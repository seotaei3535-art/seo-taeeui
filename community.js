import {firebaseConfig, adminUid} from './firebase-config.js';
const $ = s => document.querySelector(s);
const status = text => { $('#community-status').textContent = text; };
const el = (tag, text, cls) => { const n=document.createElement(tag); if(text)n.textContent=text; if(cls)n.className=cls; return n; };
let auth, sdk, admin=false, compressed=null, previewUrl, fileVersion=0;
const configured=Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && adminUid);
const caches=new Map();
async function request(path, {method='GET', body, query={}, fresh=false}={}) {
  const url=new URL(firebaseConfig.databaseURL.replace(/\/$/,'')+'/'+path+'.json');
  for(const [k,v] of Object.entries(query))url.searchParams.set(k,JSON.stringify(v));
  const cacheKey=url.href;
  if(method==='GET'&&!fresh&&caches.has(cacheKey)&&Date.now()-caches.get(cacheKey).time<300000)return caches.get(cacheKey).data;
  if(method!=='GET') {
    if(!auth?.currentUser)throw Error('먼저 로그인해주세요.');
    url.searchParams.set('auth',await auth.currentUser.getIdToken());
  }
  const response=await fetch(url,{method,body:body===undefined?undefined:JSON.stringify(body),headers:body===undefined?{}:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(response.status===401||response.status===403?'권한이 없거나 보안 규칙에 맞지 않습니다. 관리자 설정 또는 질문 등록 간격을 확인해주세요.':'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
  const data=await response.json();
  if(method==='GET') { if(caches.size>50)caches.delete(caches.keys().next().value); caches.set(cacheKey,{time:Date.now(),data}); }
  else caches.clear();
  return data;
}
async function busy(button,fn) { button.disabled=true; try {await fn();}catch(e){status(e.message||'연결을 확인해주세요.');}finally{button.disabled=false;} }
let initPromise;
async function initAuth(){
  if(!configured)throw Error('Firebase 연결 설정이 필요합니다. 동봉된 설치안내를 확인해주세요.');
  if(!initPromise)initPromise=(async()=>{
    const [{initializeApp},authSdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js')]);
    sdk=authSdk; auth=sdk.getAuth(initializeApp(firebaseConfig));
    await sdk.setPersistence(auth,sdk.browserSessionPersistence);
    await auth.authStateReady();
    sdk.onAuthStateChanged(auth,user=>{
      admin=Boolean(user&&user.uid===adminUid);
      $('#upload-form').hidden=!admin; $('#login-form').hidden=admin; $('#logout-button').hidden=!admin;
      $('#auth-state').textContent=admin?'관리자로 로그인했습니다.': '관리자 로그인 후 사진 업로드와 답변을 할 수 있습니다.';
      renderQuestions(); renderPhotos();
    });
  })().catch(e=>{initPromise=null;throw e;});
  return initPromise;
}
const pages={photos:{items:[],cursor:null},questions:{items:[],cursor:null}};
async function loadPage(type, reset=false) {
  if(!configured) {status('사진·Q&A는 Firebase 설정 후 사용할 수 있습니다. 기존 바로가기는 그대로 이용할 수 있습니다.');return;}
  const p=pages[type];
  const query={orderBy:'$key',limitToLast:7};
  if(!reset&&p.cursor)query.endAt=p.cursor;
  const data=await request(type,{query,fresh:reset});
  let rows=Object.entries(data||{}).sort(([a],[b])=>b.localeCompare(a));
  const more=rows.length>6;const nextCursor=more?rows[6][0]:null;rows=rows.slice(0,6);
  p.items=reset?rows:[...p.items,...rows];
  // Keep the seventh (not yet displayed) record as the inclusive next-page cursor.
  p.cursor=nextCursor;
  $(type==='photos'?'#photo-more':'#qna-more').hidden=!more;
  type==='photos'?renderPhotos():renderQuestions();
}
const imageObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){imageObserver.unobserve(entry.target);loadImage(entry.target);}
},{rootMargin:'150px'});
async function loadImage(image) {
  try{const data=await request('photoData/'+image.dataset.id);if(!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(data||''))throw Error('사진 데이터 오류');image.src=data;image.alt=image.dataset.caption;}
  catch{const retry=el('button','사진 다시 불러오기');retry.type='button';retry.onclick=()=>{retry.remove();loadImage(image);};image.after(retry);image.alt='사진을 불러오지 못했습니다.';}
}
function renderPhotos(){
  imageObserver.disconnect();const list=$('#photo-list');list.replaceChildren();
  if(!pages.photos.items.length)list.append(el('p',configured?'아직 등록된 사진이 없습니다.':'사진을 준비하고 있어요.','empty'));
  for(const [id,p] of pages.photos.items){const card=el('figure',null,'photo-card');const img=el('img');img.width=p.width;img.height=p.height;img.alt='사진 불러오는 중';img.dataset.id=id;img.dataset.caption=p.caption;card.append(img,el('figcaption',p.caption));
    if(admin){const remove=el('button','사진 삭제');remove.type='button';remove.onclick=()=>{if(confirm('이 사진을 삭제할까요?'))busy(remove,async()=>{await request('',{method:'PATCH',body:{['photos/'+id]:null,['photoData/'+id]:null}});await loadPage('photos',true);status('사진을 삭제했습니다.');});};card.append(remove);}
    list.append(card);imageObserver.observe(img);
  }
}
function renderQuestions(){const list=$('#qna-list');list.replaceChildren();if(!pages.questions.items.length)list.append(el('p',configured?'첫 질문을 남겨주세요.':'질문함을 준비하고 있어요.','empty'));
  for(const [id,q] of pages.questions.items){const card=el('article',null,'question');card.append(el('small',q.name+' · '+new Date(q.createdAt).toLocaleDateString('ko-KR')),el('p',q.question));
    if(q.answer){const a=el('div',null,'answer');a.append(el('strong','모아의 답변'),el('p',q.answer));card.append(a);}else card.append(el('small','답변을 기다리고 있어요.'));
    if(admin){const f=el('form',null,'editor');const label=el('label','답변 작성');const input=el('textarea');input.maxLength=2000;input.required=true;input.rows=3;input.value=q.answer||'';label.append(input);const save=el('button','답변 저장');save.type='submit';f.append(label,save);f.onsubmit=e=>{e.preventDefault();busy(save,async()=>{if(!input.value.trim())throw Error('답변을 입력해주세요.');await request('questions/'+id,{method:'PATCH',body:{answer:input.value.trim()}});q.answer=input.value.trim();renderQuestions();status('답변을 저장했습니다.');});};const del=el('button','질문 삭제');del.type='button';del.onclick=()=>{if(confirm('질문과 답변을 삭제할까요?'))busy(del,async()=>{await request('questions/'+id,{method:'DELETE'});await loadPage('questions',true);status('질문을 삭제했습니다.');});};card.append(f,del);}
    list.append(card);
  }
}
export async function compressPhoto(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP 사진을 선택해주세요.');
  if(file.size>20*1024*1024)throw Error('원본은 20MB 이하로 선택해주세요.');
  const bitmap=await createImageBitmap(file);try{
    if(bitmap.width*bitmap.height>40000000)throw Error('사진이 너무 큽니다. 먼저 크기를 줄여주세요.');
    let scale=Math.min(1,960/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    for(let attempt=0;attempt<8;attempt++){
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',Math.max(.35,.72-attempt*.06)));
      if(!blob||blob.type!=='image/webp')throw Error('이 브라우저는 WebP 압축을 지원하지 않습니다. 최신 브라우저를 이용해주세요.');
      if(blob.size<=80*1024)return {blob,width:canvas.width,height:canvas.height};scale*=.8;
    }throw Error('80KB 이하로 압축하지 못했습니다. 다른 사진을 선택해주세요.');
  }finally{bitmap.close();}
}
$('#photo-file').onchange=async e=>{
  const version=++fileVersion;compressed=null;$('#upload-button').disabled=true;$('#photo-preview').hidden=true;if(previewUrl)URL.revokeObjectURL(previewUrl);
  const file=e.target.files[0];if(!file)return;
  try{const result=await compressPhoto(file);if(version!==fileVersion)return;compressed=result;previewUrl=URL.createObjectURL(result.blob);$('#photo-preview').src=previewUrl;$('#photo-preview').hidden=false;
    $('#compression-info').textContent=`${(file.size/1024).toFixed(1)}KB → ${(result.blob.size/1024).toFixed(1)}KB · ${result.width}×${result.height}px · DB 저장 약 ${Math.ceil(result.blob.size/3)*4/1024|0}KB (Base64 포함)`;$('#upload-button').disabled=false;
  }catch(e){if(version===fileVersion)status(e.message);}
};
const makeId=()=>String(Date.now()).padStart(13,'0')+'_'+crypto.randomUUID().replaceAll('-','');
$('#upload-form').onsubmit=e=>{e.preventDefault();busy($('#upload-button'),async()=>{
  if(!admin||!compressed)throw Error('관리자 로그인과 사진 선택이 필요합니다.');const caption=$('#photo-caption').value.trim();if(!caption)throw Error('사진 설명을 입력해주세요.');
  const photo=compressed;const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('사진 읽기 실패'));r.readAsDataURL(photo.blob);});const id=makeId();
  await request('',{method:'PATCH',body:{['photos/'+id]:{caption,width:photo.width,height:photo.height,bytes:photo.blob.size,createdAt:{'.sv':'timestamp'}},['photoData/'+id]:data}});
  $('#upload-form').reset();compressed=null;++fileVersion;$('#photo-preview').hidden=true;if(previewUrl)URL.revokeObjectURL(previewUrl);await loadPage('photos',true);status('압축 사진을 업로드했습니다.');
}).finally(()=>{$('#upload-button').disabled=!compressed;});};
$('#question-form').onsubmit=e=>{e.preventDefault();busy(e.submitter,async()=>{
  const name=$('#question-name').value.trim(), question=$('#question-text').value.trim();if(!name||!question)throw Error('별명과 질문을 입력해주세요.');
  await initAuth();if(!auth.currentUser)await sdk.signInAnonymously(auth);const id=makeId(),uid=auth.currentUser.uid;
  await request('',{method:'PATCH',body:{['questions/'+id]:{name,question,uid,createdAt:{'.sv':'timestamp'}},['limits/'+uid]:{at:{'.sv':'timestamp'},questionId:id}}});
  $('#question-text').value='';await loadPage('questions',true);status('질문을 등록했습니다. 답변은 질문함에서 확인해주세요.');
});};
$('#login-form').onsubmit=e=>{e.preventDefault();busy(e.submitter,async()=>{await initAuth();await sdk.signInWithEmailAndPassword(auth,$('#admin-email').value.trim(),$('#admin-password').value);$('#admin-password').value='';if(auth.currentUser.uid!==adminUid){await sdk.signOut(auth);throw Error('지정된 관리자 계정이 아닙니다.');}status('관리자로 로그인했습니다.');});};
$('#logout-button').onclick=e=>busy(e.target,async()=>{await sdk.signOut(auth);status('로그아웃했습니다.');});
for(const [type,prefix] of [['photos','photo'],['questions','qna']]){
  $('#'+prefix+'-refresh').onclick=e=>busy(e.target,()=>loadPage(type,true));
  $('#'+prefix+'-more').onclick=e=>busy(e.target,()=>loadPage(type));
}
// No polling or realtime subscriptions. Fetch each section only when near the viewport.
const sectionObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){sectionObserver.unobserve(e.target);const type=e.target.id==='photos'?'photos':'questions';loadPage(type).catch(e=>status(e.message));}},{rootMargin:'100px'});
sectionObserver.observe($('#photos'));sectionObserver.observe($('#qna'));
renderPhotos();renderQuestions();if(configured)initAuth().catch(()=>status('로그인 기능을 불러오지 못했습니다. 연결과 Firebase 설정을 확인해주세요.'));else status('Firebase 설정 전입니다. 설치안내에 따라 연결하면 사진과 Q&A를 사용할 수 있습니다.');


