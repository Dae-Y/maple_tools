// js/cube-simulator/cubeSimulator.js
window.cubeSimulatorState = (function() {
  let rollCount = 0;
  let mesoUsed = 0;
  let meisterUsed = 0;

  return {
    getStats: () => ({ rollCount, mesoUsed, meisterUsed }),
    incrementStats: (cubeKind, count, cost) => {
      rollCount += count;
      if (cubeKind === "meister") {
        meisterUsed += count;
      } else {
        mesoUsed += cost * count;
      }
    },
    resetStats: () => {
      rollCount = 0;
      mesoUsed = 0;
      meisterUsed = 0;
    }
  };
})();

(function() {
  const CUBE_ID_BLACK = "5062010";   // 블랙 큐브
  const CUBE_ID_ADDI = "5062500";    // 에디셔널 큐브
  const CUBE_ID_MEISTER = "2711004"; // 명장의 큐브

  let currentLines = [];
  let rollCandidates = [[], [], []];
  let logEntries = [];
  let logVisible = false;

  // 1. Initial Loader
  window.addEventListener("DOMContentLoaded", async () => {
    try {
      await window.cubeData.load();
      initCurrentOption();
      updateCubeTag();
      updateStatsTags();
      updateLogVisibility();
    } catch (err) {
      console.error("큐브 시뮬레이터 초기화 실패:", err);
    }

    // 2. Bind DOM Events
    document.getElementById("rollBtn").addEventListener("click", () => {
      if (window.autoRoll.getIsRunning()) return;
      doOneRollStep();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      if (window.autoRoll.getIsRunning()) return;
      handleReset();
    });

    document.querySelectorAll(".cube-option-box.candidate").forEach(box => {
      box.addEventListener("click", (e) => {
        if (window.autoRoll.getIsRunning()) return;
        const index = Number(e.currentTarget.getAttribute("data-choice")) - 1;
        chooseCandidate(index);
      });
    });

    document.querySelectorAll('input[name="cubeKind"]').forEach(r => {
      r.addEventListener("change", () => {
        window.cubeSimulatorState.resetStats();
        updateCubeTag();
        initCurrentOption();
        window.autoRoll.clearHighlights();
      });
    });

    document.getElementById("itemLevel").addEventListener("change", () => {
      window.cubeSimulatorState.resetStats();
      initCurrentOption();
      window.autoRoll.clearHighlights();
    });

    document.getElementById("partsType").addEventListener("change", () => {
      window.cubeSimulatorState.resetStats();
      initCurrentOption();
      window.autoRoll.clearHighlights();
    });

    document.getElementById("toggleLogBtn").addEventListener("click", () => {
      logVisible = !logVisible;
      updateLogVisibility();
    });

    // 3. Auto-Roll Events Bindings
    const autoRollBtn = document.getElementById("autoRollBtn");
    if (autoRollBtn) {
      autoRollBtn.addEventListener("click", () => {
        if (window.autoRoll.getIsRunning()) {
          window.autoRoll.stop();
        } else {
          startAutoRollSequence();
        }
      });
    }

    window.addEventListener("cubeSim:autoRollEnd", (e) => {
      updateAutoButtonState(false);
      const detail = e.detail;
      if (detail.reached) {
        // Log target completion
        const idx = detail.index;
        const cand = rollCandidates[idx];
        const logMsg = `🎉 [자동 돌리기 목표 달성] #${window.cubeSimulatorState.getStats().rollCount}회째: ${cand.map(l => l.optionText).join(" | ")}`;
        appendLogEntry(logMsg);
        
        // Auto-select the successful candidate
        setTimeout(() => chooseCandidate(idx), 800);
      }
    });
  });

  // Main roll mechanics
  function initCurrentOption() {
    const cubeItemID = getSelectedCubeId();
    const partsType = getSelectedPartsType();
    const reqLev = getSelectedLevel();

    const first = window.cubeRoller.rollOneSet(cubeItemID, partsType, reqLev, []);
    if (!first) {
      currentLines = [];
      rollCandidates = [[], [], []];
      renderAllBoxes();
      alert("해당 장비 레벨 및 부위 조합의 공식 확률 데이터가 존재하지 않습니다. 다른 장비 조건을 선택해 주세요.");
      return;
    }

    currentLines = first;
    rollCandidates = [[], [], []];
    renderAllBoxes();
  }

  function doOneRollStep() {
    const cubeItemID = getSelectedCubeId();
    const partsType = getSelectedPartsType();
    const reqLev = getSelectedLevel();
    const cubeKind = getSelectedCubeKind();

    const cand1 = window.cubeRoller.rollOneSet(cubeItemID, partsType, reqLev, currentLines);
    const cand2 = window.cubeRoller.rollOneSet(cubeItemID, partsType, reqLev, currentLines);
    const cand3 = window.cubeRoller.rollOneSet(cubeItemID, partsType, reqLev, currentLines);

    if (!cand1 || !cand2 || !cand3) {
      alert("해당 조합의 데이터가 부족하여 큐브를 재설정할 수 없습니다.");
      return null;
    }

    rollCandidates = [cand1, cand2, cand3];
    
    // Compute costs
    const cost = getCostPerSet(reqLev, cubeItemID);
    window.cubeSimulatorState.incrementStats(cubeKind, 3, cost);

    // Logging entries
    const count = window.cubeSimulatorState.getStats().rollCount;
    const label = cubeKind === "addi" ? "에디" : "윗";
    const partText = document.getElementById("partsType").selectedOptions[0].text;
    const header = `[${count - 2}~${count}회] ${partText} (${label})`;
    const l1 = `  1) ${cand1.map(l => l.optionText).join(" | ")}`;
    const l2 = `  2) ${cand2.map(l => l.optionText).join(" | ")}`;
    const l3 = `  3) ${cand3.map(l => l.optionText).join(" | ")}`;
    appendLogEntry(`${header}\n${l1}\n${l2}\n${l3}`);

    updateStatsTags();
    renderAllBoxes();
    triggerCandidatesFadeIn();
    return true;
  }

  function chooseCandidate(index) {
    const cand = rollCandidates[index];
    if (!cand || !cand.length) return;

    const candBoxId = `box-roll${index + 1}`;
    const candEl = document.getElementById(candBoxId);
    const currentEl = document.getElementById("box-current");

    // Fade animation trigger
    candEl.classList.remove("fade-out-card");
    void candEl.offsetWidth;
    candEl.classList.add("fade-out-card");

    candEl.addEventListener("animationend", () => {
      candEl.classList.remove("fade-out-card");
      currentLines = cand.map(l => ({ ...l }));
      rollCandidates = [[], [], []];
      renderAllBoxes();

      currentEl.classList.remove("fade-in-card");
      void currentEl.offsetWidth;
      currentEl.classList.add("fade-in-card");
      currentEl.addEventListener("animationend", () => {
        currentEl.classList.remove("fade-in-card");
      }, { once: true });
    }, { once: true });
  }

  function handleReset() {
    window.cubeSimulatorState.resetStats();
    logEntries = [];
    document.getElementById("log").textContent = "";
    initCurrentOption();
    updateStatsTags();
    window.autoRoll.clearHighlights();
  }

  // Cost calculators
  function getCostPerSet(level, cubeItemID) {
    const isAddi = cubeItemID === CUBE_ID_ADDI;
    const tableMain = [
      { min: 250, max: 300, cost: 50000000 },
      { min: 200, max: 249, cost: 45000000 },
      { min: 160, max: 199, cost: 42500000 },
      { min: 1,   max: 159, cost: 40000000 }
    ];
    const tableAddi = [
      { min: 250, max: 300, cost: 98000000 },
      { min: 200, max: 249, cost: 88000000 },
      { min: 160, max: 199, cost: 83000000 },
      { min: 1,   max: 159, cost: 78000000 }
    ];
    const table = isAddi ? tableAddi : tableMain;
    for (const row of table) {
      if (level >= row.min && level <= row.max) return row.cost;
    }
    return table[table.length - 1].cost;
  }

  // UI render bindings
  function renderLines(elemId, lines) {
    const elem = document.getElementById(elemId);
    elem.innerHTML = "";
    if (!lines || !lines.length) {
      elem.innerHTML = "<div style='color:#9ca3af;'>-</div>";
      return;
    }

    const keyword = document.getElementById("autoGoalKeyword").value.trim();
    for (const l of lines) {
      const div = document.createElement("div");
      div.className = "cube-line";
      div.textContent = l.optionText;

      // Highlight hit lines matching search term
      if (keyword && l.optionText.includes(keyword)) {
        div.className += " hit";
      }
      elem.appendChild(div);
    }
  }

  function renderAllBoxes() {
    renderLines("lines-current", currentLines);
    renderLines("lines-roll1", rollCandidates[0]);
    renderLines("lines-roll2", rollCandidates[1]);
    renderLines("lines-roll3", rollCandidates[2]);
  }

  function triggerCandidatesFadeIn() {
    const ids = ["box-roll1", "box-roll2", "box-roll3"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove("fade-in-fast");
      void el.offsetWidth;
      el.classList.add("fade-in-fast");
      el.addEventListener("animationend", () => {
        el.classList.remove("fade-in-fast");
      }, { once: true });
    });
  }

  function appendLogEntry(text) {
    logEntries.unshift(text);
    if (logEntries.length > 100) logEntries.pop();
    document.getElementById("log").textContent = logEntries.join("\n");
  }

  function updateCubeTag() {
    const cubeKind = getSelectedCubeKind();
    const tagSpan = document.getElementById("cubeTypeTag").querySelector("span:last-child");

    if (cubeKind === "addi") tagSpan.textContent = "에디셔널 잠재";
    else if (cubeKind === "meister") tagSpan.textContent = "명장의 큐브";
    else tagSpan.textContent = "윗잠재 (블랙큐브)";
  }

  function updateStatsTags() {
    const cubeKind = getSelectedCubeKind();
    const stats = window.cubeSimulatorState.getStats();

    const countEl = document.getElementById("rollCountTag");
    const costEl = document.getElementById("mesoTag");
    const azmosEl = document.getElementById("azmosTag");

    if (cubeKind === "meister") {
      countEl.textContent = `소모된 명장의 큐브: ${stats.meisterUsed}개`;
      costEl.style.display = "none";
      if (azmosEl) {
        azmosEl.style.display = "block";
        const weeks = Math.ceil(stats.meisterUsed / 29);
        azmosEl.textContent = `아즈모스 협곡 1만점: ${weeks}주 분량`;
      }
    } else {
      countEl.textContent = `재설정 횟수: ${stats.rollCount}회`;
      costEl.style.display = "block";
      costEl.textContent = `소모 메소: ${formatMesoKorean(stats.mesoUsed)}`;
      if (azmosEl) azmosEl.style.display = "none";
    }
  }

  function updateLogVisibility() {
    const logDiv = document.getElementById("log");
    const btn = document.getElementById("toggleLogBtn");
    if (logVisible) {
      logDiv.style.display = "block";
      btn.textContent = "접기";
    } else {
      logDiv.style.display = "none";
      btn.textContent = "펼치기";
    }
  }

  function formatMesoKorean(v) {
    if (!v) return "0 메소";
    const jo = Math.floor(v / 1000000000000);
    let rem = v % 1000000000000;
    const eok = Math.floor(rem / 100000000);
    rem = rem % 100000000;
    const man = Math.floor(rem / 10000);
    const one = rem % 10000;

    const parts = [];
    if (jo) parts.push(jo + "조");
    if (eok) parts.push(eok + "억");
    if (man) parts.push(man + "만");
    if (one || parts.length === 0) parts.push(one.toLocaleString("ko-KR"));

    return parts.join(" ") + " 메소";
  }

  // Getters
  function getSelectedLevel() {
    return Number(document.getElementById("itemLevel").value);
  }

  function getSelectedPartsType() {
    return Number(document.getElementById("partsType").value);
  }

  function getSelectedCubeKind() {
    const el = document.querySelector('input[name="cubeKind"]:checked');
    return el ? el.value : "black";
  }

  function getSelectedCubeId() {
    const kind = getSelectedCubeKind();
    if (kind === "addi") return CUBE_ID_ADDI;
    if (kind === "meister") return CUBE_ID_MEISTER;
    return CUBE_ID_BLACK;
  }

  // Start Auto Roll Sequence
  function startAutoRollSequence() {
    const keyword = document.getElementById("autoGoalKeyword").value.trim();
    const count = Number(document.getElementById("autoGoalCount").value);

    if (!keyword) {
      alert("자동 돌리기에 사용할 키워드(예: STR, 공격력, 크리티컬)를 입력해 주세요!");
      return;
    }

    updateAutoButtonState(true);

    const checkGoal = () => {
      for (let i = 0; i < 3; i++) {
        if (window.cubeGoals.matchKeywordGoal(rollCandidates[i], keyword, count)) {
          return { reached: true, index: i };
        }
      }
      return { reached: false };
    };

    const onRoll = () => {
      const rolled = doOneRollStep();
      return rolled;
    };

    window.autoRoll.start(checkGoal, onRoll);
  }

  function updateAutoButtonState(running) {
    const btn = document.getElementById("autoRollBtn");
    if (btn) {
      btn.textContent = running ? "자동 돌리기 정지" : "자동 돌리기 시작";
      btn.className = running ? "btn btn-danger" : "btn btn-secondary";
    }
    document.getElementById("rollBtn").disabled = running;
    document.getElementById("resetBtn").disabled = running;
    document.getElementById("itemLevel").disabled = running;
    document.getElementById("partsType").disabled = running;
    document.querySelectorAll('input[name="cubeKind"]').forEach(r => r.disabled = running);
  }
})();
