
"use strict";

/*
 * 판타지에서 살아가기
 * Life in a Fantasy World
 * Version 1.1.0-beta
 *
 * © 2026 Fantasy Meister. All Rights Reserved.
 * Contact: fantasymaister@gmail.com
 *
 * 개발자가 적법하게 권리를 보유한 창작물에 관한
 * 권리를 유보합니다. 제3자 권리, 적용 라이선스,
 * 관련 법령상 허용되는 이용은 제외합니다.
 */

const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const VERSION = "1.1.0-beta";
const EMAIL = "fantasymaister@gmail.com";

const WORLD = [
  {
    ko: "루벨리아",
    en: "Rubellia",
    countries: [
      ["에테르 왕국", "Kingdom of Aether"],
      ["발테리온 제국", "Valterion Empire"],
      ["로젠하임 공국", "Duchy of Rosenheim"]
    ]
  },
  {
    ko: "실바리아",
    en: "Sylvaria",
    countries: [
      ["엘드라실 연방", "Eldrasil Federation"],
      ["미르벨 수림왕국", "Woodland Kingdom of Mirvel"],
      ["하르넬 자유도시", "Free City of Harnel"]
    ]
  },
  {
    ko: "카르둠",
    en: "Kardum",
    countries: [
      ["두르가르 산악왕국", "Mountain Kingdom of Durgar"],
      ["아스란 부족연맹", "Asran Tribal Confederation"],
      ["철관령", "Iron Crown Dominion"]
    ]
  },
  {
    ko: "네크라스",
    en: "Necras",
    countries: [
      ["벨제르 마도국", "Magocracy of Belzer"],
      ["아르카스 용혈제국", "Dragonblood Empire of Arcas"],
      ["사하르 상업연합", "Sahar Merchant Alliance"]
    ]
  },
  {
    ko: "아우렐리아",
    en: "Aurelia",
    countries: [
      ["솔라리스 성국", "Holy State of Solaris"],
      ["천공도시 이스테라", "Sky City of Istera"],
      ["고대왕조 에리온", "Ancient Dynasty of Erion"]
    ]
  }
];

const RANKS = [
  ["prestige", "명성", "Renown"],
  ["money", "재산", "Wealth"],
  ["sword", "검술", "Swordsmanship"],
  ["magic", "마법", "Magic"],
  ["health", "체력", "Vitality"],
  ["luck", "운", "Luck"],
  ["children", "자녀 수", "Children"],
  ["military", "군사력", "Military Power"],
  ["territory", "영토", "Territory"],
  ["intelligence", "지능", "Intelligence"],
  ["adventure", "모험", "Adventure"],
  ["longevity", "장수", "Longevity"],
  ["overall", "종합", "Overall"]
];

const RANK_KEYS = RANKS.map(x => x[0]);

let db = null;
let dbReady = false;

if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");

  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 5
  });
}

async function initDB() {
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

    for (const key of RANK_KEYS) {
      await db.query(
        "ALTER TABLE fantasy_rankings " +
        "ADD COLUMN IF NOT EXISTS " + key +
        " BIGINT NOT NULL DEFAULT 0"
      );
    }

    dbReady = true;
    console.log("Ranking database connected.");
  } catch (error) {
    console.error("Database error:", error.message);
  }
}

const CSS = `
*{box-sizing:border-box}
body{
  margin:0;
  background:#f6f7f9;
  color:#263640;
  font-family:-apple-system,BlinkMacSystemFont,
  "Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif;
  line-height:1.7
}
main{max-width:950px;margin:auto;padding:25px 16px 70px}
header{display:flex;justify-content:space-between;
  align-items:flex-start;gap:15px;flex-wrap:wrap}
h1{font-size:29px;letter-spacing:-1px;margin:0}
h2{font-size:20px;margin:0 0 13px}
h3{font-size:16px;margin:20px 0 7px}
p{margin:10px 0}
.muted{color:#73828b}
.small{font-size:13px}
.card{
  background:#fff;
  border:1px solid #dfe5e9;
  border-radius:11px;
  padding:22px;
  margin:16px 0
}
button{
  border:0;
  border-radius:7px;
  padding:10px 15px;
  margin:4px 4px 4px 0;
  background:#345569;
  color:#fff;
  cursor:pointer;
  font-size:14px
}
button:hover{filter:brightness(1.08)}
button.secondary{background:#e9f0f4;color:#345569}
button.selected{background:#345569;color:white}
button:disabled{opacity:.5;cursor:not-allowed}
input,select{
  width:100%;
  padding:11px;
  border:1px solid #cbd5dc;
  border-radius:7px;
  background:white;
  font-size:15px;
  margin:6px 0 13px
}
label{display:block;font-weight:600;font-size:14px}
.hidden{display:none!important}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.stat{background:#f1f5f7;padding:12px;border-radius:7px}
.stat small{display:block;color:#72818a}
.stat strong{font-size:18px;overflow-wrap:anywhere}
.choice{
  display:block;
  width:100%;
  background:#edf3f6;
  color:#294657;
  border:1px solid #d4e0e6;
  text-align:left;
  padding:13px
}
#eventCard{border-left:4px solid #829cae}
#eventText{white-space:pre-line}
.log{border-bottom:1px solid #e8ecef;padding:10px 0;font-size:14px}
.rank-buttons{display:flex;flex-wrap:wrap;gap:3px}
.rank-buttons button{font-size:12px;padding:7px 10px}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px}
td,th{text-align:left;border-bottom:1px solid #e6ecef;padding:9px}
.lang-switch{white-space:nowrap}
.lang-switch button{padding:7px 11px}
.notice{background:#f1f5f7;padding:13px;border-radius:7px}
footer{
  margin-top:35px;
  padding-top:20px;
  border-top:1px solid #dce4e8;
  color:#71808a;
  font-size:13px
}
footer a{display:inline-block;margin-right:12px;cursor:pointer}
a{color:#36718e}
@media(max-width:550px){
  main{padding:15px 12px 60px}
  .card{padding:16px}
  h1{font-size:24px}
}
`;

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="A fantasy life simulation game.">
<meta name="author" content="Fantasy Meister">
<title>판타지에서 살아가기</title>
<style>${CSS}</style>
</head>
<body>
<main>

<header>
  <div>
    <h1 id="siteTitle"></h1>
    <p class="muted" id="siteSubtitle"></p>
  </div>
  <div class="lang-switch">
    <button id="koBtn" onclick="setLanguage('ko')">한국어</button>
    <button id="enBtn" onclick="setLanguage('en')">English</button>
  </div>
</header>

<section id="home">

  <div class="card">
    <h2 data-t="newLife"></h2>
    <p data-t="intro"></p>

    <label for="nickname" data-t="nickname"></label>
    <input id="nickname" maxlength="16">

    <label for="eraMode" data-t="era"></label>
    <select id="eraMode" onchange="toggleEra()">
      <option value="random" id="randomOption"></option>
      <option value="custom" id="customOption"></option>
    </select>

    <div id="eraCustom" class="hidden">
      <label for="eraYear" data-t="birthYear"></label>
      <input id="eraYear" type="number" min="500" max="1500" value="1000">
    </div>

    <button onclick="newLife()" data-t="begin"></button>
    <p class="muted small" data-t="eraNote"></p>
  </div>

  <div class="card">
    <h2 data-t="leaderboard"></h2>
    <p class="muted" id="rankNotice"></p>
    <div id="rankButtons" class="rank-buttons"></div>
    <div id="ranking" class="scroll"></div>
    <p class="muted small" data-t="rankPrivacy"></p>
  </div>

  <div class="card">
    <h2 data-t="about"></h2>
    <h3 data-t="birthHeading"></h3>
    <p data-t="birthDescription"></p>
    <h3 data-t="growthHeading"></h3>
    <p data-t="growthDescription"></p>
    <h3 data-t="eventHeading"></h3>
    <p data-t="eventDescription"></p>
    <h3 data-t="deathHeading"></h3>
    <p data-t="deathDescription"></p>
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

    <button onclick="togglePause()" data-t="pause"></button>
    <button onclick="changeSpeed()" id="speedButton"></button>
    <button onclick="toggleAuto()" id="autoButton"></button>
    <button onclick="publishRank()" data-t="publish"></button>
    <button class="secondary" onclick="goHome()" data-t="home"></button>
  </div>

  <div class="card" id="eventCard">
    <h2 id="eventTitle"></h2>
    <p id="eventText"></p>
    <div id="choices"></div>
  </div>

  <div class="card">
    <h2 data-t="chronicle"></h2>
    <div id="history"></div>
  </div>

