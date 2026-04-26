const ICON_BASE = "assets/icons/";
const MVP_ICON_BASE = "assets/mvp/";
const FALLBACK_ICON = `${ICON_BASE}fallback.png`;
const AUCTION_FEE_RATE = 0.03;
const STORAGE_KEY = "maple_mvp_calculator_state_v1";

const MVP_LEVELS = [
  {
    id: "bronze",
    name: "브론즈",
    amount: 150_000,
    nextId: "silver",
  },
  {
    id: "silver",
    name: "실버",
    amount: 300_000,
    nextId: "gold",
  },
  {
    id: "gold",
    name: "골드",
    amount: 600_000,
    nextId: "diamond",
  },
  {
    id: "diamond",
    name: "다이아",
    amount: 900_000,
    nextId: "red",
  },
  {
    id: "red",
    name: "레드",
    amount: 1_500_000,
    nextId: "black",
  },
  {
    id: "black",
    name: "블랙",
    amount: 3_000_000,
    nextId: null,
  },
];

const MVP_TIERS = [
  {
    id: "silver",
    name: "실버",
    amount: 300_000,
    icon: "mvp_silver.webp",
  },
  {
    id: "gold",
    name: "골드",
    amount: 600_000,
    icon: "mvp_gold.webp",
  },
  {
    id: "diamond",
    name: "다이아",
    amount: 900_000,
    icon: "mvp_diamond.webp",
  },
  {
    id: "red",
    name: "레드",
    amount: 1_500_000,
    icon: "mvp_red.webp",
  },
  {
    id: "black",
    name: "블랙",
    amount: 3_000_000,
    icon: "mvp_black.webp",
  },
];

/*
  새 아이템 추가하려면 배열 안에 더 넣으면 됨.
  예시:
  {
    id: "new_item_1",
    name: "새 아이템 1개",
    cashPrice: 12300,
    icon: "fallback.png",
    mileageDiscount: false,
  }

  icon은 assets/icons/ 안에 넣기.
  mileageDiscount: true  -> 마일리지 적용 품목
  mileageDiscount: false -> 마일리지 미적용 품목
*/
const ITEMS = [
  {
    id: "royal_1",
    name: "로얄 1개",
    cashPrice: 2200,
    icon: "royal.png",
    mileageDiscount: false,
  },
  {
    id: "royal_10",
    name: "로얄 10개",
    cashPrice: 22000,
    icon: "royal.png",
    mileageDiscount: false,
  },
  {
    id: "royal_20",
    name: "로얄 20개",
    cashPrice: 44000,
    icon: "royal.png",
    mileageDiscount: false,
  },
  {
    id: "royal_45",
    name: "로얄 45개",
    cashPrice: 99000,
    icon: "royal.png",
    mileageDiscount: false,
  },
  {
    id: "wonderberry_1",
    name: "원더베리 1개",
    cashPrice: 5400,
    icon: "wonderberry.webp",
    mileageDiscount: false,
  },
  {
    id: "wonderberry_11",
    name: "원더베리 11개",
    cashPrice: 54000,
    icon: "wonderberry.webp",
    mileageDiscount: false,
  },
  {
    id: "scissors",
    name: "플래티넘 가위",
    cashPrice: 5900,
    icon: "scissors.png",
    mileageDiscount: true,
  },
  {
    id: "premium_hair",
    name: "프리미엄 헤쿠",
    cashPrice: 5500,
    icon: "premium_hair.png",
    mileageDiscount: true,
  },
  {
    id: "premium_face",
    name: "프리미엄 성쿠",
    cashPrice: 3500,
    icon: "premium_face.png",
    mileageDiscount: true,
  },
  {
    id: "black_hair",
    name: "흑발 헤쿠",
    cashPrice: 20000,
    icon: "black_hair.png",
    mileageDiscount: true,
  },
  {
    id: "white_eye",
    name: "백안 성쿠",
    cashPrice: 20000,
    icon: "white_eye.png",
    mileageDiscount: true,
  },
  {
    id: "boutique_1",
    name: "부티크 1개",
    cashPrice: 3300,
    icon: "boutique.png",
    mileageDiscount: false,
  },
  {
    id: "boutique_10",
    name: "부티크 10개",
    cashPrice: 33000,
    icon: "boutique.png",
    mileageDiscount: false,
  },
  {
    id: "luna_crystal",
    name: "루나 크리스탈",
    cashPrice: 3900,
    icon: "luna_crystal.webp",
    mileageDiscount: false,
  },
  {
    id: "platinum_apple_1",
    name: "플래 애플 1개",
    cashPrice: 3500,
    icon: "plat_apple.png",
    mileageDiscount: false,
  },
  {
    id: "platinum_apple_33",
    name: "플래 애플 33개",
    cashPrice: 99000,
    icon: "plat_apple.png",
    mileageDiscount: false,
  },
];

