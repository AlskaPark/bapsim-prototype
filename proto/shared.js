// 밥심 4가지 UI 실험 공용 모듈: 같은 엔진(../engine.js), 같은 데모 기록, 같은 넛지 규칙
(function(){
const E = window.BapsimEngine;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SNAPS = {
  coffee:{e:'☕',l:'커피',tags:['coffee']}, jjigae:{e:'🍲',l:'김치찌개',tags:[]}, tofu:{e:'🥘',l:'두부조림',tags:['mg']}, banana:{e:'🍌',l:'바나나',tags:['mg']},
  bibim:{e:'🍚',l:'비빔밥',tags:[]}, ssanghwa:{e:'🫙',l:'쌍화탕',tags:['licorice']}, tylenol:{e:'💊',l:'타이레놀',tags:['apap']},
  beer:{e:'🍺',l:'맥주',tags:['alcohol']}, soju:{e:'🍶',l:'소주',tags:['alcohol']}, samgyeop:{e:'🥓',l:'삼겹살',tags:[]}, ramen:{e:'🍜',l:'라면',tags:[]},
  salad:{e:'🥗',l:'샐러드',tags:[]}, snack:{e:'🍪',l:'과자',tags:[]}, kimbap:{e:'🍙',l:'김밥',tags:[]},
};
// 데모 페르소나: 혈압약 복용 직장인, 7일치 기록. day = 오늘로부터 며칠 전
const PERSONA = { name:'민수 (40대 · 혈압약 복용)', profile:{ conditions:['hypertension'], meds:'혈압약' },
  log:[
    [6,'coffee','08:40'],[6,'jjigae','12:30'],[6,'coffee','15:10'],
    [5,'coffee','08:50'],[5,'tofu','19:20'],[5,'note','다리에 쥐 났음'],
    [4,'coffee','09:00'],[4,'banana','16:00'],[4,'note','감기 기운'],
    [3,'ssanghwa','20:30'],[3,'kimbap','12:40'],
    [2,'tylenol','09:10'],[2,'beer','21:00'],[2,'samgyeop','20:40'],
    [1,'soju','22:10'],[1,'note','팀 회식'],
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
  if (!s) s = seed();
  const api = {
    get s(){ return s; }, save(){ localStorage.setItem(KEY, JSON.stringify(s)); },
    reset(){ s = seed(); api.save(); }, clear(){ s = { profile: PERSONA.profile, view:0, dismissed:[], entries:[] }; api.save(); },
    today(){ return dk(addDays(baseToday, s.view)); },           // 데모: 날짜 넘겨 보기 (-3 ~ 0)
    visible(){ const t = api.today(); return s.entries.filter(e => e.day <= t); },
    snap(k){ s.entries.push({ day: api.today(), kind:'photo', snap:k, text:SNAPS[k].l, time:new Date().toTimeString().slice(0,5), tags:SNAPS[k].tags }); api.save(); },
    memo(text){ const c = E.classify(text); s.entries.push({ day: api.today(), kind: c.need?'need':'note', text, tags:c.tags }); api.save(); return c.need; },
    dismiss(id){ s.dismissed.push(id); api.save(); },
    memory(){ const t = api.today(); return { recentEntries: api.visible().filter(e => between(e.day,t) <= 7).map(e => ({ ...e, dayDiff: between(e.day,t) })) }; },
  };
  api.save(); return api;
}

// 넛지: 기록에서 연결된 것만, 한 번에 하나, 그날만 (다음 날 저절로 사라짐). 질문 없음.
function nudge(st){
  const t = st.today(), es = st.visible(), on = (d, tag) => es.filter(e => e.day === d && (e.tags||[]).includes(tag));
  const y = dk(addDays(new Date(t+'T09:00:00'), -1)), P = st.s.profile, htn = (P.conditions||[]).includes('hypertension');
  const tr = a => a.map(e => `${dayLabel(e.day,t)} ${e.snap?SNAPS[e.snap].e:'📝'}${e.text}`).join(' · ');
  const week = tag => es.filter(e => between(e.day,t) <= 7 && (e.tags||[]).includes(tag));
  const cands = [];
  const apap = on(t,'apap'), alc = [...on(t,'alcohol')];
  if (apap.length && alc.length) cands.push({ id:'apap-'+t, kind:'catch', text:'타이레놀 드신 날 맥주도 있었어요. 같은 날 겹치면 아세트아미노펜이 간에 부담이 될 수 있어요. 오늘은 술을 쉬어 주세요.', trace:tr([...apap,...alc]), tap:{ label:'자세히', q:'감기약 먹고 술 마셨어요' } });
  const lic = [...on(t,'licorice'), ...on(y,'licorice')];
  if (lic.length && htn) cands.push({ id:'lic-'+t, kind:'catch', text:'쌍화탕엔 감초가 들어 있어요. 혈압약 드시는 동안은 감초 없는 생강차·대추차가 나아요.', trace:tr(lic), tap:{ label:'감초 없는 대안 보기', q:'감기 기운 있어요' } });
  const ya = on(y,'alcohol');
  if (ya.length && !alc.length) cands.push({ id:'water-'+t, kind:'care', text:`어젯밤 ${ya[0].text} 기록이 있었죠. 오늘 오전엔 물을 평소보다 몇 잔 더 드시면 조금이라도 편해질 수 있어요.`, trace:tr(ya), tap:{ label:'숙취해소제 비교 보기', q:'어제 술 마셨는데 숙취해소제 추천' } });
  const cramp = es.filter(e => e.kind==='note' && /쥐/.test(e.text) && between(e.day,t) >= 1 && between(e.day,t) <= 2);
  const cof = week('coffee'), mg = week('mg');
  if (cramp.length && cof.length >= 3 && mg.length) { const foods = [...new Set(mg.map(e => e.text))].join('·');
    cands.push({ id:'mg-'+t, kind:'care', text:`커피를 자주 드시는데 쥐가 났다고 하셨죠. 커피는 그대로 두시고, 이미 드시는 ${foods}를 하루 한 번 곁들이면 마그네슘에 조금이라도 도움이 될 수 있어요.`, trace:tr([...cramp, ...mg, ...cof.slice(-2)]), tap:{ label:'자세히', q:'다리에 쥐가 자주 나요' } }); }
  return cands.find(c => !st.s.dismissed.includes(c.id)) || null;
}

// 탭 뒤 상세 (엔진 답변 + 제품 비교(예시) + 상담 목업)
function detailHTML(q, st){
  const r = E.answer(q, st.s.profile, st.memory());
  if (r.type === 'stop') return `<div class="d-stop">🚑 ${esc(r.title)} ${esc(r.text)}</div>`;
  let h = `<p class="d-say">${esc((r.lines||[]).join(' '))}</p>`;
  for (const g of r.groups) for (const i of g.items) {
    h += `<div class="d-it"><b>${esc(i.name)}</b> <span class="d-k">${/일반식품/.test(i.claim||'')?'식품':g.kind==='supp'?'건강기능식품':g.kind==='otc'?'일반의약품':'음식·차'}</span><div>${esc(g.kind==='food'?i.effect:i.claim)}</div>${i.note?`<div class="d-note">⚠️ ${esc(i.note)}</div>`:''}`;
    if (i.variants) { const v = i.variants; h += `<details><summary>제품으로 고른다면</summary>${r.enough&&g.kind==='food'?'<div class="d-note">집에서 만들어 드셔도 충분해요. 굳이 사지 않아도 돼요.</div>':''}<div class="d-demo">예시 데이터 · 가상의 제품·가격</div>
      <table class="d-cmp"><tr><th></th>${v.items.map(p=>`<th>${esc(p.name)}</th>`).join('')}</tr>${v.axis.map((ax,k)=>`<tr><th>${esc(ax)}</th>${v.items.map(p=>`<td>${esc(p.vals[k])}</td>`).join('')}</tr>`).join('')}
      <tr><th>좋은 점</th>${v.items.map(p=>`<td>${esc(p.pro||'-')}</td>`).join('')}</tr><tr><th>아쉬운 점</th>${v.items.map(p=>`<td>${esc(p.con||'-')}</td>`).join('')}</tr></table>
      ${v.items.map(p=>`<div class="d-badge">✔ ${esc(p.name)} · ${esc(p.badge)} · ${esc(String(p.price).replace('예시가','가격(예시)'))}</div>`).join('')}</details>`; }
    h += `</div>`;
  }
  if (r.excluded.length) h += `<div class="d-it d-ex"><b>피하는 게 좋아요</b>${r.excluded.map(e=>`<div>• ${esc(e.name)} — ${esc(e.reason)}</div>`).join('')}</div>`;
  h += `<button class="d-consult" onclick="this.outerHTML='<div class=d-note>✅ 상담 요청 목업이에요. 실제로는 전송되지 않아요.</div>'">약사·영양사 상담 요청 (목업)</button>
    <p class="d-disc">ⓘ 진단·처방이 아닌 일반 정보예요. 상호작용 문구는 예시이며 약사 검수 전이에요.</p>`;
  return h;
}
const SHEET_CSS = `.sh-bg{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:50;display:flex;align-items:flex-end;justify-content:center}
.sh{background:#fff;width:100%;max-width:430px;max-height:82vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px 28px;font-size:14px;line-height:1.55;color:#1f2a24}
.sh .x{float:right;border:0;background:none;font-size:18px;color:#888}.d-say{font-size:15px;margin:4px 0 10px}.d-it{border:1px solid #ebe7de;border-radius:12px;padding:10px;margin:8px 0;font-size:13px}
.d-k{font-size:11px;color:#2f8f5b;background:#e8f5ee;border-radius:6px;padding:1px 6px}.d-note{background:#fff4e5;color:#8a4b0c;border-radius:8px;padding:6px 8px;margin-top:6px;font-size:12px}
.d-ex{border-color:#f3d2cc}.d-demo{display:inline-block;background:#fdecea;color:#c0392b;font-size:10.5px;border-radius:6px;padding:1px 6px;margin:6px 0}
.d-cmp{width:100%;border-collapse:collapse;font-size:11px}.d-cmp th,.d-cmp td{border-top:1px solid #eee;padding:4px;text-align:left;vertical-align:top}.d-cmp th{color:#6b766f;font-weight:500}
.d-badge{font-size:11px;color:#24508f;margin-top:4px}details summary{color:#2f8f5b;cursor:pointer;margin-top:6px;font-size:12.5px}
.d-consult{width:100%;margin-top:10px;border:1px solid #cfe3d7;background:#fff;color:#2f8f5b;border-radius:12px;padding:10px;font-size:13px}.d-disc{font-size:11px;color:#888}.d-stop{background:#fdecea;color:#c0392b;padding:12px;border-radius:12px}
.tst{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#1f2a24;color:#fff;padding:8px 14px;border-radius:99px;font-size:13px;z-index:60;opacity:.92}
.demo{position:fixed;left:0;right:0;bottom:0;display:flex;gap:6px;justify-content:center;align-items:center;padding:6px;font-size:11px;color:#666;background:rgba(255,255,255,.85);z-index:40}
.demo button{border:1px solid #ccc;background:#fff;border-radius:8px;padding:3px 8px;font-size:11px}`;
function openSheet(html){ const bg = document.createElement('div'); bg.className='sh-bg'; bg.innerHTML=`<div class="sh"><button class="x" aria-label="닫기">✕</button>${html}</div>`; bg.onclick=e=>{ if(e.target===bg||e.target.classList.contains('x')) bg.remove(); }; document.body.appendChild(bg); return bg; }
function toast(t){ const d=document.createElement('div'); d.className='tst'; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),1400); }
function demoBar(st, rerender){ const b=document.createElement('div'); b.className='demo'; document.body.appendChild(b);
  const draw=()=>{ b.innerHTML=`데모 날짜 <button data-d="-1">◀</button> <b id="dl">${st.s.view===0?'오늘':(-st.s.view)+'일 전'}</b> <button data-d="1">▶</button> <button data-r>기록 초기화</button> <a href="../compare/" style="color:#2f8f5b">비교 ›</a>`;
    b.querySelectorAll('[data-d]').forEach(x=>x.onclick=()=>{ st.s.view=Math.max(-4,Math.min(0,st.s.view+ +x.dataset.d)); st.save(); draw(); rerender(); });
    b.querySelector('[data-r]').onclick=()=>{ st.reset(); st.s.view=0; st.save(); draw(); rerender(); }; };
  draw(); }
const st0 = document.createElement('style'); st0.textContent = SHEET_CSS; document.head.appendChild(st0);
window.Bapsim = { E, esc, SNAPS, PERSONA, Store, nudge, detailHTML, openSheet, toast, demoBar, dayLabel, between };
})();