</section>

<section id="legal" class="card hidden">
  <button class="secondary" onclick="backFromLegal()" data-t="back"></button>
  <h2 id="legalTitle"></h2>
  <div id="legalBody"></div>
</section>

<footer>
  <p><strong id="footerTitle"></strong> · ${VERSION}</p>
  <p>
    <a onclick="showLegal('privacy')" data-t="privacy"></a>
    <a onclick="showLegal('terms')" data-t="terms"></a>
    <a onclick="showLegal('copyright')" data-t="copyright"></a>
    <a onclick="showLegal('notice')" data-t="notice"></a>
    <a onclick="showLegal('updates')" data-t="updates"></a>
    <a href="mailto:${EMAIL}" data-t="contact"></a>
  </p>
  <p>© 2026 Fantasy Meister. All Rights Reserved.</p>
  <p data-t="rightsNotice"></p>
  <p>
    <span data-t="rightsContact"></span>:
    <a href="mailto:${EMAIL}">${EMAIL}</a>
  </p>
</footer>

</main>

<script>
"use strict";

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

const WORLD = ${JSON.stringify(WORLD)};
const RANKS = ${JSON.stringify(RANKS)};
const SAVE_KEY = "fantasy-life-v100";
const LANG_KEY = "fantasy-life-language";