const $ = (id) => document.getElementById(id);

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function formatKRW(value) {
  return `${formatNumber(value)}원`;
}

function formatCash(value) {
  return `${formatNumber(value)} 캐시`;
}

function formatMeso(value) {
  const rounded = Math.round(value);

  if (rounded === 0) return "0 메소";

  const eok = Math.floor(rounded / 100_000_000);
  const man = Math.floor((rounded % 100_000_000) / 10_000);
  const rest = rounded % 10_000;

  const parts = [];

  if (eok > 0) parts.push(`${formatNumber(eok)}억`);
  if (man > 0) parts.push(`${formatNumber(man)}만`);
  if (rest > 0) parts.push(`${formatNumber(rest)}`);

  return `${parts.join(" ")} 메소`;
}

function parseNumberInput(value) {
  const cleaned = String(value ?? "").replaceAll(",", "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMesoText(value) {
  return String(value ?? "")
    .replaceAll(",", "")
    .trim()
    // 한영키 안 누른 상태에서 1억, 1만을 입력한 경우 대응
    // 억 = djr, 만 = aks
    .replace(/djr/gi, "억")
    .replace(/aks/gi, "만");
}

function parseMesoInput(value) {
  const text = normalizeMesoText(value);

  if (!text) return 0;

  let total = 0;

  const eokMatch = text.match(/(\d+(?:\.\d+)?)\s*억/);
  const manMatch = text.match(/(\d+(?:\.\d+)?)\s*만/);

  if (eokMatch) {
    total += Number(eokMatch[1]) * 100_000_000;
  }

  if (manMatch) {
    total += Number(manMatch[1]) * 10_000;
  }

  const remainderText = text
    .replace(/(\d+(?:\.\d+)?)\s*억/, "")
    .replace(/(\d+(?:\.\d+)?)\s*만/, "")
    .replace(/[^\d]/g, "");

  if (remainderText) {
    total += Number(remainderText);
  }

  if (total > 0) return total;

  const numericOnly = text.replace(/[^\d]/g, "");
  return numericOnly ? Number(numericOnly) : 0;
}

function getIconPath(icon) {
  return `${ICON_BASE}${icon || "fallback.png"}`;
}

function getMvpLevelById(id) {
  return MVP_LEVELS.find((level) => level.id === id) ?? MVP_LEVELS[0];
}

function getNextMvpLevel(currentLevel) {
  if (!currentLevel.nextId) return null;
  return getMvpLevelById(currentLevel.nextId);
}

function calculateCurrentMvpFromTier() {
  const currentTierId = $("currentTier").value;
  const currentLevel = getMvpLevelById(currentTierId);
  const nextLevel = getNextMvpLevel(currentLevel);
  const remainingToNext = parseNumberInput($("remainingToNext").value);

  if (!nextLevel) {
    return {
      currentMvp: currentLevel.amount,
      currentLevel,
      nextLevel: null,
      remainingToNext: 0,
      warning: "블랙 등급은 다음 등급이 없어 현재 누적금액을 블랙 기준 금액으로 계산합니다.",
    };
  }

  const currentMvp = Math.max(0, nextLevel.amount - remainingToNext);

  let warning = "";

  if (
    currentLevel.id === "bronze" &&
    remainingToNext === nextLevel.amount
  ) {
    warning = "MVP작을 처음 하시는군요!";
  } else if (currentMvp < currentLevel.amount) {
    warning = `${currentLevel.name} 등급 기준보다 낮게 계산되었습니다. 입력한 남은 캐시가 너무 큰지 확인해보세요.`;
  }

  if (currentMvp > nextLevel.amount) {
    warning = `${nextLevel.name} 기준보다 높게 계산되었습니다. 남은 캐시는 0 이상이어야 합니다.`;
  }

  return {
    currentMvp,
    currentLevel,
    nextLevel,
    remainingToNext,
    warning,
  };
}

function updateCurrentMvpPreview() {
  const result = calculateCurrentMvpFromTier();

  $("computedCurrentMvp").textContent = formatCash(result.currentMvp);

  if (!result.nextLevel) {
    $("remainingToNextLabel").textContent = "다음 등급까지 남은 캐시";
    $("remainingToNext").value = 0;
    $("remainingToNext").disabled = true;
    $("computedCurrentMvpNote").textContent = result.warning;
    return;
  }

  $("remainingToNext").disabled = false;
  $("remainingToNextLabel").textContent = `${result.nextLevel.name} 등급까지 남은 캐시`;

  $("computedCurrentMvpNote").textContent =
    result.warning ||
    `${result.nextLevel.name} 기준 ${formatCash(result.nextLevel.amount)} - 남은 캐시 ${formatCash(result.remainingToNext)}로 계산했습니다.`;
}

function getSelectedTier() {
  const selectedAmount = parseNumberInput($("selectedTargetMvp").value);
  return MVP_TIERS.find((tier) => tier.amount === selectedAmount) ?? MVP_TIERS[3];
}

function renderMvpTiers() {
  const selectedAmount = parseNumberInput($("selectedTargetMvp").value);
  const tierList = $("mvpTierList");

  tierList.innerHTML = MVP_TIERS.map((tier) => {
    const activeClass = tier.amount === selectedAmount ? "active" : "";

    return `
      <button
        type="button"
        class="mvp-tier-button ${activeClass}"
        data-mvp-amount="${tier.amount}"
        data-tier-id="${tier.id}"
        aria-label="${tier.name} 선택"
      >
        <img src="${MVP_ICON_BASE}${tier.icon}" alt="${tier.name}" />
        <span>${tier.name}</span>
        <small>${formatCash(tier.amount)}</small>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".mvp-tier-button").forEach((button) => {
    button.addEventListener("click", () => {
      $("selectedTargetMvp").value = button.dataset.mvpAmount;
      renderMvpTiers();
    });
  });
}

function getCurrentAuctionInputValues() {
  const values = {};

  document.querySelectorAll(".auction-input").forEach((input) => {
    values[input.id] = input.value;
  });

  return values;
}

function renderItemRows(items) {
  return items.map((item) => {
    const inputId = `auction-${item.id}`;

    return `
      <div class="item-row">
        <img
          class="item-icon"
          src="${getIconPath(item.icon)}"
          alt="${item.name}"
          onerror="this.src='${FALLBACK_ICON}'"
        />

        <div class="item-info">
          <div class="item-name" title="${item.name}">${item.name}</div>
        </div>

        <div class="cash-price" title="${formatCash(item.cashPrice)}">${formatCash(item.cashPrice)}</div>

        <div class="auction-container">
          <input
            class="auction-input"
            id="${inputId}"
            type="text"
            inputmode="text"
            lang="ko"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="경매장 가격 입력"
          />
          <button
            class="btn-reset-auction"
            type="button"
            data-target="${inputId}"
            title="이 가격만 초기화"
            aria-label="${item.name} 경매장 가격 초기화"
          >
            ⟳
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function attachAuctionResetHandlers() {
  document.querySelectorAll(".btn-reset-auction").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const input = $(targetId);

      if (input) {
        input.value = "";
        input.focus();
      }
    });
  });
}

