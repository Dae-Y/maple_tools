import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurations
const CUBES = [
  { id: "5062010", file: "bcprobs.json", name: "Black Potential Cube" },
  { id: "5062500", file: "wcprobs.json", name: "Additional Potential Cube" },
  { id: "2711004", file: "acprobs.json", name: "Meister Cube" }
];

const GRADES = [4]; // Legendary only for now, but fully loop-compatible

const PART_TYPES = [
  1,  // 무기
  2,  // 엠블렘
  3,  // 보조무기
  4,  // 포스실드/소울링
  5,  // 방패
  6,  // 모자
  7,  // 상의
  8,  // 한벌옷
  9,  // 하의
  10, // 신발
  11, // 장갑
  12, // 망토
  13, // 벨트
  14, // 어깨장식
  15, // 얼굴장식
  16, // 눈장식
  17, // 귀고리
  18, // 반지
  19, // 펜던트
  20  // 기계심장
];

const REQ_LEVELS = [100, 120, 130, 140, 150, 160, 200, 250];

const DELAY_MS = 300; // Polite request pacing (300 ms)

function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("==================================================");
  console.log("MapleStory Cube Probability Local Update Script");
  console.log("==================================================");

  const outDir = path.join(__dirname, '..', 'data', 'cube-simulator');
  await fs.mkdir(outDir, { recursive: true });

  let overallFailedRequests = 0;
  const summary = [];

  // Track old row counts for final comparison
  const oldRowCounts = {};
  for (const cube of CUBES) {
    const filePath = path.join(outDir, cube.file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const existing = JSON.parse(content);
      oldRowCounts[cube.id] = existing.length;
    } catch {
      oldRowCounts[cube.id] = 0;
    }
  }

  for (const cube of CUBES) {
    console.log(`\nProcessing: ${cube.name} (ID: ${cube.id})...`);
    const newRows = [];
    let totalCombinations = 0;
    let emptyCombinations = 0;
    let failedRequests = 0;

    for (const grade of GRADES) {
      for (const partsType of PART_TYPES) {
        for (const reqLev of REQ_LEVELS) {
          totalCombinations++;
          const comboStr = `cubeItemID=${cube.id}, grade=${grade}, partsType=${partsType}, reqLev=${reqLev}`;

          await delay(DELAY_MS);

          const url = 'https://maplestory.nexon.com/Guide/OtherProbability/cube/GetSearchProbList';
          const body = `nCubeItemID=${cube.id}&nGrade=${grade}&nPartsType=${partsType}&nReqLev=${reqLev}`;
          const headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": "https://maplestory.nexon.com/Guide/OtherProbability/cube/black",
            "Origin": "https://maplestory.nexon.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          };

          try {
            const res = await fetch(url, {
              method: 'POST',
              headers,
              body
            });

            if (!res.ok) {
              throw new Error(`HTTP Status ${res.status}`);
            }

            const html = await res.text();
            
            // Extract probability tables
            const tableMatches = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
            let parsedCount = 0;

            for (const match of tableMatches) {
              const tableContent = match[0];
              let line = 0;
              if (tableContent.includes('cube_data _1') || tableContent.includes('첫 번째 옵션')) {
                line = 1;
              } else if (tableContent.includes('cube_data _2') || tableContent.includes('두 번째 옵션')) {
                line = 2;
              } else if (tableContent.includes('cube_data _3') || tableContent.includes('세 번째 옵션')) {
                line = 3;
              }

              if (line === 0) continue;

              const tbodyMatch = tableContent.match(/<tbody>([\s\S]*?)<\/tbody>/);
              if (!tbodyMatch) continue;
              const tbody = tbodyMatch[1];

              const trMatches = [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
              for (const trMatch of trMatches) {
                const trContent = trMatch[1];
                const tdMatches = [...trContent.matchAll(/<td>([\s\S]*?)<\/td>/g)];
                if (tdMatches.length >= 2) {
                  const optionTextRaw = tdMatches[0][1];
                  const probTextRaw = tdMatches[tdMatches.length - 1][1];

                  const optionText = decodeHtmlEntities(optionTextRaw);
                  const probMatch = probTextRaw.match(/([\d.]+)%/);
                  if (probMatch) {
                    const probPercentage = parseFloat(probMatch[1]);
                    const probability = probPercentage / 100;
                    
                    newRows.push({
                      cubeItemID: String(cube.id),
                      grade: Number(grade),
                      partsType: Number(partsType),
                      reqLev: Number(reqLev),
                      line: Number(line),
                      optionText,
                      probability
                    });
                    parsedCount++;
                  }
                }
              }
            }

            if (parsedCount === 0) {
              emptyCombinations++;
              console.warn(`[WARN] Empty results parsed for: ${comboStr}`);
            }

          } catch (err) {
            failedRequests++;
            overallFailedRequests++;
            console.error(`[ERROR] Failed request for ${comboStr}:`, err.message);
          }
        }
      }
    }

    console.log(`-> Parsing complete for ${cube.name}`);
    console.log(`   Attempted Combinations: ${totalCombinations}`);
    console.log(`   Failed Requests: ${failedRequests}`);
    console.log(`   Empty Combinations: ${emptyCombinations}`);
    console.log(`   Total Generated Rows in Memory: ${newRows.length}`);

    // Pre-write Safeguards
    const oldRowCount = oldRowCounts[cube.id];
    console.log(`   Existing Row Count in JSON: ${oldRowCount}`);

    if (newRows.length === 0) {
      console.error(`[CRITICAL ERROR] Generated 0 rows for ${cube.name}! HTML structure might have changed or we are fully blocked. Aborting update operation.`);
      process.exit(1);
    }

    if (oldRowCount > 0 && newRows.length < oldRowCount * 0.75) {
      console.error(`[CRITICAL ERROR] Generated row count (${newRows.length}) is unexpectedly lower than 75% of existing row count (${oldRowCount})! Aborting to prevent data corruption.`);
      process.exit(1);
    }

    const emptyRatio = emptyCombinations / totalCombinations;
    if (emptyRatio > 0.15) {
      console.error(`[CRITICAL ERROR] High ratio of empty combinations (${emptyCombinations} / ${totalCombinations} = ${(emptyRatio * 100).toFixed(2)}%). Nexon endpoint structure may have changed. Aborting.`);
      process.exit(1);
    }

    // Run Probability Validation Check
    console.log(`   Validating probability pool sums (tolerance: 0.0002)...`);
    const groups = {};
    for (const row of newRows) {
      const key = `${row.cubeItemID}-${row.grade}-${row.partsType}-${row.reqLev}-${row.line}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    let validationWarnings = 0;
    for (const [key, rows] of Object.entries(groups)) {
      const sum = rows.reduce((acc, r) => acc + r.probability, 0);
      const diff = Math.abs(sum - 1.0);
      if (diff > 0.0002) {
        console.warn(`   [WARN] Probability sum deviation for ${key}: ${sum.toFixed(6)} (diff: ${diff.toFixed(6)})`);
        validationWarnings++;
      }
    }

    if (validationWarnings > 0) {
      console.log(`   [INFO] Validation completed with ${validationWarnings} sum deviations warnings.`);
    } else {
      console.log(`   [PASS] All probability sums successfully validated.`);
    }

    // Write final output file safely
    const filePath = path.join(outDir, cube.file);
    try {
      await fs.writeFile(filePath, JSON.stringify(newRows, null, 2), 'utf8');
      console.log(`   [SUCCESS] Saved updated JSON to: ${cube.file}`);
      summary.push({
        cube: cube.name,
        file: cube.file,
        oldRows: oldRowCount,
        newRows: newRows.length,
        failed: failedRequests,
        empty: emptyCombinations
      });
    } catch (err) {
      console.error(`[CRITICAL ERROR] Failed to write ${cube.file}:`, err.message);
      process.exit(1);
    }
  }

  // Final Summary Output
  console.log("\n==================================================");
  console.log("FINAL UPDATE SUMMARY");
  console.log("==================================================");
  for (const s of summary) {
    console.log(`${s.cube} (${s.file}):`);
    console.log(`   Rows: old ${s.oldRows} -> new ${s.newRows} (Failed: ${s.failed}, Empty: ${s.empty})`);
  }
  console.log("--------------------------------------------------");
  if (overallFailedRequests > 0) {
    console.log(`Completed with ${overallFailedRequests} failed requests. Please check warnings above.`);
    process.exit(1);
  } else {
    console.log("All probability updates completed successfully!");
  }
}

main().catch(err => {
  console.error("Fatal Error during script execution:", err);
  process.exit(1);
});
