
const http = require("node:http");

const PORT = process.env.PORT || 3000;

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>운명의 대륙</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#10151f;color:#f4e9d0;
font-family:system-ui,-apple-system,sans-serif}
main{max-width:750px;margin:35px auto;padding:20px}
h1{text-align:center;color:#eac47c;font-size:34px}
.subtitle{text-align:center;color:#a7acb7}
.panel{background:#1b2433;border:1px solid #4c4250;
border-radius:14px;padding:22px;margin-top:20px}
button{background:#b88b49;color:#151515;border:0;
padding:13px 18px;border-radius:9px;font-weight:bold;
cursor:pointer;margin:5px}
button:hover{background:#e2b46c}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.stat{background:#283347;padding:12px;border-radius:8px}
small{color:#aeb6c5}
#log{white-space:pre-line;line-height:1.8}
</style>
</head>
<body>
<main>
<h1>⚔ 운명의 대륙</h1>
<p class="subtitle">당신의 운명은 태어나는 순간 시작된다.</p>
<div class="panel" id="birth">
<h2>새로운 생명</h2>
<p id="birthInfo"></p>
<button onclick="reroll()">다시 태어나기</button>
<button onclick="start()">이 운명으로 시작</button>
</div>
<div class="panel" id="game" hidden>
<h2 id="identity"></h2>
<div class="stats" id="stats"></div>
<h3>인생의 선택</h3>
<button onclick="act('study')">학문 수련</button>
<button onclick="act('train')">검술 수련</button>
<button onclick="act('work')">돈 벌기</button>
<button onclick="act('explore')">모험하기</button>
<button onclick="nextYear()">1년 보내기</button>
<button onclick="restart()">새 인생</button>
<h3>인생 기록</h3>
<div id="log"></div>
</div>
</main>
<script>
const races=[
["인간",65],["엘프",12],["드워프",8],
["수인",6],["마족",4],["용인족",2.5],
["정령족",1.5],["천족",0.7],["고대종",0.3]
];
const classes=[
["농노",42],["평민",27],["상인",14],
["하급 귀족",10],["상급 귀족",5],["왕족",2]
];
const first=["김","이","박","최","정","레온","카일",
"아델","세리아","엘리시아","아르","벨","카르"];
const middle=["도","하","시","윤","라","엘","리",
"아","테","노","루","에","린","카","미"];
const last=["윤","준","현","린","아","온","엘",
"리스","리온","테르","시아","벨","드"];
const families=["발테리온","실바리스","아이언포지",
"아스텔","벨페리온","로젠하임","드라코니아"];
let player=null,birth=null;

function pick(list){
return list[Math.floor(Math.random()*list.length)];
}
function weighted(list){
let r=Math.random()*100;
for(const [name,chance] of list){
r-=chance;if(r<0)return name;
}
return list[list.length-1][0];
}
function name(){
return pick(first)+pick(middle)+pick(last)+
" "+pick(families);
}
function reroll(){
const fateRoll=Math.random()*100;
let fate="평범한 운명";
if(fateRoll<0.025)fate="전생자";
else if(fateRoll<0.045)fate="회귀자";
else if(fateRoll<0.060)fate="마왕의 환생";
else if(fateRoll<0.075)fate="용의 화신";
else if(fateRoll<0.090)fate="신의 사도";
else if(fateRoll<0.100)fate="세계의 오류";
birth={
name:name(),race:weighted(races),
rank:weighted(classes),fate
};
document.getElementById("birthInfo").innerHTML=
"이름: "+birth.name+"<br>종족: "+birth.race+
"<br>신분: "+birth.rank+"<br>운명: "+birth.fate;
}
function start(){
player={...birth,age:0,money:0,skill:0,
knowledge:0,prestige:0,history:["0세: 세상에 태어났다."]};
document.getElementById("birth").hidden=true;
document.getElementById("game").hidden=false;
save();render();
}
function act(type){
if(!player)return;
const actions={
study:["학문을 공부했다.", "knowledge",3],
train:["검술을 연마했다.", "skill",3],
work:["일해서 금화를 벌었다.", "money",25],
explore:["미지의 땅을 탐험했다.", "prestige",2]
};
const [message,key,amount]=actions[type];
player[key]+=amount;
player.history.unshift(player.age+"세: "+message);
save();render();
}
function nextYear(){
player.age++;
const events=[
"평화로운 한 해가 흘렀다.",
"마을에 떠돌이 상인이 찾아왔다.",
"먼 왕국에서 전쟁 소식이 들려왔다.",
"밤하늘에 붉은 별이 나타났다.",
"오래된 유적이 발견되었다."
];
player.history.unshift(player.age+"세: "+pick(events));
save();render();
}
function render(){
document.getElementById("identity").textContent=
player.name+" · "+player.age+"세";
const values=[
["종족",player.race],["신분",player.rank],
["운명",player.fate],["금화",player.money],
["검술",player.skill],["학문",player.knowledge],
["명성",player.prestige]
];
document.getElementById("stats").innerHTML=
values.map(([k,v])=>'<div class="stat"><small>'+
k+'</small><div>'+v+'</div></div>').join("");
document.getElementById("log").textContent=
player.history.slice(0,12).join("\\n");
}
function save(){
localStorage.setItem("destiny-save",JSON.stringify(player));
}
function restart(){
if(!confirm("현재 인생을 삭제하고 다시 시작할까요?"))return;
localStorage.removeItem("destiny-save");
location.reload();
}
try{
const saved=JSON.parse(localStorage.getItem("destiny-save"));
if(saved){player=saved;
document.getElementById("birth").hidden=true;
document.getElementById("game").hidden=false;render();}
else reroll();
}catch(e){reroll();}
</script>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });
  res.end(html);
}).listen(PORT, "0.0.0.0", () => {
  console.log("Game running on port " + PORT);
});