function renderItems(preserveInputValues = false) {
  const previousValues = preserveInputValues ? getCurrentAuctionInputValues() : {};
  const itemList = $("itemList");

  const nonMileageItems = ITEMS.filter((item) => !item.mileageDiscount);
  const mileageItems = ITEMS.filter((item) => item.mileageDiscount);

  itemList.innerHTML = `
    <div class="item-groups">
      <section class="item-group">
        <div class="item-group-header">
          <h3>마일리지 미적용 품목</h3>
          <p>넥슨캐시로만 구매 가능합니다.</p>
        </div>

        <div class="grouped-item-list">
          ${renderItemRows(nonMileageItems)}
        </div>
      </section>

      <section class="item-group">
        <div class="item-group-header">
          <h3>마일리지 적용 품목</h3>
          <p>보유 마일리지를 최대 30%까지 사용할 수 있습니다.</p>
        </div>

        <div class="grouped-item-list">
          ${renderItemRows(mileageItems)}
        </div>
      </section>
    </div>
  `;

  Object.entries(previousValues).forEach(([inputId, value]) => {
    const input = $(inputId);
    if (input) input.value = value;
  });

  attachAuctionResetHandlers();
}

function addCustomItem() {
  const name = $("customItemName").value.trim();
  const cashPrice = parseNumberInput($("customItemCashPrice").value);
  const mileageDiscount = $("customItemMileage").checked;

  if (!name) {
    alert("아이템 이름을 입력해주세요.");
    return;
  }

  if (cashPrice <= 0) {
    alert("캐시 가격을 올바르게 입력해주세요.");
    return;
  }

  const customItem = {
    id: `custom_${Date.now()}`,
    name,
    cashPrice,
    icon: "fallback.png",
    mileageDiscount,
    isCustom: true,
  };

  ITEMS.push(customItem);

  $("customItemName").value = "";
  $("customItemCashPrice").value = "";
  $("customItemMileage").checked = false;

  renderItems(true);
}

