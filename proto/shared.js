// 밥심 4가지 UI 실험 공용 모듈: 같은 엔진(../engine.js), 같은 데모 기록, 같은 넛지 규칙
(function(){
const E = window.BapsimEngine;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SNAPS = {
  coffee:{e:'',l:'커피',tags:['coffee']}, energy:{e:'',l:'에너지 드링크',tags:['coffee']}, dosirak:{e:'',l:'편의점 도시락',tags:[]}, onigiri:{e:'',l:'삼각김밥',tags:[]},
  protein:{e:'',l:'프로틴바',tags:[]}, banana:{e:'',l:'바나나',tags:['mg']}, pizza:{e:'',l:'배달 피자',tags:[]}, chicken:{e:'',l:'치킨',tags:[]}, tteok:{e:'',l:'떡볶이',tags:[]},
  cola:{e:'',l:'콜라',tags:[]}, beer:{e:'',l:'맥주',tags:['alcohol']}, soju:{e:'',l:'소주',tags:['alcohol']}, tylenol:{e:'',l:'타이레놀',tags:['apap']},
  ramen:{e:'',l:'라면',tags:[]}, salad:{e:'',l:'샐러드',tags:[]}, tofu:{e:'',l:'두부',tags:['mg']}, ssanghwa:{e:'',l:'쌍화탕',tags:['licorice']},
};
// 데모 페르소나: 혈압약 복용 직장인, 7일치 기록. day = 오늘로부터 며칠 전
const PERSONA = { name:'지우 (20대 후반 · 직장인)', profile:{ conditions:[], meds:'' },
  log:[
    [6,'coffee','08:40'],[6,'dosirak','12:30'],[6,'energy','16:10'],
    [5,'coffee','08:50'],[5,'banana','15:20'],[5,'note','다리에 쥐 났음'],
    [4,'coffee','09:00'],[4,'onigiri','13:10'],[4,'energy','17:00'],
    [3,'tylenol','09:10'],[3,'pizza','20:10'],[3,'beer','21:00'],
    [2,'coffee','08:45'],[2,'protein','15:00'],[2,'tteok','19:30'],
    [1,'chicken','20:40'],[1,'soju','22:10'],[1,'note','팀 회식'],
    [0,'coffee','08:45'] ] };
const qs = new URLSearchParams(location.search);
const baseToday = qs.get('today') ? new Date(qs.get('today') + 'T09:00:00') : new Date();
const dk = d => d.toISOString().slice(0,10);
const addDays = (d,n) => new Date(d.getTime() + n*864e5);
const between = (a,b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const dayLabel = (d, today) => { const n = between(d, today); return n<=0?'오늘':n===1?'어제':n===2?'그저께':n+'일 전'; };

function Store(variant){
  const KEY = 'bapsim-proto-' + variant;
  let s = JSON.parse(localStorage.getItem(KEY) || 'null');
  const seed = () => ({ profile: PERSONA.profile, view: 0, dismissed: [], entries: PERSONA.log.map(([d,k,t]) => k==='note'
      ? { day: dk(addDays(baseToday,-d)), kind:'note', text:t, tags:E.classify(t).tags }
      : { day: dk(addDays(baseToday,-d)), kind:'photo', snap:k, text:SNAPS[k].l, time:t, tags:SNAPS[k].tags }) });
  const blank = () => ({ profile: {}, view: 0, dismissed: [], entries: [], onboarded: false, sample: false });
  if (!s) s = blank();
  const api = {
    get s(){ return s; }, save(){ localStorage.setItem(KEY, JSON.stringify(s)); },
    reset(){ const p = s.profile, o = s.onboarded; s = blank(); s.profile = p; s.onboarded = o; api.save(); },
    loadSample(){ const d = seed(); s.entries = d.entries.map(e => ({ ...e, sample: true })).concat(s.entries.filter(e => !e.sample)); s.profile = { ...PERSONA.profile }; s.sample = true; s.onboarded = true; s.view = 0; s.dismissed = []; api.save(); },
    clearSample(){ s.entries = s.entries.filter(e => !e.sample); s.sample = false; api.save(); },
    addPhoto(pid){ const e = { id: 'e' + Date.now(), day: api.today(), kind:'photo', pid, text:'사진', time:new Date().toTimeString().slice(0,5), tags:[] }; s.entries.push(e); api.save(); return e; },
    label(id, k){ const e = s.entries.find(x => x.id === id); if (!e) return; e.snap = k; e.text = SNAPS[k].l; e.tags = SNAPS[k].tags; api.save(); }, clear(){ s = { profile: PERSONA.profile, view:0, dismissed:[], entries:[] }; api.save(); },
    today(){ return dk(addDays(baseToday, s.view)); },           // 데모: 날짜 넘겨 보기 (-3 ~ 0)
    visible(){ const t = api.today(); return s.entries.filter(e => e.day <= t); },
    snap(k){ s.entries.push({ day: api.today(), kind:'photo', snap:k, text:SNAPS[k].l, time:new Date().toTimeString().slice(0,5), tags:SNAPS[k].tags }); api.save(); },
    memo(text){ const c = E.classify(text), tags = [...c.tags]; [[/타이레놀|아세트아미노펜|감기약/,'apap'],[/쌍화탕/,'licorice'],[/술|맥주|소주|와인|막걸리/,'alcohol'],[/커피|아메리카노|라떼/,'coffee'],[/두부|바나나|아몬드/,'mg']].forEach(([r,t]) => { if (r.test(text) && !tags.includes(t)) tags.push(t); }); s.entries.push({ day: api.today(), kind: c.need?'need':'note', text, tags }); api.save(); return c.need; },
    dismiss(id){ s.dismissed.push(id); api.save(); },
    memory(){ const t = api.today(); return { recentEntries: api.visible().filter(e => between(e.day,t) <= 7).map(e => ({ ...e, dayDiff: between(e.day,t) })) }; },
  };
  api.save(); return api;
}

// 넛지: 기록에서 연결된 것만, 한 번에 하나, 그날만 (다음 날 저절로 사라짐). 질문 없음.
function nudge(st){
  const t = st.today(), es = st.visible(), on = (d, tag) => es.filter(e => e.day === d && (e.tags||[]).includes(tag));
  const y = dk(addDays(new Date(t+'T09:00:00'), -1)), P = st.s.profile, htn = (P.conditions||[]).includes('hypertension');
  const tr = a => a.map(e => ({ day: dayLabel(e.day,t), snap: e.snap, src: src(e), text: e.text }));
  const week = tag => es.filter(e => between(e.day,t) <= 7 && (e.tags||[]).includes(tag));
  const cands = [];
  const apap = on(t,'apap'), alc = [...on(t,'alcohol')];
  if (apap.length && alc.length) cands.push({ id:'apap-'+t, kind:'catch', text:'오늘 타이레놀 드시고 맥주도 찍으셨어요. 같은 날 겹치면 아세트아미노펜이 간에 부담이 될 수 있어요. 오늘 술은 여기까지만요.', trace:tr([...apap,...alc]), tap:{ label:'자세히', q:'감기약 먹고 술 마셨어요' } });
  const lic = [...on(t,'licorice'), ...on(y,'licorice')];
  if (lic.length && htn) cands.push({ id:'lic-'+t, kind:'catch', text:'쌍화탕엔 감초가 들어 있어요. 혈압약 드시는 동안은 감초 없는 생강차·대추차가 나아요.', trace:tr(lic), tap:{ label:'감초 없는 대안 보기', q:'감기 기운 있어요' } });
  const ya = on(y,'alcohol');
  if (ya.length && !alc.length) cands.push({ id:'water-'+t, kind:'care', text:`어젯밤 ${ya[0].text} 기록이 있었죠. 오늘 오전엔 물을 평소보다 몇 잔 더 드시면 조금이라도 편해질 수 있어요.`, trace:tr(ya), tap:{ label:'숙취해소제 비교 보기', q:'어제 술 마셨는데 숙취해소제 추천' } });
  const cramp = es.filter(e => e.kind==='note' && /쥐/.test(e.text) && between(e.day,t) >= 1 && between(e.day,t) <= 2);
  const cof = week('coffee'), mg = week('mg');
  if (cramp.length && cof.length >= 3 && mg.length) { const foods = [...new Set(mg.map(e => e.text))].join('·');
    cands.push({ id:'mg-'+t, kind:'care', text:`커피·에너지 드링크가 잦은 주에 쥐가 났다고 하셨죠. 마시던 건 그대로, 이미 드시는 ${foods} 하나만 매일 곁들이면 마그네슘에 조금이라도 도움이 될 수 있어요.`, trace:tr([...cramp, ...mg, ...cof.slice(-2)]), tap:{ label:'자세히', q:'다리에 쥐가 자주 나요' } }); }
  const kind = id => id.slice(0, id.indexOf('-')), dday = id => id.slice(id.indexOf('-') + 1);
  const recentlyDismissed = c => st.s.dismissed.some(d => kind(d) === kind(c.id) && between(dday(d), t) >= 0 && between(dday(d), t) <= 3);
  return cands.find(c => !recentlyDismissed(c)) || null;
}

const IMG = k => `../img/${k}.jpg`;
function traceHTML(items){ if(!items||!items.length) return ''; return `<div class="trace">${items.slice(0,4).map(i => (i.src || i.snap) ? `<span class="tchip"><img src="${i.src || IMG(i.snap)}" alt="">${esc(i.day)} ${esc(i.text)}</span>` : `<span class="tchip memo"><i data-lucide="pen-line"></i>${esc(i.day)} ${esc(i.text)}</span>`).join('')}</div>`; }
function traceText(items){ return (items||[]).map(i => `${i.day} ${i.text}`).join(' · '); }
function icons(){ if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } }); }
const SB_ICONS = `<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>
<svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.5c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .8 10.2 10.2 0 0 0 .9 3.7L2 4.9a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.1-1.2A7 7 0 0 0 8 4.2a7 7 0 0 0-4.7 1.9l1.1 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.3c.6 0 1.1.2 1.5.6L8 11.5 6.5 9.8c.4-.4.9-.6 1.5-.6Z" fill="currentColor"/></svg>
<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4" fill="none"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity=".45"/></svg>`;
function statusBar(dark){ return `<div class="sbar ${dark?'dark':''}"><span class="t">9:41</span><span class="island"></span><span class="r">${SB_ICONS}</span></div>`; }
function nudgeHTML(n, o={}){ return `<div class="nudge ${o.cls||''}" id="${o.id||'nc'}"><div class="eyebrow"><span class="dot"></span>${o.label||'밥심'}${o.time?` · ${o.time}`:''}</div><div class="msg">${esc(n.text)}</div>${traceHTML(n.trace)}${o.tap===false?'':`<button class="tap">${esc(n.tap.label)}<i data-lucide="chevron-right"></i></button>`}<button class="x" aria-label="닫기"><i data-lucide="x"></i></button></div>`; }
function bindNudge(root, n, st, rerender){ const el = root.querySelector('.nudge'); if(!el) return; icons();
  el.querySelector('.x').onclick = e => { e.stopPropagation(); el.classList.add('out'); setTimeout(() => { st.dismiss(n.id); rerender(); }, 260); };
  const open = () => openSheet(detailHTML(n.tap.q, st)); const t = el.querySelector('.tap'); if (t) t.onclick = e => { e.stopPropagation(); open(); }; return open; }
