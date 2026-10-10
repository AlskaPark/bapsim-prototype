// 밥심 v10 — 하나의 앱. 찍어 두면, 놓치면 안 될 때만 한 줄로.
(function(){
const E = window.BapsimEngine;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icons = () => window.lucide && lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch {} };
const IMG = k => `img/${k}.jpg`;
const qs = new URLSearchParams(location.search);

// 이름표: 사진 속에 있는 것 (모두 같은 형식, 범주 구분 없음)
const ITEMS = {
  coffee:{l:'커피',t:['coffee']}, beer:{l:'맥주',t:['alcohol']}, soju:{l:'소주',t:['alcohol']}, tylenol:{l:'타이레놀',t:['apap']},
  ssanghwa:{l:'쌍화탕',t:['licorice']}, grapefruit:{l:'자몽주스',t:['grapefruit']}, iron:{l:'철분제',t:['iron']}, energy:{l:'에너지 드링크',t:['coffee']},
  banana:{l:'바나나',t:['mg']}, tofu:{l:'두부',t:['mg']}, dosirak:{l:'도시락',t:[]}, onigiri:{l:'삼각김밥',t:[]}, protein:{l:'프로틴바',t:[]},
  pizza:{l:'피자',t:[]}, chicken:{l:'치킨',t:[]}, tteok:{l:'떡볶이',t:[]}, ramen:{l:'라면',t:[]}, salad:{l:'샐러드',t:[]}, cola:{l:'콜라',t:[]},
};
const TRAY = ['coffee','beer','soju','tylenol','ssanghwa','grapefruit','iron','energy','banana'];
const MEDS = ['혈압약','고지혈증약','타이레놀·감기약','아스피린','와파린','철분제','항생제'];
const CONDS = [['hypertension','고혈압'],['diabetes','당뇨'],['kidney','신장 질환'],['pregnant','임신·수유']];

// ---- 날짜 ----
const base = qs.get('today') ? new Date(qs.get('today') + 'T12:00:00') : new Date();
const dk = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0,10); };
const add = (d, n) => new Date(d.getTime() + n * 864e5);
const gap = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const WD = ['일','월','화','수','목','금','토'];
const dayName = (d, t) => { const n = gap(d, t); if (n === 0) return '오늘'; if (n === 1) return '어제'; if (n === 2) return '그저께'; const x = new Date(d + 'T12:00:00'); return `${x.getMonth()+1}월 ${x.getDate()}일 ${WD[x.getDay()]}요일`; };

