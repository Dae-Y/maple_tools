# maple_tools

A static GitHub Pages collection of utility calculators and tools for MapleStory.

## Deployed Pages

* **Main Tools Hub:** [https://dae-y.github.io/maple_tools/](https://dae-y.github.io/maple_tools/)
* **MVP Calculator:** [https://dae-y.github.io/maple_tools/mvp-calculator.html](https://dae-y.github.io/maple_tools/mvp-calculator.html)
* **Cube Simulator:** [https://dae-y.github.io/maple_tools/cube-simulator.html](https://dae-y.github.io/maple_tools/cube-simulator.html)

---

## Route Structure

* `/` — **메이플 도구함 (Maple Tools Hub)**: The centralized multi-page landing hub for all available MapleStory utility tools.
* `/mvp-calculator.html` — **MVP작 계산기 (MVP Calculator)**: Calculates the most efficient cash item combinations and anticipated cash loss to reach a target MVP tier.
* `/cube-simulator.html` — **큐브 시뮬레이터 (Cube Simulator)**: Simulates equipment potential resets using official probability tables and estimated meso rolling costs.

---

## Key Features

### 1. MVP작 & 메소마켓 계산기 (MVP Calculator)
* **MVP Tier Target Calculation:** Set your current tier, target tier, and remaining required cash to view precise path combinations.
* **Auction House Route Calculation:** Compare cash item auction house values to optimize real cash recovery.
* **Mileage Discount Support:** Factor in 30% mileage discounts on cash items (with a togglable "disable mileage" option).
* **Meso Market Route Calculator:** Compute Nexon Cash -> Maple Points -> Meso -> Cash (Water rate ratio) conversion paths to quickly analyze instant-liquidity strategies.
* **LocalStorage Save/Load:** Instantly save all your current cash item auction house price inputs, basic settings, and custom configurations.
* **Custom Cash Item Support:** Manually add newly released or customized cash items (name, price, mileage applicability) to calculations instantly.
* **Profit-first vs Speed-first Strategies:** Choose between minimizing expected losses (`이익우선`) and minimizing item trade quantity (`시간우선`).
* **Modular JavaScript Organization:** De-cluttered structure with pricing lists, calculation engines, and meso market modules organized nicely under the `js/mvp-calculator/` directory.

### 2. 큐브 시뮬레이터 (Cube Simulator) - Phase 1 & 1.5
* **Official Probability Tables:** Powered by official Nexon-grade probability JSON files located in `data/cube-simulator/` (Main potential `bcprobs.json`, Additional potential `wcprobs.json`, Meister cube `acprobs.json`).
* **Duplicate Option Constraints:** Strictly implements official constraints:
  - *Only One* occurrence allowed: `쓸만한` skill or `피격 후 무적` lines.
  - *At Most Two* occurrences allowed: `피격 시 일정 확률로 데미지` or `피격 시 일정 확률로 일정 시간 무적` lines.
* **Exact Same Reroll Rule:** Prevents rolling the exact same potential set back-to-back using a 5000 attempt protection wrapper.
* **Level-Based Meso Cost Estimations:** Computes cumulative meso costs based on item level thresholds (100, 120, 130, 140, 150, 160, 200, 250) and meister Azmos estimates.
* **Keyword-based Auto-Rolling:** Background-looping (using non-blocking timeouts) to roll until at least `N` lines contain a desired target keyword (e.g. "STR", "공격력", "크리티컬 데미지", "올스탯"), complete with maximum roll safety caps (100k rolls) and successful card highlights.
* **Modular Architecture:** Clean separation of loaders (`cubeData.js`), rolling logic (`cubeRoller.js`), target checkers (`cubeGoals.js`), loopers (`autoRoll.js`), and glue engines (`cubeSimulator.js`).

---

## Local Development

To run the tools hub locally, launch any standard HTTP server in the project directory:

```bash
# Using Python 3
python3 -m http.server 8000
```

Then visit:
* `http://localhost:8000/` (Main Hub)
* `http://localhost:8000/mvp-calculator.html` (MVP Calculator)
* `http://localhost:8000/cube-simulator.html` (Cube Simulator)

---

## Updating Cube Probability Data

To update the local cube probability JSON files from the official MapleStory probability endpoint, run:

```bash
node scripts/update-cube-probabilities.mjs
```

> [!NOTE]
> This script runs locally in Node.js (Node 18+ built-in `fetch`) without any external `npm` dependencies. It fetches official MapleStory Legendary potential tables from the Nexon endpoint, performs validation on option sums, and safely overwrites:
> * `data/cube-simulator/bcprobs.json`
> * `data/cube-simulator/wcprobs.json`
> * `data/cube-simulator/acprobs.json`
>
> The website itself uses these static JSON files rather than fetching Nexon directly at runtime to prevent browser CORS block issues.

