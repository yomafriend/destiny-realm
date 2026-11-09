
/*
 * 판타지에서 살아가기
 * Fantasy Life Simulator
 *
 * Version: 1.0.0-beta
 * Copyright (c) 2026 Fantasy Meister.
 * All Rights Reserved.
 *
 * Contact: fantasymaister@gmail.com
 *
 * 본 소프트웨어 및 관련 창작물 중 개발자가
 * 적법하게 권리를 보유한 부분에 관한 권리를
 * 유보합니다.
 *
 * 적용 법령과 제3자 라이선스에서 허용하는
 * 경우를 제외하고, 권리자의 허락 없는
 * 복제, 배포 및 상업적 이용을 금지합니다.
 *
 * 이 고지는 저작권 보호 대상이 아닌 아이디어,
 * AI 단독 생성물 또는 제3자 저작물에 대한
 * 독점적 권리를 주장하지 않습니다.
 */

"use strict";

const http = require("node:http");
const crypto = require("node:crypto");

const PORT = process.env.PORT || 3000;
const EMAIL = "fantasymaister@gmail.com";
const VERSION = "1.0.0-beta";

const WORLD = [
  {
    name: "루벨리아",
    countries: [
      "에테르 왕국",
      "발테리온 제국",
      "로젠하임 공국"
    ]
  },
  {
    name: "실바리아",
    countries: [
      "엘드라실 연방",
      "미르벨 수림왕국",
      "하르넬 자유도시"
    ]
  },
  {
    name: "카르둠",
    countries: [
      "두르가르 산악왕국",
      "아스란 부족연맹",
      "철관령"
    ]
  },
  {
    name: "네크라스",
    countries: [
      "벨제르 마도국",
      "아르카스 용혈제국",
      "사하르 상업연합"
    ]
  },
  {
    name: "아우렐리아",
    countries: [
      "솔라리스 성국",
      "천공도시 이스테라",
      "고대왕조 에리온"
    ]
  }
];

const RANKS = {
  prestige: "명성",
  money: "재산",
  sword: "검술",
  magic: "마법",
  health: "체력",
  luck: "운",
  children: "자녀 수",
  military: "군사력",
  territory: "영토",
  intelligence: "지능",
  adventure: "모험",
  longevity: "장수",
  overall: "종합"
};

let db = null;
let dbReady = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require("pg");

    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5
    });
  } catch (error) {
    console.error("PostgreSQL 준비 실패:", error.message);
  }
}

async function initializeDatabase() {
  if (!db) return;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS fantasy_rankings (
        id TEXT PRIMARY KEY,
        nickname VARCHAR(24) NOT NULL,
        character_name VARCHAR(80) NOT NULL,
        race VARCHAR(30) NOT NULL,
        age INTEGER NOT NULL DEFAULT 0,
        prestige BIGINT NOT NULL DEFAULT 0,
        money BIGINT NOT NULL DEFAULT 0,
        sword BIGINT NOT NULL DEFAULT 0,
        magic BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const additionalColumns = [
      "health",
      "luck",
      "children",
      "military",
      "territory",
      "intelligence",
      "adventure",
      "longevity",
      "overall"
    ];

    for (const column of additionalColumns) {
      await db.query(`
        ALTER TABLE fantasy_rankings
        ADD COLUMN IF NOT EXISTS ${column}
        BIGINT NOT NULL DEFAULT 0
      `);
    }

    dbReady = true;
    console.log("랭킹 DB 연결 완료");
  } catch (error) {
    dbReady = false;
    console.error("랭킹 DB 초기화 실패:", error);
  }
}

const CSS = `
:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f6f7f8;
  color: #27333b;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Apple SD Gothic Neo",
    "Noto Sans KR",
    sans-serif;
  line-height: 1.75;
}

main {
  max-width: 920px;
  margin: auto;
  padding: 28px 18px 70px;
}

h1 {
  font-size: 29px;
  margin: 0;
  letter-spacing: -1px;
}

h2 {
  font-size: 19px;
  margin: 0 0 12px;
}

h3 {
  font-size: 16px;
  margin: 22px 0 8px;
}

p {
  margin: 10px 0;
}

.muted {
  color: #73818a;
}

.small {
  font-size: 13px;
}

.card {
  background: #fff;
  border: 1px solid #dfe4e7;
  border-radius: 10px;
  padding: 22px;
  margin: 16px 0;
}

button {
  padding: 10px 15px;
  margin: 4px 4px 4px 0;
  border: 0;
  border-radius: 6px;
  background: #344f5f;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  filter: brightness(1.08);
}

button.secondary {
  background: #eaf0f3;
  color: #344a57;
}

button.danger {
  background: #a94c4c;
}

button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

input, select {
  width: 100%;
  padding: 11px;
  margin: 6px 0 12px;
  background: white;
  border: 1px solid #cbd5da;
  border-radius: 6px;
  font-size: 15px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.hidden {
  display: none !important;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat {
  padding: 12px;
  border-radius: 7px;
  background: #f1f5f7;
}

.stat small {
  display: block;
  color: #70808a;
}

.stat strong {
  font-size: 18px;
  word-break: break-word;
}

.choice {
  display: block;
  width: 100%;
  padding: 13px;
  text-align: left;
  background: #edf3f6;
  color: #2a424f;
  border: 1px solid #d4e0e6;
}

.choice:hover {
  background: #dfeaf0;
}

#eventCard {
  border-left: 4px solid #8399a7;
}

#eventText {
  white-space: pre-line;
}

.log {
  border-bottom: 1px solid #e8ecee;
  padding: 10px 0;
  font-size: 14px;
}

.rank-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rank-buttons button {
  padding: 7px 10px;
  font-size: 13px;
}

.rank-buttons button.active {
  background: #344f5f;
  color: white;
}

.scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 10px 7px;
  border-bottom: 1px solid #e5eaed;
  text-align: left;
}

footer {
  border-top: 1px solid #dce3e7;
  padding-top: 22px;
  margin-top: 40px;
  color: #6e7c85;
  font-size: 13px;
}

a {
  color: #376f8d;
  cursor: pointer;
}

footer a {
  margin-right: 12px;
  display: inline-block;
}

.notice {
  background: #f1f5f7;
  border-radius: 7px;
  padding: 12px;
  font-size: 13px;
}

@media(max-width: 550px) {
  main {
    padding: 16px 12px 60px;
  }

  .card {
    padding: 16px;
  }

  h1 {
    font-size: 25px;
  }
}
`;

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<meta name="description"
content="판타지 세계에서 태어나 자신만의 인생을 살아가는 웹 시뮬레이션 게임">

