# maple_tools

메이플스토리 관련 계산기와 시뮬레이터를 모아둔 정적 웹 도구함입니다.  
GitHub Pages에서 HTML/CSS/JavaScript만으로 동작합니다.

## 배포 링크

- 메이플 도구함: https://dae-y.github.io/maple_tools/
- MVP작 계산기: https://dae-y.github.io/maple_tools/mvp-calculator.html
- 큐브 시뮬레이터: https://dae-y.github.io/maple_tools/cube-simulator.html

## 페이지 구성

- `/`  
  메이플 관련 도구들을 모아둔 메인 페이지입니다.

- `/mvp-calculator.html`  
  캐시 아이템 경매장 가격, 마일리지, 물통비율을 입력해 목표 MVP 등급까지의 예상 손실과 구매 조합을 계산합니다.  
  메소마켓 루트 계산도 함께 제공합니다.

- `/cube-simulator.html`  
  메이플스토리 공식 확률표 데이터를 기반으로 잠재능력 재설정 결과를 시뮬레이션합니다.  
  원하는 옵션을 줄별로 지정하거나, 공격력/보공/드메 같은 목표 조건으로 자동 돌리기를 실행할 수 있습니다.

## 프로젝트 구조

```text
maple_tools/
├── index.html
├── mvp-calculator.html
├── cube-simulator.html
├── assets/
├── css/
│   └── styles.css
├── data/
│   └── cube-simulator/
│       ├── acprobs.json
│       ├── bcprobs.json
│       └── wcprobs.json
├── js/
│   ├── mvp-calculator/
│   └── cube-simulator/
└── scripts/
    └── update-cube-probabilities.mjs
```

## 로컬 실행

프로젝트 폴더에서 간단한 로컬 서버를 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 아래 주소를 열면 됩니다.

```text
http://localhost:8000/
http://localhost:8000/mvp-calculator.html
http://localhost:8000/cube-simulator.html
```

## 큐브 확률 데이터 업데이트

큐브 시뮬레이터는 `data/cube-simulator/` 안의 JSON 파일을 사용합니다.

공식 홈페이지 확률표 기준으로 데이터를 다시 가져오려면 아래 명령어를 실행합니다.

```bash
node scripts/update-cube-probabilities.mjs
```

이 스크립트는 메이플스토리 공식 확률형 아이템 페이지에서 레전드리 잠재능력 확률표를 가져와 아래 파일들을 갱신합니다.

```text
data/cube-simulator/bcprobs.json
data/cube-simulator/wcprobs.json
data/cube-simulator/acprobs.json
```

웹페이지에서 넥슨 사이트를 직접 호출하지 않고, 로컬에서 JSON을 갱신한 뒤 정적 파일로 사용합니다.

## 참고

이 프로젝트는 개인 제작 팬 도구입니다.  
넥슨에서 공식 지원하거나 운영하는 페이지가 아닙니다.  
계산 결과와 시뮬레이션 결과는 참고용입니다.


## License

이 프로젝트의 소스코드와 자체 제작 구성은 All rights reserved입니다.  
사전 허가 없이 복사, 수정, 재배포, 상업적 이용, 별도 서비스 운영에 사용할 수 없습니다.

MapleStory 및 관련 아이콘/이미지/게임 데이터의 권리는 Nexon에 있습니다.


The source code and original project structure are All rights reserved.  
You may not copy, modify, redistribute, commercialize, or host this project as a separate service without prior permission.

MapleStory and related icons, images, names, and game data belong to Nexon.