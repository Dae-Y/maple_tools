// js/cube-simulator/cubeRoller.js
window.cubeRoller = (function() {
  const ONLY_ONE_KEYWORDS = ["쓸만한", "피격 후 무적"];
  const AT_MOST_TWO_KEYWORDS = ["피격 시 일정 확률로 데미지", "피격 시 일정 확률로 일정 시간 무적"];

  function textMatchesAny(text, keywords) {
    return keywords.some(kw => text.includes(kw));
  }
  function isGroupOne(text) {
    return textMatchesAny(text, ONLY_ONE_KEYWORDS);
  }
  function isGroupTwo(text) {
    return textMatchesAny(text, AT_MOST_TWO_KEYWORDS);
  }

  function rollOneLine(cubeItemID, partsType, reqLev, line, existingLines) {
    const basePool = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, line);
    if (!basePool || !basePool.length) return null;

    // Count occurrences in existing lines to respect official duplicate limits
    const countG1 = existingLines.filter(l => isGroupOne(l.optionText)).length;
    const countG2 = existingLines.filter(l => isGroupTwo(l.optionText)).length;

    const filtered = [];
    for (const row of basePool) {
      const text = row.optionText;
      if (isGroupOne(text) && countG1 >= 1) continue;
      if (isGroupTwo(text) && countG2 >= 2) continue;
      filtered.push(row);
    }
    if (!filtered.length) return null;

    let totalProb = 0;
    for (const row of filtered) {
      totalProb += row.probability;
    }

    const r = Math.random() * totalProb;
    let acc = 0;
    for (const row of filtered) {
      acc += row.probability;
      if (r <= acc) {
        return { line, optionText: row.optionText, raw: row };
      }
    }
    const last = filtered[filtered.length - 1];
    return { line, optionText: last.optionText, raw: last };
  }

  function isSameSet(aLines, bLines) {
    if (!aLines || !bLines) return false;
    if (aLines.length !== 3 || bLines.length !== 3) return false;
    for (let i = 0; i < 3; i++) {
      if (aLines[i].optionText !== bLines[i].optionText) return false;
    }
    return true;
  }

  function rollOneSet(cubeItemID, partsType, reqLev, currentLines) {
    // 1. Verify pool exists for all three lines first
    for (let line = 1; line <= 3; line++) {
      const base = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, line);
      if (!base || base.length === 0) return null;
    }

    // 2. Safe rolling loop with 5000 attempt limit to avoid infinite loops and prevent identical rerolls
    const MAX_ATTEMPTS = 5000;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const lines = [];
      for (let line = 1; line <= 3; line++) {
        const opt = rollOneLine(cubeItemID, partsType, reqLev, line, lines);
        if (!opt) break;
        lines.push(opt);
      }
      if (lines.length !== 3) continue;
      if (isSameSet(lines, currentLines)) continue;
      return lines;
    }
    return null;
  }

  return {
    rollOneSet
  };
})();
