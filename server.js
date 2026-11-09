
const http = require("node:http");
const PORT = process.env.PORT || 3000;

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>판타지에서 살아가기</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#10151e;color:#eee5d4;font-family:system-ui,-apple-system,sans-serif}
main{max-width:800px;margin:auto;padding:22px}
h1{text-align:center;color:#e9c17d}
h2{color:#e9c17d}
.subtitle{text-align:center;color:#aaa}
.panel{background:#1b2534;border:1px solid #45485a;border-radius:14px;padding:20px;margin:16px 0}
button{background:#b99254;border:0;color:#171717;padding:12px 16px;border-radius:9px;font-weight:bold;cursor:pointer;margin:5px}
button:hover{background:#e3bd7c}
button:disabled{opacity:.4}
input,select{background:#29364a;color:white;border:1px solid #777;border-radius:8px;padding:12px;width:100%;font-size:16px}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.stat{background:#2b3648;padding:12px;border-radius:9px}
.stat small{display:block;color:#adb5c4;margin-bottom:5px}
#log{max-height:420px;overflow:auto}
.entry{padding:12px;border-bottom:1px solid #394356;line-height:1.65}
.good{color:#a7e6ae}.bad{color:#f3a7a7}
#event{border-color:#d9ad60;background:#302c31}
#eventText{white-space:pre-line;line-height:1.8}
.choice{display:block;width:100%;text-align:left;margin:8px 0}
.hidden{display:none!important}
.notice{color:#b8c2d0;font-size:13px}
</style>
</head>
<body>
<main>
<h1>⚔ 판타지에서 살아가기</h1>
<p class="subtitle" id="subtitle">당신은 어떤 삶을 살게 될까?</p>

<section id="birth" class="panel">
<h2>새로운 인생</h2>
<label>플레이어 닉네임</label>
<input id="username" maxlength="16" placeholder="닉네임 입력">
<p class="notice">닉네임과 캐릭터 이름은 서로 달라.</p>
<div id="birthInfo"></div>
<button onclick="reroll()">다시 태어나기</button>
<button onclick="start()">이 인생으로 시작</button>
</section>

<section id="game" class="hidden">
<div class="panel">
<h2 id="identity"></h2>
<p id="timeInfo"></p>
<div class="stats" id="stats"></div>
<p id="status"></p>
<button onclick="togglePause()" id="pauseBtn">일시정지</button>
<button onclick="changeSpeed()">속도 변경</button>
<button onclick="restart()">새 인생</button>
</div>

<div id="event" class="panel hidden">
<h2 id="eventTitle"></h2>
<p id="eventText"></p>
<div id="choices"></div>
</div>

<div class="panel">
<h2>📜 인생 연대기</h2>
<div id="log"></div>
</div>
</section>
</main>

<script>
const $=id=>document.getElementById(id);
const random=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[random(0,a.length-1)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

const races=[
["인간",65,68,100],
["엘프",12,250,500],
["드워프",8,130,220],
["수인",6,55,95],
["마족",4,150,300],
["용인족",2.5,220,420],
["정령족",1.5,300,650],
["천족",.7,350,700],
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
function weighted(items){
let r=Math.random()*100;
for(const x of items){r-=x[1];if(r<0)return x;}
return items[items.length-1];
}
function fate(){
let r=Math.random()*100;
for(const x of fates){r-=x[1];if(r<0)return x[0];}
return "평범한 운명";
}
const koreanFamily=["김","이","박","최","정","강","조","윤","장","임","한","오","서","신","권","황","안","송","류","홍"];
const koreanFirst=["도","하","서","지","윤","민","예","유","시","태","은","현","준","수","연","채","우","다","라","아"];
const koreanLast=["준","윤","현","아","린","우","호","진","서","영","민","율","희","원","빈","하","온","은","혁","별"];
const fantasyFirst=["레온","카일","아델","세리아","엘리시아","루시안","아르웬","카르둠","아자르","벨리안","에르단","리오넬","엘레나","이사벨","드레이크","테오","리아나","아스란","제노","라헬"];
const fantasyMiddle=["아","엘","리","온","테","카","벨","드","린","시아","노","루","라","미","렌","스","타","디","아르","페"];
const fantasyLast=["리온","시아","테르","리스","엘","란","드","벨","미르","스","온","니아","델","르","안","가르","피르","나","시아스","렌"];
const houses=["발테리온","실바리스","아이언포지","로젠하임","아스텔","드라코니아","벨페리온","윈터하트","블랙손","아르카디아","스톰브링어","루미나르"];

function generateName(){
if(Math.random()<.35)
return pick(koreanFamily)+pick(koreanFirst)+pick(koreanLast);
return pick(fantasyFirst)+pick(fantasyMiddle)+pick(fantasyLast)+" "+pick(houses);
}

let birth=null,p=null,paused=false,speed=1,ticks=0;

function reroll(){
const race=weighted(races);
birth={
name:generateName(),race:race[0],
rank:weighted(ranks)[0],fate:fate(),
lifespan:random(race[2],race[3])
};
$("birthInfo").innerHTML=
"<p>캐릭터 이름: <b>"+birth.name+"</b></p>"+
"<p>종족: "+birth.race+"</p>"+
"<p>신분: "+birth.rank+"</p>"+
"<p class='notice'>특별한 운명은 출생 시 공개되지 않아.</p>";
}

function start(){
const username=$("username").value.trim();
if(!username){alert("닉네임을 입력해 줘!");return;}
p={...birth,username,age:0,month:0,
health:100,money:50,skill:0,knowledge:0,
magic:0,prestige:0,alive:true,
pending:null,history:[],eventCount:0};
record("세상에 태어났다.","");
$("birth").classList.add("hidden");
$("game").classList.remove("hidden");
paused=false;
save();render();
}

function record(message,tone=""){
p.history.unshift({age:p.age,month:p.month,message,tone});
p.history=p.history.slice(0,300);
}

const places=[
"왕도","변경의 숲","산골 마을","상업 도시",
"항구","고대 유적","드워프 광산","엘프 숲",
"황무지","마법 도시","국경 요새","사막 오아시스",
"대성당","빙설 산맥","버려진 성","지하 미궁",
"왕립 아카데미","정령의 호수","마탑","시장",
"귀족 저택","여관","농촌","용의 협곡"
];
const people=[
"떠돌이 기사","상인","노인","마법사",
"수상한 여행자","귀족","용병","사제",
"정령","대장장이","모험가","농민",
"엘프 궁수","드워프 장인","마족 사절","어린아이",
"도둑","왕실 기사","학자","치유사"
];
const situations=[
"폭풍이 몰아치는 밤","축제가 열리는 날",
"평화로운 아침","겨울이 시작될 무렵",
"수확이 끝난 날","왕국의 기념일",
"안개가 짙은 새벽","보름달이 뜬 밤",
"전쟁 소문이 퍼진 날","비가 내리는 오후",
"시장에 사람이 몰린 날","긴 가뭄이 이어지던 때"
];

const eventTypes=[
["산적의 습격","산적 무리가 길을 막고 금화를 요구한다.","bad","skill"],
["마물 출현","마을 근처에 위험한 마물이 나타났다.","bad","skill"],
["대지진","땅이 흔들리고 건물들이 무너지고 있다.","bad","knowledge"],
["전염병","원인을 알 수 없는 병이 퍼지고 있다.","bad","knowledge"],
["왕국 전쟁","국경에서 전쟁이 시작됐다는 소식이 들린다.","bad","skill"],
["홍수","강이 범람해 집들이 물에 잠기고 있다.","bad","knowledge"],
["화재","큰불이 번지며 사람들이 도움을 요청한다.","bad","skill"],
["흉년","농작물이 말라 식량이 부족해지고 있다.","bad","knowledge"],
["도둑","누군가 귀중품을 훔쳐 달아났다.","bad","skill"],
["저주받은 유물","검은 기운을 내뿜는 유물이 발견됐다.","bad","magic"],
["귀족의 음모","권력자가 누군가에게 누명을 씌우려 한다.","bad","knowledge"],
["실종 사건","주민 한 명이 흔적도 없이 사라졌다.","bad","knowledge"],
["노예 상인","붙잡힌 사람들이 도움을 청한다.","bad","skill"],
["마법 폭주","마법 실험이 실패해 마력이 폭주한다.","bad","magic"],
["괴수의 습격","거대한 괴수가 도시로 다가온다.","bad","skill"],
["숨겨진 보물","오래된 보물 지도가 발견됐다.","good","knowledge"],
["귀인의 도움","유력한 인물이 재능을 알아보고 도움을 제안한다.","good","prestige"],
["마법 재능 발견","마력에 특별한 반응이 나타났다.","good","magic"],
["검술의 깨달음","오랜 고민 끝에 새로운 검술의 실마리를 찾았다.","good","skill"],
["뜻밖의 유산","먼 친척이 남긴 재산에 관한 소식이 도착했다.","good","knowledge"],
["정령의 축복","정령이 작은 선물을 건네려 한다.","good","magic"],
["왕실의 포상","왕실에서 공로자를 찾고 있다.","good","prestige"],
["상단의 제안","상인이 큰 이익을 낼 거래를 제안한다.","good","knowledge"],
["스승과의 만남","뛰어난 스승이 제자를 구하고 있다.","good","skill"],
["고대 도서 발견","잊힌 지식이 담긴 책이 발견됐다.","good","knowledge"],
["축제의 우승 기회","도시 축제에서 다양한 경연이 열린다.","good","skill"],
["치유의 샘","상처를 치유한다는 샘이 발견됐다.","good","magic"],
["친구의 도움","오래된 친구가 어려움을 도와주겠다고 한다.","good","prestige"],
["광맥 발견","근처 산에서 귀금속 광맥이 발견됐다.","good","knowledge"],
["신비로운 알","정체 모를 알이 발견돼 사람들의 관심을 끈다.","good","magic"],
["결혼 제안","유력 가문에서 혼인을 제안해 왔다.","good","prestige"],
["고대 유적의 발견","탐험가들이 새로운 유적의 입구를 발견했다.","good","knowledge"]
];

const childhood=[
["첫 친구","또래 아이가 함께 놀자고 다가왔다.","good","prestige"],
["마법 재능 검사","마탑에서 아이들의 재능을 검사한다.","good","magic"],
["길 잃은 아이","낯선 아이가 울면서 도움을 청한다.","bad","knowledge"],
["낡은 목검","버려진 목검에서 희미한 빛이 새어 나온다.","good","skill"],
["아픈 가족","가족이 갑자기 병에 걸렸다.","bad","knowledge"],
["수상한 선물","여행자가 정체 모를 선물을 남겼다.","good","knowledge"]
];

const fateEvents={
"회귀자":["반복되는 기억","한 번도 경험하지 않은 미래의 장면이 떠올랐다."],
"전생자":["전생의 기억","낯선 세계에서 살았던 기억이 꿈에 나타났다."],
"마왕의 환생":["검은 왕관","꿈속에서 수많은 마물이 무릎을 꿇었다."],
"용의 화신":["용의 심장","가슴 깊은 곳에서 용의 심장 박동이 느껴졌다."],
"신의 사도":["신탁","어디선가 자신의 이름을 부르는 신성한 목소리가 들렸다."],
"세계의 오류":["시간의 균열","주변 시간이 잠시 멈추고 세상이 뒤틀렸다."],
"용사의 운명":["성검의 부름","먼 곳에서 빛나는 검이 자신을 부르는 느낌이 들었다."]
};

function makeEvent(){
let e;
if(p.age<=12 && Math.random()<.6)e=pick(childhood);
else if(p.fate!=="평범한 운명" && Math.random()<.04){
const f=fateEvents[p.fate];
e=[f[0],f[1],"mystery","magic"];
}else e=pick(eventTypes);

const place=pick(places),person=pick(people),situation=pick(situations);
const [title,description,kind,ability]=e;

return {
title,
kind,
ability,
text:situation+", "+place+"에서 사건이 일어났다.\\n\\n"+
person+"와 관련된 소식이다. "+description+
"\\n\\n당신은 어떻게 행동할까?",
options:[
{label:"적극적으로 해결한다",type:"challenge"},
{label:"신중하게 조사한다",type:"investigate"},
{label:"금화를 사용해 해결한다",type:"pay"},
{label:"관여하지 않고 떠난다",type:"leave"}
]
};
}

function beginEvent(){
p.pending=makeEvent();
paused=true;
record("사건 발생: "+p.pending.title,"");
render();
}

function chance(base,ability){
const stat=p[ability]||0;
return clamp(base+Math.floor(stat/5),8,92);
}
function resolve(index){
if(!p||!p.pending||!p.alive)return;
const e=p.pending;
const option=e.options[index];
let success=false,description="",tone="";

if(option.type==="challenge"){
success=Math.random()*100<chance(43,e.ability);
if(success){
p.money+=random(20,110);
p.prestige+=random(3,10);
p[e.ability]=(p[e.ability]||0)+random(2,6);
description="위험을 무릅쓰고 문제를 해결했다. 보상과 명성을 얻었다.";
tone="good";
}else{
p.health-=random(5,19);
p.money=Math.max(0,p.money-random(5,45));
description="무리하게 행동하다 실패했다. 부상을 입거나 재산을 잃었다.";
tone="bad";
}
}
else if(option.type==="investigate"){
success=Math.random()*100<chance(65,"knowledge");
p.knowledge+=random(1,4);
if(success){
p.money+=random(10,65);
p.prestige+=3;
description="상황을 신중히 살펴 유리한 해결책을 찾아냈다.";
tone="good";
}else{
p.health-=random(0,7);
description="단서를 찾았지만 사건을 완전히 해결하지는 못했다.";
tone="bad";
}
}
else if(option.type==="pay"){
const cost=30;
if(p.money>=cost){
p.money-=cost;
p.prestige+=2;
description="금화 30개를 사용해 피해를 줄이거나 문제를 수습했다.";
tone="good";
}else{
description="금화가 부족해 원하는 방식으로 해결하지 못했다.";
tone="bad";
}
}
else{
if(e.kind==="bad"){
p.health=Math.min(100,p.health+2);
description="위험을 피하고 무사히 떠났다. 다른 이들이 사건을 해결했을지도 모른다.";
}else{
description="기회를 놓치고 평범한 일상으로 돌아갔다.";
}
}

if(e.kind==="bad" && tone==="good")
description="불행한 사건을 기회로 바꾸었다. "+description;
if(e.kind==="good" && tone==="bad")
description="좋은 기회였지만 예상치 못한 어려움을 겪었다. "+description;

record(e.title+" — "+option.label+": "+description,tone);
p.pending=null;
p.eventCount++;
paused=false;

if(p.health<=0)die("사건으로 인한 부상");
save();render();
}

function die(reason){
p.alive=false;
paused=true;
p.pending=null;
record(reason+"으로 생을 마감했다.","bad");
}

function advance(){
if(!p||paused||!p.alive)return;
p.month++;
if(p.month>=12){
p.month=0;p.age++;
p.skill+=Math.random()<.2?1:0;
p.knowledge+=Math.random()<.2?1:0;
if(p.age>50 && p.race==="인간")
p.health-=random(0,2);
record("한 해가 지나 "+p.age+"세가 되었다.","");
}
if(p.age>=p.lifespan){
die("노화");
}else if(p.health<=0){
die("건강 악화");
}else if(p.age>=1 && Math.random()<.13){
beginEvent();
}
save();render();
}

function togglePause(){
if(!p||!p.alive||p.pending)return;
paused=!paused;render();
}
function changeSpeed(){
speed=speed===1?2:speed===2?4:1;
render();
}
function restart(){
if(!confirm("현재 인생을 끝내고 새롭게 태어날까?"))return;
const oldName=p?.username||"";
localStorage.removeItem("fantasy-life-save-v1");
p=null;paused=false;
$("game").classList.add("hidden");
$("birth").classList.remove("hidden");
$("username").value=oldName;
reroll();
}
function save(){
if(p)localStorage.setItem("fantasy-life-save-v1",JSON.stringify(p));
}
function render(){
if(!p)return;
$("subtitle").textContent="플레이어: "+p.username;
$("identity").textContent=p.name+" · "+p.age+"세";
$("timeInfo").textContent=
"나이: "+p.age+"세 "+p.month+"개월 / "+
(p.alive?(p.pending?"사건 발생 — 시간 정지":paused?"일시정지":"시간 진행 중"):"사망");
const values=[
["종족",p.race],["신분",p.rank],
["건강",Math.max(0,p.health)],
["금화",p.money],["검술",p.skill],
["학문",p.knowledge],["마법",p.magic],
["명성",p.prestige]
];
$("stats").innerHTML=values.map(x=>
'<div class="stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>'
).join("");
$("status").textContent=p.alive?
"진행 속도: "+speed+"배 / 겪은 사건: "+p.eventCount+"회":
"이 인생은 끝났다. 새로운 인생을 시작할 수 있다.";
$("pauseBtn").disabled=!!p.pending||!p.alive;
$("pauseBtn").textContent=paused?"계속 진행":"일시정지";
$("event").classList.toggle("hidden",!p.pending);
if(p.pending){
$("eventTitle").textContent="⚡ "+p.pending.title;
$("eventText").textContent=p.pending.text;
$("choices").innerHTML="";
p.pending.options.forEach((o,i)=>{
const b=document.createElement("button");
b.className="choice";b.textContent=o.label;
b.onclick=()=>resolve(i);
$("choices").appendChild(b);
});
}
$("log").innerHTML="";
p.history.slice(0,100).forEach(e=>{
const div=document.createElement("div");
div.className="entry "+(e.tone||"");
div.textContent=e.age+"세 "+e.month+"개월 — "+e.message;
$("log").appendChild(div);
});
}

setInterval(()=>{
if(!p||paused||!p.alive)return;
ticks++;
if(ticks>=Math.max(1,4/speed)){
ticks=0;advance();
}
},450);

try{
const saved=JSON.parse(localStorage.getItem("fantasy-life-save-v1"));
if(saved&&saved.username){
p=saved;
paused=!!p.pending||!p.alive;
$("birth").classList.add("hidden");
$("game").classList.remove("hidden");
render();
}else reroll();
}catch(e){reroll();}
</script>
</body>
</html>`;

http.createServer((req,res)=>{
res.writeHead(200,{
"Content-Type":"text/html; charset=utf-8",
"Cache-Control":"no-cache"
});
res.end(html);
}).listen(PORT,"0.0.0.0",()=>{
console.log("판타지에서 살아가기 실행: "+PORT);
});