// ---- 기기 저장 (IndexedDB) ----
const DB = new Promise((res, rej) => { const r = indexedDB.open('bapsim-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const URLS = {};
async function idbPut(id, blob){ const db = await DB; return new Promise((res, rej) => { const t = db.transaction('p','readwrite'); t.objectStore('p').put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function idbGet(id){ const db = await DB; return new Promise(res => { const q = db.transaction('p').objectStore('p').get(id); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); }
async function ready(st){ for (const e of st.s.entries) if (e.pid && !URLS[e.pid]) { const b = await idbGet(e.pid); if (b) URLS[e.pid] = URL.createObjectURL(b); } }
const src = e => e.pid ? (URLS[e.pid] || '') : e.snap ? IMG(e.snap) : '';
async function shrink(file){ try { const bmp = await createImageBitmap(file); const k = Math.min(1, 1080 / Math.max(bmp.width, bmp.height)); const c = document.createElement('canvas'); c.width = bmp.width * k; c.height = bmp.height * k; c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return await new Promise(r => c.toBlob(r, 'image/jpeg', .85)); } catch { return file; } }
// 실제 카메라/앨범: <input capture>. 찍으면 저장만 하고, 선택 라벨 칩은 막지 않고 잠깐 떠 있다 사라짐
function capture(st, onDone, opts={}){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (opts.multiple) inp.multiple = true; else inp.capture = 'environment';
  inp.style.display = 'none'; document.body.appendChild(inp);
  inp.onchange = async () => { const files = [...inp.files]; inp.remove(); if (!files.length) return; let last;
    for (const f of files) { const pid = 'p' + Date.now() + Math.random().toString(36).slice(2,6); const b = await shrink(f); await idbPut(pid, b); URLS[pid] = URL.createObjectURL(b); last = st.addPhoto(pid); }
    toast(files.length > 1 ? '사진을 저장했어요' : '저장했어요'); onDone && onDone(); if (files.length === 1) labelChips(st, last, onDone); };
  inp.click(); return inp;
}
async function saveBlob(st, blob, onDone){ const pid = 'p' + Date.now() + Math.random().toString(36).slice(2,6); await idbPut(pid, blob); URLS[pid] = URL.createObjectURL(blob); const e = st.addPhoto(pid); toast('저장했어요'); onDone && onDone(); labelChips(st, e, onDone); }
const CHIP_KEYS = ['coffee','energy','beer','soju','tylenol','dosirak','pizza','banana','ssanghwa'];
function labelChips(st, e, onDone){
  document.querySelectorAll('.chips').forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'chips';
  d.innerHTML = `<span class="cl">원하면 한 번 눌러 두세요</span><div class="cr">${CHIP_KEYS.map(k => `<button data-k="${k}">${SNAPS[k].l}</button>`).join('')}</div>`;
  document.body.appendChild(d); const kill = () => { d.classList.add('out'); setTimeout(() => d.remove(), 250); }; const t = setTimeout(kill, 6000);
  d.querySelectorAll('button').forEach(b => b.onclick = () => { clearTimeout(t); st.label(e.id, b.dataset.k); kill(); onDone && onDone(); });
}
// 한 번만: 안전 정보 (질문은 여기서만)
function onboard(st, onDone){
  if (st.s.onboarded) return false;
  const C = [['hypertension','고혈압'],['diabetes','당뇨'],['kidney','신장 질환'],['pregnant','임신·수유'],['anticoag','항응고제 복용']];
  const bg = document.createElement('div'); bg.className = 'ob';
  bg.innerHTML = `<div class="obc"><div class="ob-ic"><i data-lucide="sparkles"></i></div><h2>밥심</h2><p>먹고 마신 걸 찍어 두기만 하세요.<br>필요한 순간에만 한 줄로 알려 드려요.</p>
  <div class="ob-l">맞지 않는 걸 걸러 드릴게요 (선택)</div><div class="ob-c">${C.map(([k,l]) => `<button data-c="${k}">${l}</button>`).join('')}</div>
  <input id="ob-meds" placeholder="드시는 약 (예: 혈압약, 타이레놀)"><input id="ob-al" placeholder="알레르기 (예: 새우, 땅콩)">
  <button class="ob-go" id="ob-go">시작하기</button><button class="ob-s" id="ob-s">샘플 기록으로 둘러보기</button><p class="ob-f">이 기기 안에만 저장돼요. 서버로 보내지 않아요.</p></div>`;
  document.body.appendChild(bg); icons();
  bg.querySelectorAll('[data-c]').forEach(b => b.onclick = () => b.classList.toggle('on'));
  const done = () => { bg.classList.add('out'); setTimeout(() => bg.remove(), 250); onDone && onDone(); };
  bg.querySelector('#ob-go').onclick = () => { const conds = [...bg.querySelectorAll('[data-c].on')].map(b => b.dataset.c); const meds = bg.querySelector('#ob-meds').value.trim() + (conds.includes('anticoag') ? ' 항응고제' : '');
    st.s.profile = { conditions: conds.filter(c => c !== 'anticoag'), meds: meds.trim(), allergies: bg.querySelector('#ob-al').value.split(/[,\s]+/).filter(Boolean) }; st.s.onboarded = true; st.save(); done(); };
  bg.querySelector('#ob-s').onclick = () => { st.loadSample(); done(); };
  return true;
}
// 탭 뒤 상세 (엔진 답변 + 제품 비교(예시) + 상담 목업)
function detailHTML(q, st){
  const r = E.answer(q, st.s.profile, st.memory());
  if (r.type === 'stop') return `<div class="d-stop">${esc(r.title)} ${esc(r.text)}</div>`;
  let h = `<div class="d-eyebrow">밥심이 찾아본 것</div><p class="d-say">${esc((r.lines||[]).join(' '))}</p>`;
  for (const g of r.groups) for (const i of g.items) {
    h += `<div class="d-it"><b>${esc(i.name)}</b><div>${esc(g.kind==='food'?i.effect:i.claim)}</div>${i.note?`<div class="d-note">${esc(i.note)}</div>`:''}`;
    if (i.variants) { const v = i.variants; h += `<details><summary>제품으로 고른다면</summary>${r.enough&&g.kind==='food'?'<div class="d-note">집에서 만들어 드셔도 충분해요. 굳이 사지 않아도 돼요.</div>':''}<div class="d-demo">예시 데이터 · 가상의 제품·가격</div>
      <table class="d-cmp"><tr><th></th>${v.items.map(p=>`<th>${esc(p.name)}</th>`).join('')}</tr>${v.axis.map((ax,k)=>`<tr><th>${esc(ax)}</th>${v.items.map(p=>`<td>${esc(p.vals[k])}</td>`).join('')}</tr>`).join('')}
      <tr><th>좋은 점</th>${v.items.map(p=>`<td>${esc(p.pro||'-')}</td>`).join('')}</tr><tr><th>아쉬운 점</th>${v.items.map(p=>`<td>${esc(p.con||'-')}</td>`).join('')}</tr></table>
      ${v.items.map(p=>`<div class="d-badge"><i data-lucide="badge-check"></i>${esc(p.name)} · ${esc(p.badge)} · ${esc(String(p.price).replace('예시가','가격(예시)'))}</div>`).join('')}</details>`; }
    h += `</div>`;
  }
  if (r.excluded.length) h += `<div class="d-it d-ex"><b>피하는 게 좋아요</b>${r.excluded.map(e=>`<div>• ${esc(e.name)} — ${esc(e.reason)}</div>`).join('')}</div>`;
  h += `<button class="d-consult" onclick="this.outerHTML='<div class=d-note>상담 요청 목업이에요. 실제로는 전송되지 않아요.</div>'">약사·영양사 상담 요청 (목업)</button>
    <p class="d-disc">진단·처방이 아닌 일반 정보예요. 상호작용 문구는 예시이며 약사 검수 전이에요.</p>`;
  return h;
}
const SHEET_CSS = '';
function openSheet(html){ const bg = document.createElement('div'); bg.className='sh-bg'; bg.innerHTML=`<div class="sh"><div class="grab"></div><button class="x" aria-label="닫기"><i data-lucide="x"></i></button>${html}</div>`; bg.onclick=e=>{ if(e.target===bg||e.target.closest('.x')) { bg.classList.add('out'); setTimeout(()=>bg.remove(),220); } }; document.body.appendChild(bg); icons(); return bg; }
function toast(t){ const d=document.createElement('div'); d.className='tst'; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),1400); }
function demoBar(st, rerender){ if(!qs.has('demo')) return; const b=document.createElement('div'); b.className='demo'; document.body.appendChild(b);
  const draw=()=>{ b.innerHTML=`<span class="lbl">데모</span><button data-d="-1" aria-label="전날"><i data-lucide="chevron-left"></i></button><b id="dl">${st.s.view===0?'오늘':(-st.s.view)+'일 전'}</b><button data-d="1" aria-label="다음 날"><i data-lucide="chevron-right"></i></button><button data-s>${st.s.sample?'샘플 끄기':'샘플'}</button><a href="../compare/">비교</a>`; icons();
    b.querySelectorAll('[data-d]').forEach(x=>x.onclick=()=>{ st.s.view=Math.max(-4,Math.min(0,st.s.view+ +x.dataset.d)); st.save(); draw(); rerender(); });
    b.querySelector('[data-s]').onclick=()=>{ st.s.sample ? st.clearSample() : st.loadSample(); draw(); rerender(); }; };
  draw(); }
const st0 = document.createElement('style'); st0.textContent = SHEET_CSS; document.head.appendChild(st0);
window.Bapsim = { E, esc, SNAPS, PERSONA, Store, nudge, detailHTML, openSheet, toast, demoBar, dayLabel, between, IMG, src, ready, capture, saveBlob, labelChips, onboard, traceHTML, traceText, icons, statusBar, nudgeHTML, bindNudge };
})();
