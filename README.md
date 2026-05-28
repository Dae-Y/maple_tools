# maple_tools

A static GitHub Pages collection of utility calculators and tools for MapleStory.

## Deployed Pages

* **Main Tools Hub:** [https://dae-y.github.io/maple_tools/](https://dae-y.github.io/maple_tools/)
* **MVP Calculator:** [https://dae-y.github.io/maple_tools/mvp-calculator.html](https://dae-y.github.io/maple_tools/mvp-calculator.html)
* **Cube Simulator (Placeholder):** [https://dae-y.github.io/maple_tools/cube-simulator.html](https://dae-y.github.io/maple_tools/cube-simulator.html)

---

## Route Structure

* `/` — **메이플 도구함 (Maple Tools Hub)**: The centralized multi-page landing hub for all available MapleStory utility tools.
* `/mvp-calculator.html` — **MVP작 계산기 (MVP Calculator)**: Calculates the most efficient cash item combinations and anticipated cash loss to reach a target MVP tier.
* `/cube-simulator.html` — **큐브 시뮬레이터 (Cube Simulator)**: Upcoming tool for simulating cube results and calculating estimated upgrade/option costs (currently under development).

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
