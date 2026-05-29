import fs from "fs/promises";
import zlib from "zlib";
import path from "path";

const inputPath = path.resolve("assets/brand/character.png");
const outputPath = path.resolve("assets/brand/character-cropped.png");
const EXTRA_PADDING = 8;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crc32(buffer) {
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })());

  let c = 0xffffffff;
  for (const byte of buffer) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function parseChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Not a PNG file.");
  }

  const chunks = [];
  let offset = 8;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += length + 12;
    if (type === "IEND") break;
  }

  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const rows = [];
  let offset = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[offset++];
    const row = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;

    const prev = y > 0 ? rows[y - 1] : Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = prev[x] ?? 0;
      const upLeft = x >= bpp ? prev[x - bpp] : 0;

      if (filter === 1) row[x] = (row[x] + left) & 0xff;
      else if (filter === 2) row[x] = (row[x] + up) & 0xff;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) row[x] = (row[x] + paeth(left, up, upLeft)) & 0xff;
      else if (filter !== 0) throw new Error(`Unsupported PNG filter: ${filter}`);
    }

    rows.push(row);
  }

  return rows;
}

async function main() {
  const buffer = await fs.readFile(inputPath);
  const chunks = parseChunks(buffer);

  const ihdr = chunks.find((c) => c.type === "IHDR");
  if (!ihdr) throw new Error("IHDR not found.");

  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Only 8-bit RGBA PNG is supported. Got bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const rows = unfilter(raw, width, height, 4);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const alpha = row[x * 4 + 3];
      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < 0) throw new Error("No visible pixels found.");

  minX = Math.max(0, minX - EXTRA_PADDING);
  minY = Math.max(0, minY - EXTRA_PADDING);
  maxX = Math.min(width - 1, maxX + EXTRA_PADDING);
  maxY = Math.min(height - 1, maxY + EXTRA_PADDING);

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  const croppedRows = [];
  for (let y = minY; y <= maxY; y++) {
    croppedRows.push(Buffer.from([0]));
    croppedRows.push(Buffer.from(rows[y].subarray(minX * 4, (maxX + 1) * 4)));
  }

  const newIHDR = Buffer.from(ihdr.data);
  newIHDR.writeUInt32BE(croppedWidth, 0);
  newIHDR.writeUInt32BE(croppedHeight, 4);

  const compressed = zlib.deflateSync(Buffer.concat(croppedRows), { level: 9 });

  const output = Buffer.concat([
    PNG_SIGNATURE,
    makeChunk("IHDR", newIHDR),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);

  await fs.writeFile(outputPath, output);

  console.log(`Created: ${outputPath}`);
  console.log(`Original: ${width}x${height}`);
  console.log(`Cropped: ${croppedWidth}x${croppedHeight}`);
  console.log(`Crop box: left=${minX}, top=${minY}, right=${maxX}, bottom=${maxY}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