const TEXT = {
  ko: {
    title:"판타지에서 살아가기",
    subtitle:"당신은 이 세계에서 어떤 삶을 살게 될까요?",
    newLife:"새로운 인생",
    intro:"다섯 대륙과 열다섯 국가. 당신의 출생과 신분, 가족과 운명은 새로운 인생마다 달라집니다.",
    nickname:"플레이어 닉네임",
    nicknamePlaceholder:"닉네임을 입력하세요",
    era:"출생 시대",
    randomEra:"무작위 (제국력 500~1500년)",
    customEra:"직접 선택",
    birthYear:"제국력 출생 연도",
    begin:"태어나기",
    eraNote:"출생 연도는 게임 속 시대를 결정합니다.",
    leaderboard:"세계 랭킹",
    rankPrivacy:"랭킹 등록은 선택 사항이며, 등록한 닉네임과 캐릭터 기록은 공개됩니다.",
    about:"게임 소개",
    birthHeading:"출생과 신분",
    birthDescription:"다양한 종족과 신분으로 태어납니다. 농노부터 왕족까지, 출생은 다르지만 미래가 정해진 것은 아닙니다.",
    growthHeading:"성장과 역전",
    growthDescription:"검술, 마법, 체력 등 능력치에는 고정된 성장 상한이 없습니다. 평범한 농노도 세계 최고의 인물이 될 수 있습니다.",
    eventHeading:"인생의 사건",
    eventDescription:"가족, 질병, 전쟁, 모험, 고대 유적과 마법의 사건을 겪습니다. 선택에 따라 결과가 달라집니다.",
    deathHeading:"죽음과 기록",
    deathDescription:"종족마다 수명이 다릅니다. 삶의 기록은 연대기에 남고, 원하는 경우 세계 랭킹에 등록할 수 있습니다.",
    pause:"일시정지 / 계속",
    speed:"속도",
    auto:"자동 결정",
    on:"켜짐",
    off:"꺼짐",
    publish:"세계 랭킹 등록",
    home:"첫 화면",
    chronicle:"인생 연대기",
    back:"돌아가기",
    privacy:"개인정보 처리방침",
    terms:"이용약관",
    copyright:"저작권 안내",
    notice:"운영 안내",
    updates:"업데이트 내역",
    contact:"문의하기",
    rightsNotice:"개발자가 적법하게 권리를 보유한 창작물에 관한 권리를 유보합니다. 법령 및 제3자 라이선스에서 허용하는 이용은 제외합니다.",
    rightsContact:"저작권 및 서비스 문의",
    enterNick:"닉네임을 입력해 주세요.",
    invalidYear:"출생 연도는 제국력 500~1500년 사이여야 합니다.",
    birthEvent:"0세 — 탄생",
    birthChoice:"이 가정에서 살아간다",
    act:"적극적으로 해결한다",
    investigate:"신중하게 조사한다",
    avoid:"관여하지 않는다",
    age:"세",
    imperial:"제국력",
    father:"아버지",
    mother:"어머니",
    family:"가족",
    hp:"체력",
    mp:"마력",
    sp:"기력",
    sword:"검술",
    magic:"마법",
    intelligence:"지능",
    strength:"근력",
    agility:"민첩",
    prestige:"명성",
    money:"재산",
    luck:"운",
    children:"자녀 수",
    military:"군사력",
    territory:"영토",
    adventure:"모험",
    overall:"종합 점수",
    dead:"인생 종료 · 사망",
    waiting:"선택을 기다리는 중",
    paused:"일시정지",
    running:"시간 진행 중",
    loading:"랭킹을 불러오는 중...",
    unavailable:"공용 랭킹 데이터베이스가 연결되지 않았습니다.",
    empty:"아직 등록된 기록이 없습니다.",
    rankError:"랭킹을 불러오지 못했습니다.",
    rankPosition:"순위",
    player:"플레이어",
    character:"캐릭터",
    score:"점수",
    rankConfirm:"세계 랭킹에 등록하시겠습니까? 닉네임, 캐릭터 이름, 종족, 나이와 점수가 공개됩니다.",
    rankSuccess:"세계 랭킹에 기록을 등록했습니다.",
    rankFail:"랭킹 등록에 실패했습니다.",
    homeConfirm:"정말로 처음으로 돌아가시겠습니까?\\n\\n현재 인생의 브라우저 저장 기록이 삭제되며 복구할 수 없습니다. 이미 등록한 세계 랭킹 기록은 삭제되지 않습니다.",
    yearReached:"{age}세가 되었다.",
    bornLog:"이 세계에 태어났다.",
    startLog:"가족과 함께 인생을 시작했다.",
    childLog:"가족에게 새로운 자녀가 태어났다.",
    eventLog:"{title} 사건이 발생했다.",
    eventPrompt:"당신은 어떻게 행동하시겠습니까?",
    success:"위험을 감수한 끝에 성공했다. 보상과 경험을 얻었다.",
    failure:"도전했지만 실패했다. 부상과 손실을 입었다.",
    carefulSuccess:"신중한 판단으로 좋은 결과를 얻었다.",
    carefulFailure:"신중하게 접근했지만 원하는 결과를 얻지 못했다.",
    walkAway:"사건에 관여하지 않고 지나갔다.",
    minorDamage:"하지만 피해를 완전히 피하지는 못했다.",
    breakthrough:"전설적인 기연을 만나 능력이 폭발적으로 성장했다.",
    omen:"자신의 숨겨진 운명에 관한 기묘한 징조를 느꼈다.",
    freedom:"공적을 인정받아 농노 신분에서 벗어났다.",
    nobility:"특별한 공적으로 귀족 작위를 받았다.",
    landGrant:"영지와 병력을 하사받았다.",
    deathOld:"노화",
    deathHealth:"건강 악화",
    deathInjury:"사건 중 입은 부상",
    died:"{reason}으로 생을 마감했다.",
    birthStory:"제국력 {year}년 1월 1일.\\n\\n당신은 {continent} 대륙의 {country}에서 태어났습니다.\\n\\n아버지 {father}은(는) {fatherJob} 일을 하는 {fatherTrait} 사람입니다.\\n어머니 {mother}은(는) {motherJob} 일을 하는 {motherTrait} 사람입니다.\\n\\n당신의 가정은 {social} 계층에 속합니다. 부모님은 각자의 형편 속에서 새로운 생명을 맞이했습니다.",
    eventText:"{place} {description}\\n\\n{prompt}"
  },

  en: {
    title:"Life in a Fantasy World",
    subtitle:"What kind of life will you lead in this world?",
    newLife:"A New Life",
    intro:"Five continents. Fifteen nations. Every life begins with a different birthplace, social standing, family, and destiny.",
    nickname:"Player Nickname",
    nicknamePlaceholder:"Enter your nickname",
    era:"Starting Era",
    randomEra:"Random (Imperial Year 500–1500)",
    customEra:"Choose a Year",
    birthYear:"Year of Birth",
    begin:"Begin Your Life",
    eraNote:"Your birth year determines when your story begins.",
    leaderboard:"Global Leaderboards",
    rankPrivacy:"Leaderboard submission is optional. Submitted nicknames and character records are publicly visible.",
    about:"About the Game",
    birthHeading:"Birth and Social Standing",
    birthDescription:"Be born into one of several races and social classes, from serfdom to royalty. Your origins do not determine your future.",
    growthHeading:"Growth and Greatness",
    growthDescription:"Swordsmanship, magic, vitality, and other abilities have no fixed growth ceiling. Even a humble serf can become the greatest figure in the world.",
    eventHeading:"Life-Changing Events",
    eventDescription:"Experience family milestones, disease, war, adventures, ancient ruins, and magic. Your decisions shape the outcome.",
    deathHeading:"Death and Legacy",
    deathDescription:"Each race has its own lifespan. Your life is recorded in a chronicle, and you may choose to enter the global leaderboards.",
    pause:"Pause / Resume",
    speed:"Speed",
    auto:"Auto Decisions",
    on:"On",
    off:"Off",
    publish:"Submit to Leaderboards",
    home:"Main Menu",
    chronicle:"Life Chronicle",
    back:"Go Back",
    privacy:"Privacy Policy",
    terms:"Terms of Service",
    copyright:"Copyright Notice",
    notice:"Service Information",
    updates:"Update History",
    contact:"Contact",
    rightsNotice:"Rights are reserved in original works lawfully owned by the developer, subject to applicable law and third-party licenses.",
    rightsContact:"Copyright and Service Inquiries",
    enterNick:"Please enter a nickname.",
    invalidYear:"Choose a birth year between Imperial Years 500 and 1500.",
    birthEvent:"Age 0 — A New Beginning",
    birthChoice:"Begin life with this family",
    act:"Take decisive action",
    investigate:"Investigate carefully",
    avoid:"Stay out of it",
    age:"years old",
    imperial:"Imperial Year",
    father:"Father",
    mother:"Mother",
    family:"Family",
    hp:"Vitality",
    mp:"Mana",
    sp:"Stamina",
    sword:"Swordsmanship",
    magic:"Magic",
    intelligence:"Intelligence",
    strength:"Strength",
    agility:"Agility",
    prestige:"Renown",
    money:"Wealth",
    luck:"Luck",
    children:"Children",
    military:"Military Power",
    territory:"Territory",
    adventure:"Adventure",
    overall:"Overall Score",
    dead:"Life Ended · Deceased",
    waiting:"Awaiting your decision",
    paused:"Paused",
    running:"Time is passing",
    loading:"Loading leaderboards...",
    unavailable:"The leaderboard database is currently unavailable.",
    empty:"No records have been submitted yet.",
    rankError:"Unable to load the leaderboards.",
    rankPosition:"Rank",
    player:"Player",
    character:"Character",
    score:"Score",
    rankConfirm:"Submit your record to the global leaderboards? Your nickname, character name, race, age, and scores will be publicly visible.",
    rankSuccess:"Your record has been submitted.",
    rankFail:"Unable to submit your record.",
    homeConfirm:"Return to the main menu?\\n\\nYour current life and its locally saved progress will be permanently deleted. Previously submitted leaderboard records will remain.",
    yearReached:"You turned {age}.",
    bornLog:"You were born into this world.",
    startLog:"Your life with your family began.",
    childLog:"A new child was born into your family.",
    eventLog:"An event occurred: {title}.",
    eventPrompt:"What will you do?",
    success:"You took a risk and succeeded, gaining experience and rewards.",
    failure:"Your attempt failed, leaving you injured and poorer.",
    carefulSuccess:"Your careful judgment paid off.",
    carefulFailure:"Despite your caution, things did not go as planned.",
    walkAway:"You chose not to get involved.",
    minorDamage:"Even so, you could not avoid all the harm.",
    breakthrough:"A fateful encounter granted you an extraordinary surge of power.",
    omen:"You sensed an unsettling sign of your hidden destiny.",
    freedom:"Your achievements earned you freedom from serfdom.",
    nobility:"Your exceptional service earned you a noble title.",
    landGrant:"You were granted land and soldiers.",
    deathOld:"old age",
    deathHealth:"declining health",
    deathInjury:"injuries sustained during an incident",
    died:"Your life came to an end due to {reason}.",
    birthStory:"Imperial Year {year}, January 1.\\n\\nYou were born in {country}, on the continent of {continent}.\\n\\nYour father, {father}, is a {fatherTrait} {fatherJob}.\\nYour mother, {mother}, is a {motherTrait} {motherJob}.\\n\\nYour family belongs to the {social} class. Whatever their circumstances, your parents welcome a new life into the world.",
    eventText:"{place}, {description}\\n\\n{prompt}"
  }
};

const RACES = [
  ["인간","Human",65,65,105],
  ["엘프","Elf",12,250,500],
  ["드워프","Dwarf",8,130,230],
  ["수인","Beastkin",6,55,105],
  ["마족","Demonkin",4,150,320],
  ["용인족","Dragonkin",2.5,220,450],
  ["정령족","Spiritkin",1.5,300,650],
  ["천족","Celestial",0.7,350,750],
  ["고대종","Ancient One",0.3,500,1000]
];

const CLASSES = [
  ["농노","Serf",42],
  ["평민","Commoner",27],
  ["상인 가문","Merchant Family",14],
  ["하급 귀족","Lesser Nobility",10],
  ["상급 귀족","High Nobility",5],
  ["왕족","Royalty",2]
];

const FATES = [
  ["전생자","Reincarnator",0.025],
  ["회귀자","Regressor",0.020],
  ["마왕의 환생","Reincarnation of the Demon King",0.015],
  ["용의 화신","Avatar of the Dragon",0.015],
  ["신의 사도","Divine Apostle",0.010],
  ["세계의 오류","Anomaly of the World",0.005],
  ["용사의 운명","Destined Hero",0.010]
];

const FIRST_NAMES = [
  "카일","레온","아르","엘린","세리아",
  "루카","나엘","벨라","드란","라엘",
  "테오","오린","린아","에르","미하",
  "하린","실렌","렌","바르","디온",
  "안나","키엘","제론","로아","샤린",
  "델","유리아","칼렌","페르","이안"
];

const EN_NAMES = [
  "Kyle","Leon","Arlen","Elin","Celia",
  "Luca","Nael","Bella","Dran","Rael",
  "Theo","Orin","Lina","Eren","Mia",
  "Harin","Silen","Ren","Var","Dion",
  "Anna","Kiel","Jeron","Roa","Sharin",
  "Del","Yuria","Kalen","Fer","Ian"
];