function getAuctionInputValues() {
  const values = {};

  for (const item of ITEMS) {
    const input = $(`auction-${item.id}`);
    if (input && input.value.trim()) {
      values[item.id] = input.value.trim();
    }
  }

  return values;
}

function getCustomItemsForStorage() {
  return ITEMS
    .filter((item) => item.isCustom)
    .map((item) => ({
      id: item.id,
      name: item.name,
      cashPrice: item.cashPrice,
      icon: "fallback.png",
      mileageDiscount: item.mileageDiscount,
      isCustom: true,
    }));
}

function saveCalculatorState() {
  const state = {
    version: 1,
    savedAt: new Date().toISOString(),

    inputs: {
      currentMileage: $("currentMileage").value,
      waterRate: $("waterRate").value,
      currentTier: $("currentTier").value,
      remainingToNext: $("remainingToNext").value,
      selectedTargetMvp: $("selectedTargetMvp").value,
      disableMileage: $("disableMileage").checked,
    },

    auctionInputs: getAuctionInputValues(),
    customItems: getCustomItemsForStorage(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  alert("저장되었습니다. 다음에 이 브라우저에서 다시 열어도 입력값이 유지됩니다.");
}

function loadCalculatorState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw);
  } catch (error) {
    console.warn("저장된 데이터를 불러오지 못했습니다.", error);
    return null;
  }
}

function applySavedCustomItems(savedState) {
  if (!savedState || !Array.isArray(savedState.customItems)) {
    return;
  }

  for (const item of savedState.customItems) {
    const alreadyExists = ITEMS.some((existingItem) => existingItem.id === item.id);

    if (!alreadyExists) {
      ITEMS.push({
        id: item.id,
        name: item.name,
        cashPrice: Number(item.cashPrice),
        icon: "fallback.png",
        mileageDiscount: Boolean(item.mileageDiscount),
        isCustom: true,
      });
    }
  }
}

function applySavedInputs(savedState) {
  if (!savedState || !savedState.inputs) {
    return;
  }

  const inputs = savedState.inputs;

  if ($("currentMileage")) $("currentMileage").value = inputs.currentMileage ?? 0;
  if ($("waterRate")) $("waterRate").value = inputs.waterRate ?? 1600;
  if ($("currentTier")) $("currentTier").value = inputs.currentTier ?? "bronze";
  if ($("remainingToNext")) $("remainingToNext").value = inputs.remainingToNext ?? 300_000;
  if ($("selectedTargetMvp")) $("selectedTargetMvp").value = inputs.selectedTargetMvp ?? 1_500_000;
  if ($("disableMileage")) $("disableMileage").checked = Boolean(inputs.disableMileage);

  if (savedState.auctionInputs) {
    Object.entries(savedState.auctionInputs).forEach(([itemId, value]) => {
      const input = $(`auction-${itemId}`);
      if (input) {
        input.value = value;
      }
    });
  }

  renderMvpTiers();
  updateCurrentMvpPreview();
}

function getAuctionPrices() {
  const prices = {};

  for (const item of ITEMS) {
    const input = $(`auction-${item.id}`);
    if (input) {
      prices[item.id] = parseMesoInput(input.value);
    }
  }

  return prices;
}

function calculateSinglePurchase(
  item,
  currentMileage,
  auctionPrice,
  waterRate,
  disableMileage
) {
  const maxMileageDiscount = item.mileageDiscount && !disableMileage
    ? Math.floor(item.cashPrice * 0.3)
    : 0;

  const mileageUsed = Math.min(currentMileage, maxMileageDiscount);
  const actualCashSpent = item.cashPrice - mileageUsed;

  const mileageEarned = Math.floor(actualCashSpent * 0.05);

  const mesoAfterFee = auctionPrice * (1 - AUCTION_FEE_RATE);
  const recoveredCash = Math.floor((mesoAfterFee / 100_000_000) * waterRate);

  const loss = actualCashSpent - recoveredCash;
  const efficiency = actualCashSpent > 0 ? recoveredCash / actualCashSpent : 0;

  return {
    item,
    mileageUsed,
    actualCashSpent,
    mileageEarned,
    mesoAfterFee,
    recoveredCash,
    loss,
    efficiency,
  };
}

