// js/cube-simulator/autoRoll.js
window.autoRoll = (function() {
  let isRunning = false;
  let timerId = null;
  const maxRolls = 100000;

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    console.log("자동 돌리기 정지.");
    // Dispatch end event to UI
    window.dispatchEvent(new CustomEvent("cubeSim:autoRollEnd", { detail: { reached: false } }));
  }

  function start(checkGoalFn, onRollFn) {
    if (isRunning) return;
    isRunning = true;
    console.log("자동 돌리기 시작.");

    clearHighlights();

    function step() {
      if (!isRunning) return;

      // 1. Perform 3 rolls (doOneRollStep equivalents)
      const rolled = onRollFn();
      if (!rolled) {
        isRunning = false;
        timerId = null;
        window.dispatchEvent(new CustomEvent("cubeSim:autoRollEnd", { detail: { reached: false, error: true } }));
        return;
      }

      // 2. Check goals
      const matchResult = checkGoalFn();
      if (matchResult.reached) {
        isRunning = false;
        highlightSuccessfulCard(matchResult.index);
        window.dispatchEvent(new CustomEvent("cubeSim:autoRollEnd", { detail: { reached: true, index: matchResult.index } }));
        return;
      }

      // 3. Limit checks
      const stats = window.cubeSimulatorState.getStats();
      if (stats.rollCount >= maxRolls) {
        isRunning = false;
        window.dispatchEvent(new CustomEvent("cubeSim:autoRollEnd", { detail: { reached: false, limit: true } }));
        return;
      }

      // 4. Loop with zero-delay setTimeout to avoid freezing browser threads
      timerId = setTimeout(step, 0);
    }

    step();
  }

  function clearHighlights() {
    ["box-roll1", "box-roll2", "box-roll3"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove("auto-hit");
        el.classList.remove("auto-hit-flash");
      }
    });
  }

  function highlightSuccessfulCard(index) {
    const boxId = `box-roll${index + 1}`;
    const el = document.getElementById(boxId);
    if (el) {
      el.classList.add("auto-hit");
      el.classList.add("auto-hit-flash");
      el.addEventListener("animationend", () => {
        el.classList.remove("auto-hit-flash");
      }, { once: true });
    }
  }

  return {
    start,
    stop,
    clearHighlights,
    getIsRunning: () => isRunning
  };
})();