const SURNAMES = [
  "아르벨","아르덴","벨하임","로젠",
  "카르딘","에르빈","델피아","실바",
  "레오나","엘드라","미르벨","발테르",
  "하르넬","벨제르","아스란","아르카스",
  "에리온","솔라리스","드라켄","루미엘"
];

const EN_SURNAMES = [
  "Arvel","Arden","Belheim","Rosen",
  "Kardin","Ervin","Delphia","Silva",
  "Leona","Eldra","Mirvel","Valter",
  "Harnel","Belzer","Asran","Arcas",
  "Erion","Solaris","Draken","Lumiel"
];

const JOBS = [
  ["농부","farmer"],["목수","carpenter"],
  ["상인","merchant"],["대장장이","blacksmith"],
  ["사냥꾼","hunter"],["병사","soldier"],
  ["재봉사","tailor"],["약초사","herbalist"],
  ["마법사","mage"],["서기관","scribe"],
  ["어부","fisher"],["광부","miner"],
  ["여관 주인","innkeeper"],["기사","knight"],
  ["성직자","cleric"]
];

const TRAITS = [
  ["다정한","kind-hearted"],
  ["엄격한","strict"],
  ["성실한","hardworking"],
  ["과묵한","quiet"],
  ["명랑한","cheerful"],
  ["신중한","cautious"],
  ["고집 센","stubborn"],
  ["온화한","gentle"],
  ["용감한","brave"],
  ["욕심 많은","ambitious"],
  ["현명한","wise"],
  ["소심한","timid"]
];

const EVENTS = [
  ["bandits","산적의 습격","Bandit Ambush",
    "여행 중 산적 무리를 마주쳤다.",
    "a band of outlaws blocks your path.",
    "sword","bad"],
  ["ruins","고대 유적","Ancient Ruins",
    "숲 깊은 곳에서 고대 유적이 발견되었다.",
    "you discover the remains of an ancient civilization.",
    "adventure","mixed"],
  ["master","검술 스승","A Swordmaster's Offer",
    "뛰어난 검사가 제자를 모집하고 있다.",
    "a renowned swordsman is searching for an apprentice.",
    "sword","good"],
  ["tower","마탑의 초대","Invitation from the Mage Tower",
    "마탑에서 재능 있는 인물을 찾고 있다.",
    "the Mage Tower is seeking promising new talent.",
    "magic","good"],
  ["plague","전염병","Outbreak of Disease",
    "마을에 원인을 알 수 없는 병이 퍼졌다.",
    "a mysterious illness is spreading through the village.",
    "health","bad"],
  ["royal","왕실의 포상","Royal Recognition",
    "왕실에서 공로자를 찾고 있다.",
    "the royal court is searching for worthy individuals to reward.",
    "prestige","good"],
  ["trade","상단의 제안","A Merchant's Proposal",
    "거대한 상단에서 거래를 제안했다.",
    "a powerful merchant guild offers you a business opportunity.",
    "money","good"],
  ["spirit","정령의 축복","Blessing of a Spirit",
    "작은 정령이 당신 앞에 나타났다.",
    "a mysterious spirit appears before you.",
    "magic","good"],
  ["quake","대지진","Earthquake",
    "땅이 흔들리고 건물이 무너지기 시작했다.",
    "the ground trembles as nearby buildings begin to collapse.",
    "health","bad"],
  ["war","전쟁 발발","Outbreak of War",
    "국경에서 전쟁이 시작되었다.",
    "war erupts along the border.",
    "military","bad"],
  ["plot","귀족의 음모","Noble Conspiracy",
    "귀족들의 권력 다툼에 휘말렸다.",
    "you become entangled in a struggle for power among nobles.",
    "intelligence","mixed"],
  ["grimoire","마법서 발견","Forbidden Grimoire",
    "봉인된 고대 마법서를 발견했다.",
    "you discover an ancient spellbook sealed by forgotten magic.",
    "magic","mixed"],
  ["treasure","숨겨진 보물","Hidden Treasure",
    "오래된 보물 지도를 발견했다.",
    "you come across a weathered treasure map.",
    "adventure","good"],
  ["rebellion","왕국의 반란","Rebellion",
    "지방 영주들이 반란을 일으켰다.",
    "several provincial lords rise against the crown.",
    "military","bad"],
  ["dragon","용의 흔적","Traces of a Dragon",
    "산맥에서 고대 용의 흔적이 발견되었다.",
    "signs of an ancient dragon emerge in the mountains.",
    "magic","mixed"],
  ["estate","영지의 위기","A Lordless Estate",
    "후계자를 잃은 영지가 혼란에 빠졌다.",
    "an estate falls into chaos after its heir disappears.",
    "territory","mixed"],
  ["ore","희귀 광맥","Rare Ore Vein",
    "버려진 광산에서 희귀 광석이 발견되었다.",
    "valuable ore is discovered in an abandoned mine.",
    "money","good"],
  ["knights","기사단 모집","The Knightly Order",
    "왕국 기사단에서 새로운 단원을 모집한다.",
    "the kingdom's knights are recruiting new members.",
    "sword","good"],
  ["oracle","신전의 계시","Oracle of the Temple",
    "신전에서 특별한 계시가 내려왔다.",
    "the temple announces a mysterious prophecy.",
    "luck","mixed"],
  ["beast","괴수 출현","Monstrous Threat",
    "변방 마을에 거대한 괴수가 나타났다.",
    "a terrifying creature appears near a frontier village.",
    "sword","bad"],
  ["commerce","무역 호황","Trade Boom",
    "새로운 교역로가 열렸다.",
    "a newly opened trade route promises great opportunities.",
    "money","good"],
  ["succession","왕위 분쟁","Succession Crisis",
    "왕실에서 후계자 다툼이 시작되었다.",
    "rival heirs begin fighting for the throne.",
    "prestige","mixed"],
  ["fire","대화재","Great Fire",
    "시장에 큰불이 났다.",
    "a devastating fire sweeps through the marketplace.",
    "health","bad"],
  ["spring","치유의 샘","Healing Spring",
    "병을 낫게 한다는 샘이 발견되었다.",
    "a spring said to cure illness has been discovered.",
    "health","good"],
  ["research","비밀 연구","Secret Research",
    "마법사가 위험한 연구를 제안했다.",
    "a mage invites you to participate in a dangerous experiment.",
    "intelligence","mixed"]
];

const PLACES = [
  ["왕국의 변방에서","On the kingdom's frontier"],
  ["오래된 숲에서","Deep within an ancient forest"],
  ["수도 근처에서","Near the capital"],
  ["작은 마을에서","In a quiet village"],
  ["산맥 너머에서","Beyond the mountains"],
  ["고대 유적 근처에서","Near forgotten ruins"],
  ["상업 도시에서","In a bustling trading city"],
  ["국경 지대에서","Along the border"]
];

const EMAIL = "fantasymaister@gmail.com";