<meta name="author" content="Fantasy Meister">
<meta name="copyright"
content="Copyright 2026 Fantasy Meister. All Rights Reserved.">

<title>판타지에서 살아가기</title>

<style>${CSS}</style>
</head>

<body>
<main>

<header>
<h1>판타지에서 살아가기</h1>
<p class="muted">
당신은 이 세계에서 어떤 삶을 살게 될까요?
</p>
</header>

<section id="home">

<div class="card">
<h2>새로운 인생</h2>

<p>
다섯 대륙과 열다섯 국가.
당신의 출생과 신분, 가족과 운명은
새로운 인생마다 달라집니다.
</p>

<label for="nickname">플레이어 닉네임</label>
<input
id="nickname"
maxlength="16"
placeholder="닉네임을 입력하세요"
>

<label for="eraMode">출생 시대</label>
<select id="eraMode" onchange="toggleEra()">
<option value="random">
무작위 (제국력 500~1500년)
</option>
<option value="custom">
직접 선택
</option>
</select>

<div id="eraCustom" class="hidden">
<label for="eraYear">제국력 출생 연도</label>
<input
id="eraYear"
type="number"
min="500"
max="1500"
value="1000"
>
</div>

<button onclick="newLife()">태어나기</button>

<p class="muted small">
출생 연도는 게임 속 시대를 결정합니다.
이후 시간은 캐릭터의 나이에 따라 흐릅니다.
</p>
</div>

<div class="card">
<h2>세계 랭킹</h2>

<p class="muted" id="rankNotice">
랭킹을 불러오는 중입니다.
</p>

<div class="rank-buttons" id="rankButtons"></div>

<div class="scroll" id="ranking"></div>

<p class="muted small">
세계 랭킹은 선택적으로 등록할 수 있습니다.
등록하면 닉네임과 캐릭터 기록이 공개됩니다.
</p>
</div>

<div class="card">
<h2>게임 소개</h2>

<h3>출생과 신분</h3>
<p>
인간, 엘프, 드워프, 수인, 마족, 용인족,
정령족, 천족, 고대종 등 다양한 종족으로
태어날 수 있습니다.
</p>

<p>
농노에서 왕족까지 출생 신분이 존재합니다.
하지만 출생이 최종적인 운명을 결정하지는 않습니다.
</p>

<h3>성장과 역전</h3>
<p>
검술, 마법, 체력과 여러 능력치는
고정된 성장 상한이 없습니다.
</p>

<p>
평범한 농노도 극히 드문 기연과
오랜 노력으로 세계 최고의 인물이 될 수 있습니다.
</p>

<h3>인생의 사건</h3>
<p>
성장, 가족, 질병, 재난, 전쟁, 모험,
고대 유적, 마법과 같은 사건을 경험합니다.
</p>

<p>
같은 사건도 선택과 능력, 운에 따라
다른 결과로 이어집니다.
</p>

<h3>죽음과 기록</h3>
<p>
종족마다 수명이 다르며
질병이나 사고로 일찍 사망할 수도 있습니다.
</p>

<p>
살아온 인생은 연대기에 기록되고,
원하는 경우 세계 랭킹에 등록할 수 있습니다.
</p>
</div>

</section>

<section id="game" class="hidden">

<div class="card">

<h2 id="charTitle"></h2>
<p id="gameDate"></p>
<p id="charInfo" class="muted"></p>
<p id="familyInfo"></p>

<div class="grid" id="stats"></div>

<p id="lifeStatus" class="muted"></p>

<button onclick="togglePause()">
일시정지 / 계속
</button>

<button onclick="changeSpeed()">
속도 변경
</button>

<button onclick="toggleAuto()">
자동 결정
</button>

<button onclick="publishRank()">
세계 랭킹 등록
</button>

<button class="secondary" onclick="goHome()">
첫 화면
</button>

</div>

<div class="card" id="eventCard">

<h2 id="eventTitle"></h2>
<p id="eventText"></p>

<div id="choices"></div>

</div>

<div class="card">
<h2>인생 연대기</h2>
<div id="history"></div>
</div>

</section>

<section id="legal" class="card hidden">

<button class="secondary" onclick="showPage('home')">
돌아가기
</button>

<h2 id="legalTitle"></h2>
<div id="legalBody"></div>

</section>

<footer>

<p>
<strong>판타지에서 살아가기</strong>
· ${VERSION}
</p>

<p>
<a onclick="showLegal('privacy')">
개인정보 처리방침
</a>

<a onclick="showLegal('terms')">
이용약관
</a>

<a onclick="showLegal('copyright')">
저작권 안내
</a>

<a onclick="showLegal('notice')">
운영 안내
</a>

<a onclick="showLegal('updates')">
업데이트 내역
</a>

<a href="mailto:${EMAIL}">
문의하기
</a>
</p>

<p>
© 2026 Fantasy Meister.
All Rights Reserved.
</p>

<p>
본 게임에서 개발자가 적법하게 권리를 보유한
독창적인 세계관, 스토리, 캐릭터,
텍스트, 디자인 및 소스코드에 관한
권리는 개발자에게 있습니다.
</p>

<p>
관련 법령과 적용 라이선스에서 허용하는 경우를 제외하고,
권리자의 허락 없는 무단 복제, 재배포,
전송 및 상업적 이용을 금지합니다.
</p>

<p>
저작권 및 서비스 문의:
<a href="mailto:${EMAIL}">${EMAIL}</a>
</p>

</footer>

</main>

<script>
"use strict";

const $ = id => document.getElementById(id);

const pick = arr =>
  arr[Math.floor(Math.random() * arr.length)];

const rnd = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const WORLD = ${JSON.stringify(WORLD)};
const RANKS = ${JSON.stringify(RANKS)};

const SAVE_KEY = "fantasy-life-v100";

const RACES = [
  ["인간",65,65,105],
  ["엘프",12,250,500],
  ["드워프",8,130,230],
  ["수인",6,55,105],
  ["마족",4,150,320],
  ["용인족",2.5,220,450],
  ["정령족",1.5,300,650],
  ["천족",0.7,350,750],
  ["고대종",0.3,500,1000]
];

const CLASSES = [
  ["농노",42],
  ["평민",27],
  ["상인 가문",14],
  ["하급 귀족",10],
  ["상급 귀족",5],
  ["왕족",2]
];

