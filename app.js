const groups=[
{id:"campus",n:"01",title:"대학생활",desc:"수업과 학사 정보를 빠르게 확인하세요.",links:[
["부경대학교 LMS","온라인 강의, 과제 제출, 출석 확인","https://lms.pknu.ac.kr/","학교"],
["부경대학교 포털","수강신청, 성적, 학사 서비스","https://portal.pknu.ac.kr/","학교"],
["부경대학교 홈페이지","학교 공지와 학사일정 확인","https://www.pknu.ac.kr/","학교"]]},
{id:"career",n:"02",title:"취업 · 커리어",desc:"채용 공고부터 취업 지원까지.",links:[
["고용24","채용정보, 취업지원, 직업훈련 찾기","https://www.work24.go.kr/","정부"],
["사람인","직무·지역별 채용 공고와 기업정보","https://www.saramin.co.kr/","채용"],
["잡코리아","채용 공고와 취업 준비 정보","https://www.jobkorea.co.kr/","채용"],
["부경대 대학일자리플러스센터","교내 취업 프로그램과 상담 확인","https://pknujob.pknu.ac.kr/","학교"]]},
{id:"support",n:"03",title:"복지 · 장학금",desc:"내게 필요한 지원을 놓치지 않도록.",links:[
["정부24","민원·증명서 발급과 보조금24 혜택 확인","https://www.gov.kr/","정부"],
["복지로","복지서비스 검색과 복지 신청 안내","https://www.bokjiro.go.kr/","정부"],
["드림스폰","다양한 교외 장학금과 지원사업 찾기","https://www.dreamspon.com/","장학"],
["한국장학재단","국가장학금과 학자금 지원 확인","https://www.kosaf.go.kr/","공공"]]},
{id:"english",n:"04",title:"영어 · 언어교환",desc:"작은 대화부터, 영어를 일상으로.",links:[
["HelloTalk","언어교환 파트너와 채팅·음성 대화, 문장 교정","https://www.hellotalk.com/","언어교환"],
["Tandem","언어와 관심사로 파트너 찾기, 채팅·음성·영상 대화","https://tandem.net/","언어교환"],
["British Council LearnEnglish","듣기·읽기·문법을 수준별로 공부하기","https://learnenglish.britishcouncil.org/","영어학습"]]}
];
const external='target="_blank" rel="noopener noreferrer"';
document.querySelector("#directory").innerHTML=groups.map(g=>`<section class="panel" id="${g.id}" aria-labelledby="${g.id}-title"><div class="panel-title"><h2 id="${g.id}-title">${g.title}</h2><span class="index">${g.n}</span></div><p class="section-desc">${g.desc}</p>${g.links.map(([name,desc,url,tag])=>`<a class="link-row" href="${url}" ${external}><div><strong>${name}</strong><p>${desc}</p></div><span class="tag">${tag}</span></a>`).join("")}${g.id==="english"?'<p class="note">앱의 무료·유료 기능은 공식 페이지에서 확인하세요. 첫 대화는 관심사와 배우고 싶은 언어로 시작해보세요.</p>':""}</section>`).join("");
const countries=[
["AU","호주","영어","https://whic.mofa.go.kr/whic/nation/info.jsp?boardNo=100002"],
["CA","캐나다","영어 · 프랑스어","https://whic.mofa.go.kr/whic/nation/info.jsp?boardNo=100013"],
["NZ","뉴질랜드","영어","https://whic.mofa.go.kr/whic/nation/info.jsp?boardNo=100003"],
["GB","영국","영어 · YMS","https://www.gov.uk/youth-mobility"],
["IE","아일랜드","영어","https://whic.mofa.go.kr/whic/nation/info.jsp?boardNo=100014"],
["FR","프랑스","프랑스어","https://whic.mofa.go.kr/whic/nation/info.jsp?boardNo=100011"]];
document.querySelector("#countries").innerHTML=countries.map(([code,name,language,url])=>`<a class="country" href="${url}" ${external}><span class="code">${code}</span><div><strong>${name}</strong><small>${language} · 공식 안내</small></div></a>`).join("");
const zones=[
["한국 · 서울","Asia/Seoul"],["호주 · 시드니","Australia/Sydney"],["호주 · 퍼스","Australia/Perth"],["캐나다 · 밴쿠버","America/Vancouver"],
["캐나다 · 토론토","America/Toronto"],["뉴질랜드 · 오클랜드","Pacific/Auckland"],["영국 · 런던","Europe/London"],["아일랜드 · 더블린","Europe/Dublin"],
["일본 · 도쿄","Asia/Tokyo"],["독일 · 베를린","Europe/Berlin"],["프랑스 · 파리","Europe/Paris"],["미국 · 뉴욕","America/New_York"]];
function offset(zone,now){const p=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now);const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return (Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute,+o.second)-Math.floor(now.getTime()/1000)*1000)/3600000;}
function updateClocks(){const now=new Date();document.querySelector("#clocks").innerHTML=zones.map(([city,zone],i)=>{const d=Math.round((offset(zone,now)-offset("Asia/Seoul",now))*100)/100;return `<div class="clock ${i===0?"home":""}"><div class="city">${city}</div><div class="time">${new Intl.DateTimeFormat("ko-KR",{timeZone:zone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now)}</div><div class="date">${new Intl.DateTimeFormat("ko-KR",{timeZone:zone,month:"long",day:"numeric",weekday:"short"}).format(now)}</div><div class="diff">${i===0?"한국 기준":d===0?"한국과 같은 시간":`한국보다 ${Math.abs(d)}시간 ${d>0?"빠름":"느림"}`}</div></div>`;}).join("");}
updateClocks();setInterval(updateClocks,30000);