const LEGAL = {
  privacy: [
    ["개인정보 처리방침 — 베타 초안","Privacy Policy — Beta Draft"],
    [
      "처리 목적",
      "게임 진행, 선택적 랭킹 운영 및 문의 대응을 위해 필요한 정보를 처리합니다.",
      "Purpose of Processing",
      "Information is processed to operate the game, maintain optional leaderboards, and respond to inquiries."
    ],
    [
      "처리 정보",
      "게임 진행 정보는 브라우저에 저장됩니다. 랭킹 등록 시 닉네임, 캐릭터 이름, 종족, 나이 및 점수가 서버에 저장됩니다. 호스팅 과정에서 IP 주소와 접속 기록 등이 처리될 수 있습니다.",
      "Information Collected",
      "Game progress is stored in your browser. Optional leaderboard submissions store your nickname, character name, race, age, and scores on the server. Hosting providers may also process IP addresses and access logs."
    ],
    [
      "공개 및 보유",
      "랭킹 기록은 다른 이용자에게 공개됩니다. 서버 기록의 구체적인 보유 기간은 정식 운영 전에 확정해야 합니다.",
      "Publication and Retention",
      "Submitted leaderboard records are publicly visible. A definitive server-side retention period must be established before full release."
    ],
    [
      "삭제 요청",
      "개인정보 열람, 정정, 삭제 및 처리정지 요청은 이메일로 문의할 수 있습니다. 랭킹 삭제 시 기록 소유권 확인이 필요할 수 있습니다.",
      "Your Rights",
      "You may request access, correction, deletion, or restriction of personal data by email. Ownership verification may be required for leaderboard deletion."
    ],
    [
      "호스팅 및 국외 처리",
      "Render 호스팅 및 PostgreSQL을 사용합니다. 실제 위탁 및 국외 이전에 관한 세부 사항은 확인 후 고지해야 합니다.",
      "Hosting and International Processing",
      "The service uses Render hosting and PostgreSQL. Details of actual processors and international data transfers must be verified and disclosed."
    ],
    [
      "문의",
      EMAIL,
      "Contact",
      EMAIL
    ],
    [
      "시행 안내",
      "본 문서는 베타 초안이며 정식 운영 전 실제 개인정보 처리 현황에 맞게 보완해야 합니다.",
      "Important Notice",
      "This is a beta draft and must be finalized to reflect actual data processing practices before full release."
    ]
  ],

  terms: [
    ["이용약관 — 베타 초안","Terms of Service — Beta Draft"],
    [
      "서비스 내용",
      "본 서비스는 가상의 판타지 세계에서 인물의 삶을 체험하는 무료 베타 시뮬레이션 게임입니다.",
      "Service Description",
      "This is a free beta simulation game in which players experience a character's life in a fictional fantasy world."
    ],
    [
      "게임 기록",
      "게임 진행 기록은 브라우저에 저장되며 기기 변경이나 브라우저 데이터 삭제로 유실될 수 있습니다.",
      "Saved Progress",
      "Progress is stored in your browser and may be lost if you change devices or clear browser data."
    ],
    [
      "랭킹 이용",
      "타인 사칭, 부정한 점수 조작, 서버 공격 및 서비스 운영 방해 행위를 금지합니다.",
      "Leaderboard Conduct",
      "Impersonation, fraudulent score manipulation, attacks on the server, and interference with the service are prohibited."
    ],
    [
      "저작권",
      "개발자가 적법하게 권리를 보유한 창작물의 저작권은 해당 권리자에게 있습니다. 관련 법령과 제3자 라이선스에서 허용되는 이용은 제외합니다.",
      "Copyright",
      "Copyright in original works lawfully owned by the developer remains with the respective rights holder, subject to applicable law and third-party licenses."
    ],
    [
      "서비스 변경",
      "운영자는 개선이나 보안상의 이유로 서비스를 변경할 수 있으며 중요한 변경 사항은 적절한 방법으로 안내합니다.",
      "Service Changes",
      "The operator may modify the service for improvements or security reasons and will provide appropriate notice of material changes."
    ],
    [
      "문의",
      EMAIL,
      "Contact",
      EMAIL
    ]
  ],

  copyright: [
    ["저작권 및 지식재산권 안내","Copyright and Intellectual Property Notice"],
    [
      "권리자",
      "© 2026 Fantasy Meister. All Rights Reserved.",
      "Rights Notice",
      "© 2026 Fantasy Meister. All Rights Reserved."
    ],
    [
      "보호 대상",
      "개발자가 적법하게 권리를 보유한 독창적인 세계관의 구체적인 표현, 스토리, 캐릭터, 텍스트, 디자인 및 소스코드는 관련 법령에 따라 보호될 수 있습니다.",
      "Protected Works",
      "Original expressions of worldbuilding, stories, characters, text, designs, and source code lawfully owned by the developer may be protected under applicable copyright law."
    ],
    [
      "무단 이용",
      "관련 법령이나 적용 라이선스에서 허용하는 경우를 제외하고, 권리자의 허락 없는 보호 대상 창작물의 무단 복제, 재배포, 전송 및 상업적 이용을 금지합니다.",
      "Unauthorized Use",
      "Except where permitted by law or applicable licenses, unauthorized copying, redistribution, transmission, or commercial exploitation of protected works is prohibited."
    ],
    [
      "권리의 한계",
      "일반적인 게임 아이디어나 규칙, 제3자 저작물, 저작권 보호 요건을 충족하지 않는 AI 생성물까지 독점적으로 소유한다는 의미는 아닙니다.",
      "Scope of Rights",
      "This notice does not claim exclusive ownership of general game ideas or mechanics, third-party works, or AI-generated material that does not qualify for copyright protection."
    ],
    [
      "상표",
      "게임 명칭과 로고의 상표권은 별도의 출원 및 등록 여부에 따라 판단됩니다.",
      "Trademarks",
      "Trademark rights in the game's name and logo depend on applicable law and any separate trademark registration."
    ],
    [
      "문의",
      EMAIL,
      "Contact",
      EMAIL
    ]
  ],

  notice: [
    ["운영 안내","Service Information"],
    [
      "서비스 상태",
      "현재 베타 테스트 중입니다.",
      "Service Status",
      "The game is currently in beta testing."
    ],
    [
      "콘텐츠",
      "전쟁, 질병, 재난 및 사망과 같은 사건이 포함됩니다.",
      "Content Advisory",
      "The game includes fictional events involving war, illness, disasters, and death."
    ],
    [
      "저장",
      "게임 기록은 브라우저에 저장됩니다. 첫 화면으로 돌아가기를 확인하면 현재 인생의 저장 기록이 삭제됩니다.",
      "Saved Progress",
      "Progress is stored in your browser. Confirming a return to the main menu deletes the current life."
    ],
    [
      "문의",
      EMAIL,
      "Contact",
      EMAIL
    ]
  ],

  updates: [
    ["업데이트 내역","Update History"],
    [
      "v1.1.0-beta",
      "한국어·영어 전환 기능과 게임 내 문구, 사건, 연대기, 랭킹 및 정책 문서의 영어 표시를 추가했습니다.",
      "v1.1.0-beta",
      "Added Korean and English language switching for the interface, events, chronicle, leaderboards, and policy pages."
    ],
    [
      "향후 개발",
      "독립 NPC, 결혼, 자녀 성장, 국가 전쟁, 영지 운영, 다양한 사건 및 서버 검증형 랭킹을 개발할 예정입니다.",
      "Planned Features",
      "Future plans include independent NPCs, marriage, growing children, national wars, estate management, richer events, and server-verified leaderboards."
    ]
  ]
};

let lang = localStorage.getItem(LANG_KEY);

if (lang !== "ko" && lang !== "en") {
  lang = navigator.language.toLowerCase().startsWith("ko")
    ? "ko"
    : "en";
}

let p = null;
let paused = true;
let speed = 1;
let auto = false;
let currentRank = "prestige";
let legalPage = null;
let previousPage = "home";
let rankCache = null;

function t(key, vars = {}) {
  let value = TEXT[lang][key] || TEXT.ko[key] || key;

  for (const [name, replacement] of Object.entries(vars)) {
    value = value.split("{" + name + "}").join(String(replacement));
  }

  return value;
}

function pair(item) {
  return item[lang === "ko" ? 0 : 1];
}

function weighted(items, weightIndex) {
  let total = items.reduce((sum,x) => sum + x[weightIndex],0);
  let n = Math.random() * total;

  for (const item of items) {
    n -= item[weightIndex];
    if (n <= 0) return item;
  }

  return items[items.length - 1];
}

function getRace(key) {
  return RACES.find(x => x[0] === key || x[1] === key);
}

function getClass(key) {
  return CLASSES.find(x => x[0] === key || x[1] === key);
}

function getWorld(koName) {
  return WORLD.find(x => x.ko === koName);
}

function displayRace(key) {
  const item = getRace(key);
  return item ? pair(item) : key;
}

