
const http = require("node:http");
const { randomUUID } = require("node:crypto");

const PORT = process.env.PORT || 3000;
let db = null;

try {
  if (process.env.DATABASE_URL) {
    const { Pool } = require("pg");
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
} catch (e) {
  console.log("DB 설정 확인:", e.message);
}

const world = [
  { continent:"루벨리아", countries:[
    ["에테르 왕국","아르덴","농업과 기사단"],
    ["발테리온 제국","발테르","군사와 정치"],
    ["로젠하임 공국","로젠","상업과 귀족"]
  ]},
  { continent:"실바리아", countries:[
    ["엘드라실 연방","엘드라","엘프와 정령"],
    ["미르벨 수림왕국","미르벨","원시림과 마법"],
    ["하르넬 자유도시","하르넬","무역과 학문"]
  ]},
  { continent:"카르둠", countries:[
    ["두르가르 산악왕국","두르가르","광업과 대장장이"],
    ["아스란 부족연맹","아스란","수인과 부족"],
    ["철관령","카르헨","요새와 군수"]
  ]},
  { continent:"네크라스", countries:[
    ["벨제르 마도국","벨제르","마족과 마법"],
    ["아르카스 용혈제국","아르카스","용인과 전사"],
    ["사하르 상업연합","사하르","사막과 교역"]
  ]},
  { continent:"아우렐리아", countries:[
    ["솔라리스 성국","솔라리스","성직자와 신앙"],
    ["천공도시 이스테라","이스테라","천족과 비술"],
    ["고대왕조 에리온","에리온","고대 유적"]
  ]}
];

async function initDB() {
  if (!db) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS fantasy_rankings (
        id TEXT PRIMARY KEY,
        nickname VARCHAR(24) NOT NULL,
        character_name VARCHAR(80) NOT NULL,
        race VARCHAR(30) NOT NULL,
        age INTEGER NOT NULL,
        prestige INTEGER NOT NULL DEFAULT 0,
        money INTEGER NOT NULL DEFAULT 0,
        sword INTEGER NOT NULL DEFAULT 0,
        magic INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("랭킹 DB 연결 완료");
  } catch (e) {
    console.error("DB 초기화 오류:", e.message);
    db = null;
  }
}
initDB();

const css = `
*{box-sizing:border-box}
body{margin:0;background:#f5f6f4;color:#27313a;
font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;
line-height:1.7}
main{max-width:850px;margin:auto;padding:28px 18px 80px}
h1{font-size:28px;margin:12px 0 4px}
h2{font-size:19px;margin:0 0 14px}
h3{font-size:16px}
.muted,small{color:#74808a}
.card{background:white;border:1px solid #dce1df;
border-radius:10px;padding:22px;margin:16px 0}
button{padding:10px 16px;background:#334c5b;color:white;
border:0;border-radius:6px;cursor:pointer;margin:4px 4px 4px 0}
button:hover{background:#496b7e}
button:disabled{opacity:.45}
input{padding:11px;border:1px solid #ccd4d8;
border-radius:6px;width:100%;font-size:15px}
table{border-collapse:collapse;width:100%;font-size:14px}
td,th{padding:10px;border-bottom:1px solid #e6e9eb;text-align:left}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.stat{background:#f2f5f6;padding:11px;border-radius:6px}
.stat b{display:block;font-size:18px}
.bar{height:8px;background:#e5e9ed;border-radius:5px;overflow:hidden}
.fill{height:100%;background:#65899c}
.red{background:#cb7474}.blue{background:#729bc9}
.green{background:#82a784}
.hidden{display:none}
.choice{display:block;width:100%;text-align:left;background:#edf2f5;
color:#283a45;border:1px solid #d6e0e5;margin:8px 0}
.choice:hover{background:#dae7ee}
.log{padding:10px 0;border-bottom:1px solid #e5e8eb;font-size:14px}
footer{border-top:1px solid #dce1df;margin-top:30px;
padding-top:22px;color:#66747b;font-size:13px}
a{color:#416a80;margin-right:12px;cursor:pointer}
#event{border-left:4px solid #9b8052}
@media(max-width:550px){main{padding:14px}.card{padding:16px}}
`;

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>판타지에서 살아가기</title>
<style>${css}</style></head>
<body><main>
<header>
<h1>판타지에서 살아가기</h1>
<p class="muted">당신은 이 세계에서 어떤 삶을 살게 될까요?</p>
</header>

<section id="home">
<div class="card">
<h2>새로운 인생</h2>
<p>다섯 대륙, 열다섯 국가 중 한 곳에서 태어납니다.
종족과 신분, 가족, 운명은 태어날 때 결정됩니다.</p>
<label>플레이어 닉네임</label>
<input id="nickname" maxlength="16" placeholder="닉네임 입력">
<p><button onclick="newLife()">태어나기</button></p>
</div>

<div class="card">
<h2>세계 랭킹</h2>
<p class="muted" id="rankNotice">랭킹 불러오는 중...</p>
<button onclick="loadRanks('prestige')">명성</button>
<button onclick="loadRanks('money')">재산</button>
<button onclick="loadRanks('sword')">검술</button>
<button onclick="loadRanks('magic')">마법</button>
<div id="ranking"></div>
</div>

<div class="card">
<h2>어떻게 진행되나요?</h2>
<p>0세부터 한 사람의 인생이 시작됩니다.
시간은 자동으로 흐르며 중요한 사건이 발생하면 잠시 멈춥니다.
플레이어는 사건에 대응하는 방법을 선택할 수 있습니다.</p>
<p>전쟁과 재난 같은 불행한 사건도 좋은 결과로 이어질 수 있고,
뜻밖의 행운도 잘못된 선택으로 불행해질 수 있습니다.</p>
<p>세계의 국가와 대륙은 고정되어 있지만
플레이어의 출생과 사건은 무작위입니다.
각 종족은 서로 다른 자연 수명을 갖습니다.</p>
<p>이 게임은 실제 통계에 기반한 시뮬레이션이 아닙니다.
세계관과 확률은 게임을 위해 설정한 가상의 수치입니다.</p>
</div>
</section>

<section id="game" class="hidden">
<div class="card">
<h2 id="charTitle"></h2>
<p id="charInfo"></p>
<div class="grid" id="stats"></div>
<p id="lifeStatus" class="muted"></p>
<button onclick="togglePause()">일시정지 / 계속</button>
<button onclick="changeSpeed()">속도 변경</button>
<button onclick="publishRank()">랭킹 기록 등록</button>
<button onclick="goHome()">첫 화면</button>
</div>

<div class="card" id="event">
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
<button onclick="showPage('home')">돌아가기</button>
<h2 id="legalTitle"></h2>
<div id="legalBody"></div>
</section>

<footer>
<p><b>판타지에서 살아가기</b> · 베타 서비스</p>
<p>
<a onclick="showLegal('privacy')">개인정보 처리방침</a>
<a onclick="showLegal('terms')">이용약관</a>
<a onclick="showLegal('notice')">운영 안내</a>
<a onclick="showLegal('updates')">업데이트 내역</a>
</p>
<p>이 게임은 창작된 판타지 세계를 배경으로 하며
전쟁, 질병, 사망, 범죄와 같은 사건을 포함합니다.</p>
<p>문의처와 운영자 정보는 실제 서비스 운영 전에 확정하여 게시해야 합니다.</p>
</footer>
</main>
<script>
const $=id=>document.getElementById(id);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const world=${JSON.stringify(world)};
const races=[
["인간",65,68,100],["엘프",12,250,500],
["드워프",8,130,220],["수인",6,55,95],
["마족",4,150,300],["용인족",2.5,220,420],
["정령족",1.5,300,650],["천족",.7,350,700],
["고대종",.3,500,1000]
];
const ranks=[
["농노",42],["평민",27],["상인 가문",14],
["하급 귀족",10],["상급 귀족",5],["왕족",2]
];
const fates=[
["전생자",.025],["회귀자",.020],
["마왕의 환생",.015],["용의 화신",.015],
["신의 사도",.010],["세계의 오류",.005],
["용사의 운명",.010]
];
function weighted(a){
let n=Math.random()*a.reduce((s,x)=>s+x[1],0);
for(const x of a){n-=x[1];if(n<=0)return x;}
return a[a.length-1];
}
function hiddenFate(){
let n=Math.random()*100;
for(const x of fates){n-=x[1];if(n<0)return x[0];}
return "평범한 운명";
}
const first=["레온","카일","세리아","엘리안","아델",
"루시안","아르웬","테오","리안","벨라","드란","에리카"];
const last=["아르벨","실바","카르둠","발테르","로젠",
"엘드라","미르벨","아스란","하르넬","벨제르"];
const jobs=["농부","대장장이","상인","사냥꾼","서기관",
"약초사","병사","목수","재봉사","마법사"];
const traits=["다정한","엄격한","성실한","과묵한",
"명랑한","신중한","고집 센","온화한"];
const events=[
["산적의 습격","여행길에 산적들이 나타났다.","bad","sword"],
["대지진","건물이 무너지고 사람들이 도움을 청한다.","bad","knowledge"],
["왕국의 전쟁","국경에서 전쟁이 시작됐다.","bad","sword"],
["전염병","마을에 원인 모를 질병이 퍼지고 있다.","bad","knowledge"],
["마물의 습격","숲에서 마물이 나타났다.","bad","sword"],
["가문의 빚","가족에게 오래된 빚이 있다는 사실을 알았다.","bad","knowledge"],
["화재","마을 창고에 큰불이 났다.","bad","sword"],
["귀족의 음모","억울한 누명을 쓴 사람이 도움을 요청한다.","bad","knowledge"],
["뜻밖의 유산","먼 친척이 재산을 남겼다는 소식이 왔다.","good","knowledge"],
["숨겨진 보물","오래된 보물 지도를 발견했다.","good","knowledge"],
["검술 스승","뛰어난 검사가 제자를 모집한다.","good","sword"],
["마탑의 초대","마탑에서 재능 검사를 진행한다.","good","magic"],
["정령의 축복","작은 정령이 다가와 도움을 제안한다.","good","magic"],
["상단의 제안","상인이 새로운 거래를 제안한다.","good","knowledge"],
["왕실 포상","왕실에서 공로자를 찾고 있다.","good","prestige"],
["치유의 샘","병을 낫게 한다는 샘이 발견됐다.","good","magic"],
["축제의 우승","지역 축제에서 경연 대회가 열린다.","good","sword"],
["고대 유적","탐험가가 유적 탐사에 동행하자고 한다.","good","knowledge"],
["실종된 여행자","길을 잃은 여행자를 발견했다.","bad","knowledge"],
["수상한 마법서","봉인된 책에서 이상한 빛이 새어 나온다.","bad","magic"]
];
const legalTexts={
privacy:{
title:"개인정보 처리방침 (초안)",
body:"이 게임은 회원가입 없이 이용할 수 있도록 설계되었습니다. "+
"게임 진행 기록은 이용자의 브라우저에 저장됩니다. "+
"이용자가 랭킹 등록을 선택하면 닉네임, 캐릭터 이름, "+
"종족, 나이, 게임 점수 및 기록 식별자가 서버에 저장될 수 있습니다. "+
"랭킹 기록은 다른 이용자에게 공개됩니다. "+
"랭킹 삭제 기능은 등록한 브라우저에서 이용할 수 있도록 준비되어 있습니다. "+
"호스팅 제공자의 접속 기록 등 실제 처리되는 정보, 보관 기간, "+
"처리 위탁 및 국외 이전 사항은 운영 환경을 확인해 정식 방침에 명시해야 합니다."
},
terms:{
title:"이용약관 (초안)",
body:"본 서비스는 가상의 판타지 인생 시뮬레이션입니다. "+
"게임 내 사건과 확률은 현실의 사실이나 통계를 나타내지 않습니다. "+
"이용자는 다른 사람을 사칭하거나 랭킹을 조작해서는 안 됩니다. "+
"운영자는 서비스 개선을 위해 기능을 변경할 수 있습니다. "+
"유료 서비스가 도입되는 경우 별도의 이용 조건을 마련합니다."
},
notice:{
title:"운영 안내",
body:"현재 베타 서비스입니다. "+
"게임에는 전쟁, 재난, 질병, 사망 등 무거운 주제가 포함될 수 있습니다. "+
"게임 내 등장인물, 국가, 사건은 허구입니다. "+
"운영자 명칭, 연락처, 서비스 주소, 개인정보 담당 연락처는 "+
"실제 운영 정보로 확인한 뒤 게시해야 합니다."
},
updates:{
title:"업데이트 내역",
body:"v0.8 — 고정 대륙과 국가, 출생 가족 설명, 상태창, "+
"자동 시간 진행, 랜덤 사건, 랭킹 연동 구조, "+
"개인정보 처리방침 및 이용약관 초안 추가."
}
};
let p=null,paused=true,speed=1;
let homeNick="";
function showPage(page){
$("home").classList.toggle("hidden",page!=="home");
$("game").classList.toggle("hidden",page!=="game");
$("legal").classList.toggle("hidden",page!=="legal");
window.scrollTo(0,0);
}
function showLegal(key){
const item=legalTexts[key];
$("legalTitle").textContent=item.title;
$("legalBody").textContent=item.body;
showPage("legal");
}
function newLife(){
const nickname=$("nickname").value.trim();
if(!nickname){alert("닉네임을 입력해 줘.");return;}
homeNick=nickname;
const continent=pick(world);
const country=pick(continent.countries);
const race=weighted(races);
const rank=weighted(ranks)[0];
const father=pick(first)+" "+pick(last);
const mother=pick(first)+" "+pick(last);
const fatherJob=pick(jobs),motherJob=pick(jobs);
const familyMoney=rank==="왕족"?500:
rank.includes("귀족")?200:rank==="상인 가문"?130:40;
p={
id:crypto.randomUUID(),nickname,
name:pick(first)+" "+pick(last),
race:race[0],lifespan:rnd(race[2],race[3]),
rank,continent:continent.continent,
country:country[0],capital:country[1],
father,mother,fatherJob,motherJob,
fatherTrait:pick(traits),motherTrait:pick(traits),
fate:hiddenFate(),age:0,month:0,
hp:100,maxHp:100,mp:30,maxMp:30,
sp:100,maxSp:100,money:familyMoney,
sword:0,magic:0,knowledge:0,prestige:0,
history:[],pending:null,alive:true
};
paused=true;
p.pending={
title:"0세 — 탄생",
text:"당신은 "+p.continent+" 대륙, "+p.country+
"의 한 가정에서 태어났습니다.\\n\\n"+
"아버지 "+father+"은(는) "+fatherJob+
" 일을 하는 "+p.fatherTrait+" 사람입니다.\\n"+
"어머니 "+mother+"은(는) "+motherJob+
" 일을 하는 "+p.motherTrait+" 사람입니다.\\n\\n"+
"당신의 가문은 "+rank+" 계층에 속합니다. "+
"가족은 저마다의 사정 속에서 당신을 맞이했습니다.",
birth:true
};
addLog("이 세계에 태어났다.");
save();showPage("game");render();
}
function addLog(text){
p.history.unshift({age:p.age,month:p.month,text});
p.history=p.history.slice(0,250);
}
function nextEvent(){
const e=pick(events);
p.pending={
title:e[0],text:e[1],kind:e[2],ability:e[3]
};
paused=true;
addLog(e[0]+" 사건이 발생했다.");
}
function resolveEvent(choice){
if(!p||!p.pending)return;
if(p.pending.birth){
p.pending=null;paused=false;
addLog("가족과 함께 첫 번째 삶을 시작했다.");
save();render();return;
}
const e=p.pending;
const ability=p[e.ability]||0;
let success=false,summary="";
if(choice===0){
success=Math.random()*100<Math.min(90,45+ability*2);
if(success){
p.money+=rnd(20,90);p.prestige+=5;
p[e.ability]=(p[e.ability]||0)+3;
summary="적극적으로 행동해 사건을 해결하고 보상을 얻었다.";
}else{
p.hp-=rnd(5,18);p.money=Math.max(0,p.money-15);
summary="위험을 감수했지만 실패해 손해를 입었다.";
}
}else if(choice===1){
success=Math.random()*100<Math.min(90,65+p.knowledge*2);
p.knowledge+=2;
if(success){
p.money+=25;p.prestige+=2;
summary="신중하게 조사해 좋은 결과를 얻었다.";
}else{
summary="조사했지만 원하는 결과를 얻지 못했다.";
}
}else{
summary="사건에 관여하지 않고 지나갔다.";
if(e.kind==="bad")p.hp=Math.min(p.maxHp,p.hp+1);
}
if(e.kind==="bad"&&success)
summary="불행한 일을 기회로 바꾸었다. "+summary;
if(e.kind==="good"&&!success&&choice!==2)
summary="좋은 기회였지만 일이 뜻대로 풀리지 않았다. "+summary;
addLog(e.title+" — "+summary);
p.pending=null;paused=false;
if(p.hp<=0)die("사건으로 인한 부상");
save();render();
}
function die(reason){
p.alive=false;paused=true;p.pending=null;
addLog(reason+"으로 생을 마감했다.");
}
function advance(){
if(!p||paused||!p.alive)return;
p.month++;
if(p.month>=12){
p.month=0;p.age++;
if(Math.random()<.3)p.knowledge++;
if(Math.random()<.2)p.sword++;
if(p.age>p.lifespan*.7 && Math.random()<.35)p.hp--;
addLog(p.age+"세가 되었다.");
}
if(p.age>=p.lifespan)die("노화");
else if(p.hp<=0)die("건강 악화");
else if(p.age>=1&&Math.random()<.12)nextEvent();
save();render();
}
function togglePause(){
if(!p||p.pending||!p.alive)return;
paused=!paused;render();
}
function changeSpeed(){
speed=speed===1?2:speed===2?4:1;render();
}
function goHome(){
showPage("home");
$("nickname").value=homeNick;
loadRanks("prestige");
}
function stat(label,value){
return '<div class="stat"><small>'+label+
'</small><b>'+value+'</b></div>';
}
function render(){
if(!p)return;
$("charTitle").textContent=p.name+" · "+p.age+"세";
$("charInfo").textContent=p.continent+" 대륙 / "+
p.country+" / "+p.race+" / "+p.rank;
$("stats").innerHTML=
stat("체력 HP",Math.max(0,p.hp)+" / "+p.maxHp)+
stat("마력 MP",p.mp+" / "+p.maxMp)+
stat("기력 SP",p.sp+" / "+p.maxSp)+
stat("금화",p.money)+
stat("검술",p.sword)+stat("마법",p.magic)+
stat("학문",p.knowledge)+stat("명성",p.prestige);
$("lifeStatus").textContent=
p.alive?(p.pending?"선택 대기 중":
paused?"일시정지":"시간 진행 중 · "+speed+"배속"):
"사망 · 인생 종료";
$("event").classList.toggle("hidden",!p.pending);
if(p.pending){
$("eventTitle").textContent=p.pending.title;
$("eventText").textContent=p.pending.text;
$("eventText").style.whiteSpace="pre-line";
$("choices").innerHTML="";
const labels=p.pending.birth?
["이 가정에서 살아간다"]:
["적극적으로 해결한다","신중하게 조사한다","관여하지 않는다"];
labels.forEach((label,i)=>{
const b=document.createElement("button");
b.className="choice";b.textContent=label;
b.onclick=()=>resolveEvent(i);
$("choices").appendChild(b);
});
}
$("history").innerHTML="";
p.history.slice(0,100).forEach(h=>{
const div=document.createElement("div");
div.className="log";
div.textContent=h.age+"세 "+h.month+"개월 — "+h.text;
$("history").appendChild(div);
});
}
function save(){
if(p)localStorage.setItem("fantasy-life-v08",JSON.stringify(p));
}
async function loadRanks(type){
try{
const r=await fetch("/api/rankings?type="+type);
const data=await r.json();
$("ranking").innerHTML="";
if(!data.enabled){
$("rankNotice").textContent=
"아직 공용 랭킹 DB가 연결되지 않았습니다.";
return;
}
$("rankNotice").textContent="실제 등록된 이용자 기록";
const table=document.createElement("table");
const head=document.createElement("tr");
["순위","플레이어","캐릭터","점수"].forEach(t=>{
const th=document.createElement("th");th.textContent=t;
head.appendChild(th);
});
table.appendChild(head);
data.rows.forEach((x,i)=>{
const tr=document.createElement("tr");
[i+1,x.nickname,x.character_name,x[type]].forEach(v=>{
const td=document.createElement("td");td.textContent=v;
tr.appendChild(td);
});
table.appendChild(tr);
});
$("ranking").appendChild(table);
}catch(e){
$("rankNotice").textContent="랭킹을 불러오지 못했습니다.";
}
}
async function publishRank(){
if(!p)return;
if(!confirm("닉네임, 캐릭터 이름, 종족, 나이와 "+
"게임 점수를 공개 랭킹에 등록할까요?"))return;
try{
const response=await fetch("/api/rankings",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
id:p.id,nickname:p.nickname,
character_name:p.name,race:p.race,age:p.age,
prestige:p.prestige,money:p.money,
sword:p.sword,magic:p.magic
})
});
const data=await response.json();
alert(data.message||"요청이 처리되었습니다.");
}catch(e){alert("랭킹 서버 연결에 실패했습니다.");}
}
setInterval(advance,1200);
try{
const saved=JSON.parse(localStorage.getItem("fantasy-life-v08"));
if(saved&&saved.name){
p=saved;homeNick=p.nickname;
$("nickname").value=homeNick;
paused=!!p.pending||!p.alive;
showPage("game");render();
}
}catch(e){}
loadRanks("prestige");
</script></body></html>`;

function json(res,status,data){
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8"});
  res.end(JSON.stringify(data));
}
async function handle(req,res){
  const url=new URL(req.url,"http://localhost");
  if(url.pathname==="/api/world"){
    return json(res,200,world);
  }
  if(url.pathname==="/api/rankings"&&req.method==="GET"){
    if(!db)return json(res,200,{enabled:false,rows:[]});
    const allowed=["prestige","money","sword","magic"];
    const type=allowed.includes(url.searchParams.get("type"))?
      url.searchParams.get("type"):"prestige";
    try{
      const result=await db.query(
        "SELECT nickname,character_name,race,age,prestige,money,sword,magic "+
        "FROM fantasy_rankings ORDER BY "+type+" DESC LIMIT 20"
      );
      return json(res,200,{enabled:true,rows:result.rows});
    }catch(e){
      return json(res,503,{enabled:false,rows:[]});
    }
  }
  if(url.pathname==="/api/rankings"&&req.method==="POST"){
    if(!db)return json(res,503,{message:"DB 연결이 필요합니다."});
    let raw="";
    for await(const chunk of req){
      raw+=chunk;
      if(raw.length>10000)return json(res,413,{message:"요청이 너무 큽니다."});
    }
    try{
      const d=JSON.parse(raw);
      const str=(v,n)=>String(v||"").trim().slice(0,n);
      const num=v=>Math.max(0,Math.min(1000000000,Math.floor(Number(v)||0)));
      if(!str(d.nickname,24)||!str(d.character_name,80))
        return json(res,400,{message:"이름을 확인해 주세요."});
      const id=str(d.id,100)||randomUUID();
      await db.query(
        `INSERT INTO fantasy_rankings
        (id,nickname,character_name,race,age,prestige,money,sword,magic)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT(id) DO UPDATE SET
        nickname=$2,character_name=$3,race=$4,age=$5,
        prestige=$6,money=$7,sword=$8,magic=$9,updated_at=NOW()`,
        [id,str(d.nickname,24),str(d.character_name,80),
        str(d.race,30),num(d.age),num(d.prestige),
        num(d.money),num(d.sword),num(d.magic)]
      );
      return json(res,200,{message:"랭킹 기록을 등록했습니다."});
    }catch(e){
      return json(res,400,{message:"등록 중 오류가 발생했습니다."});
    }
  }
  res.writeHead(200,{
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff"
  });
  res.end(html);
}
http.createServer((req,res)=>{
  handle(req,res).catch(e=>{
    console.error(e);
    if(!res.headersSent)json(res,500,{message:"서버 오류"});
  });
}).listen(PORT,"0.0.0.0",()=>{
  console.log("판타지에서 살아가기 실행:",PORT);
});
