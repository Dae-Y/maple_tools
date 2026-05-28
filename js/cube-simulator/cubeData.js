// js/cube-simulator/cubeData.js
window.cubeData = (function() {
  let bcProbs = [];
  let wcProbs = [];
  let acProbs = [];
  let allProbs = [];
  let isLoaded = false;
  const poolCache = new Map();

  async function load() {
    try {
      const [bc, wc, ac] = await Promise.all([
        fetch("data/cube-simulator/bcprobs.json").then(r => {
          if (!r.ok) throw new Error("bcprobs.json 로드 실패");
          return r.json();
        }),
        fetch("data/cube-simulator/wcprobs.json").then(r => {
          if (!r.ok) throw new Error("wcprobs.json 로드 실패");
          return r.json();
        }),
        fetch("data/cube-simulator/acprobs.json").then(r => {
          if (!r.ok) throw new Error("acprobs.json 로드 실패");
          return r.json();
        })
      ]);

      bcProbs = bc;
      wcProbs = wc;
      acProbs = ac;
      allProbs = [...bcProbs, ...wcProbs, ...acProbs];
      isLoaded = true;
      console.log("큐브 확률 데이터 로드 완료:", allProbs.length);
      return true;
    } catch (err) {
      console.error("큐브 확률 데이터 로딩 에러:", err);
      showError(err.message);
      throw err;
    }
  }

  function showError(msg) {
    const statusMsg = document.getElementById("cubeStatusMessage");
    if (statusMsg) {
      statusMsg.style.display = "block";
      statusMsg.innerHTML = `
        <div style="background: #fee2e2; color: #b91c1c; padding: 16px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 20px; font-size: 14px; font-weight: 700; line-height: 1.5;">
          ⚠️ 데이터 로드 실패: ${msg}<br>
          <span style="font-size: 12px; font-weight: normal; color: #7f1d1d; display: block; margin-top: 4px;">
            로컬 서버(python3 -m http.server 8000)를 실행 중인지, 혹은 브라우저가 CORS 정책이나 파일 액세스 제한 등으로 JSON 파일을 읽지 못하는지 확인해 주세요.
          </span>
        </div>
      `;
    }
  }

  function getBasePool(cubeItemID, partsType, reqLev, line) {
    const key = `${cubeItemID}-${partsType}-${reqLev}-${line}`;
    if (poolCache.has(key)) return poolCache.get(key);

    const pool = allProbs.filter(
      r =>
        r.cubeItemID === String(cubeItemID) &&
        r.partsType === Number(partsType) &&
        r.reqLev === Number(reqLev) &&
        r.line === Number(line)
    );
    poolCache.set(key, pool);
    return pool;
  }

  return {
    load,
    getBasePool,
    getBcProbs: () => bcProbs,
    getWcProbs: () => wcProbs,
    getAcProbs: () => acProbs,
    getAllProbs: () => allProbs,
    getIsLoaded: () => isLoaded,
    clearCache: () => poolCache.clear()
  };
})();