function displayClass(key) {
  const item = getClass(key);
  return item ? pair(item) : key;
}

function displayContinent(key) {
  const item = getWorld(key);
  return item ? item[lang] : key;
}

function displayCountry(key) {
  for (const world of WORLD) {
    const item = world.countries.find(x => x[0] === key || x[1] === key);
    if (item) return pair(item);
  }
  return key;
}

function makeName() {
  const i = rnd(0,FIRST_NAMES.length-1);
  const j = rnd(0,SURNAMES.length-1);

  return {
    ko:FIRST_NAMES[i] + " " + SURNAMES[j],
    en:EN_NAMES[i] + " " + EN_SURNAMES[j]
  };
}

function nameOf(name) {
  if (name && typeof name === "object") {
    return name[lang] || name.ko;
  }
  return String(name || "");
}

function number(value) {
  return Number(value || 0).toLocaleString(
    lang === "ko" ? "ko-KR" : "en-US"
  );
}

function dateText() {
  const year = p.birthYear + p.age;
  const month = p.month + 1;

  return lang === "ko"
    ? "제국력 " + year + "년 " + month + "월 1일"
    : "Imperial Year " + year + ", " +
      new Date(2000,month-1,1).toLocaleString("en-US",{month:"long"}) +
      " 1";
}

function ageText(age) {
  return lang === "ko" ? age + "세" : "Age " + age;
}

function setLanguage(next) {
  if (next !== "ko" && next !== "en") return;

  lang = next;
  localStorage.setItem(LANG_KEY,lang);
  document.documentElement.lang = lang;
  document.title = t("title");

  $("siteTitle").textContent = t("title");
  $("siteSubtitle").textContent = t("subtitle");
  $("footerTitle").textContent = t("title");

  document.querySelectorAll("[data-t]").forEach(el => {
    el.textContent = t(el.dataset.t);
  });

  $("nickname").placeholder = t("nicknamePlaceholder");
  $("randomOption").textContent = t("randomEra");
  $("customOption").textContent = t("customEra");

  $("koBtn").className = lang === "ko" ? "selected" : "secondary";
  $("enBtn").className = lang === "en" ? "selected" : "secondary";

  buildRankButtons();

  if (rankCache) drawRanks(rankCache);
  if (p) render();
  if (legalPage) renderLegal();
}

function toggleEra() {
  $("eraCustom").classList.toggle(
    "hidden",
    $("eraMode").value !== "custom"
  );
}

function showPage(page) {
  ["home","game","legal"].forEach(id => {
    $(id).classList.toggle("hidden",id !== page);
  });
  window.scrollTo(0,0);
}

function newLife() {
  const nickname = $("nickname").value.trim();

  if (!nickname) {
    alert(t("enterNick"));
    return;
  }

  let birthYear;

  if ($("eraMode").value === "random") {
    birthYear = rnd(500,1500);
  } else {
    birthYear = Number($("eraYear").value);

    if (!Number.isInteger(birthYear) ||
        birthYear < 500 || birthYear > 1500) {
      alert(t("invalidYear"));
      return;
    }
  }

  const world = pick(WORLD);
  const country = pick(world.countries);
  const race = weighted(RACES,2);
  const social = weighted(CLASSES,2);

  const wealth = {
    "농노":10,"평민":40,"상인 가문":150,
    "하급 귀족":300,"상급 귀족":1000,"왕족":5000
  };

  const fate = weighted(
    [
      ...FATES.map(x => [x[0],x[1],x[2]]),
      ["평범한 운명","Ordinary Destiny",99.9]
    ],
    2
  );

  p = {
    id:crypto.randomUUID(),
    nickname,
    name:makeName(),
    race:race[0],
    social:social[0],
    continent:world.ko,
    country:country[0],
    birthYear,
    age:0,
    month:0,
    lifespan:rnd(race[3],race[4]),
    fate:fate[0],

    father:makeName(),
    mother:makeName(),
    fatherJob:pick(JOBS),
    motherJob:pick(JOBS),
    fatherTrait:pick(TRAITS),
    motherTrait:pick(TRAITS),

    hp:100,maxHp:100,
    mp:20,maxMp:20,
    sp:100,maxSp:100,

    sword:0,magic:0,intelligence:0,
    strength:1,agility:1,
    prestige:0,luck:rnd(1,100),
    money:wealth[social[0]],
    children:0,military:0,
    territory:0,adventure:0,

    alive:true,
    history:[],
    pending:{kind:"birth"}
  };

  paused = true;
  auto = false;
  speed = 1;

  addLog("born");
  save();
  showPage("game");
  render();
}

function birthStory() {
  return t("birthStory",{
    year:p.birthYear,
    continent:displayContinent(p.continent),
    country:displayCountry(p.country),
    father:nameOf(p.father),
    mother:nameOf(p.mother),
    fatherJob:pair(p.fatherJob),
    motherJob:pair(p.motherJob),
    fatherTrait:pair(p.fatherTrait),
    motherTrait:pair(p.motherTrait),
    social:displayClass(p.social)
  });
}

function addLog(key,data={}) {
  p.history.unshift({
    year:p.birthYear+p.age,
    month:p.month,
    age:p.age,
    key,
    data
  });

  p.history = p.history.slice(0,1000);
}

function logText(item) {
  if (item.text) return item.text;

  const data = item.data || {};

  if (item.key === "event") {
    const event = EVENTS.find(x => x[0] === data.id);
    return t("eventLog",{
      title:event ? event[lang==="ko"?1:2] : data.id
    });
  }

  if (item.key === "result") {
    const event = EVENTS.find(x => x[0] === data.id);
    const title = event ? event[lang==="ko"?1:2] : data.id;

    return title + " — " +
      (data.results || []).map(x => t(x)).join(" ");
  }

  return t(item.key,data);
}

function overallScore() {
  const v = x => Math.log1p(Math.max(0,Number(x)||0));

  return Math.floor(
    v(p.money)*15+
    v(p.prestige)*20+
    v(p.sword)*20+
    v(p.magic)*20+
    v(p.maxHp)*10+
    v(p.intelligence)*15+
    v(p.military)*10+
    v(p.territory)*15+
    v(p.adventure)*15+
    v(p.children)*10+
    v(p.luck)*5
  );
}

function createEvent() {
  const event = pick(EVENTS);

  p.pending = {
    kind:"event",
    id:event[0],
    place:PLACES.indexOf(pick(PLACES))
  };

  paused = true;
  addLog("event",{id:event[0]});
}

function gainAbility(key,amount) {
  if (key === "health") {
    p.maxHp += amount;
    p.hp += amount;
  } else if (key === "magic") {
    p.magic += amount;
    p.maxMp += amount;
    p.mp += amount;
  } else {
    p[key] = Math.max(0,Number(p[key]||0)+amount);
  }
}