function makeSummaryBox(label, value) {
  return `
    <div class="summary-box">
      <div class="summary-label">${label}</div>
      <div class="summary-value">${value}</div>
    </div>
  `;
}

function runSimulation() {
  const startingMileage = parseNumberInput($("currentMileage").value);
  const waterRate = parseNumberInput($("waterRate").value);
  const targetMvp = parseNumberInput($("selectedTargetMvp").value);
  const currentMvpInput = calculateCurrentMvpFromTier().currentMvp;
  const disableMileage = $("disableMileage").checked;

  const selectedTier = getSelectedTier();
  const auctionPrices = getAuctionPrices();

  if (targetMvp <= 0 || waterRate <= 0) {
    alert("목표 MVP 등급과 물통비율을 올바르게 입력해주세요.");
    return;
  }

  const hasAnyAuctionPrice = Object.values(auctionPrices).some((price) => price > 0);

  if (!hasAnyAuctionPrice) {
    alert("최소 1개 이상의 아이템 경매장 가격을 입력해주세요.");
    return;
  }

  let mileage = startingMileage;
  let currentMvp = currentMvpInput;

  let totalCashSpent = 0;
  let totalMileageUsed = 0;
  let totalMileageEarned = 0;
  let totalMesoAfterFee = 0;
  let totalRecoveredCash = 0;

  const plan = {};
  const maxIterations = 100_000;
  let iterations = 0;
  let stoppedReason = "";

  while (currentMvp < targetMvp && iterations < maxIterations) {
    iterations++;

    const candidates = ITEMS
      .map((item) => {
        const auctionPrice = auctionPrices[item.id];

        if (!auctionPrice || auctionPrice <= 0) {
          return null;
        }

        return calculateSinglePurchase(
          item,
          mileage,
          auctionPrice,
          waterRate,
          disableMileage
        );
      })
      .filter((candidate) => {
        return candidate !== null && candidate.actualCashSpent > 0;
      });

    if (candidates.length === 0) {
      stoppedReason = "입력된 경매장 가격 기준으로 구매 가능한 아이템이 없어 계산이 중단되었습니다.";
      break;
    }

    candidates.sort((a, b) => {
      if (b.efficiency !== a.efficiency) {
        return b.efficiency - a.efficiency;
      }

      return b.actualCashSpent - a.actualCashSpent;
    });

    const best = candidates[0];
    const itemId = best.item.id;

    mileage -= best.mileageUsed;

    currentMvp += best.actualCashSpent;
    totalCashSpent += best.actualCashSpent;

    mileage += best.mileageEarned;
    totalMileageUsed += best.mileageUsed;
    totalMileageEarned += best.mileageEarned;

    totalRecoveredCash += best.recoveredCash;
    totalMesoAfterFee += best.mesoAfterFee;

    if (!plan[itemId]) {
      plan[itemId] = {
        name: best.item.name,
        count: 0,
        totalCashSpent: 0,
        totalMileageUsed: 0,
        totalRecoveredCash: 0,
        totalLoss: 0,
      };
    }

    plan[itemId].count += 1;
    plan[itemId].totalCashSpent += best.actualCashSpent;
    plan[itemId].totalMileageUsed += best.mileageUsed;
    plan[itemId].totalRecoveredCash += best.recoveredCash;
    plan[itemId].totalLoss += best.loss;
  }

  if (iterations >= maxIterations) {
    stoppedReason = "반복 횟수가 너무 많아 계산이 중단되었습니다.";
  }

  const actualCost = totalCashSpent - totalRecoveredCash;
  const mvpAchieved = currentMvp >= targetMvp;

  renderResults({
    selectedTier,
    actualCost,
    targetMvp,
    currentMvp,
    mvpAchieved,
    mileage,
    totalCashSpent,
    totalMileageUsed,
    totalMileageEarned,
    totalMesoAfterFee,
    totalRecoveredCash,
    plan,
    stoppedReason,
    disableMileage,
  });
}