// ---- 저장 (localStorage + IndexedDB) ----
const KEY = 'bapsim-v10';
const blank = () => ({ intro:false, setup:false, profile:{ meds:[], other:'', conds:[] }, entries:[], dismissed:[], sample:false, view:0 });
let S = JSON.parse(localStorage.getItem(KEY) || 'null') || blank();
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const today = () => dk(add(base, S.view));
const visible = () => S.entries.filter(e => e.day <= today());
const DB = new Promise(res => { try { const r = indexedDB.open('bapsim-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch { res(null); } });
const URLS = {};
const put = async (id, b) => { const db = await DB; if (!db) return; await new Promise(r => { const t = db.transaction('p','readwrite'); t.objectStore('p').put(b, id); t.oncomplete = r; t.onerror = r; }); };
const get = async id => { const db = await DB; if (!db) return null; return new Promise(r => { const q = db.transaction('p').objectStore('p').get(id); q.onsuccess = () => r(q.result); q.onerror = () => r(null); }); };
const del = async id => { const db = await DB; if (db) db.transaction('p','readwrite').objectStore('p').delete(id); };
const src = e => e.pid ? (URLS[e.pid] || '') : e.k ? IMG(e.k) : '';
async function loadUrls(){ for (const e of S.entries) if (e.pid && !URLS[e.pid]) { const b = await get(e.pid); if (b) URLS[e.pid] = URL.createObjectURL(b); } }
async function shrink(f){ try { const bm = await createImageBitmap(f); const k = Math.min(1, 1080 / Math.max(bm.width, bm.height)); const c = document.createElement('canvas'); c.width = bm.width * k; c.height = bm.height * k; c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height); return await new Promise(r => c.toBlob(r, 'image/jpeg', .85)); } catch { return f; } }
const now = () => new Date().toTimeString().slice(0,5);
const memoTags = text => { const c = E.classify(text), t = [...c.tags]; [[/타이레놀|아세트아미노펜|감기약/,'apap'],[/쌍화탕/,'licorice'],[/술|맥주|소주|와인|막걸리/,'alcohol'],[/커피|아메리카노|라떼/,'coffee'],[/자몽/,'grapefruit'],[/철분/,'iron'],[/두부|바나나|아몬드/,'mg']].forEach(([r,x]) => { if (r.test(text) && !t.includes(x)) t.push(x); }); return t; };

// ---- 프로필 → 엔진 ----
const profile = () => ({ conditions: S.profile.conds, meds: [...S.profile.meds, S.profile.other].join(' ').replace('타이레놀·감기약','타이레놀 감기약'), allergies: [] });
const hasMed = re => re.test([...S.profile.meds, S.profile.other].join(' '));

// ---- 샘플 일주일 ----
const SAMPLE = { meds:['혈압약'], log:[
  [6,'coffee','08:40'],[6,'dosirak','12:30'],[6,'energy','16:10'],
  [5,'coffee','08:50'],[5,'banana','15:20'],[5,'n','다리에 쥐 났음'],
  [4,'coffee','09:00'],[4,'onigiri','13:10'],[4,'energy','17:00'],
  [3,'tylenol','09:10'],[3,'pizza','20:10'],[3,'beer','21:00'],
  [2,'coffee','08:45'],[2,'protein','15:00'],[2,'tteok','19:30'],
  [1,'chicken','20:40'],[1,'soju','22:10'],[1,'n','팀 회식'],
  [0,'coffee','08:45'],[0,'n','감기 기운'],[0,'ssanghwa','13:20'] ] };
function loadSample(){ S.entries = S.entries.filter(e => !e.sample).concat(SAMPLE.log.map(([d,k,t], i) => k === 'n'
  ? { id:'s'+i, sample:true, day: dk(add(base,-d)), kind:'memo', text:t, tags: memoTags(t) }
  : { id:'s'+i, sample:true, day: dk(add(base,-d)), kind:'photo', k, text: ITEMS[k].l, time:t, tags: ITEMS[k].t }));
  S.profile = { meds:[...SAMPLE.meds], other:'', conds:[] }; S.sample = true; S.dismissed = []; S.view = 0; save(); }
const clearSample = () => { S.entries = S.entries.filter(e => !e.sample); S.sample = false; save(); };

// ---- 한 줄 규칙: 기록 + 내 약/몸에서 연결된 것만. 하루 하나. 닫으면 그날 끝 ----
function pick(){
  const t = today(), y = dk(add(new Date(t + 'T12:00:00'), -1)), es = visible();
  if (S.dismissed.some(d => d.slice(d.indexOf('-') + 1) === t)) return null;
  const on = (d, tag) => es.filter(e => e.day === d && (e.tags||[]).includes(tag));
  const wk = tag => es.filter(e => gap(e.day, t) <= 7 && (e.tags||[]).includes(tag));
  const htn = S.profile.conds.includes('hypertension') || hasMed(/혈압/);
  const lipid = hasMed(/고지혈|스타틴/);
  const C = [];
  const apap = on(t,'apap'), alc = on(t,'alcohol');
  if (apap.length && alc.length) C.push({ id:'apap', src:[...apap.slice(-1), ...alc.slice(-1)], pair:`${apap.at(-1).text} + ${alc.at(-1).text}`,
    msg:`${apap.at(-1).text} 먹은 날 ${alc.at(-1).text}예요. 같이 들어가면 간에 부담이 될 수 있어서, 오늘 술은 여기까지가 좋아요.`,
    title:'타이레놀 먹은 날의 술', why:'타이레놀(아세트아미노펜)과 술은 둘 다 간에서 처리돼요. 같은 날 겹치면 간이 평소보다 힘들 수 있다고 알려져 있어요. 감기약·두통약 중에도 같은 성분이 든 게 많아요.',
    alts:[['물이나 꿀물','오늘 남은 저녁은 이쪽이 편해요'],['따뜻한 국물','속을 편하게 하는 데 조금이라도 도움이 될 수 있어요']] });
  const lic = [...on(t,'licorice'), ...on(y,'licorice')];
  if (lic.length && htn) C.push({ id:'lic', src:lic.slice(-1), pair:`${lic.at(-1).text} + 혈압약`,
    msg:'쌍화탕엔 감초가 들어 있어요. 혈압약을 드시는 동안은 맞지 않을 수 있어서, 생강차나 대추차가 나아요.',
    title:'쌍화탕과 혈압약', why:'감초 성분(글리시리진)은 몸에 나트륨과 물을 붙잡아 두는 쪽으로 작용할 수 있어요. 그래서 혈압약을 먹는 동안에는 감초가 든 차·탕을 피하라고 안내하는 경우가 많아요.', q:'감기 기운 있어요' });
  const gf = [...on(t,'grapefruit'), ...on(y,'grapefruit')];
  if (gf.length && (htn || lipid)) C.push({ id:'gf', src:gf.slice(-1), pair:`자몽주스 + ${lipid ? '고지혈증약' : '혈압약'}`,
    msg:`자몽은 일부 ${lipid ? '고지혈증약' : '혈압약'}의 효과를 세게 만들 수 있어요. 약을 드시는 동안엔 다른 과일 주스가 나아요.`,
    title:'자몽과 내 약', why:'자몽은 장에서 약을 분해하는 효소를 막아서, 일부 약(특정 스타틴·칼슘 통로 차단제 등)이 몸에 더 많이 남게 할 수 있어요. 내 약이 해당되는지는 약 봉투나 약사에게 확인하면 정확해요.',
    alts:[['오렌지·사과 주스','이 상호작용과는 거리가 멀어요'],['물이나 탄산수','가장 무난해요']] });
  const iron = [...on(t,'iron')], cof = on(t,'coffee');
  if ((iron.length || hasMed(/철분/)) && cof.length && iron.length) C.push({ id:'iron', src:[...iron.slice(-1), ...cof.slice(-1)], pair:'철분제 + 커피',
    msg:'철분제 먹은 날 커피도 있었어요. 둘 사이에 시간 차를 두면 철분이 조금 더 잘 흡수될 수 있어요.',
    title:'철분제와 커피', why:'커피·녹차의 탄닌 성분은 철분과 붙어서 흡수를 줄일 수 있어요. 커피는 그대로 드시고, 시간만 떨어뜨려도 충분해요.',
    alts:[['오렌지 같은 과일과 함께','비타민 C가 철분 흡수에 조금이라도 도움이 될 수 있어요']] });
  const ya = on(y,'alcohol');
  if (ya.length && !alc.length) C.push({ id:'water', src:ya.slice(-1), pair:`어젯밤 ${ya.at(-1).text}`,
    msg:`어젯밤 ${ya.at(-1).text} 기록이 있어요. 오늘 오전엔 물을 평소보다 몇 잔 더 마시면 조금 편할 수 있어요.`,
    title:'술 마신 다음 날', why:'술은 소변을 늘려 몸의 수분을 빼앗아요. 다음 날 물을 조금 더 마시면 그만큼 채우는 데 도움이 될 수 있어요.', q:'어제 술 마셨는데 숙취해소제 추천' });
  const cramp = es.filter(e => e.kind === 'memo' && /쥐/.test(e.text) && gap(e.day, t) >= 1 && gap(e.day, t) <= 2), cw = wk('coffee'), mg = wk('mg');
  if (cramp.length && cw.length >= 3 && mg.length) { const f = mg.at(-1).text;
    C.push({ id:'mg', src:[cramp[0], mg.at(-1), cw.at(-1)], pair:'다리에 쥐 + 커피 잦은 주',
      msg:`커피 잦은 주에 다리에 쥐가 났다고 적으셨어요. 이미 드시는 ${f}${/[가-힣]/.test(f) && (f.charCodeAt(f.length-1)-0xAC00)%28 ? '을' : '를'} 매일 하나씩 곁들이면 조금이라도 도움이 될 수 있어요.`,
      title:'다리에 쥐가 난 주', why:'카페인은 마그네슘·칼륨이 소변으로 빠지는 걸 조금 늘릴 수 있어요. 커피는 그대로 두고, 이미 드시는 것 중 마그네슘·칼륨이 든 걸 조금 더하는 정도면 충분해요.', q:'다리에 쥐가 자주 나요' }); }
  const kind = d => d.slice(0, d.indexOf('-')), dday = d => d.slice(d.indexOf('-') + 1);
  return C.find(c => !S.dismissed.some(d => kind(d) === c.id && gap(dday(d), t) >= 0 && gap(dday(d), t) <= 3)) || null;
}

// ---- 화면 ----
function why(t){ return ` data-why="${esc(t)}"`; }
function thumbs(list){ return `<span class="n-thumbs">${list.map(e => src(e) ? `<img src="${src(e)}" alt="">` : `<span class="m"><i data-lucide="pen-line"></i></span>`).join('')}</span>`; }
function render(){
  const app = $('#app'), t = today(), n = pick();
  const head = `<header class="hd"><div class="brand"${why('로고 아래 한 줄이 앱이 하는 일을 매번 상기시켜요. 다시 열었을 때 뭐 하는 앱인지 잊지 않게.')}><span class="mark"><i></i></span><div><h1>밥심</h1><p>찍어 두면, 놓치면 안 될 때만 알려 드려요</p></div></div>
    <button class="icon-btn" id="gear" aria-label="설정"${why('약이 바뀌면 안내도 바뀌어야 해서 수정할 곳이 필요해요. 그 외 설정은 두지 않았어요.')}><i data-lucide="settings-2"></i></button></header>`;
  const top = n ? `<article class="note" id="note"${why('하루에 최대 하나. 기록과 내 약에서 연결된 것만. 질문이 아니라서 답할 필요가 없어요.')}>
      <div class="n-src"${why('왜 지금 이 말을 하는지 근거가 바로 보여야 무작위 건강 상식처럼 느껴지지 않아요.')}>${thumbs(n.src)}<span class="n-pair">${esc(dayName(t,t))} · ${esc(n.pair)}</span></div>
      <p class="n-msg">${esc(n.msg)}</p>
      <div class="n-foot"><button class="n-more" id="more"${why('자세한 이유와 대안은 원할 때만. 카드가 길어지지 않게 탭 뒤로 숨겼어요.')}>이유와 대안 보기<i data-lucide="chevron-right"></i></button><span class="n-exp"${why('스스로 사라진다는 걸 알려서, 쌓일까 봐 부담 갖지 않게 해요.')}>오늘까지</span></div>
      <button class="x" id="nx" aria-label="닫기"${why('무시할 권리. 닫으면 그날은 더 이상 아무것도 뜨지 않고, 같은 종류는 3일 동안 조용해요.')}><i data-lucide="x"></i></button></article>`
    : `<div class="quiet"${why('조용한 날에도 앱이 고장 난 게 아니라 일부러 조용하다는 걸 알려 줘요.')}><span class="q-ic"><i data-lucide="moon"></i></span><div><b>오늘은 챙길 게 없어요</b><span>계속 찍어 두세요. 필요할 때만 알려 드릴게요.</span></div></div>`;
  const days = {}; visible().forEach(e => (days[e.day] = days[e.day] || []).push(e));
  const keys = Object.keys(days).sort().reverse();
  if (!keys.includes(t)) keys.unshift(t);
  const tl = keys.map((d, i) => { const es = (days[d] || []).slice().reverse(), ph = es.filter(e => e.kind === 'photo'), me = es.filter(e => e.kind === 'memo');
    return `<section class="day"${i===0?why('날짜별 기록. 저장됐다는 믿음과, 한 줄의 근거를 확인하는 곳이에요. 숫자나 분석은 없어요.'):''}><h3>${esc(dayName(d,t))}</h3>
      ${ph.length ? `<div class="grid">${ph.map(e => `<button class="tile${e.id===lastNew?' new':''}" data-id="${e.id}" aria-label="${esc(e.text||'사진')}"><img src="${src(e)}" alt="" loading="lazy">${e.k?`<span class="lb">${esc(e.text)}</span>`:''}</button>`).join('')}</div>` : (me.length ? '' : `<div class="empty">아직 찍은 게 없어요</div>`)}
      ${me.length ? `<div class="memos">${me.map(e => `<span class="memo"><i data-lucide="pen-line"></i>${esc(e.text)}</span>`).join('')}</div>` : ''}</section>`; }).join('');
  app.innerHTML = `<div class="wrap">${head}<div class="today">${top}</div>${tl}</div>
    <nav class="dock"><div class="dock-in">
      <button class="side" id="pen" aria-label="한 줄 적기"${why('쥐가 남, 감기 기운처럼 찍을 수 없는 몸 상태를 남기는 곳. 이게 없으면 몸 상태와 연결된 순간을 놓쳐요.')}><i data-lucide="pen-line"></i></button>
      <button class="shutter" id="shot" aria-label="찍어 두기"${why('유일한 주 동작. 엄지가 닿는 하단 중앙에 가장 크게. 기본 카메라를 바로 열어요.')}><i><i data-lucide="camera"></i></i></button>
      <button class="side" id="album" aria-label="앨범에서 가져오기"${why('이미 기본 카메라로 음식 사진을 찍는 사람이 많아서, 앨범에서 여러 장을 한 번에 가져올 수 있게 했어요.')}><i data-lucide="images"></i></button>
    </div></nav>`;
  icons(); lastNew = null;
  $('#gear').onclick = settings; $('#shot').onclick = () => capture(false); $('#album').onclick = () => capture(true); $('#pen').onclick = composer;
  $$('.tile').forEach(b => b.onclick = () => photoView(b.dataset.id));
  if (n) { $('#more').onclick = () => detail(n); $('#nx').onclick = () => { buzz(); $('#note').classList.add('out'); setTimeout(() => { S.dismissed.push(n.id + '-' + t); save(); render(); }, 260); }; }
  notesRefresh();
}
let lastNew = null;

// ---- 찍기 ----
function capture(multi){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (multi) inp.multiple = true; else inp.capture = 'environment';
  inp.style.display = 'none'; document.body.appendChild(inp);
  inp.onchange = async () => { const fs = [...inp.files]; inp.remove(); if (!fs.length) return; let e;
    for (const f of fs) { const pid = 'p' + Date.now() + Math.random().toString(36).slice(2,6), b = await shrink(f); await put(pid, b); URLS[pid] = URL.createObjectURL(b);
      e = { id:'e' + Date.now() + Math.random().toString(36).slice(2,5), day: today(), kind:'photo', pid, text:'', time: now(), tags:[] }; S.entries.push(e); }
    save(); buzz(); lastNew = e.id; closeTray(); render(); if (fs.length === 1) tray(e); };
  inp.click();
}
let trayT;
function closeTray(){ clearTimeout(trayT); const t = $('.tray'); if (t) { t.classList.add('out'); setTimeout(() => t.remove(), 220); } }
function tray(e){
  const d = document.createElement('div'); d.className = 'tray';
  d.setAttribute('data-why', '서버 분석이 없는 동안, 사진이 무엇인지 알 수 있는 유일한 방법이에요. 한 번 탭이면 끝나고, 안 눌러도 8초 뒤 스스로 닫혀요.');
  d.innerHTML = `<div class="tray-h"><img src="${src(e)}" alt=""><p>사진 속에 있는 걸 누르면, 겹치는 조합을 챙길 수 있어요</p><button class="x" aria-label="닫기"><i data-lucide="x"></i></button></div>
    <div class="tray-c">${TRAY.map(k => `<button class="tag" data-k="${k}"><img src="${IMG(k)}" alt="">${ITEMS[k].l}</button>`).join('')}</div><div class="tray-bar"><i></i></div>`;
  document.body.appendChild(d); icons();
  trayT = setTimeout(closeTray, 8000);
  $('.x', d).onclick = closeTray;
  $$('.tag', d).forEach(b => b.onclick = () => { clearTimeout(trayT); b.classList.add('on'); buzz(); setLabel(e.id, b.dataset.k); setTimeout(() => { closeTray(); render(); }, 220); });
  notesRefresh();
}
function setLabel(id, k){ const e = S.entries.find(x => x.id === id); if (!e) return; e.k = k; e.text = ITEMS[k].l; e.tags = ITEMS[k].t; save(); }

// ---- 시트 ----
function sheet(html, cls = ''){ const bg = document.createElement('div'); bg.className = 'sh-bg'; bg.innerHTML = `<div class="sh ${cls}"><div class="grab"></div><button class="x" aria-label="닫기"><i data-lucide="x"></i></button>${html}</div>`;
  const close = () => { bg.classList.add('out'); setTimeout(() => bg.remove(), 220); };
  bg.onclick = ev => { if (ev.target === bg || ev.target.closest('.sh > .x')) close(); }; document.body.appendChild(bg); icons(); bg.close = close; return bg; }

function detail(n){
  let items = (n.alts || []).map(([a,b]) => ({ name:a, text:b }));
  let cmp = '';
  if (n.q) { const r = E.answer(n.q, profile(), { recentEntries: [] });
    for (const g of r.groups || []) for (const i of g.items) { if (i.note) continue; items.push({ name:i.name, text: g.kind === 'food' ? i.effect : i.claim, v: i.variants }); }
    items = items.slice(0, 4); }
  const body = items.map(i => `<div class="it"><b>${esc(i.name)}</b><span>${esc(i.text)}</span>${i.v ? variants(i.v) : ''}</div>`).join('');
  sheet(`<div class="s-eyebrow">${esc(n.pair)}</div><h2 class="s-title">${esc(n.title)}</h2>
    <div class="s-sec"${why('근거 없는 경고는 믿지 않아요. 왜 그런지 한 단락으로만.')}><h4>이유</h4><p>${esc(n.why)}</p></div>
    ${body ? `<div class="s-sec"${why('경고로 끝내지 않고, 지금 할 수 있는 작은 대안. 음식·차·제품 모두 같은 형식이고 범주 표시가 없어요.')}><h4>대신 이렇게</h4>${body}</div>` : ''}
    <p class="disc">진단이나 처방이 아닌 일반 정보예요. 문구는 예시이며 약사 검수 전이에요. 약에 대해서는 약사·의사의 안내를 따라 주세요.</p>`);
  notesRefresh();
}
function variants(v){ return `<details><summary>제품으로 고른다면</summary><div><span class="demo-l">예시 데이터 · 가상의 제품</span></div>
  <table class="cmp"><tr><th></th>${v.items.map(p => `<th>${esc(p.name)}</th>`).join('')}</tr>${v.axis.map((ax,k) => `<tr><th>${esc(ax)}</th>${v.items.map(p => `<td>${esc(p.vals[k])}</td>`).join('')}</tr>`).join('')}
  <tr><th>좋은 점</th>${v.items.map(p => `<td>${esc(p.pro||'-')}</td>`).join('')}</tr><tr><th>아쉬운 점</th>${v.items.map(p => `<td>${esc(p.con||'-')}</td>`).join('')}</tr></table>
  ${v.items.map(p => `<div class="ver">${esc(p.name)} · ${esc(p.badge)}</div>`).join('')}</details>`; }

function photoView(id){
  const e = S.entries.find(x => x.id === id); if (!e) return;
  const bg = sheet(`<div class="pv"><img src="${src(e)}" alt=""><div class="meta">${esc(dayName(e.day, today()))}${e.time ? ' · ' + esc(e.time) : ''}</div>
    <h4 style="font-size:13px;color:var(--sub);margin:16px 0 0">이름표</h4><div class="tags">${TRAY.map(k => `<button class="tag${e.k===k?' on':''}" data-k="${k}"><img src="${IMG(k)}" alt="">${ITEMS[k].l}</button>`).join('')}</div>
    <button class="danger" id="del">이 기록 지우기</button></div>`);
  $$('.tag', bg).forEach(b => b.onclick = () => { $$('.tag', bg).forEach(x => x.classList.remove('on')); b.classList.add('on'); buzz(); setLabel(id, b.dataset.k); render(); });
  $('#del', bg).onclick = () => { S.entries = S.entries.filter(x => x.id !== id); if (e.pid) del(e.pid); save(); bg.close(); render(); };
}

function composer(){
  const bg = sheet(`<div class="comp"><div class="s-eyebrow">한 줄 적기</div><h2 class="s-title">찍을 수 없는 몸 상태를 남겨 두세요</h2>
    <textarea id="mt" rows="2" placeholder="예: 다리에 쥐 남"></textarea>
    <div class="ex">${['감기 기운','다리에 쥐 남','속이 더부룩함','잠을 설침'].map(x => `<button>${x}</button>`).join('')}</div>
    <button class="primary" id="ms" disabled>적어 두기</button></div>`);
  const ta = $('#mt', bg), go = $('#ms', bg); setTimeout(() => ta.focus(), 340);
  ta.oninput = () => go.disabled = !ta.value.trim();
  $$('.ex button', bg).forEach(b => b.onclick = () => { ta.value = b.textContent; go.disabled = false; });
  go.onclick = () => { const text = ta.value.trim(); if (!text) return; S.entries.push({ id:'m' + Date.now(), day: today(), kind:'memo', text, tags: memoTags(text) }); save(); buzz(); bg.close(); render(); };
}

function settings(){
  const p = S.profile, sum = [...p.meds, p.other, ...p.conds.map(c => (CONDS.find(x => x[0]===c)||[])[1])].filter(Boolean).join(', ') || '비어 있어요';
  const bg = sheet(`<h2 class="s-title" style="margin-top:8px">설정</h2>
    <button class="row" id="r-p"><span>먹는 약과 몸 상태<small>${esc(sum)}</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-s"><span>${S.sample ? '샘플 기록 끄기' : '샘플 기록으로 둘러보기'}<small>일주일치 예시 기록이에요</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-i"><span>소개 다시 보기</span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-x" style="color:#C0362C"><span>모든 기록 지우기<small>이 휴대폰에서만 지워져요</small></span></button>`);
  $('#r-p', bg).onclick = () => { bg.close(); setup(true); };
  $('#r-s', bg).onclick = () => { S.sample ? clearSample() : loadSample(); bg.close(); render(); };
  $('#r-i', bg).onclick = () => { bg.close(); intro(true); };
  $('#r-x', bg).onclick = function(){ if (this.dataset.c) { S.entries.forEach(e => e.pid && del(e.pid)); S.entries = []; S.dismissed = []; S.sample = false; save(); bg.close(); render(); } else { this.dataset.c = 1; this.querySelector('span').firstChild.textContent = '한 번 더 누르면 지워져요'; } };
}

// ---- 소개 ----
function intro(again){
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'intro';
  const note = (pair, msg, srcs) => `<div class="mini"><div class="n-src"><span class="n-thumbs">${srcs.map(s => `<img src="${s}" alt="">`).join('')}</span><span class="n-pair">${pair}</span></div><p class="n-msg">${msg}</p></div>`;
  ov.innerHTML = `<div class="in-top"><button id="skip">건너뛰기</button></div><div class="slides" id="slides">
   <section class="slide"${why('추상적인 설명보다 실제 순간 하나가 3초 안에 이해돼요. 그래서 첫 장이 바로 예시예요.')}><div class="viz">
      <div class="ph" style="left:24px;top:8px;--r:-6deg;animation-delay:.1s"><img src="img/tylenol.jpg" alt=""><span class="lb">타이레놀</span></div>
      <div class="ph" style="right:24px;top:28px;--r:5deg;animation-delay:.3s"><img src="img/beer.jpg" alt=""><span class="lb">맥주</span></div>
      <div style="position:absolute;left:0;right:0;bottom:0;animation-delay:.9s" class="mini-w">${note('오늘 · 타이레놀 + 맥주','타이레놀 먹은 날 맥주예요. 같이 들어가면 간에 부담이 될 수 있어서, 오늘 술은 여기까지가 좋아요.',['img/tylenol.jpg','img/beer.jpg'])}</div></div>
      <h2>놓치면 안 될 때만,<br>한 줄로</h2><p>타이레놀 먹은 날 맥주를 찍으면, <b>간에 부담이 될 수 있다고</b> 바로 챙겨 드려요.</p></section>
   <section class="slide"${why('할 일은 찍는 것뿐이라는 걸 보여 줘요. 기록 앱처럼 입력 부담이 있다고 오해하지 않게.')}><div class="viz"><div class="g9">${['coffee','dosirak','energy','banana','pizza','beer','tylenol','tteok','soju'].map((k,i) => `<span style="animation-delay:${.05+i*.06}s"><img src="img/${k}.jpg" alt=""></span>`).join('')}<div class="lock"><i data-lucide="lock"></i>이 휴대폰에만 저장돼요</div></div></div>
      <h2>찍어 두기만<br>하세요</h2><p>밥, 커피, 술, 약까지 뭐든요. <b>분석도, 질문도 없이</b> 조용히 모아 둬요.</p></section>
   <section class="slide"${why('다음 화면에서 약을 묻는 이유를 미리 보여 줘요. 설정이 설문처럼 느껴지지 않게.')}><div class="viz">
      <span class="chipviz" style="left:20px;top:20px;animation-delay:.1s"><i data-lucide="pill"></i>혈압약</span>
      <div class="ph" style="right:28px;top:12px;--r:5deg;animation-delay:.35s"><img src="img/ssanghwa.jpg" alt=""><span class="lb">쌍화탕</span></div>
      <div style="position:absolute;left:0;right:0;bottom:0" class="mini-w">${note('오늘 · 쌍화탕 + 혈압약','쌍화탕엔 감초가 들어 있어요. 혈압약을 드시는 동안은 맞지 않을 수 있어서, 생강차나 대추차가 나아요.',['img/ssanghwa.jpg'])}</div></div>
      <h2>내 약과 몸에<br>맞춰서</h2><p>먹는 약을 알려 주시면, <b>그 약과 겹치는 순간</b>을 챙겨요.</p></section>
  </div><div class="in-bot"><div class="dots"><i class="on"></i><i></i><i></i></div><button class="primary" id="next">다음</button></div>`;
  document.body.appendChild(ov); icons();
  const sl = $('#slides', ov), slides = $$('.slide', ov), dots = $$('.dots i', ov);
  $$('.mini-w .mini', ov).forEach(m => m.style.animationDelay = '.9s');
  let idx = -1;
  const activate = i => { if (i === idx) return; idx = i; slides.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i));
    $('#next', ov).textContent = i === 2 ? '시작하기' : '다음'; $('#skip', ov).style.visibility = i === 2 ? 'hidden' : 'visible'; notesRefresh(); };
  activate(0);
  sl.addEventListener('scroll', () => activate(Math.round(sl.scrollLeft / sl.clientWidth)), { passive: true });
  const done = () => { S.intro = true; save(); ov.classList.add('out'); setTimeout(() => ov.remove(), 250); if (!S.setup && !again) setup(false); else notesRefresh(); };
  $('#next', ov).onclick = () => idx < 2 ? sl.scrollTo({ left: (idx + 1) * sl.clientWidth, behavior: 'smooth' }) : done();
  $('#skip', ov).onclick = done;
}

// ---- 내 약·몸 상태 ----
function setup(edit){
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'setup'; const p = S.profile;
  ov.innerHTML = `<div class="in-top">${edit ? '<button id="cancel">취소</button>' : ''}</div><div class="su">
    <h2>먹는 약과 몸 상태</h2><p>알려 주시면 그것과 겹치는 순간을 챙겨요. 비워 둬도 되고, 나중에 바꿀 수 있어요.</p>
    <h4>먹는 약</h4><div class="opts" data-g="m"${why('타이핑보다 탭이 빠르고 철자 오류가 없어요. 각 칩은 실제 상호작용 규칙과 연결돼 있어요.')}>${MEDS.map(m => `<button class="opt${p.meds.includes(m)?' on':''}" data-v="${m}"><i data-lucide="check"></i>${m}</button>`).join('')}</div>
    <input id="other" placeholder="그 밖의 약 (예: 메트포르민)" value="${esc(p.other)}">
    <h4>몸 상태</h4><div class="opts" data-g="c"${why('감초·자몽 같은 규칙은 몸 상태에 따라 달라져요. 알레르기는 본인이 이미 알고 사진으로는 잡을 수 없어서 뺐어요.')}>${CONDS.map(([k,l]) => `<button class="opt${p.conds.includes(k)?' on':''}" data-v="${k}"><i data-lucide="check"></i>${l}</button>`).join('')}</div>
  </div><div class="in-bot"><button class="primary" id="done"${why('아무것도 고르지 않으면 버튼이 \'나중에 할게요\'로 바뀌어, 비워 둬도 된다는 걸 직접 말해요.')}></button>${edit ? '' : `<button class="ghost" id="sample"${why('첫날엔 아무 일도 일어나지 않아요. 일주일을 기다리지 않고 체험할 수 있게.')}>샘플 기록으로 둘러보기</button>`}
    <div class="lockline"${why('약 정보는 민감해요. 어디에 저장되는지 바로 그 자리에서 말해요.')}><i data-lucide="lock"></i>이 휴대폰에만 저장돼요</div></div>`;
  document.body.appendChild(ov); icons();
  const sel = g => $$(`[data-g="${g}"] .on`, ov).map(b => b.dataset.v);
  const label = () => { const any = sel('m').length || sel('c').length || $('#other', ov).value.trim(); $('#done', ov).textContent = edit ? '저장' : any ? '완료' : '나중에 할게요'; };
  $$('.opt', ov).forEach(b => b.onclick = () => { b.classList.toggle('on'); buzz(); label(); });
  $('#other', ov).oninput = label; label();
  const close = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 250); };
  $('#done', ov).onclick = () => { S.profile = { meds: sel('m'), other: $('#other', ov).value.trim(), conds: sel('c') }; S.setup = true; save(); close(); render(); };
  if (edit) $('#cancel', ov).onclick = close;
  else $('#sample', ov).onclick = () => { loadSample(); S.setup = true; save(); close(); render(); };
  notesRefresh();
}

