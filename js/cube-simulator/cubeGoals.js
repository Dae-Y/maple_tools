// js/cube-simulator/cubeGoals.js
window.cubeGoals = (function() {

  function getGoalFromUI() {
    return {
      exactLines: {
        1: document.getElementById("goalLine1") ? document.getElementById("goalLine1").value : "",
        2: document.getElementById("goalLine2") ? document.getElementById("goalLine2").value : "",
        3: document.getElementById("goalLine3") ? document.getElementById("goalLine3").value : ""
      },
      category: document.getElementById("goalCategory") ? document.getElementById("goalCategory").value : "",
      requiredCount: document.getElementById("goalCategoryCount") ? Number(document.getElementById("goalCategoryCount").value) : 2
    };
  }

  function getCategoryMatcher(category) {
    switch (category) {
      case "attackPercent":
        return (text) => /^공격력 \+\d+%$/.test(text);
      case "magicPercent":
        return (text) => /^마력 \+\d+%$/.test(text);
      case "bossDamage":
        return (text) => text.includes("보스 몬스터 데미지");
      case "ignoreDefense":
        return (text) => text.includes("몬스터 방어율 무시");
      case "critDamage":
        return (text) => text.includes("크리티컬 데미지");
      case "cooldownReduction":
        return (text) => text.includes("재사용 대기시간");
      case "itemDrop":
        return (text) => text.includes("아이템 드롭률");
      case "mesoAcquisition":
        return (text) => text.includes("메소 획득량");
      case "strPercent":
        return (text) => /^STR \+\d+%$/.test(text);
      case "dexPercent":
        return (text) => /^DEX \+\d+%$/.test(text);
      case "intPercent":
        return (text) => /^INT \+\d+%$/.test(text);
      case "lukPercent":
        return (text) => /^LUK \+\d+%$/.test(text);
      case "allStatPercent":
        return (text) => text.includes("올스탯") && text.includes("%");
      default:
        return () => false;
    }
  }

  function evaluateGoal(resultLines, goal) {
    if (!resultLines || resultLines.length !== 3) {
      return {
        reached: false,
        matched: false,
        exactLineMatches: { 1: false, 2: false, 3: false },
        categoryMatchCount: 0,
        requiredCount: goal.requiredCount || 0
      };
    }

    // 1. Evaluate Exact Lines
    const exactLineMatches = { 1: null, 2: null, 3: null };
    let exactMatchPass = true;

    for (let i = 1; i <= 3; i++) {
      const target = goal.exactLines[i];
      if (target) {
        const actualRaw = resultLines[i - 1]?.optionText || "";
        const actual = actualRaw.trim();
        const match = actual === target.trim();
        exactLineMatches[i] = match;
        if (!match) {
          exactMatchPass = false;
        }
      } else {
        exactLineMatches[i] = null; // 상관 없음
      }
    }

    // 2. Evaluate Category Count
    let categoryMatchCount = 0;
    let categoryMatchPass = true;

    if (goal.category) {
      const matcher = getCategoryMatcher(goal.category);
      for (const line of resultLines) {
        const text = (line.optionText || "").trim();
        if (matcher(text)) {
          categoryMatchCount++;
        }
      }
      categoryMatchPass = categoryMatchCount >= goal.requiredCount;
    }

    const reached = exactMatchPass && categoryMatchPass;

    return {
      reached,
      matched: reached,
      exactLineMatches,
      categoryMatchCount,
      requiredCount: goal.requiredCount || 0
    };
  }

  function populateLineTargetSelects(cubeItemID, partsType, reqLev) {
    for (let lineNum = 1; lineNum <= 3; lineNum++) {
      const selectEl = document.getElementById(`goalLine${lineNum}`);
      if (!selectEl) continue;

      // Remember previous selection
      const prevVal = selectEl.value;

      // Get unique option texts from probability pool
      const pool = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, lineNum);
      const uniqueTexts = [...new Set(pool.map(r => (r.optionText || "").trim()))].sort();

      // Reset select
      selectEl.innerHTML = '<option value="">상관 없음</option>';
      for (const text of uniqueTexts) {
        const opt = document.createElement("option");
        opt.value = text;
        opt.textContent = text;
        selectEl.appendChild(opt);
      }

      // Restore selection if still valid
      if (prevVal && uniqueTexts.includes(prevVal.trim())) {
        selectEl.value = prevVal;
      } else {
        selectEl.value = "";
      }
    }
  }

  return {
    getGoalFromUI,
    getCategoryMatcher,
    evaluateGoal,
    populateLineTargetSelects
  };
})();