function renderResults(result) {
  $("resultSection").classList.remove("hidden");

  $("summaryGrid").innerHTML = [
    makeSummaryBox("목표 MVP 등급", `${result.selectedTier.name} / ${formatCash(result.targetMvp)}`),
    makeSummaryBox("실제 소모된 내 현금", formatKRW(result.actualCost)),
    makeSummaryBox("총 MVP 누적", formatCash(result.currentMvp)),
    makeSummaryBox("총 캐시 사용", formatCash(result.totalCashSpent)),
    makeSummaryBox("총 회수 현금", formatKRW(result.totalRecoveredCash)),
    makeSummaryBox("수수료 후 받은 총 메소", formatMeso(result.totalMesoAfterFee)),
    makeSummaryBox("총 마일리지 사용", `${formatNumber(result.totalMileageUsed)} 마일리지`),
    makeSummaryBox("총 마일리지 적립", `${formatNumber(result.totalMileageEarned)} 마일리지`),
    makeSummaryBox("최종 마일리지", `${formatNumber(result.mileage)} 마일리지`),
    makeSummaryBox("마일리지 사용 설정", result.disableMileage ? "미사용" : "사용"),
  ].join("");

  const rows = Object.values(result.plan)
    .sort((a, b) => b.totalCashSpent - a.totalCashSpent)
    .map((entry) => {
      return `
        <tr>
          <td>${entry.name}</td>
          <td>${formatNumber(entry.count)}개</td>
          <td>${formatCash(entry.totalCashSpent)}</td>
          <td>${formatNumber(entry.totalMileageUsed)}</td>
          <td>${formatKRW(entry.totalRecoveredCash)}</td>
          <td>${formatKRW(entry.totalLoss)}</td>
        </tr>
      `;
    })
    .join("");

  $("planTableBody").innerHTML = rows || `
    <tr>
      <td colspan="6">구매 가능한 조합이 없습니다.</td>
    </tr>
  `;

  const notes = [];

  if (result.mvpAchieved) {
    notes.push("목표 MVP 금액을 달성했습니다. MVP 누적은 마일리지 할인 후 실제 넥슨캐시가 차감된 금액 기준으로 계산했습니다.");
  } else {
    notes.push("목표 MVP 금액을 달성하지 못했습니다. MVP 누적은 마일리지 할인 후 실제 넥슨캐시가 차감된 금액 기준으로 계산했습니다.");
  }

  if (result.disableMileage) {
    notes.push("마일리지 미사용 옵션이 켜져 있어, 마일리지 할인 가능 아이템도 마일리지를 사용하지 않는 것으로 계산했습니다.");
  } else {
    notes.push("마일리지 할인 가능 아이템은 보유 마일리지 한도 내에서 최대 30%까지 사용하는 것으로 계산했습니다.");
  }

  if (result.actualCost < 0) {
    notes.push("축하합니다. 이득보고 MVP작 하셨네요!");
  }

  if (result.stoppedReason) {
    notes.push(result.stoppedReason);
  }

  $("resultNote").innerHTML = `
    <ul>
      ${notes.map((note) => `<li>${note}</li>`).join("")}
    </ul>
  `;
}

function resetInputs() {
  const confirmed = confirm("모든 입력값과 저장된 가격을 초기화하시겠습니까?");

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);

  for (let i = ITEMS.length - 1; i >= 0; i--) {
    if (ITEMS[i].isCustom) {
      ITEMS.splice(i, 1);
    }
  }

  renderItems();

  for (const item of ITEMS) {
    const input = $(`auction-${item.id}`);
    if (input) input.value = "";
  }

  $("currentMileage").value = 0;
  $("waterRate").value = 1600;
  $("currentTier").value = "bronze";
  $("remainingToNext").value = 300_000;
  $("selectedTargetMvp").value = 1_500_000;
  $("disableMileage").checked = false;

  renderMvpTiers();
  updateCurrentMvpPreview();
  $("resultSection").classList.add("hidden");

  alert("입력값이 초기화되었습니다.");
}

const savedState = loadCalculatorState();

applySavedCustomItems(savedState);

renderMvpTiers();
renderItems();

applySavedInputs(savedState);
updateCurrentMvpPreview();

$("currentTier").addEventListener("change", updateCurrentMvpPreview);
$("remainingToNext").addEventListener("input", updateCurrentMvpPreview);

$("calculateBtn").addEventListener("click", runSimulation);
$("saveStateBtn").addEventListener("click", saveCalculatorState);
$("resetBtn").addEventListener("click", resetInputs);
$("addCustomItemBtn").addEventListener("click", addCustomItem);