function resolveEvent(choice) {
  if (!p || !p.pending) return;

  if (p.pending.kind === "birth") {
    p.pending = null;
    paused = false;
    addLog("startLog");
    save();
    render();
    return;
  }

  const event = EVENTS.find(x => x[0] === p.pending.id);
  if (!event) return;

  const ability = event[5];
  const value = ability === "health" ? p.maxHp : Number(p[ability]||0);

  const results = [];
  let success = false;

  if (choice === 0) {
    success = Math.random()*100 <
      Math.min(95,40+Math.sqrt(value)*3);

    if (success) {
      gainAbility(ability,rnd(1,5));
      p.prestige += rnd(1,8);
      p.money += rnd(10,80);
      p.adventure++;
      results.push("success");
    } else {
      p.hp -= rnd(5,20);
      p.money = Math.max(0,p.money-rnd(1,20));
      results.push("failure");
    }
  }

  if (choice === 1) {
    success = Math.random()*100 <
      Math.min(95,55+Math.sqrt(p.intelligence)*3);

    p.intelligence += rnd(1,3);

    if (success) {
      p.money += rnd(5,45);
      p.prestige += rnd(1,4);
      results.push("carefulSuccess");
    } else {
      results.push("carefulFailure");
    }
  }

  if (choice === 2) {
    results.push("walkAway");

    if (event[6] === "bad" && Math.random()<0.2) {
      p.hp -= rnd(1,8);
      results.push("minorDamage");
    }
  }

  if (success && Math.random()<0.002) {
    gainAbility(ability,rnd(500,3000));
    p.prestige += rnd(100,500);
    results.push("breakthrough");
  }

  if (success && p.fate !== "평범한 운명" &&
      Math.random()<0.025) {
    results.push("omen");
  }

  if (success && p.social==="농노" &&
      p.prestige>=100 && Math.random()<0.04) {
    p.social="평민";
    results.push("freedom");
  }

  if (success && p.social==="평민" &&
      p.prestige>=500 && Math.random()<0.005) {
    p.social="하급 귀족";
    results.push("nobility");
  }

  if (success && p.age>=18 &&
      p.prestige>=100 && Math.random()<0.003) {
    p.territory+=rnd(1,5);
    p.military+=rnd(10,100);
    results.push("landGrant");
  }

  addLog("result",{id:event[0],results});

  p.pending=null;
  paused=false;

  if (p.hp<=0) die("deathInjury");

  save();
  render();
}

function yearlyLife() {
  if (!p.alive) return;

  const age=p.age;

  if (age>=3) {
    if (Math.random()<0.65) {
      const gain=rnd(1,4);
      p.maxHp+=gain;
      p.hp+=gain;
    }

    if (Math.random()<0.5) {
      const gain=rnd(1,3);
      p.maxMp+=gain;
      p.mp+=gain;
    }

    if (Math.random()<0.6) {
      const gain=rnd(1,3);
      p.maxSp+=gain;
      p.sp+=gain;
    }

    if (Math.random()<0.5) p.intelligence++;
    if (Math.random()<0.4) p.sword++;
    if (Math.random()<0.3) p.magic++;
    if (Math.random()<0.4) p.strength++;
    if (Math.random()<0.4) p.agility++;
  }

  if (age>=16 && age<=75) {
    const incomes={
      "농노":[1,10],"평민":[5,20],
      "상인 가문":[10,50],
      "하급 귀족":[15,60],
      "상급 귀족":[30,100],
      "왕족":[50,150]
    };

    const range=incomes[p.social]||[1,10];
    p.money+=rnd(range[0],range[1]);
  }

  if (age>=18 && age<=65 && Math.random()<0.035) {
    p.children++;
    addLog("childLog");
  }

  if (age>=12 && Math.random()<0.15) {
    p.adventure+=rnd(1,3);
  }

  if (p.territory>0 && age>=18) {
    p.military+=rnd(0,5);
  }

  if (Math.random()<0.3) {
    p.luck=Math.max(0,p.luck+rnd(-3,4));
  }

  if (age>p.lifespan*0.75 && Math.random()<0.25) {
    p.hp-=rnd(1,5);
  }

  if (age>=p.lifespan) die("deathOld");
  else if (p.hp<=0) die("deathHealth");
}

function die(reason) {
  if (!p.alive) return;

  p.alive=false;
  paused=true;
  p.pending=null;
  addLog("died",{reason:t(reason)});

  // Store a language-independent reason for new saves.
  p.history[0].data={reasonKey:reason};
}

function advance() {
  if (!p || paused || !p.alive) return;

  p.month++;

  if (p.month>=12) {
    p.month=0;
    p.age++;
    addLog("yearReached",{age:p.age});
    yearlyLife();
  }

  if (p.alive && p.age>=1 && Math.random()<0.10) {
    createEvent();

    if (auto && p.pending) {
      resolveEvent(rnd(0,2));
    }
  }

  save();
  render();
}

function togglePause() {
  if (!p || !p.alive || p.pending) return;
  paused=!paused;
  render();
}

function changeSpeed() {
  speed=speed===1?2:speed===2?4:1;
  render();
}

function toggleAuto() {
  auto=!auto;

  if (auto && p && p.pending &&
      p.pending.kind==="event") {
    resolveEvent(rnd(0,2));
  }

  render();
}

function goHome() {
  if (!confirm(t("homeConfirm"))) return;

  localStorage.removeItem(SAVE_KEY);
  p=null;
  paused=true;
  auto=false;

  showPage("home");
  loadRanks(currentRank);
}

function addStat(label,value) {
  const div=document.createElement("div");
  div.className="stat";

  const small=document.createElement("small");
  small.textContent=label;

  const strong=document.createElement("strong");
  strong.textContent=value;

  div.append(small,strong);
  $("stats").appendChild(div);
}

function render() {
  if (!p) return;

  $("charTitle").textContent=
    nameOf(p.name)+" · "+ageText(p.age);

  $("gameDate").textContent=dateText();

  $("charInfo").textContent=[
    displayContinent(p.continent),
    displayCountry(p.country),
    displayRace(p.race),
    displayClass(p.social)
  ].join(" / ");

  $("familyInfo").textContent=
    t("father")+": "+nameOf(p.father)+" · "+
    t("mother")+": "+nameOf(p.mother);

  $("stats").replaceChildren();

  addStat(t("hp"),number(Math.max(0,p.hp))+" / "+number(p.maxHp));
  addStat(t("mp"),number(p.mp)+" / "+number(p.maxMp));
  addStat(t("sp"),number(p.sp)+" / "+number(p.maxSp));

  [
    ["sword",p.sword],["magic",p.magic],
    ["intelligence",p.intelligence],
    ["strength",p.strength],["agility",p.agility],
    ["prestige",p.prestige],["money",p.money],
    ["luck",p.luck],["children",p.children],
    ["military",p.military],["territory",p.territory],
    ["adventure",p.adventure],["overall",overallScore()]
  ].forEach(x=>addStat(t(x[0]),number(x[1])));

  $("lifeStatus").textContent=
    !p.alive?t("dead"):
    p.pending?t("waiting"):
    paused?t("paused"):
    t("running")+" · "+speed+"x";

  $("speedButton").textContent=t("speed")+" "+speed+"x";
  $("autoButton").textContent=
    t("auto")+" · "+t(auto?"on":"off");

  $("eventCard").classList.toggle("hidden",!p.pending);

  if (p.pending) {
    if (p.pending.kind==="birth") {
      $("eventTitle").textContent=t("birthEvent");
      $("eventText").textContent=birthStory();
    } else {
      const event=EVENTS.find(x=>x[0]===p.pending.id);

      if (event) {
        const index=lang==="ko"?1:2;
        const description=event[lang==="ko"?3:4];
        const place=PLACES[p.pending.place]||PLACES[0];

        $("eventTitle").textContent=event[index];
        $("eventText").textContent=t("eventText",{
          place:pair(place),
          description,
          prompt:t("eventPrompt")
        });
      }
    }

    $("choices").replaceChildren();

    const options=p.pending.kind==="birth"
      ?["birthChoice"]
      :["act","investigate","avoid"];

    options.forEach((key,index)=>{
      const button=document.createElement("button");
      button.className="choice";
      button.textContent=t(key);
      button.onclick=()=>resolveEvent(index);
      $("choices").appendChild(button);
    });
  }

  $("history").replaceChildren();

  p.history.slice(0,120).forEach(item=>{
    const div=document.createElement("div");
    div.className="log";

    let description;

    if (item.key==="died" && item.data?.reasonKey) {
      description=t("died",{
        reason:t(item.data.reasonKey)
      });
    } else {
      description=logText(item);
    }

    const when=lang==="ko"
      ?"제국력 "+item.year+"년 "+(item.month+1)+"월"
      :"Imperial Year "+item.year+", Month "+(item.month+1);

    div.textContent=
      when+" · "+ageText(item.age)+" — "+description;

    $("history").appendChild(div);
  });
}