// ---- 디자인 노트 (?notes=1) ----
let notesOn = false;
function notesRefresh(){ if (!notesOn) return; requestAnimationFrame(() => { $$('.why-pin,.why-panel').forEach(x => x.remove());
  const top = $$('.ov').at(-1) || $$('.sh-bg').at(-1); const scope = top || document;
  const els = $$('[data-why]', scope).filter(el => { const r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight && r.left < innerWidth && r.right > 0; });
  const tr = $('.tray'); if (tr && !top) els.push(tr);
  if (!els.length) return;
  els.forEach((el, i) => { const r = el.getBoundingClientRect(), d = document.createElement('div'); d.className = 'why-pin'; d.textContent = i + 1;
    d.style.left = Math.min(innerWidth - 24, Math.max(4, r.right - 12)) + 'px'; d.style.top = (Math.max(4, r.top - 8) + scrollY) + 'px'; document.body.appendChild(d); });
  const pn = document.createElement('div'); pn.className = 'why-panel'; pn.innerHTML = `<h5>왜 이렇게?</h5><ol>${els.map(el => `<li>${esc(el.getAttribute('data-why'))}</li>`).join('')}</ol>`; document.body.appendChild(pn); }); }
function notesToggle(){ if (!qs.has('notes')) return; const t = document.createElement('button'); t.className = 'why-t off'; t.innerHTML = '<i data-lucide="info"></i>왜 이렇게?'; document.body.appendChild(t); icons();
  t.onclick = () => { notesOn = !notesOn; t.classList.toggle('off', !notesOn); document.body.classList.toggle('why-on', notesOn); if (notesOn) notesRefresh(); else $$('.why-pin,.why-panel').forEach(b => b.remove()); };
  addEventListener('scroll', () => notesOn && notesRefresh(), { passive: true }); addEventListener('resize', () => notesOn && notesRefresh());
  if (qs.get('notes') === 'on') t.click(); }

// ---- 데모 막대 (?demo=1) ----
function demoBar(){ if (!qs.has('demo')) return; document.body.classList.add('demo-on'); const b = document.createElement('div'); b.className = 'demo'; document.body.appendChild(b);
  const draw = () => { b.innerHTML = `<span class="l">데모</span><button data-d="-1" aria-label="전날"><i data-lucide="chevron-left"></i></button><b>${esc(dayName(today(), dk(base)))}</b><button data-d="1" aria-label="다음 날"><i data-lucide="chevron-right"></i></button><button class="s">${S.sample ? '샘플 끄기' : '샘플'}</button>`; icons();
    $$('[data-d]', b).forEach(x => x.onclick = () => { S.view = Math.max(-6, Math.min(0, S.view + +x.dataset.d)); save(); draw(); render(); });
    $('.s', b).onclick = () => { S.sample ? clearSample() : loadSample(); draw(); render(); }; };
  draw(); }

// ---- 시작 ----
(async () => { await loadUrls(); render(); notesToggle(); demoBar();
  if (!S.intro) intro(false); else if (!S.setup) setup(false);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); })();
window.__bapsim = { S, render };
})();