const FATES = [
  ["전생자",0.025],
  ["회귀자",0.020],
  ["마왕의 환생",0.015],
  ["용의 화신",0.015],
  ["신의 사도",0.010],
  ["세계의 오류",0.005],
  ["용사의 운명",0.010]
];

const FIRST_NAMES = [
  "카일","레온","아르","엘린","세리아",
  "루카","나엘","벨라","드란","라엘",
  "테오","오린","린아","에르","미하",
  "하린","실렌","렌","바르","디온",
  "안나","키엘","제론","로아","샤린",
  "델","유리아","칼렌","페르","이안"
];

const SURNAMES = [
  "아르벨","아르덴","벨하임","로젠",
  "카르딘","에르빈","델피아","실바",
  "레오나","엘드라","미르벨","발테르",
  "하르넬","벨제르","아스란","아르카스",
  "에리온","솔라리스","드라켄","루미엘"
];

const JOBS = [
  "농부","목수","상인","대장장이",
  "사냥꾼","병사","재봉사","약초사",
  "마법사","서기관","어부","광부",
  "여관 주인","기사","성직자"
];

const TRAITS = [
  "다정한","엄격한","성실한",
  "과묵한","명랑한","신중한",
  "고집 센","온화한","용감한",
  "욕심 많은","현명한","소심한"
];

const EVENTS = [
  {
    title:"산적의 습격",
    text:"여행 중 산적 무리를 마주쳤다.",
    kind:"bad",
    ability:"sword"
  },
  {
    title:"고대 유적",
    text:"숲 깊은 곳에서 고대 유적이 발견되었다.",
    kind:"mixed",
    ability:"adventure"
  },
  {
    title:"검술 스승",
    text:"뛰어난 검사가 제자를 모집하고 있다.",
    kind:"good",
    ability:"sword"
  },
  {
    title:"마탑의 초대",
    text:"마탑에서 재능 있는 인물을 찾고 있다.",
    kind:"good",
    ability:"magic"
  },
  {
    title:"전염병",
    text:"마을에 원인을 알 수 없는 병이 퍼졌다.",
    kind:"bad",
    ability:"health"
  },
  {
    title:"왕실의 포상",
    text:"왕실에서 공로자를 찾고 있다.",
    kind:"good",
    ability:"prestige"
  },
  {
    title:"상단의 제안",
    text:"거대한 상단에서 거래를 제안했다.",
    kind:"good",
    ability:"money"
  },
  {
    title:"정령의 축복",
    text:"작은 정령이 당신 앞에 나타났다.",
    kind:"good",
    ability:"magic"
  },
  {
    title:"대지진",
    text:"땅이 흔들리고 건물이 무너지기 시작했다.",
    kind:"bad",
    ability:"health"
  },
  {
    title:"전쟁 발발",
    text:"국경에서 전쟁이 시작되었다.",
    kind:"bad",
    ability:"military"
  },
  {
    title:"귀족의 음모",
    text:"귀족들의 권력 다툼에 휘말렸다.",
    kind:"mixed",
    ability:"intelligence"
  },
  {
    title:"마법서 발견",
    text:"봉인된 고대 마법서를 발견했다.",
    kind:"mixed",
    ability:"magic"
  },
  {
    title:"숨겨진 보물",
    text:"오래된 보물 지도를 발견했다.",
    kind:"good",
    ability:"adventure"
  },
  {
    title:"왕국의 반란",
    text:"지방 영주들이 반란을 일으켰다.",
    kind:"bad",
    ability:"military"
  },
  {
    title:"용의 흔적",
    text:"산맥에서 고대 용의 흔적이 발견되었다.",
    kind:"mixed",
    ability:"magic"
  },
  {
    title:"영지의 위기",
    text:"후계자를 잃은 영지가 혼란에 빠졌다.",
    kind:"mixed",
    ability:"territory"
  },
  {
    title:"희귀 광맥",
    text:"버려진 광산에서 희귀 광석이 발견되었다.",
    kind:"good",
    ability:"money"
  },
  {
    title:"기사단 모집",
    text:"왕국 기사단에서 새로운 단원을 모집한다.",
    kind:"good",
    ability:"sword"
  },
  {
    title:"신전의 계시",
    text:"신전에서 특별한 계시가 내려왔다.",
    kind:"mixed",
    ability:"luck"
  },
  {
    title:"괴수 출현",
    text:"변방 마을에 거대한 괴수가 나타났다.",
    kind:"bad",
    ability:"sword"
  },
  {
    title:"무역 호황",
    text:"새로운 교역로가 열렸다.",
    kind:"good",
    ability:"money"
  },
  {
    title:"왕위 분쟁",
    text:"왕실에서 후계자 다툼이 시작되었다.",
    kind:"mixed",
    ability:"prestige"
  },
  {
    title:"대화재",
    text:"시장에 큰불이 났다.",
    kind:"bad",
    ability:"health"
  },
  {
    title:"치유의 샘",
    text:"병을 낫게 한다는 샘이 발견되었다.",
    kind:"good",
    ability:"health"
  },
  {
    title:"비밀 연구",
    text:"마법사가 위험한 연구를 제안했다.",
    kind:"mixed",
    ability:"intelligence"
  }
];

const PLACES = [
  "왕국의 변방에서",
  "오래된 숲에서",
  "수도 근처에서",
  "작은 마을에서",
  "산맥 너머에서",
  "고대 유적 근처에서",
  "상업 도시에서",
  "국경 지대에서"
];

let p = null;
let paused = true;
let speed = 1;
let auto = false;
let homeNick = "";
let currentRank = "prestige";

