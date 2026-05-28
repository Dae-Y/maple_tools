// js/cube-simulator/cubeTips.js
window.CubeTips = (function () {
  let currentTipIndex = 0;
  let calculatedTips = [];

  const AUTO_TIP_DELAY_MS = 15000;
  const MANUAL_TIP_DELAY_MS = 20000;
  let tipAutoTimer = null;
  let isTipAutoPaused = false;
  let tipTimerStartedAt = 0;
  let tipTimerDelayMs = 15000;
  let tipProgressFrame = null;

  function init() {
    buildTips();
    renderCurrentTip();
    bindEvents();
    scheduleTipAutoAdvance(AUTO_TIP_DELAY_MS);
  }

  // Base Matchers
  const isBossDamage = (txt) => txt.includes("보스 몬스터 데미지");
  const isAttackPercent = (txt) => /^공격력 \+\d+%$/.test(txt.trim());
  const isIed = (txt) => txt.includes("몬스터 방어율 무시");
  const isDamagePercent = (txt) => /^데미지 \+\d+%$/.test(txt.trim());
  const isAllStatPercent = (txt) => txt.includes("올스탯") && txt.includes("%");
  const isCritPercent = (txt) => txt.includes("크리티컬 확률") && txt.includes("%");

  const isUsefulAdditionalExtra = (txt) => {
    return isAttackPercent(txt) || 
           isBossDamage(txt) || 
           isIed(txt) || 
           isDamagePercent(txt) || 
           isAllStatPercent(txt) || 
           isCritPercent(txt);
  };

  // Reusable helper to parse attack percent
  const getAttackPercent = (optText) => {
    const m = optText.trim().match(/^공격력 \+(\d+)%$/);
    return m ? Number(m[1]) : 0;
  };

  // Tip 1: 에디셔널 공/마 30% 이상 확률
  function calculateAdditionalAttack30() {
    const cubeItemID = "5062500"; // 아랫잠 (에디셔널)
    const partsType = 1; // 무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const att1 = pool1.map(r => ({ percent: getAttackPercent(r.optionText), prob: r.probability })).filter(r => r.percent > 0);
    const att2 = pool2.map(r => ({ percent: getAttackPercent(r.optionText), prob: r.probability })).filter(r => r.percent > 0);
    const att3 = pool3.map(r => ({ percent: getAttackPercent(r.optionText), prob: r.probability })).filter(r => r.percent > 0);

    let totalProb = 0;
    for (const a1 of att1) {
      for (const a2 of att2) {
        for (const a3 of att3) {
          if (a1.percent + a2.percent + a3.percent >= 30) {
            totalProb += a1.prob * a2.prob * a3.prob;
          }
        }
      }
    }

    return totalProb;
  }

  // Tip 2: 방무 미포함 윗잠 이탈 확률 (무기)
  function calculateUpperNoIedEscape() {
    const cubeItemID = "5062010"; // 윗잠 (블큐)
    const partsType = 1; // 무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const isWanted = (txt) => isBossDamage(txt) || isAttackPercent(txt);

    const legWantedTexts = new Set(
      pool1.filter(r => isWanted(r.optionText)).map(r => r.optionText.trim())
    );

    const wanted1 = pool1.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => isWanted(r.text));
    const wanted2 = pool2.map(r => ({ text: r.optionText.trim(), prob: r.probability, isLeg: legWantedTexts.has(r.optionText.trim()) })).filter(r => isWanted(r.text));
    const wanted3 = pool3.map(r => ({ text: r.optionText.trim(), prob: r.probability, isLeg: legWantedTexts.has(r.optionText.trim()) })).filter(r => isWanted(r.text));

    let totalProb = 0;
    for (const w1 of wanted1) {
      for (const w2 of wanted2) {
        for (const w3 of wanted3) {
          if (w2.isLeg || w3.isLeg) {
            totalProb += w1.prob * w2.prob * w3.prob;
          }
        }
      }
    }

    return totalProb;
  }

  // Tip 3: 보조무기 방무 미포함 이탈 확률
  function calculateUpperNoIedSecondaryEscape() {
    const cubeItemID = "5062010"; // 윗잠 (블큐)
    const partsType = 3; // 보조무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const isWanted = (txt) => isBossDamage(txt) || isAttackPercent(txt);

    const legWantedTexts = new Set(
      pool1.filter(r => isWanted(r.optionText)).map(r => r.optionText.trim())
    );

    const wanted1 = pool1.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => isWanted(r.text));
    const wanted2 = pool2.map(r => ({ text: r.optionText.trim(), prob: r.probability, isLeg: legWantedTexts.has(r.optionText.trim()) })).filter(r => isWanted(r.text));
    const wanted3 = pool3.map(r => ({ text: r.optionText.trim(), prob: r.probability, isLeg: legWantedTexts.has(r.optionText.trim()) })).filter(r => isWanted(r.text));

    let totalProb = 0;
    for (const w1 of wanted1) {
      for (const w2 of wanted2) {
        for (const w3 of wanted3) {
          if (w2.isLeg || w3.isLeg) {
            totalProb += w1.prob * w2.prob * w3.prob;
          }
        }
      }
    }

    return totalProb;
  }

  // Tip 4: 에디셔널 공/마 21% 이상 확률
  function calculateAdditionalAttack21() {
    const cubeItemID = "5062500"; // 아랫잠 (에디셔널)
    const partsType = 1; // 무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const att1 = pool1.map(r => ({ percent: getAttackPercent(r.optionText), prob: r.probability }));
    const att2 = pool2.map(r => ({ percent: getAttackPercent(r.optionText), prob: r.probability }));
    const att3 = pool3.map(r => ({ percent: getAttackPercent(r.optionText), prob: r.probability }));

    let totalProb = 0;
    for (const a1 of att1) {
      for (const a2 of att2) {
        for (const a3 of att3) {
          if (a1.percent + a2.percent + a3.percent >= 21) {
            totalProb += a1.prob * a2.prob * a3.prob;
          }
        }
      }
    }

    return totalProb;
  }

  // Tip 5: 에디셔널 공/마 21% 이상 +@ 확률
  function calculateAdditionalAttack21WithExtra() {
    const cubeItemID = "5062500"; // 아랫잠 (에디셔널)
    const partsType = 1; // 무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    let totalProb = 0;
    for (const r1 of pool1) {
      const p1 = getAttackPercent(r1.optionText);
      const ok1 = (p1 > 0) || isUsefulAdditionalExtra(r1.optionText);
      if (!ok1) continue;

      for (const r2 of pool2) {
        const p2 = getAttackPercent(r2.optionText);
        const ok2 = (p2 > 0) || isUsefulAdditionalExtra(r2.optionText);
        if (!ok2) continue;

        for (const r3 of pool3) {
          const p3 = getAttackPercent(r3.optionText);
          const ok3 = (p3 > 0) || isUsefulAdditionalExtra(r3.optionText);
          if (!ok3) continue;

          if (p1 + p2 + p3 >= 21) {
            totalProb += r1.probability * r2.probability * r3.probability;
          }
        }
      }
    }

    return totalProb;
  }

  // Tip 6: 무기 윗잠 올이탈 확률
  function calculateUpperAllEscape() {
    const cubeItemID = "5062010"; // 윗잠 (블큐)
    const partsType = 1; // 무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const isWanted = (txt) => isBossDamage(txt) || isAttackPercent(txt);

    // Identify Legendary wanted options from Line 1
    const legWantedTexts = new Set(
      pool1.filter(r => isWanted(r.optionText)).map(r => r.optionText.trim())
    );

    const wanted1 = pool1.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => isWanted(r.text));
    const wanted2 = pool2.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => legWantedTexts.has(r.text));
    const wanted3 = pool3.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => legWantedTexts.has(r.text));

    let totalProb = 0;
    for (const w1 of wanted1) {
      for (const w2 of wanted2) {
        for (const w3 of wanted3) {
          totalProb += w1.prob * w2.prob * w3.prob;
        }
      }
    }

    return totalProb;
  }

  // Tip 7: 보조무기 윗잠 올이탈 확률
  function calculateUpperSecondaryAllEscape() {
    const cubeItemID = "5062010"; // 윗잠 (블큐)
    const partsType = 3; // 보조무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const isWanted = (txt) => isBossDamage(txt) || isAttackPercent(txt);

    // Identify Legendary wanted options from Line 1
    const legWantedTexts = new Set(
      pool1.filter(r => isWanted(r.optionText)).map(r => r.optionText.trim())
    );

    const wanted1 = pool1.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => isWanted(r.text));
    const wanted2 = pool2.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => legWantedTexts.has(r.text));
    const wanted3 = pool3.map(r => ({ text: r.optionText.trim(), prob: r.probability })).filter(r => legWantedTexts.has(r.text));

    let totalProb = 0;
    for (const w1 of wanted1) {
      for (const w2 of wanted2) {
        for (const w3 of wanted3) {
          totalProb += w1.prob * w2.prob * w3.prob;
        }
      }
    }

    return totalProb;
  }

  // Tip 8: 에디 올이탈 공12 3줄 확률
  function calculateAdditionalAttack12ThreeLines() {
    const cubeItemID = "5062500"; // 아랫잠 (에디셔널)
    const partsType = 1; // 무기
    const reqLev = 200; // 200레벨

    const pool1 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 1);
    const pool2 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 2);
    const pool3 = window.cubeData.getBasePool(cubeItemID, partsType, reqLev, 3);

    if (!pool1.length || !pool2.length || !pool3.length) {
      return null;
    }

    const targetText = "공격력 +12%";

    const r1 = pool1.find(r => (r.optionText || "").trim() === targetText);
    const r2 = pool2.find(r => (r.optionText || "").trim() === targetText);
    const r3 = pool3.find(r => (r.optionText || "").trim() === targetText);

    if (!r1 || !r2 || !r3) {
      return 0;
    }

    return r1.probability * r2.probability * r3.probability;
  }

  const tipsDefinition = [
    {
      title: "에디셔널 공/마 30% 이상 확률",
      calculate: calculateAdditionalAttack30,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 무기 기준</div>
          <p class="living-tip-desc">
            아랫잠(에디셔널)에서 공/마 30% 이상이 나올 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 공격력 또는 마력 중 한 계열만 기준으로 계산합니다. 예: 공격 직업은 공격력 12% / 9% / 9%.</div>
        `;
      }
    },
    {
      title: "방무 미포함 윗잠 이탈 확률",
      calculate: calculateUpperNoIedEscape,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 무기 기준</div>
          <p class="living-tip-desc">
            윗잠에서 방무 없이 보공/공격력%만으로 3줄이 구성되고, 2~3번째 줄 중 최소 1줄이 레전드리 등급으로 이탈할 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 마법 직업은 공격력% 대신 마력%로 보면 동일한 방식입니다. 보공/공격력/마력%를 모두 합산하면 더 높게 보이지만, 실제 세팅에서는 공/마를 섞지 않습니다.</div>
        `;
      }
    },
    {
      title: "보조무기 방무 미포함 이탈 확률",
      calculate: calculateUpperNoIedSecondaryEscape,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">보조무기 확률 데이터를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 보조무기 기준</div>
          <p class="living-tip-desc">
            윗잠에서 방무 없이 보공/공격력%만으로 3줄이 구성되고, 2~3번째 줄 중 최소 1줄이 레전드리 등급으로 이탈할 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 보조무기는 무기와 다른 옵션 풀 및 가중치를 가지므로, 계산 결과에 약간의 차이가 존재합니다.</div>
        `;
      }
    },
    {
      title: "에디셔널 공/마 21% 이상 확률",
      calculate: calculateAdditionalAttack21,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 무기 기준</div>
          <p class="living-tip-desc">
            아랫잠(에디셔널)에서 공/마 21% 이상이 나올 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 공격력 또는 마력 중 한 계열만 기준으로 계산합니다. 마법 직업은 마력%로 보면 됩니다. (두 줄 공/마 21% 세팅 확보 기준)</div>
        `;
      }
    },
    {
      title: "에디셔널 공/마 21% 이상 +@ 확률",
      calculate: calculateAdditionalAttack21WithExtra,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 무기 기준</div>
          <p class="living-tip-desc">
            아랫잠(에디셔널)에서 공/마 21% 이상과 유효 보조 옵션이 함께 나올 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ +@는 남은 한 줄이 보공/방무/데미지/올스탯/크확 등 유효 옵션인 경우로 계산합니다. 세 줄 모두 공/마%인 경우도 포함됩니다.</div>
        `;
      }
    },
    {
      title: "무기 윗잠 올이탈 확률",
      calculate: calculateUpperAllEscape,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 무기 기준</div>
          <p class="living-tip-desc">
            윗잠에서 보공/공격력%만으로 L등급 3줄 올이탈이 나올 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 공격 직업 기준입니다. 마법 직업은 공격력% 대신 마력%로 보면 됩니다. (2~3번째 줄도 전부 레전드리 전용 수치로 이탈한 최고점 기준)</div>
        `;
      }
    },
    {
      title: "보조무기 윗잠 올이탈 확률",
      calculate: calculateUpperSecondaryAllEscape,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">보조무기 확률 데이터를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(5);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 보조무기 기준</div>
          <p class="living-tip-desc">
            윗잠에서 보공/공격력%만으로 L등급 3줄 올이탈이 나올 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 보조무기는 보스 공격 시 데미지% 가중치가 무기와 달라 별도로 동적 산출됩니다. (공격 직업 기준)</div>
        `;
      }
    },
    {
      title: "에디 올이탈 공12 3줄 확률",
      calculate: calculateAdditionalAttack12ThreeLines,
      render: (prob) => {
        if (prob === null) return `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`;
        const percent = (prob * 100).toFixed(8);
        const attempts = Math.round(1 / prob).toLocaleString("ko-KR");
        return `
          <div class="living-tip-subtitle">장비 레벨 200 무기 기준</div>
          <p class="living-tip-desc">
            아랫잠(에디셔널)에서 공격력 +12% 3줄이 나올 확률은 약 <span class="living-tip-highlight">${percent}%</span>입니다.<br>
            즉 약 <span class="living-tip-highlight">${attempts}회에 1번</span>입니다.
          </p>
          <div class="living-tip-meta">※ 공격력 +12% 세 줄의 극악의 에디셔널 최고점 수치입니다. 마법 직업은 마력 +12% 세 줄로 보면 동일합니다.</div>
        `;
      }
    }
  ];

  function buildTips() {
    calculatedTips = tipsDefinition.map(tip => {
      try {
        const prob = tip.calculate();
        return {
          title: tip.title,
          content: tip.render(prob)
        };
      } catch (err) {
        console.error("Living tip calculation error:", err);
        return {
          title: tip.title,
          content: `<div class="living-tip-empty">확률 정보를 계산할 수 없습니다.</div>`
        };
      }
    });
  }

  function renderCurrentTip() {
    const titleEl = document.getElementById("livingTipTitle");
    const bodyEl = document.getElementById("livingTipBody");
    const indexEl = document.getElementById("tipIndexLabel");

    if (!calculatedTips.length) return;

    const tip = calculatedTips[currentTipIndex];
    if (titleEl) titleEl.textContent = tip.title;
    if (bodyEl) bodyEl.innerHTML = tip.content;
    if (indexEl) indexEl.textContent = `${currentTipIndex + 1} / ${calculatedTips.length}`;
  }

  function scheduleTipAutoAdvance(delay = AUTO_TIP_DELAY_MS) {
    clearTimeout(tipAutoTimer);
    cancelAnimationFrame(tipProgressFrame);
    if (calculatedTips.length <= 1 || isTipAutoPaused) return;

    tipTimerStartedAt = Date.now();
    tipTimerDelayMs = delay;

    tipAutoTimer = setTimeout(() => {
      currentTipIndex = (currentTipIndex + 1) % calculatedTips.length;
      renderCurrentTip();
      scheduleTipAutoAdvance(AUTO_TIP_DELAY_MS);
    }, delay);

    startTipProgressAnimation();
  }

  function startTipProgressAnimation() {
    function frame() {
      if (isTipAutoPaused) return;

      const elapsed = Date.now() - tipTimerStartedAt;
      const progress = Math.min(100, (elapsed / tipTimerDelayMs) * 100);

      const progressCircle = document.getElementById("tipProgressCircle");
      if (progressCircle) {
        progressCircle.style.setProperty("--progress", `${progress}%`);
      }

      if (elapsed < tipTimerDelayMs) {
        tipProgressFrame = requestAnimationFrame(frame);
      }
    }
    tipProgressFrame = requestAnimationFrame(frame);
  }

  function togglePauseResume() {
    const pauseBtn = document.getElementById("tipPauseBtn");
    if (!pauseBtn) return;

    if (isTipAutoPaused) {
      isTipAutoPaused = false;
      pauseBtn.textContent = "⏸";
      pauseBtn.title = "자동 재생 일시정지";
      pauseBtn.setAttribute("aria-label", "자동 재생 일시정지");
      scheduleTipAutoAdvance(AUTO_TIP_DELAY_MS);
    } else {
      isTipAutoPaused = true;
      pauseBtn.textContent = "▶";
      pauseBtn.title = "자동 재생 시작";
      pauseBtn.setAttribute("aria-label", "자동 재생 시작");
      clearTimeout(tipAutoTimer);
      cancelAnimationFrame(tipProgressFrame);
      
      const progressCircle = document.getElementById("tipProgressCircle");
      if (progressCircle) {
        progressCircle.style.setProperty("--progress", `0%`);
      }
    }
  }

  function bindEvents() {
    const prevBtn = document.getElementById("tipPrevBtn");
    const nextBtn = document.getElementById("tipNextBtn");
    const pauseBtn = document.getElementById("tipPauseBtn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (!calculatedTips.length) return;
        currentTipIndex = (currentTipIndex - 1 + calculatedTips.length) % calculatedTips.length;
        renderCurrentTip();
        if (!isTipAutoPaused) {
          scheduleTipAutoAdvance(MANUAL_TIP_DELAY_MS);
        } else {
          const progressCircle = document.getElementById("tipProgressCircle");
          if (progressCircle) {
            progressCircle.style.setProperty("--progress", `0%`);
          }
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (!calculatedTips.length) return;
        currentTipIndex = (currentTipIndex + 1) % calculatedTips.length;
        renderCurrentTip();
        if (!isTipAutoPaused) {
          scheduleTipAutoAdvance(MANUAL_TIP_DELAY_MS);
        } else {
          const progressCircle = document.getElementById("tipProgressCircle");
          if (progressCircle) {
            progressCircle.style.setProperty("--progress", `0%`);
          }
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        togglePauseResume();
      });
    }
  }

  return {
    init,
    buildTips,
    calculateAdditionalAttack30,
    calculateUpperNoIedEscape,
    calculateUpperNoIedSecondaryEscape,
    calculateAdditionalAttack21,
    calculateAdditionalAttack21WithExtra,
    calculateUpperAllEscape,
    calculateUpperSecondaryAllEscape,
    calculateAdditionalAttack12ThreeLines
  };
})();