function save() {
  if (!p) return;

  try {
    localStorage.setItem(SAVE_KEY,JSON.stringify(p));
  } catch(error) {
    console.error("Save failed:",error);
  }
}

function buildRankButtons() {
  $("rankButtons").replaceChildren();

  RANKS.forEach(([key,ko,en])=>{
    const button=document.createElement("button");
    button.className=
      key===currentRank?"selected":"secondary";
    button.textContent=lang==="ko"?ko:en;
    button.onclick=()=>loadRanks(key);
    $("rankButtons").appendChild(button);
  });
}

async function loadRanks(type) {
  currentRank=type;
  rankCache=null;
  buildRankButtons();

  $("rankNotice").textContent=t("loading");
  $("ranking").replaceChildren();

  try {
    const response=await fetch(
      "/api/rankings?type="+encodeURIComponent(type)
    );

    const data=await response.json();

    if (currentRank!==type) return;

    rankCache=data;
    drawRanks(data);
  } catch(error) {
    $("rankNotice").textContent=t("rankError");
  }
}

function drawRanks(data) {
  $("ranking").replaceChildren();

  if (!data.enabled) {
    $("rankNotice").textContent=t("unavailable");
    return;
  }

  if (!data.rows.length) {
    $("rankNotice").textContent=t("empty");
    return;
  }

  const rank=RANKS.find(x=>x[0]===currentRank);
  $("rankNotice").textContent=
    (rank ? rank[lang==="ko"?1:2] : currentRank)+
    " · "+t("leaderboard");

  const table=document.createElement("table");
  const head=document.createElement("tr");

  ["rankPosition","player","character","score"].forEach(key=>{
    const th=document.createElement("th");
    th.textContent=t(key);
    head.appendChild(th);
  });

  table.appendChild(head);

  data.rows.forEach((record,index)=>{
    const tr=document.createElement("tr");

    [
      index+1,
      record.nickname,
      record.character_name,
      number(record[currentRank])
    ].forEach(value=>{
      const td=document.createElement("td");
      td.textContent=value;
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  $("ranking").appendChild(table);
}

async function publishRank() {
  if (!p || !confirm(t("rankConfirm"))) return;

  const payload={
    id:p.id,
    nickname:p.nickname,
    character_name:nameOf(p.name),
    race:displayRace(p.race),
    age:p.age,
    prestige:p.prestige,
    money:p.money,
    sword:p.sword,
    magic:p.magic,
    health:p.maxHp,
    luck:p.luck,
    children:p.children,
    military:p.military,
    territory:p.territory,
    intelligence:p.intelligence,
    adventure:p.adventure,
    longevity:p.age,
    overall:overallScore()
  };

  try {
    const response=await fetch("/api/rankings",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });

    const result=await response.json();

    alert(
      response.ok
        ?t("rankSuccess")
        :(result.message||t("rankFail"))
    );
  } catch(error) {
    alert(t("rankFail"));
  }
}

function showLegal(key) {
  previousPage=p?"game":"home";
  legalPage=key;
  renderLegal();
  showPage("legal");
}

function renderLegal() {
  const sections=LEGAL[legalPage];
  if (!sections) return;

  const index=lang==="ko"?0:1;

  $("legalTitle").textContent=sections[0][index];
  $("legalBody").replaceChildren();

  sections.slice(1).forEach(section=>{
    const h=document.createElement("h3");
    h.textContent=section[lang==="ko"?0:2];

    const paragraph=document.createElement("p");
    paragraph.textContent=section[lang==="ko"?1:3];

    $("legalBody").append(h,paragraph);
  });
}

function backFromLegal() {
  legalPage=null;
  showPage(previousPage);
}

setInterval(()=>{
  for (let i=0;i<speed;i++) {
    if (!p || paused) break;
    advance();
  }
},1200);

try {
  const raw=localStorage.getItem(SAVE_KEY);

  if (raw) {
    const saved=JSON.parse(raw);

    if (saved && saved.name) {
      p=saved;
      $("nickname").value=p.nickname;
      paused=!!p.pending || !p.alive;
      showPage("game");
    }
  }
} catch(error) {
  console.error("Load failed:",error);
}

setLanguage(lang);
loadRanks("prestige");
</script>
</body>
</html>`;

function json(res,status,data) {
  res.writeHead(status,{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff"
  });

  res.end(JSON.stringify(data));
}

function safeNumber(value) {
  const n=Number(value);
  return Number.isFinite(n)
    ?Math.max(0,Math.min(1000000000,Math.floor(n)))
    :0;
}

async function handle(req,res) {
  const url=new URL(req.url,"http://localhost");

  if (url.pathname==="/api/health") {
    return json(res,200,{
      ok:true,
      database:dbReady,
      version:VERSION
    });
  }

  if (url.pathname==="/api/rankings" && req.method==="GET") {
    if (!dbReady) {
      return json(res,200,{enabled:false,rows:[]});
    }

    const requested=url.searchParams.get("type");
    const type=RANK_KEYS.includes(requested)
      ?requested:"prestige";

    try {
      const result=await db.query(
        "SELECT nickname,character_name,"+
        RANK_KEYS.join(",")+
        " FROM fantasy_rankings "+
        "ORDER BY "+type+" DESC,updated_at ASC LIMIT 20"
      );

      return json(res,200,{
        enabled:true,
        rows:result.rows
      });
    } catch(error) {
      console.error(error);
      return json(res,503,{enabled:false,rows:[]});
    }
  }

  if (url.pathname==="/api/rankings" && req.method==="POST") {
    if (!dbReady) {
      return json(res,503,{
        message:"Database unavailable."
      });
    }

    let raw="";

    try {
      for await (const chunk of req) {
        raw+=chunk;

        if (raw.length>10000) {
          return json(res,413,{
            message:"Request too large."
          });
        }
      }

      const data=JSON.parse(raw);
      const clean=(v,max)=>String(v??"").trim().slice(0,max);

      const id=clean(data.id,100)||crypto.randomUUID();
      const nickname=clean(data.nickname,24);
      const character=clean(data.character_name,80);
      const race=clean(data.race,30);

      if (!nickname || !character) {
        return json(res,400,{
          message:"Nickname and character name required."
        });
      }

      const columns=[
        "id","nickname","character_name","race","age",
        ...RANK_KEYS
      ];

      const values=[
        id,nickname,character,race,safeNumber(data.age),
        ...RANK_KEYS.map(key=>safeNumber(data[key]))
      ];

      const placeholders=columns.map(
        (_,i)=>"$"+(i+1)
      ).join(",");

      const updates=columns.slice(1).map(
        (key,i)=>key+"=$"+(i+2)
      ).join(",");

      await db.query(
        "INSERT INTO fantasy_rankings ("+
        columns.join(",")+
        ") VALUES ("+placeholders+") "+
        "ON CONFLICT(id) DO UPDATE SET "+
        updates+",updated_at=NOW()",
        values
      );

      return json(res,200,{
        message:"Leaderboard record submitted."
      });
    } catch(error) {
      console.error(error);
      return json(res,400,{
        message:"Unable to submit record."
      });
    }
  }

  if (req.method!=="GET") {
    return json(res,405,{
      message:"Method not allowed."
    });
  }

  res.writeHead(200,{
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"strict-origin-when-cross-origin"
  });

  res.end(HTML);
}

async function start() {
  await initDB();

  http.createServer((req,res)=>{
    handle(req,res).catch(error=>{
      console.error(error);

      if (!res.headersSent) {
        json(res,500,{
          message:"Internal server error."
        });
      }
    });
  }).listen(PORT,"0.0.0.0",()=>{
    console.log("Fantasy Life running on port "+PORT);
    console.log("Version: "+VERSION);
  });
}

start().catch(error=>{
  console.error(error);
  process.exit(1);
});
