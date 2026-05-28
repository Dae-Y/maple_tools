// js/cube-simulator/cubeGoals.js
window.cubeGoals = (function() {
  /**
   * Checks if at least requiredCount lines in the candidate set contain the chosen keyword.
   * @param {Array} candLines - Set of 3 rolled potential lines.
   * @param {string} keyword - Chosen search keyword (e.g. "STR", "공격력", "보스 몬스터").
   * @param {number} requiredCount - Minimum matching lines (1, 2, or 3).
   * @returns {boolean} True if matched, false otherwise.
   */
  function matchKeywordGoal(candLines, keyword, requiredCount) {
    if (!candLines || candLines.length !== 3) return false;
    if (!keyword) return false;
    
    let count = 0;
    for (const l of candLines) {
      if (l.optionText.includes(keyword)) {
        count++;
      }
    }
    return count >= requiredCount;
  }

  return {
    matchKeywordGoal
  };
})();