function weighted(items) {
  let n = Math.random() *
    items.reduce((sum, item) => sum + item[1], 0);

  for (const item of items) {
    n -= item[1];

    if (n <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function rollFate() {
  let n = Math.random() * 100;

  for (const fate of FATES) {
    n -= fate[1];

    if (n < 0) {
      return fate[0];
    }
  }

  return "평범한 운명";
}

function makeName(surname) {
  return pick(FIRST_NAMES) + " " +
    (surname || pick(SURNAMES));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function toggleEra() {
  $("eraCustom").classList.toggle(
    "hidden",
    $("eraMode").value !== "custom"
  );
}

function getBirthYear() {
  if ($("eraMode").value === "random") {
    return rnd(500, 1500);
  }

  const year = Number($("eraYear").value);

  if (
    !Number.isInteger(year) ||
    year < 500 ||
    year > 1500
  ) {
    alert("출생 연도는 제국력 500~1500년 사이여야 합니다.");
    return null;
  }

  return year;
}

function showPage(page) {
  $("home").classList.toggle(
    "hidden", page !== "home"
  );

  $("game").classList.toggle(
    "hidden", page !== "game"
  );

  $("legal").classList.toggle(
    "hidden", page !== "legal"
  );

  window.scrollTo(0, 0);
}

function dateText() {
  if (!p) return "";

  return "제국력 " +
    (p.birthYear + p.age) +
    "년 " +
    (p.month + 1) +
    "월 1일";
}

function log(text) {
  if (!p) return;

  p.history.unshift({
    year: p.birthYear + p.age,
    month: p.month,
    age: p.age,
    text: text
  });

  p.history = p.history.slice(0, 1000);
}

function newLife() {
  const nickname = $("nickname").value.trim();

  if (!nickname) {
    alert("플레이어 닉네임을 입력해 주세요.");
    return;
  }

  const year = getBirthYear();

  if (year === null) return;

  const continent = pick(WORLD);
  const country = pick(continent.countries);
  const race = weighted(RACES);
  const social = weighted(CLASSES)[0];

  const surname = pick(SURNAMES);
  const father = makeName(surname);
  const mother = makeName();

  const wealth = {
    "농노": 10,
    "평민": 40,
    "상인 가문": 150,
    "하급 귀족": 300,
    "상급 귀족": 1000,
    "왕족": 5000
  };

  homeNick = nickname;

  p = {
    id: crypto.randomUUID(),

    nickname: nickname,
    name: makeName(surname),

    race: race[0],
    social: social,

    continent: continent.name,
    country: country,

    birthYear: year,
    age: 0,
    month: 0,

    lifespan: rnd(race[2], race[3]),
    fate: rollFate(),

    father: father,
    mother: mother,

    fatherJob: pick(JOBS),
    motherJob: pick(JOBS),

    fatherTrait: pick(TRAITS),
    motherTrait: pick(TRAITS),

    hp: 100,
    maxHp: 100,

    mp: 20,
    maxMp: 20,

    sp: 100,
    maxSp: 100,

    sword: 0,
    magic: 0,
    intelligence: 0,

    prestige: 0,
    luck: rnd(1, 100),

    money: wealth[social],

    strength: 1,
    agility: 1,

    children: 0,
    military: 0,
    territory: 0,
    adventure: 0,

    alive: true,

    history: [],
    pending: null
  };

  p.pending = {
    birth: true,
    title: "0세 — 탄생",

    text:
      "제국력 " + year +
      "년 1월 1일.\\n\\n" +

      "당신은 " + p.continent +
      " 대륙의 " + p.country +
      "에서 태어났습니다.\\n\\n" +

      "아버지 " + father + "은(는) " +
      p.fatherJob + " 일을 하는 " +
      p.fatherTrait + " 사람입니다.\\n" +

      "어머니 " + mother + "은(는) " +
      p.motherJob + " 일을 하는 " +
      p.motherTrait + " 사람입니다.\\n\\n" +

      "당신의 가정은 " + social +
      " 계층에 속합니다. " +

      "부모님은 각자의 형편 속에서 " +
      "새로운 생명을 맞이했습니다."
  };

  paused = true;
  auto = false;
  speed = 1;

  log("이 세계에 태어났다.");

  save();
  showPage("game");
  render();
}

function overallScore() {
  if (!p) return 0;

  const logValue = value =>
    Math.log1p(Math.max(0, Number(value) || 0));

  return Math.floor(
    logValue(p.money) * 15 +
    logValue(p.prestige) * 20 +
    logValue(p.sword) * 20 +
    logValue(p.magic) * 20 +
    logValue(p.maxHp) * 10 +
    logValue(p.intelligence) * 15 +
    logValue(p.military) * 10 +
    logValue(p.territory) * 15 +
    logValue(p.adventure) * 15 +
    logValue(p.children) * 10 +
    logValue(p.luck) * 5
  );
}

function makeEvent() {
  const base = pick(EVENTS);

  p.pending = {
    birth: false,
    title: base.title,

    text:
      pick(PLACES) + " " +
      base.text + "\\n\\n" +
      "당신은 어떻게 행동하시겠습니까?",

    kind: base.kind,
    ability: base.ability
  };

  paused = true;

  log(base.title + " 사건이 발생했다.");
}

function gainAbility(ability, amount) {
  if (!p) return;

  if (ability === "health") {
    p.maxHp += amount;
    p.hp += amount;
    return;
  }

  if (ability === "magic") {
    p.magic += amount;
    p.maxMp += amount;
    p.mp += amount;
    return;
  }

  p[ability] = Math.max(
    0,
    Number(p[ability] || 0) + amount
  );
}

function resolveEvent(choice) {
  if (!p || !p.pending) return;

  if (p.pending.birth) {
    p.pending = null;
    paused = false;

    log("가족과 함께 인생을 시작했다.");

    save();
    render();
    return;
  }

  const event = p.pending;

  const abilityValue =
    event.ability === "health"
      ? p.maxHp
      : Number(p[event.ability] || 0);

  let success = false;
  let result = "";

  if (choice === 0) {
    const chance = Math.min(
      95,
      40 + Math.sqrt(abilityValue) * 3
    );

    success = Math.random() * 100 < chance;

    if (success) {
      gainAbility(event.ability, rnd(1, 5));

      p.prestige += rnd(1, 8);
      p.money += rnd(10, 80);
      p.adventure++;

      result =
        "위험을 감수한 끝에 성공했다. " +
        "보상과 경험을 얻었다.";
    } else {
      p.hp -= rnd(5, 20);

      p.money = Math.max(
        0,
        p.money - rnd(1, 20)
      );

      result =
        "용감하게 도전했지만 실패했다. " +
        "부상과 손실을 입었다.";
    }
  }

  if (choice === 1) {
    const chance = Math.min(
      95,
      55 + Math.sqrt(p.intelligence) * 3
    );

    success = Math.random() * 100 < chance;

    p.intelligence += rnd(1, 3);

    if (success) {
      p.money += rnd(5, 45);
      p.prestige += rnd(1, 4);

      result =
        "신중하게 판단해 좋은 결과를 얻었다.";
    } else {
      result =
        "신중하게 접근했지만 원하는 결과를 얻지 못했다.";
    }
  }

  if (choice === 2) {
    result =
      "사건에 깊이 관여하지 않고 지나갔다.";

    if (
      event.kind === "bad" &&
      Math.random() < 0.2
    ) {
      p.hp -= rnd(1, 8);

      result +=
        " 하지만 피해를 완전히 피하지는 못했다.";
    }
  }

  if (
    event.kind === "bad" &&
    success
  ) {
    result =
      "불행한 상황을 기회로 바꾸었다. " +
      result;
  }

  if (
    event.kind === "good" &&
    !success &&
    choice !== 2
  ) {
    result =
      "좋은 기회였지만 뜻대로 풀리지 않았다. " +
      result;
  }

  // 매우 드문 기연
  if (success && Math.random() < 0.002) {
    const bonus = rnd(500, 3000);

    gainAbility(event.ability, bonus);

    p.prestige += rnd(100, 500);

    result +=
      " 전설적인 기연을 얻어 " +
      "능력이 폭발적으로 성장했다.";
  }

  // 숨겨진 운명의 징조
  if (
    success &&
    p.fate !== "평범한 운명" &&
    Math.random() < 0.025
  ) {
    result +=
      " 자신의 운명에 관한 " +
      "기묘한 징조를 느꼈다.";
  }

  // 농노 신분 탈출
  if (
    success &&
    p.social === "농노" &&
    p.prestige >= 100 &&
    Math.random() < 0.04
  ) {
    p.social = "평민";

    result +=
      " 공적을 인정받아 농노 신분에서 벗어났다.";
  }

  // 신분 상승
  if (
    success &&
    p.social === "평민" &&
    p.prestige >= 500 &&
    Math.random() < 0.005
  ) {
    p.social = "하급 귀족";

    result +=
      " 특별한 공적을 인정받아 작위를 받았다.";
  }

  // 희귀한 영지 획득
  if (
    success &&
    p.age >= 18 &&
    p.prestige >= 100 &&
    Math.random() < 0.003
  ) {
    p.territory += rnd(1, 5);
    p.military += rnd(10, 100);

    result +=
      " 영지와 병력을 하사받았다.";
  }

  log(event.title + " — " + result);

  p.pending = null;
  paused = false;

  if (p.hp <= 0) {
    die("사건 중 입은 부상");
  }

  save();
  render();
}

function yearlyLife() {
  if (!p || !p.alive) return;

  const age = p.age;

  // 성장 한도 없음
  if (age >= 3) {
    if (Math.random() < 0.65) {
      const gain = rnd(1, 4);

      p.maxHp += gain;
      p.hp += gain;
    }

    if (Math.random() < 0.5) {
      const gain = rnd(1, 3);

      p.maxMp += gain;
      p.mp += gain;
    }

    if (Math.random() < 0.6) {
      const gain = rnd(1, 3);

      p.maxSp += gain;
      p.sp += gain;
    }

    if (Math.random() < 0.5) {
      p.intelligence++;
    }

    if (Math.random() < 0.4) {
      p.sword++;
    }

    if (Math.random() < 0.3) {
      p.magic++;
    }

    if (Math.random() < 0.4) {
      p.strength++;
    }

    if (Math.random() < 0.4) {
      p.agility++;
    }
  }

  // 경제 활동
  if (age >= 16 && age <= 75) {
    const income = {
      "농노": [1, 10],
      "평민": [5, 20],
      "상인 가문": [10, 50],
      "하급 귀족": [15, 60],
      "상급 귀족": [30, 100],
      "왕족": [50, 150]
    };

    const range = income[p.social] || [1, 10];

    p.money += rnd(range[0], range[1]);
  }

  // 가족 이벤트
  if (age >= 18 && age <= 65) {
    if (Math.random() < 0.035) {
      p.children++;

      log("가족에게 새로운 자녀가 태어났다.");
    }
  }

  // 모험
  if (age >= 12 && Math.random() < 0.15) {
    p.adventure += rnd(1, 3);
  }

  // 영지 운영
  if (p.territory > 0 && age >= 18) {
    p.military += rnd(0, 5);
  }

  // 운의 변화
  if (Math.random() < 0.3) {
    p.luck = Math.max(
      0,
      p.luck + rnd(-3, 4)
    );
  }

  // 노화에 따른 위험
  if (age > p.lifespan * 0.75) {
    if (Math.random() < 0.25) {
      p.hp -= rnd(1, 5);
    }
  }

  if (age >= p.lifespan) {
    die("노화");
  }

  if (p.hp <= 0 && p.alive) {
    die("건강 악화");
  }
}

function advance() {
  if (!p || paused || !p.alive) return;

  p.month++;

  if (p.month >= 12) {
    p.month = 0;
    p.age++;

    log(p.age + "세가 되었다.");

    yearlyLife();
  }

  if (
    p.alive &&
    p.age >= 1 &&
    Math.random() < 0.10
  ) {
    makeEvent();

    if (
      auto &&
      p.pending &&
      !p.pending.birth
    ) {
      resolveEvent(rnd(0, 2));
    }
  }

  save();
  render();
}

function die(reason) {
  if (!p || !p.alive) return;

  p.alive = false;
  paused = true;
  p.pending = null;

  log(reason + "으로 생을 마감했다.");
}

function togglePause() {
  if (!p || p.pending || !p.alive) return;

  paused = !paused;
  render();
}

function changeSpeed() {
  speed = speed === 1
    ? 2
    : speed === 2
      ? 4
      : 1;

  render();
}

function toggleAuto() {
  auto = !auto;

  if (
    auto &&
    p &&
    p.pending &&
    !p.pending.birth
  ) {
    resolveEvent(rnd(0, 2));
  }

  render();
}

function goHome() {
  const confirmed = confirm(
    "정말로 처음으로 돌아가시겠습니까?\\n\\n" +
    "현재 진행 중인 인생의 저장 기록이 삭제됩니다.\\n" +
    "처음으로 돌아가면 이어서 플레이할 수 없습니다.\\n\\n" +
    "이미 등록한 세계 랭킹 기록은 삭제되지 않습니다."
  );

  if (!confirmed) return;

  localStorage.removeItem(SAVE_KEY);

  p = null;
  paused = true;
  auto = false;

  showPage("home");

  $("nickname").value = homeNick;

  loadRanks("prestige");
}

function addStat(label, value) {
  const div = document.createElement("div");
  div.className = "stat";

  const small = document.createElement("small");
  small.textContent = label;

  const strong = document.createElement("strong");
  strong.textContent = value;

  div.appendChild(small);
  div.appendChild(strong);

  $("stats").appendChild(div);
}

function render() {
  if (!p) return;

  $("charTitle").textContent =
    p.name + " · " + p.age + "세";

  $("gameDate").textContent = dateText();

  $("charInfo").textContent =
    p.continent + " / " +
    p.country + " / " +
    p.race + " / " +
    p.social;

  $("familyInfo").textContent =
    "아버지: " + p.father +
    " · 어머니: " + p.mother;

  $("stats").replaceChildren();

  addStat(
    "체력",
    formatNumber(Math.max(0, p.hp)) +
    " / " +
    formatNumber(p.maxHp)
  );

  addStat(
    "마력",
    formatNumber(p.mp) +
    " / " +
    formatNumber(p.maxMp)
  );

  addStat(
    "기력",
    formatNumber(p.sp) +
    " / " +
    formatNumber(p.maxSp)
  );

  const stats = [
    ["검술", p.sword],
    ["마법", p.magic],
    ["지능", p.intelligence],
    ["근력", p.strength],
    ["민첩", p.agility],
    ["명성", p.prestige],
    ["재산", p.money],
    ["운", p.luck],
    ["자녀 수", p.children],
    ["군사력", p.military],
    ["영토", p.territory],
    ["모험", p.adventure],
    ["종합 점수", overallScore()]
  ];

  stats.forEach(item => {
    addStat(
      item[0],
      formatNumber(item[1])
    );
  });

  $("lifeStatus").textContent =
    !p.alive
      ? "인생 종료 · 사망"
      : p.pending
        ? "선택을 기다리는 중"
        : paused
          ? "일시정지"
          : "시간 진행 중 · " +
            speed + "배속" +
            (auto ? " · 자동 결정 켜짐" : "");

  $("eventCard").classList.toggle(
    "hidden",
    !p.pending
  );

  if (p.pending) {
    $("eventTitle").textContent =
      p.pending.title;

    $("eventText").textContent =
      p.pending.text;

    $("choices").replaceChildren();

    const choices = p.pending.birth
      ? ["이 가정에서 살아간다"]
      : [
          "적극적으로 해결한다",
          "신중하게 조사한다",
          "관여하지 않는다"
        ];

    choices.forEach((label, index) => {
      const button = document.createElement("button");

      button.className = "choice";
      button.textContent = label;

      button.onclick = () => resolveEvent(index);

      $("choices").appendChild(button);
    });
  }

  $("history").replaceChildren();

  p.history.slice(0, 120).forEach(item => {
    const div = document.createElement("div");

    div.className = "log";

    div.textContent =
      "제국력 " + item.year +
      "년 " + (item.month + 1) +
      "월 · " + item.age +
      "세 — " + item.text;

    $("history").appendChild(div);
  });
}

function save() {
  if (!p) return;

  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(p)
    );
  } catch (error) {
    console.error("저장 실패:", error);
  }
}

function buildRankButtons() {
  $("rankButtons").replaceChildren();

  Object.entries(RANKS).forEach(([key, label]) => {
    const button = document.createElement("button");

    button.className = "secondary";
    button.textContent = label;

    button.onclick = () => loadRanks(key);

    $("rankButtons").appendChild(button);
  });
}

async function loadRanks(type) {
  currentRank = type;

  const buttons = $("rankButtons").children;

  Object.keys(RANKS).forEach((key, index) => {
    if (buttons[index]) {
      buttons[index].classList.toggle(
        "active",
        key === type
      );
    }
  });

  $("rankNotice").textContent =
    "랭킹 불러오는 중...";

  try {
    const response = await fetch(
      "/api/rankings?type=" +
      encodeURIComponent(type)
    );

    const data = await response.json();

    if (currentRank !== type) return;

    $("ranking").replaceChildren();

    if (!data.enabled) {
      $("rankNotice").textContent =
        "공용 랭킹 데이터베이스가 연결되지 않았습니다.";
      return;
    }

    $("rankNotice").textContent =
      RANKS[type] + " 세계 랭킹";

    const table = document.createElement("table");
    const header = document.createElement("tr");

    ["순위", "플레이어", "캐릭터", "점수"]
      .forEach(label => {
        const th = document.createElement("th");
        th.textContent = label;
        header.appendChild(th);
      });

    table.appendChild(header);

    data.rows.forEach((record, index) => {
      const tr = document.createElement("tr");

      const values = [
        index + 1,
        record.nickname,
        record.character_name,
        formatNumber(record[type])
      ];

      values.forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    $("ranking").appendChild(table);

    if (!data.rows.length) {
      $("rankNotice").textContent =
        "아직 등록된 기록이 없습니다.";
    }
  } catch (error) {
    $("rankNotice").textContent =
      "랭킹을 불러오지 못했습니다.";
  }
}

async function publishRank() {
  if (!p) return;

  const confirmed = confirm(
    "세계 랭킹에 기록을 등록하시겠습니까?\\n\\n" +
    "닉네임, 캐릭터 이름, 종족, 나이와 " +
    "게임 점수가 다른 이용자에게 공개됩니다."
  );

  if (!confirmed) return;

  const data = {
    id: p.id,
    nickname: p.nickname,
    character_name: p.name,
    race: p.race,
    age: p.age,

    prestige: p.prestige,
    money: p.money,
    sword: p.sword,
    magic: p.magic,
    health: p.maxHp,
    luck: p.luck,
    children: p.children,
    military: p.military,
    territory: p.territory,
    intelligence: p.intelligence,
    adventure: p.adventure,
    longevity: p.age,
    overall: overallScore()
  };

  try {
    const response = await fetch("/api/rankings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    alert(
      result.message ||
      "랭킹 등록 요청이 처리되었습니다."
    );
  } catch (error) {
    alert("랭킹 서버에 연결하지 못했습니다.");
  }
}

const LEGAL = {
  privacy: {
    title: "개인정보 처리방침 — 베타 초안",
    sections: [
      [
        "1. 개인정보 처리 목적",
        "게임 진행, 선택적 세계 랭킹 운영, 이용자 문의 대응 및 서비스 안정성 확보를 위해 필요한 정보를 처리합니다."
      ],
      [
        "2. 처리하는 정보",
        "게임 진행 정보는 이용자의 브라우저에 저장됩니다. 랭킹 등록 시 닉네임, 캐릭터 이름, 종족, 나이, 능력치, 점수 및 기록 식별자가 서버에 저장됩니다. 호스팅 과정에서 IP 주소와 접속 기록 등이 처리될 수 있습니다."
      ],
      [
        "3. 랭킹 공개",
        "랭킹 등록은 선택 사항입니다. 공개 랭킹에는 플레이어 닉네임, 캐릭터 이름 및 게임 점수가 표시됩니다."
      ],
      [
        "4. 보유 기간",
        "브라우저의 게임 기록은 이용자가 삭제할 수 있습니다. 서버 랭킹 기록의 보유 기간과 자동 삭제 기준은 정식 운영 전에 확정하여 고지해야 합니다."
      ],
      [
        "5. 개인정보 삭제 및 권리 행사",
        "이용자는 관계 법령에 따라 개인정보 열람, 정정, 삭제 및 처리정지 등을 요청할 수 있습니다. 현재 서버 랭킹 삭제는 이메일을 통해 요청할 수 있으며 기록 소유권 확인이 필요할 수 있습니다."
      ],
      [
        "6. 외부 서비스 및 국외 이전",
        "웹서비스 운영에 Render 호스팅과 PostgreSQL 데이터베이스를 사용합니다. 실제 처리 위탁, 국외 이전 국가, 이전 항목, 보관 기간 및 법적 근거는 운영 환경을 확인하여 별도로 고지해야 합니다."
      ],
      [
        "7. 안전성 확보",
        "HTTPS 통신 및 데이터베이스 접속정보 보호를 사용합니다. 추가적인 인증, 점수 검증 및 접근 통제는 보완 중입니다."
      ],
      [
        "8. 문의",
        "개인정보 관련 문의 및 삭제 요청: fantasymaister@gmail.com"
      ],
      [
        "9. 시행 안내",
        "본 문서는 베타 초안입니다. 정식 시행일, 운영자 정보, 보유 기간 및 실제 개인정보 처리 현황을 확인한 뒤 최종 확정해야 합니다."
      ]
    ]
  },

  terms: {
    title: "서비스 이용약관 — 베타 초안",
    sections: [
      [
        "제1조 목적",
        "본 약관은 판타지에서 살아가기 서비스의 이용 조건과 운영자 및 이용자의 권리와 의무를 정하기 위한 것입니다."
      ],
      [
        "제2조 서비스 내용",
        "본 서비스는 가상의 판타지 세계에서 출생부터 사망까지 한 인물의 인생을 체험하는 시뮬레이션 게임입니다."
      ],
      [
        "제3조 이용 조건",
        "현재 서비스는 무료 베타 버전이며 회원가입 없이 이용할 수 있습니다. 브라우저 저장 기록은 기기 또는 브라우저 환경에 따라 유실될 수 있습니다."
      ],
      [
        "제4조 세계 랭킹",
        "이용자는 자신의 게임 기록을 선택적으로 공개 랭킹에 등록할 수 있습니다. 타인 사칭, 부정한 점수 조작, 서버 공격 및 서비스 운영을 방해하는 행위는 금지됩니다."
      ],
      [
        "제5조 서비스 변경",
        "운영자는 서비스 개선이나 보안상의 이유로 기능을 변경할 수 있습니다. 중요한 변경은 적절한 방법으로 안내합니다."
      ],
      [
        "제6조 저작권 및 지식재산권",
        "판타지에서 살아가기의 독창적인 세계관, 스토리, 캐릭터, 문구, 디자인, 소스코드 등 개발자가 적법하게 권리를 보유한 창작물에 관한 저작권 및 지식재산권은 해당 권리자에게 귀속됩니다. 관련 법령 또는 적용 라이선스에서 허용하는 경우를 제외하고, 권리자의 사전 허락 없는 무단 복제, 배포, 전송 및 상업적 이용을 금지합니다. 일반적인 게임 아이디어와 규칙, 제3자의 저작물 및 저작권 보호 요건을 충족하지 않는 부분은 이 조항만으로 독점적인 권리가 발생하지 않습니다."
      ],
      [
        "제7조 유료 서비스",
        "현재는 무료 베타 서비스입니다. 향후 유료 기능을 도입할 경우 가격, 결제 및 환불 조건을 별도로 안내합니다."
      ],
      [
        "제8조 책임과 분쟁",
        "서비스 이용과 관련된 책임 및 분쟁은 대한민국의 관련 법령에 따릅니다. 본 약관은 법령상 보장되는 이용자의 권리를 제한하지 않습니다."
      ],
      [
        "제9조 문의",
        "서비스 및 권리 관련 문의: fantasymaister@gmail.com"
      ]
    ]
  },

  copyright: {
    title: "저작권 및 지식재산권 안내",
    sections: [
      [
        "권리자 표시",
        "© 2026 Fantasy Meister. All Rights Reserved."
      ],
      [
        "보호 대상",
        "본 게임에서 개발자가 적법하게 권리를 보유한 독창적인 세계관의 구체적인 표현, 스토리, 캐릭터 설정, 텍스트, 디자인 및 소스코드 등은 관련 저작권법에 따라 보호될 수 있습니다."
      ],
      [
        "무단 이용 안내",
        "관련 법령과 적용 라이선스에서 허용하는 경우를 제외하고, 권리자의 허락 없이 보호되는 창작물을 무단 복제, 재배포, 전송 또는 상업적으로 이용하는 행위를 금지합니다."
      ],
      [
        "권리 범위",
        "본 고지는 일반적인 판타지 설정, 게임 장르, 아이디어, 규칙 자체에 대한 독점권을 주장하지 않습니다. 제3자 저작물과 오픈소스 라이선스의 권리는 존중합니다. AI 생성물에 대한 권리 귀속은 실제 인간의 창작적 기여와 관련 법령에 따라 판단됩니다."
      ],
      [
        "게임 명칭",
        "판타지에서 살아가기 및 Fantasy Meister의 명칭 사용과 관련된 상표권은 별도의 출원 및 등록 여부에 따라 판단됩니다. 본 저작권 고지만으로 상표권이 등록되는 것은 아닙니다."
      ],
      [
        "권리 침해 신고",
        "저작권 관련 문의, 이용 허락 요청 및 권리 침해 신고: fantasymaister@gmail.com"
      ]
    ]
  },

  notice: {
    title: "운영 안내",
    sections: [
      [
        "서비스 상태",
        "판타지에서 살아가기는 현재 베타 테스트 중입니다."
      ],
      [
        "콘텐츠 안내",
        "게임에는 전쟁, 질병, 범죄, 재난, 사망 등 무거운 사건이 포함될 수 있습니다. 국가와 인물 및 사건은 가상의 세계관을 바탕으로 합니다."
      ],
      [
        "저장 안내",
        "게임 진행 정보는 브라우저에 저장됩니다. 첫 화면 복귀를 확인하면 현재 인생의 로컬 저장 기록이 삭제됩니다."
      ],
      [
        "개선 의견",
        "게임 오류, 개선 제안, 저작권 및 개인정보 관련 문의는 fantasymaister@gmail.com으로 보내주세요."
      ]
    ]
  },

  updates: {
    title: "업데이트 내역",
    sections: [
      [
        "v1.0.0-beta",
        "제국력 출생 연도 선택, 종족별 수명, 가족 소개, 자동 시간 진행, 성장 시스템, 사건과 선택, 13개 세계 랭킹, 저작권 안내 및 서비스 정책 페이지를 통합했습니다."
      ],
      [
        "개발 예정",
        "독립 NPC, 결혼과 자녀의 성장, 영지 운영, 국가 전쟁, 다양한 사건, 서버 검증형 랭킹 및 랭킹 삭제 기능을 개발할 예정입니다."
      ]
    ]
  }
};

function showLegal(key) {
  const page = LEGAL[key];

  if (!page) return;

  $("legalTitle").textContent = page.title;
  $("legalBody").replaceChildren();

  page.sections.forEach(section => {
    const heading = document.createElement("h3");
    heading.textContent = section[0];

    const paragraph = document.createElement("p");
    paragraph.textContent = section[1];

    $("legalBody").appendChild(heading);
    $("legalBody").appendChild(paragraph);
  });

  showPage("legal");
}

// 1.2초마다 진행. 배속에 따라 여러 달 진행.
setInterval(() => {
  for (let i = 0; i < speed; i++) {
    if (!p || paused) break;

    advance();
  }
}, 1200);

// 저장된 인생 불러오기
try {
  const raw = localStorage.getItem(SAVE_KEY);

  if (raw) {
    const saved = JSON.parse(raw);

    if (saved && saved.name) {
      p = saved;
      homeNick = p.nickname;

      $("nickname").value = homeNick;

      paused = !!p.pending || !p.alive;

      showPage("game");
      render();
    }
  }
} catch (error) {
  console.error("저장 데이터 불러오기 실패:", error);
}

buildRankButtons();
loadRanks("prestige");
</script>

</body>
</html>`;

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });

  res.end(JSON.stringify(data));
}

function validNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1000000000,
      Math.floor(number)
    )
  );
}

async function handle(req, res) {
  const url = new URL(
    req.url,
    "http://localhost"
  );

  if (
    url.pathname === "/api/rankings" &&
    req.method === "GET"
  ) {
    if (!dbReady) {
      return sendJSON(res, 200, {
        enabled: false,
        rows: []
      });
    }

    const requested = url.searchParams.get("type");

    const type = Object.prototype.hasOwnProperty.call(
      RANKS,
      requested
    )
      ? requested
      : "prestige";

    try {
      const result = await db.query(
        "SELECT nickname, character_name, " +
        "prestige, money, sword, magic, health, luck, " +
        "children, military, territory, intelligence, " +
        "adventure, longevity, overall " +
        "FROM fantasy_rankings " +
        "ORDER BY " + type + " DESC, updated_at ASC " +
        "LIMIT 20"
      );

      return sendJSON(res, 200, {
        enabled: true,
        rows: result.rows
      });
    } catch (error) {
      console.error("랭킹 조회 실패:", error);

      return sendJSON(res, 503, {
        enabled: false,
        rows: []
      });
    }
  }

  if (
    url.pathname === "/api/rankings" &&
    req.method === "POST"
  ) {
    if (!dbReady) {
      return sendJSON(res, 503, {
        message: "데이터베이스가 연결되지 않았습니다."
      });
    }

    let raw = "";

    try {
      for await (const chunk of req) {
        raw += chunk;

        if (raw.length > 10000) {
          return sendJSON(res, 413, {
            message: "요청 크기가 너무 큽니다."
          });
        }
      }

      const data = JSON.parse(raw);

      const safeText = (value, max) =>
        String(value ?? "")
          .trim()
          .slice(0, max);

      const id =
        safeText(data.id, 100) ||
        crypto.randomUUID();

      const nickname = safeText(
        data.nickname,
        24
      );

      const character = safeText(
        data.character_name,
        80
      );

      const race = safeText(
        data.race,
        30
      );

      if (!nickname || !character) {
        return sendJSON(res, 400, {
          message: "닉네임과 캐릭터 이름이 필요합니다."
        });
      }

      const fields = [
        "prestige",
        "money",
        "sword",
        "magic",
        "health",
        "luck",
        "children",
        "military",
        "territory",
        "intelligence",
        "adventure",
        "longevity",
        "overall"
      ];

      const columns = [
        "id",
        "nickname",
        "character_name",
        "race",
        "age",
        ...fields
      ];

      const values = [
        id,
        nickname,
        character,
        race,
        validNumber(data.age),
        ...fields.map(key => validNumber(data[key]))
      ];

      const placeholders = columns.map(
        (_, index) => "$" + (index + 1)
      ).join(",");

      const updates = columns.slice(1).map(
        (column, index) =>
          column + "=$" + (index + 2)
      ).join(",");

      const query =
        "INSERT INTO fantasy_rankings (" +
        columns.join(",") +
        ") VALUES (" +
        placeholders +
        ") ON CONFLICT (id) DO UPDATE SET " +
        updates +
        ", updated_at=NOW()";

      await db.query(query, values);

      return sendJSON(res, 200, {
        message: "세계 랭킹에 기록을 등록했습니다."
      });
    } catch (error) {
      console.error("랭킹 등록 실패:", error);

      return sendJSON(res, 400, {
        message: "랭킹 등록 중 오류가 발생했습니다."
      });
    }
  }

  if (url.pathname === "/api/health") {
    return sendJSON(res, 200, {
      ok: true,
      database: dbReady,
      version: VERSION
    });
  }

  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      message: "허용되지 않은 요청입니다."
    });
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });

  res.end(HTML);
}

async function start() {
  await initializeDatabase();

  http.createServer((req, res) => {
    handle(req, res).catch(error => {
      console.error("서버 오류:", error);

      if (!res.headersSent) {
        sendJSON(res, 500, {
          message: "서버 오류가 발생했습니다."
        });
      }
    });
  }).listen(PORT, "0.0.0.0", () => {
    console.log(
      "판타지에서 살아가기 실행:",
      PORT
    );
    console.log("버전:", VERSION);
  });
}

start().catch(error => {
  console.error("서버 시작 실패:", error);
  process.exit(1);
});
