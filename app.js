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
  coffee:{l:'커피',t:['coffee','caffeine']}, latte:{l:'라떼',t:['coffee','caffeine','dairy','latte']}, americano:{l:'아메리카노',t:['coffee','caffeine','americano']}, filter:{l:'필터 커피',t:['coffee','caffeine','filter']}, decaf:{l:'디카페인',t:['coffee','decaf']}, beer:{l:'맥주',t:['alcohol','fizzy']}, soju:{l:'소주',t:['alcohol']}, tylenol:{l:'타이레놀',t:['apap']},
  ssanghwa:{l:'쌍화탕',t:['licorice']}, grapefruit:{l:'자몽주스',t:['grapefruit']}, iron:{l:'철분제',t:['iron']}, ibuprofen:{l:'이부프로펜',t:['nsaid'],img:'tylenol'}, energy:{l:'에너지 드링크',t:['caffeine','fizzy','sweet']},
  banana:{l:'바나나',t:['mg']}, tofu:{l:'두부',t:['mg','soy']}, dosirak:{l:'도시락',t:[]}, onigiri:{l:'삼각김밥',t:[]}, protein:{l:'프로틴바',t:[]},
  pizza:{l:'피자',t:['dairy','oily']}, chicken:{l:'치킨',t:['oily']}, samgyeop:{l:'삼겹살',t:['oily']}, snack:{l:'과자',t:['sweet']}, tteok:{l:'떡볶이',t:['sweet','spicy']}, ramen:{l:'라면',t:['spicy','oily']}, salad:{l:'샐러드',t:['veg']}, yogurt:{l:'요거트',t:['dairy','yogurt']}, cola:{l:'콜라',t:['fizzy','sweet']},
};
// 모의 이미지 인식: 서버가 붙으면 실제 모델로 교체. 지금은 파일 이름 단서만 사용, 확실하지 않으면 이름표 없음 (묻지 않음)
const REC = [[/tylenol|타이레놀|acetaminophen/i,'tylenol'],[/ibuprofen|이부프로펜|부루펜|advil/i,'ibuprofen'],[/beer|맥주/i,'beer'],[/soju|소주/i,'soju'],[/filter|drip|드립|필터/i,'filter'],[/decaf|디카페인/i,'decaf'],[/latte|라떼/i,'latte'],[/americano|아메리카노/i,'americano'],[/coffee|커피/i,'coffee'],[/ssanghwa|쌍화/i,'ssanghwa'],[/grapefruit|자몽/i,'grapefruit'],[/iron|철분/i,'iron'],[/energy|에너지/i,'energy'],[/banana|바나나/i,'banana'],[/tofu|두부/i,'tofu'],[/dosirak|도시락|lunch/i,'dosirak'],[/onigiri|삼각김밥/i,'onigiri'],[/protein|프로틴/i,'protein'],[/pizza|피자/i,'pizza'],[/chicken|치킨/i,'chicken'],[/tteok|떡볶이/i,'tteok'],[/ramen|라면/i,'ramen'],[/salad|샐러드/i,'salad'],[/cola|콜라/i,'cola'],[/samgyeop|삼겹/i,'samgyeop'],[/snack|과자/i,'snack'],[/yogurt|요거트|요구르트/i,'yogurt']];
const recognize = name => { const h = REC.find(([r]) => r.test(name || '')); return h ? h[1] : null; };
ITEMS.soda = { l:'탄산음료', t:['fizzy','sweet'], img:'cola' }; ITEMS.cancoffee = { l:'커피 캔', t:['coffee','caffeine','sweet'], img:'energy' }; ITEMS.makgeolli = { l:'막걸리', t:['alcohol'], img:'soju' };
ITEMS.vitamin = { l:'영양제', t:[], img:'iron' }; ITEMS.coldmed = { l:'감기약', t:['apap'], img:'tylenol' }; ITEMS.gingertea = { l:'생강차', t:[], img:'ssanghwa' };
// 모의 인식기 top-k: 그 사진에 그럴듯한 후보 2~3개 (실제 서비스에선 모델 점수 순)
const CANDS = { energy:['energy','soda','cancoffee'], cola:['cola','soda','energy'], beer:['beer','soda','makgeolli'], soju:['soju','makgeolli','beer'], coffee:['coffee','latte','americano'], latte:['latte','coffee','americano'],
  americano:['americano','coffee','filter'], filter:['filter','americano','coffee'], tylenol:['tylenol','coldmed','vitamin'], iron:['iron','vitamin','tylenol'], ssanghwa:['ssanghwa','gingertea','coldmed'],
  dosirak:['dosirak','onigiri','chicken'], pizza:['pizza','chicken','tteok'], chicken:['chicken','pizza','samgyeop'], yogurt:['yogurt','banana','salad'] };
const IMGK = k => IMG((ITEMS[k] && ITEMS[k].img) || k);
function candidates(e){ if (e.k && CANDS[e.k]) return CANDS[e.k]; if (e.k) return [e.k];
  const h = parseInt((e.time || '12').slice(0, 2)); return h < 11 ? ['coffee','yogurt','onigiri'] : h < 17 ? ['dosirak','coffee','salad'] : ['beer','chicken','soju']; }
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
const src = e => e.pid ? (URLS[e.pid] || '') : e.k ? IMGK(e.k) : '';
async function loadUrls(){ for (const e of S.entries) if (e.pid && !URLS[e.pid]) { const b = await get(e.pid); if (b) URLS[e.pid] = URL.createObjectURL(b); } }
async function shrink(f){ try { const bm = await createImageBitmap(f, { imageOrientation: 'from-image' }); /* EXIF 회전을 저장 시점에 반영 */ const k = Math.min(1, 1080 / Math.max(bm.width, bm.height)); const c = document.createElement('canvas'); c.width = bm.width * k; c.height = bm.height * k; c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height); return await new Promise(r => c.toBlob(r, 'image/jpeg', .85)); } catch { return f; } }
const now = () => new Date().toTimeString().slice(0,5);
const memoTags = text => { const c = E.classify(text), t = [...c.tags]; [[/타이레놀|아세트아미노펜|감기약/,'apap'],[/쌍화탕/,'licorice'],[/이부프로펜|부루펜|애드빌|나프록센/,'nsaid'],[/술|맥주|소주|와인|막걸리/,'alcohol'],[/커피|아메리카노|라떼/,'coffee'],[/자몽/,'grapefruit'],[/철분/,'iron'],[/두부|바나나|아몬드/,'mg'],[/우유|라떼|치즈|요거트/,'dairy'],[/요거트|요구르트/,'yogurt'],[/두부|두유|콩/,'soy'],[/콜라|사이다|탄산/,'fizzy'],[/치킨|튀김|삼겹|기름진/,'oily'],[/케이크|초콜릿|과자|디저트|빵/,'sweet']].forEach(([r,x]) => { if (r.test(text) && !t.includes(x)) t.push(x); }); return t; };

// ---- 프로필 → 엔진 ----
const profile = () => ({ conditions: S.profile.conds, meds: [...S.profile.meds, S.profile.other].join(' ').replace('타이레놀·감기약','타이레놀 감기약'), allergies: [] });
const hasMed = re => re.test([...S.profile.meds, S.profile.other].join(' '));

// ---- 샘플 일주일 ----
const SAMPLE = { meds:['혈압약'], shortSleep:[12,6,4], log:[
  [13,'latte','09:00'],[13,'n','피곤'],[13,'n','커피 마시고 속이 불편함'],[13,'salad','12:40'],[13,'n','개운함'],[5,'salad','12:30'],[5,'n','개운함'],[12,'americano','08:30'],[12,'energy','15:40'],[12,'n','다리에 쥐 났음'],
  [11,'chicken','20:00'],[9,'yogurt','08:10'],[9,'n','속 편함'],[9,'cola','21:00'],[8,'n','아침에 배에 가스 참'],[8,'snack','16:00'],[7,'samgyeop','12:30'],[7,'n','소화가 잘 안 됨'],[6,'n','턱에 뾰루지'],[11,'soju','21:30'],[10,'n','속이 더부룩함'],[10,'latte','10:00'],[10,'n','피곤'],[10,'n','커피 마시고 속이 불편함'],[9,'ramen','13:00'],[8,'americano','09:10'],[8,'n','피곤'],[11,'energy','15:00'],[7,'tofu','19:00'],
  [6,'filter','08:40'],[6,'iron','09:00'],[6,'dosirak','12:30'],[6,'energy','16:10'],
  [5,'yogurt','08:00'],[5,'n','속 편함'],[5,'filter','08:50'],[5,'banana','15:20'],[5,'n','다리에 쥐 났음'],
  [4,'filter','09:00'],[4,'onigiri','13:10'],[4,'energy','17:00'],
  [3,'tylenol','09:10'],[3,'pizza','20:10'],[3,'beer','21:00'],
  [2,'filter','08:45'],[2,'n','속이 더부룩함'],[2,'n','아침에 배에 가스 참'],[2,'protein','15:00'],[2,'tteok','19:30'],
  [1,'chicken','20:40'],[1,'n','이마에 뾰루지'],[1,'soju','22:10'],[1,'n','팀 회식'],
  [0,'coffee','08:45'],[0,'n','소화가 잘 안 됨'],[0,'n','감기 기운'],[0,'ssanghwa','13:20'] ] };
function loadSample(){ S.entries = S.entries.filter(e => !e.sample).concat(SAMPLE.log.map(([d,k,t], i) => k === 'n'
  ? { id:'s'+i, sample:true, day: dk(add(base,-d)), kind:'memo', text:t, tags: memoTags(t) }
  : { id:'s'+i, sample:true, day: dk(add(base,-d)), kind:'photo', k, text: ITEMS[k].l, time:t, tags: ITEMS[k].t }));
  S.profile = { meds:[...SAMPLE.meds], other:'', conds:[] }; S.sample = true; S.health = { on:true, sample:true, short: SAMPLE.shortSleep.map(d => dk(add(base,-d))) };
  const D = n => dk(add(base, -n));
  S.checks = {
    coffee: { mode:'swap', what:'커피', variant:'필터 커피', start: D(7), sample:true, result:'yes', line:'필터 커피로 바꾼 주에는 피곤함과 속 불편이 줄었어요.', health:'잠은 평소와 비슷했어요.', guess:'카페인보다는 종이 필터에 걸러지는 커피 기름 성분이 맞지 않았을 수도 있어요. 커피는 그대로, 종류만 바꿔도 돼요.' },
    gas: { mode:'avoid', what:'탄산', start: D(2), sample:true },
    fresh: { mode:'more', what:'채소', start: D(27), sample:true, result:'same', line:'채소를 며칠 더 먹어봐도 비슷했어요. 채소 때문은 아닌 것 같아요.' },
    oily: { mode:'avoid', what:'기름진 음식', start: D(24), sample:true, result:'kept', line:'확인하는 동안에도 기름진 음식이 있었어요. 그래서 이번엔 판단하지 않을게요.' },
  }; S.dismissed = []; S.view = 0; save(); }
const clearSample = () => { S.entries = S.entries.filter(e => !e.sample); S.sample = false; if (S.checks) for (const k in S.checks) if (S.checks[k].sample) delete S.checks[k]; if (S.health && S.health.sample) S.health = null; save(); };
const shortSleep = d => !!(S.health && S.health.on && (S.health.short||[]).includes(d));

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
  const nsa = [...on(t,'nsaid')], pk = [...apap, ...nsa];
  if (pk.length && alc.length) { const isN = !apap.length;
  C.push({ id:'apap', src:[...pk.slice(-1), ...alc.slice(-1)], pair:`${pk.at(-1).text} + ${alc.at(-1).text}`,
    msg: isN ? `${pk.at(-1).text} 먹은 날 술이 있었어요. 같이 먹으면 위출혈이 생길 수 있다고 안내돼 있어요.` : `${pk.at(-1).text} 먹은 날 술이 있었어요. 같이 먹으면 간에 부담이 될 수 있다고 안내돼 있어요.`,
    short:`${pk.at(-1).text} 먹은 날이에요. 술과는 같이 안 먹는 게 좋아요`, title:'진통제 먹은 날의 술',
    why:'타이레놀 같은 아세트아미노펜은 간에, 이부프로펜 같은 소염진통제는 위에 부담이 될 수 있어서, 술을 자주 마신다면 먹기 전에 약사와 상의하라고 안내돼 있어요.',
    refs:['tylenol','ibuprofen'], quote:[{ ref:'tylenol', t:'매일 세잔 이상 정기적으로 술을 마시는 사람이 이 약이나 다른 해열 진통제를 복용해야 할 경우 반드시 의사 또는 약사와 상의해야 한다. 이러한 사람이 이 약을 복용하면 간손상이 유발될 수 있다.', s:'타이레놀정500밀리그람(아세트아미노펜) 사용상의 주의사항' }, { ref:'ibuprofen', t:'매일 세잔 이상 정기적으로 술을 마시는 사람이 이 약이나 다른 해열진통제를 복용해야 할 경우 반드시 의사 또는 약사와 상의해야 한다. 이러한 사람이 이 약을 복용하면 위장출혈이 유발될 수 있다.', s:'부루펜정200밀리그램(이부프로펜) 사용상의 주의사항' }] }); }
  const lic = [...on(t,'licorice'), ...on(y,'licorice')];
  if (lic.length && htn) C.push({ id:'lic', src:lic.slice(-1), pair:`${lic.at(-1).text} + 혈압약`,
    msg:'쌍화탕엔 감초가 들어 있어요. 혈압약을 드시는 동안은 맞지 않을 수 있어요. 오늘은 따뜻한 물이면 충분해요.',
    short:'쌍화탕 감초는 혈압약과 안 맞을 수 있어요', title:'쌍화탕과 혈압약', why:'감초 성분(글리시리진)은 몸에 나트륨과 물을 붙잡아 두는 쪽으로 작용할 수 있어요. 그래서 혈압약을 먹는 동안에는 감초가 든 차·탕을 피하라고 안내하는 경우가 많아요.', q:'감기 기운 있어요', refs:['ssanghwa','licorice'], quote:[{ ref:'ssanghwa', t:'다음과 같은 사람은 이 약을 복용하기 전에 의사, 한의사, 치과의사, 약사, 한약사와 상의할 것. 1) 고혈압 환자', s:'경방쌍화탕액 사용상의 주의사항' }] });
  const gf = [...on(t,'grapefruit'), ...on(y,'grapefruit')];
  if (gf.length && (htn || lipid)) C.push({ id:'gf', src:gf.slice(-1), pair:`자몽주스 + ${lipid ? '고지혈증약' : '혈압약'}`,
    msg:`자몽은 일부 ${lipid ? '고지혈증약' : '혈압약'}의 효과를 세게 만들 수 있어요. 약을 드시는 동안엔 다른 과일 주스가 나아요.`,
    short:'자몽은 내 약 효과를 세게 할 수 있어요', title:'자몽과 내 약', why:'자몽은 장에서 약을 분해하는 효소를 막아서, 일부 약(특정 스타틴·칼슘 통로 차단제 등)이 몸에 더 많이 남게 할 수 있어요. 내 약이 해당되는지는 약 봉투나 약사에게 확인하면 정확해요.',
    alts:[['오렌지·사과 주스','이 상호작용과는 거리가 멀어요'],['물이나 탄산수','가장 무난해요']] });
  const iron = [...on(t,'iron')], cof = on(t,'coffee');
  if ((iron.length || hasMed(/철분/)) && cof.length && iron.length) C.push({ id:'iron', src:[...iron.slice(-1), ...cof.slice(-1)], pair:'철분제 + 커피',
    msg:'철분제 먹은 날 커피도 있었어요. 둘 사이에 시간 차를 두면 철분이 조금 더 잘 흡수될 수 있어요.',
    short:'철분제와 커피는 시간 차를 두면 좋아요', title:'철분제와 커피', why:'커피·녹차의 탄닌 성분은 철분과 붙어서 흡수를 줄일 수 있어요. 커피는 그대로 드시고, 시간만 떨어뜨려도 충분해요.',
    alts:[['오렌지 같은 과일과 함께','비타민 C가 철분 흡수에 조금이라도 도움이 될 수 있어요']] });
  const ya = on(y,'alcohol');
  if (ya.length && !alc.length) C.push({ id:'water', src:ya.slice(-1), pair:`어젯밤 ${ya.at(-1).text}`,
    msg:`어젯밤 ${ya.at(-1).text} 기록이 있어요. 오늘 오전엔 물을 평소보다 몇 잔 더 마시면 조금 편할 수 있어요.`,
    short:`어젯밤 ${ya.at(-1).text}, 오늘 오전엔 물 몇 잔 더`, health: shortSleep(t), title:'술 마신 다음 날', why:'술은 소변을 늘려 몸의 수분을 빼앗아요. 다음 날 물을 조금 더 마시면 그만큼 채우는 데 도움이 될 수 있어요.', q:'어제 술 마셨는데 숙취해소제 추천' });
  const cramp = es.filter(e => e.kind === 'memo' && /쥐/.test(e.text) && gap(e.day, t) >= 1 && gap(e.day, t) <= 2), cw = wk('caffeine'), mg = wk('mg');
  if (cramp.length && cw.length >= 3 && mg.length) { const f = mg.at(-1).text;
    C.push({ id:'mg', src:[cramp[0], mg.at(-1), cw.at(-1)], pair:'다리에 쥐 + 커피 잦은 주',
      msg:`커피 잦은 주에 다리에 쥐가 났다고 적으셨어요. 이미 드시는 ${f}${/[가-힣]/.test(f) && (f.charCodeAt(f.length-1)-0xAC00)%28 ? '을' : '를'} 매일 하나씩 곁들이면 조금이라도 도움이 될 수 있어요.`,
      short:`이미 드시는 ${f}, 매일 하나씩 곁들여 보세요`, title:'다리에 쥐가 난 주', why:'카페인은 마그네슘·칼륨이 소변으로 빠지는 걸 조금 늘릴 수 있어요. 커피는 그대로 두고, 이미 드시는 것 중 마그네슘·칼륨이 든 걸 조금 더하는 정도면 충분해요.', q:'다리에 쥐가 자주 나요' }); }
  if (!C.length && S.watch) for (const [name, w] of Object.entries(S.watch)) { const now = priceOn(name, w.base, t); if (now < w.at && t > w.day) { C.push({ id:'price', src:[], product: w.key, pair:'지켜보던 가격', msg:`지켜보던 ${name} 가격이 내려갔어요. 확인된 판매처 기준이에요.`, short:`지켜보던 ${name} 가격이 내려갔어요` }); break; } }
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
      <div class="n-src"${why('왜 지금 이 말을 하는지 근거가 바로 보여야 무작위 건강 상식처럼 느껴지지 않아요.')}>${thumbs(n.src)}<span class="n-pair">${esc(dayName(t,t))} · ${esc(n.pair)}</span><span class="ai" aria-label="AI가 쓴 문장"${why('AI 기본법에 따라 생성형 AI가 쓴 문장임을 알려요. 크게 드러내지 않고 근거 줄 끝에 작은 글자 두 개로만, 어디서나 같은 자리에.')}>AI</span>${n.health?`<i data-lucide="heart-pulse" class="n-h"${why('수면 같은 건강 데이터는 숫자로 보여 주지 않고, 근거 줄의 작은 표시로만 드러나요.')}></i>`:''}</div>
      <p class="n-msg">${esc(n.msg)}</p>
      <div class="n-foot"><button class="n-more" id="more"${why('자세한 이유와 대안은 원할 때만. 카드가 길어지지 않게 탭 뒤로 숨겼어요.')}>${n.product ? '가격 보기' : '이유와 대안 보기'}<i data-lucide="chevron-right"></i></button><span class="n-exp"${why('스스로 사라진다는 걸 알려서, 쌓일까 봐 부담 갖지 않게 해요.')}>오늘까지</span></div>
      <button class="x" id="nx" aria-label="닫기"${why('무시할 권리. 닫으면 그날은 더 이상 아무것도 뜨지 않고, 같은 종류는 3일 동안 조용해요.')}><i data-lucide="x"></i></button></article>`
    : `<div class="quiet"${why('조용한 날에도 앱이 고장 난 게 아니라 일부러 조용하다는 걸 알려 줘요.')}><span class="q-ic"><i data-lucide="moon"></i></span><div><b>오늘은 챙길 게 없어요</b><span>계속 찍어 두세요. 필요할 때만 알려 드릴게요.</span></div></div>`;
  const days = {}; visible().forEach(e => (days[e.day] = days[e.day] || []).push(e));
  const keys = Object.keys(days).sort().reverse();
  if (!keys.includes(t)) keys.unshift(t);
  const tl = keys.map((d, i) => { const es = (days[d] || []).slice().reverse(), ph = es.filter(e => e.kind === 'photo'), me = es.filter(e => e.kind === 'memo');
    return `<section class="day"${i===0?why('날짜별 기록. 저장됐다는 믿음과, 한 줄의 근거를 확인하는 곳이에요. 숫자나 분석은 없어요.'):''}><h3>${esc(dayName(d,t))}</h3>
      ${ph.length ? `<div class="grid">${ph.map(e => `<button class="tile${e.id===lastNew?' new':''}" data-id="${e.id}" aria-label="${esc(e.text||'사진')}"><img src="${src(e)}" alt="" loading="lazy">${e.rec==='pending'?'<span class="lb pend">확인 중</span>':(e.k||e.custom)?`<span class="lb">${esc(e.text)}</span>`:''}</button>`).join('')}</div>` : (me.length ? '' : `<div class="empty">아직 찍은 게 없어요</div>`)}
      ${me.length ? `<div class="memos">${me.map(e => `<span class="memo"><i data-lucide="pen-line"></i>${esc(e.text)}</span>`).join('')}</div>` : ''}</section>`; }).join('');
  const ins = insights();
  const insLink = ins.length ? `<button class="ins-link" id="insl"${why('따로 탭을 만들지 않았어요. 알게 된 게 생겼을 때만 이 작은 줄이 나타나요.')}><i data-lucide="sprout"></i>나에 대해 알게 된 것<i data-lucide="chevron-right"></i></button>` : '';
  app.innerHTML = `<div class="wrap">${head}<div class="today">${top}</div>${insLink}${tl}</div>
    <nav class="dock"><div class="dock-in">
      <button class="side" id="pen" aria-label="한 줄 적기"${why('쥐가 남, 감기 기운처럼 찍을 수 없는 몸 상태를 남기는 곳. 이게 없으면 몸 상태와 연결된 순간을 놓쳐요.')}><i data-lucide="pen-line"></i></button>
      <button class="shutter" id="shot" aria-label="찍어 두기"${why('유일한 주 동작. 엄지가 닿는 하단 중앙에 가장 크게. 기본 카메라를 바로 열어요.')}><i><i data-lucide="camera"></i></i></button>
      <button class="side" id="album" aria-label="앨범에서 가져오기"${why('이미 기본 카메라로 음식 사진을 찍는 사람이 많아서, 앨범에서 여러 장을 한 번에 가져올 수 있게 했어요.')}><i data-lucide="images"></i></button>
    </div></nav>`;
  icons(); lastNew = null;
  $('#gear').onclick = settings; if ($('#insl')) $('#insl').onclick = insightsPage; $('#shot').onclick = () => capture(false); $('#album').onclick = () => capture(true); $('#pen').onclick = composer;
  $$('.tile').forEach(b => b.onclick = () => photoView(b.dataset.id));
  const ft = $('.tile'); if (ft) ft.setAttribute('data-why', '밥심이 사진을 스스로 알아보고, 이름표를 사진 위에 작게만 붙여요. 아무것도 뜨지 않아요. 확실하지 않으면 이름표를 붙이지 않고, 묻지도 않아요.');
  if (n) { $('#more').onclick = () => n.product ? productSheet(n.product) : detail(n); $('#nx').onclick = () => { buzz(); $('#note').classList.add('out'); setTimeout(() => { S.dismissed.push(n.id + '-' + t); save(); render(); }, 260); }; }
  notesRefresh();
}
let lastNew = null;

// ---- 찍기 ----
function capture(multi){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (multi) inp.multiple = true; else inp.capture = 'environment';
  inp.style.display = 'none'; document.body.appendChild(inp);
  inp.onchange = async () => { const fs = [...inp.files]; inp.remove(); if (!fs.length) return; let e;
    const made = [];
    for (const f of fs) { const pid = 'p' + Date.now() + Math.random().toString(36).slice(2,6), b = await shrink(f); await put(pid, b); URLS[pid] = URL.createObjectURL(b);
      e = { id:'e' + Date.now() + Math.random().toString(36).slice(2,5), day: today(), kind:'photo', pid, text:'', time: now(), tags:[], rec:'pending' }; S.entries.push(e); made.push([e, f.name]); }
    save(); buzz(); lastNew = e.id; render();
    setTimeout(() => { made.forEach(([x, name]) => { const k = recognize(name); delete x.rec; if (k) { x.k = k; x.text = ITEMS[k].l; x.tags = ITEMS[k].t; x.auto = true; } }); save(); render(); }, 1000); };
  inp.click();
}
function setCustom(id, text){ const e = S.entries.find(x => x.id === id); if (!e || !text) return; e.k = null; e.custom = true; e.text = text; e.tags = memoTags(text); e.auto = false; save(); }
function setLabel(id, k){ const e = S.entries.find(x => x.id === id); if (!e) return; e.custom = false; e.k = k; e.text = ITEMS[k].l; e.tags = ITEMS[k].t; e.auto = false; save(); }

// ---- 시트 ----
function sheet(html, cls = ''){ const bg = document.createElement('div'); bg.className = 'sh-bg'; bg.innerHTML = `<div class="sh ${cls}"><div class="grab"></div><button class="x" aria-label="닫기"><i data-lucide="x"></i></button>${html}</div>`;
  const close = () => { bg.classList.add('out'); setTimeout(() => bg.remove(), 220); };
  bg.onclick = ev => { if (ev.target === bg || ev.target.closest('.sh > .x')) close(); }; document.body.appendChild(bg); icons(); bg.close = close; return bg; }

function detail(n){
  let items = (n.alts || []).map(([a,b]) => ({ name:a, text:b }));
  let cmp = '';
  if (n.q) { const r = E.answer(n.q, profile(), { recentEntries: [] });
    for (const g of r.groups || []) for (const i of g.items) { if (i.note) continue; items.push({ name:i.name, text: g.kind === 'food' ? i.effect : i.claim, ref: i.ref || (/허가사항/.test(i.claim||'') ? '_mfds' : ''), v: i.variants }); }
    items = items.slice(0, 4); }
  const body = items.map(i => `<div class="it"><b>${esc(i.name)}</b><span>${esc(i.text)}</span>${i.ref === '_mfds' ? '<small class="ref-t">출처: 식약처 의약품 허가사항 (대표 품목)</small>' : i.ref ? `<small class="ref-t">출처: ${refA(i.ref)}</small>` : ''}${i.v ? variants(i.v) : ''}</div>`).join('');
  sheet(`<div class="s-eyebrow">${esc(n.pair)}</div><h2 class="s-title">${esc(n.title)}</h2>
    <div class="s-sec"${why('근거 없는 경고는 믿지 않아요. 왜 그런지 한 단락으로만.')}><h4>이유</h4><p>${esc(n.why)}</p></div>
    ${body ? `<div class="s-sec"${why('경고로 끝내지 않고, 지금 할 수 있는 작은 대안. 음식·차·제품 모두 같은 형식이고 범주 표시가 없어요.')}><h4>대신 이렇게</h4>${body}</div>` : ''}
    ${(() => { const cs = CURATE.filter(c => c.on === n.id); return cs.length ? `<div class="cur">${cs.map(c => `<p>${esc(c.food)}</p><button class="pr-open" data-p="${esc(c.key)}">${esc(PRODUCTS[c.key].title.split(' · ')[0])} 제품 보기<i data-lucide="chevron-right"></i></button>`).join('')}</div>` : ''; })()}
    ${n.quote ? `<div class="s-sec"${why('허가사항 원문은 AI 문장과 섞지 않고 인용으로 따로. 무엇이 AI 문장이고 무엇이 공식 문구인지 바로 구분돼요.')}><h4>허가사항 원문</h4>${n.quote.map(q => `<blockquote class="qt"><p>“${esc(q.t)}”</p><cite>${q.ref && REFS[q.ref] ? `<a class="ref" href="${REFS[q.ref].u}" target="_blank" rel="noopener noreferrer">${esc(q.s)}<span aria-hidden="true">↗</span></a>` : esc(q.s)}</cite></blockquote>`).join('')}</div>` : ''}
    <p class="ai-f"${why('출처 줄 바로 옆에 한 줄. 원문 인용을 뺀 문장은 AI가 썼다는 걸 알려요.')}><span class="ai">AI</span>AI가 내 기록을 보고 쓴 문장이에요${n.quote ? '. 따옴표 안은 허가사항 원문이에요' : ''}.</p>
    ${n.refs ? `<p class="src"${why('출처는 눌러서 원문을 바로 열 수 있게. 직접 열어 확인한 링크만 걸고, 확인 못 한 출처는 글자로만 남겨요. 작게, 밑줄과 ↗로만.')}>${n.refs.every(k => /nedrug/.test(REFS[k].u)) ? '출처: 식약처 의약품 허가사항' : '출처'}<span class="refs">${n.refs.map(refA).join('')}</span></p>` : ''}
    <p class="disc">진단이나 처방이 아닌 일반 정보예요. 문구는 예시이며 약사 검수 전이에요. 약에 대해서는 약사·의사의 안내를 따라 주세요.</p>`);
  notesRefresh();
}
function variants(v){ return `<details><summary>제품으로 고른다면</summary><div><span class="demo-l">예시 데이터 · 가상의 제품</span></div>
  <table class="cmp"><tr><th></th>${v.items.map(p => `<th>${esc(p.name)}</th>`).join('')}</tr>${v.axis.map((ax,k) => `<tr><th>${esc(ax)}</th>${v.items.map(p => `<td>${esc(p.vals[k])}</td>`).join('')}</tr>`).join('')}
  <tr><th>좋은 점</th>${v.items.map(p => `<td>${esc(p.pro||'-')}</td>`).join('')}</tr><tr><th>아쉬운 점</th>${v.items.map(p => `<td>${esc(p.con||'-')}</td>`).join('')}</tr></table>
  ${v.items.map(p => `<div class="ver"><i data-lucide="badge-check"></i>${esc(p.name)} · ${esc(p.badge)}</div>`).join('')}
  ${(() => { const ok = v.items.map(p => ({ p, n: parseInt(String(p.price).replace(/[^0-9]/g, '')) || 0 })).filter(o => o.n && /인증|허가|HACCP|신고|표시/.test(o.p.badge)).sort((a,b) => a.n - b.n)[0]; return ok ? `<a class="pr-go sm" href="#" onclick="return false">확인된 곳 중 가장 싼 곳 보기 · ${esc(ok.p.name)} ${won(ok.n)}</a>` : ''; })()}</details>`; }

function photoView(id){
  const e = S.entries.find(x => x.id === id); if (!e) return;
  const bg = sheet(`<div class="pv"><div class="meta">${esc(dayName(e.day, today()))}${e.time ? ' · ' + esc(e.time) : ''}</div><div class="pv-ph"${why('세로·가로 사진 모두 잘리지 않게 원래 비율 그대로, 화면 높이에 맞춰요. 닫기 버튼과 겹치지 않게 사진은 제목 줄 아래에서 시작해요.')}><img src="${src(e)}" alt=""></div>
    <button class="curtag" id="ct"${why('고치는 건 선택이고, 사진을 눌러 본 사람만 발견해요. 찍을 때마다 묻지 않기 위해서예요.')}>${e.k ? `<img src="${IMGK(e.k)}" alt="">` : ''}${e.k || e.custom ? esc(e.text) : '이름표 없음'}<span>${e.k || e.custom ? '바꾸기' : '붙이기'}</span></button>
    ${e.k && e.auto !== false ? `<p class="ai-tag"${why('자동으로 붙은 이름표는 AI 인식 결과라는 걸 사진을 열었을 때만 작게. 타임라인엔 아무것도 더하지 않아요.')}><span class="ai">AI</span>AI가 사진을 보고 붙인 이름표예요</p>` : ''}
    <div class="pick" id="tg" hidden${why('긴 목록 대신, 이 사진에 그럴듯한 후보 두세 개만 보여 줘요(인식기의 상위 후보). 없으면 직접 짧게 적으면 돼요.')}><p class="pick-h">AI가 고른 후보</p><div class="tags">${candidates(e).map(k => `<button class="tag${e.k===k?' on':''}" data-k="${k}"><img src="${IMGK(k)}" alt="">${ITEMS[k].l}</button>`).join('')}</div>
      <form class="pick-f" id="pf"><input id="pi" placeholder="직접 적기 (예: 오트 라떼)" maxlength="20" autocomplete="off"><button type="submit" id="pok" disabled>저장</button></form></div>
    <button class="danger" id="del">이 기록 지우기</button></div>`);
  $('#ct', bg).onclick = () => { $('#tg', bg).hidden = false; $('#ct', bg).hidden = true; notesRefresh(); };
  $('#pi', bg).oninput = () => $('#pok', bg).disabled = !$('#pi', bg).value.trim();
  $('#pf', bg).onsubmit = ev => { ev.preventDefault(); const v = $('#pi', bg).value.trim(); if (!v) return; buzz(); setCustom(id, v); render(); setTimeout(() => bg.close(), 150); };
  $$('.tag', bg).forEach(b => b.onclick = () => { $$('.tag', bg).forEach(x => x.classList.remove('on')); b.classList.add('on'); buzz(); setLabel(id, b.dataset.k); render(); setTimeout(() => bg.close(), 200); });
  $('#del', bg).onclick = () => { S.entries = S.entries.filter(x => x.id !== id); if (e.pid) del(e.pid); save(); bg.close(); render(); };
  notesRefresh();
}
const MEMO_NEG = ['변비','설사','가스','소화 불편','뾰루지','두통','피곤'], MEMO_POS = ['속 편함','개운함','피부 좋음'];
const memoText = c => ({ '가스':'아침에 배에 가스 참', '소화 불편':'소화가 잘 안 됨' })[c] || c;
const freqOrder = list => { const cnt = c => S.entries.filter(e => e.kind === 'memo' && e.text.includes(c.split(' ')[0])).length; return list.slice().sort((a, b) => cnt(b) - cnt(a)); };
function saveMemo(text){ S.entries.push({ id:'m' + Date.now() + Math.random().toString(36).slice(2,4), day: today(), kind:'memo', text, tags: memoTags(text) }); save(); buzz(); }
function memoChips(){ return `<div class="mc"${why('가장 흔한 몸 상태는 한 번 탭으로. 자주 쓰는 게 앞으로 오고, 몸무게처럼 숫자를 재는 항목은 두지 않았어요.')}>${freqOrder(MEMO_NEG).map(c => `<button class="mchip" data-m="${esc(memoText(c))}">${esc(c)}</button>`).join('')}</div>
  <div class="mc pos"${why('좋았던 날도 같은 무게로 남겨요. 그래야 \'뭐가 나를 편하게 하는지\'도 보여요.')}>${freqOrder(MEMO_POS).map(c => `<button class="mchip pos" data-m="${esc(c)}"><i data-lucide="leaf"></i>${esc(c)}</button>`).join('')}</div>`; }
function composer(){
  const bg = sheet(`<div class="comp"><h2 class="s-title" style="margin-top:8px">지금 몸 상태</h2>${memoChips()}
    <div class="comp-free"${why('칩에 없는 건 직접. 손이 바쁠 땐 말로 남길 수 있게 음성 버튼을 두었어요(목업).')}><textarea id="mt" rows="1" placeholder="직접 적기"></textarea><button class="mic" id="mic" aria-label="말로 남기기"><i data-lucide="mic"></i></button></div>
    <button class="primary" id="ms" disabled>적어 두기</button></div>`);
  const ta = $('#mt', bg), go = $('#ms', bg);
  ta.oninput = () => go.disabled = !ta.value.trim();
  $$('.mchip', bg).forEach(b => b.onclick = () => { b.classList.add('on'); saveMemo(b.dataset.m); setTimeout(() => { bg.close(); render(); }, 220); });
  $('#mic', bg).onclick = () => { const m = $('#mic', bg); m.classList.add('rec'); ta.placeholder = '듣고 있어요…'; setTimeout(() => { m.classList.remove('rec'); ta.placeholder = '직접 적기'; ta.value = '점심 먹고 속이 더부룩함'; go.disabled = false; }, 1600); };
  go.onclick = () => { const text = ta.value.trim(); if (!text) return; saveMemo(text); bg.close(); render(); };
}
function settings(){
  const p = S.profile, sum = [...p.meds, p.other, ...p.conds.map(c => (CONDS.find(x => x[0]===c)||[])[1])].filter(Boolean).join(', ') || '비어 있어요';
  const bg = sheet(`<h2 class="s-title" style="margin-top:8px">설정</h2>
    <button class="row" id="r-p"><span>먹는 약과 몸 상태<small>${esc(sum)}</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-s"><span>${S.sample ? '샘플 기록 끄기' : '샘플 기록으로 둘러보기'}<small>일주일치 예시 기록이에요</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-k"><span>나에 대해 알게 된 것<small>내 기록이 겹쳐 보일 때만 적혀요</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-h"><span>건강 데이터 ${S.health && S.health.on ? '연결됨' : '연결'}<small>${S.health && S.health.on ? '수면 같은 맥락을 조용히 참고하고 있어요' : '수면·걸음 수를 한 줄의 맥락으로만 써요 (선택)'}</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-w"><span>알림창 위젯 미리 보기<small>Android 알림창에 늘 떠 있는 모습이에요</small></span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-i"><span>소개 다시 보기</span><i data-lucide="chevron-right"></i></button>
    <button class="row" id="r-x" style="color:#C0362C"><span>모든 기록 지우기<small>이 휴대폰에서만 지워져요</small></span></button>`);
  $('#r-p', bg).onclick = () => { bg.close(); setup(true); };
  $('#r-s', bg).onclick = () => { S.sample ? clearSample() : loadSample(); bg.close(); render(); };
  $('#r-k', bg).onclick = () => { bg.close(); insightsPage(); };
  $('#r-h', bg).onclick = () => { bg.close(); if (S.health && S.health.on) { S.health = null; save(); render(); } else setTimeout(healthConnect, 240); };
  $('#r-w', bg).onclick = () => { bg.close(); widget(); };
  $('#r-i', bg).onclick = () => { bg.close(); intro(true); };
  $('#r-x', bg).onclick = function(){ if (this.dataset.c) { S.entries.forEach(e => e.pid && del(e.pid)); S.entries = []; S.dismissed = []; S.sample = false; save(); bg.close(); render(); } else { this.dataset.c = 1; this.querySelector('span').firstChild.textContent = '한 번 더 누르면 지워져요'; } };
}

// ---- 소개 ----
function intro(again){
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'intro';
  const note = (pair, msg, srcs) => `<div class="mini"><div class="n-src"><span class="n-thumbs">${srcs.map(s => `<img src="${s}" alt="">`).join('')}</span><span class="n-pair">${pair}</span><span class="ai">AI</span></div><p class="n-msg">${msg}</p></div>`;
  ov.innerHTML = `<div class="in-top"><button id="skip">건너뛰기</button></div><div class="slides" id="slides">
   <section class="slide"${why('추상적인 설명보다 실제 순간 하나가 3초 안에 이해돼요. 그래서 첫 장이 바로 예시예요.')}><div class="viz">
      <div class="ph" style="left:24px;top:8px;--r:-6deg;animation-delay:.1s"><img src="img/tylenol.jpg" alt=""><span class="lb">타이레놀</span></div>
      <div class="ph" style="right:24px;top:28px;--r:5deg;animation-delay:.3s"><img src="img/beer.jpg" alt=""><span class="lb">맥주</span></div>
      <div style="position:absolute;left:0;right:0;bottom:0;animation-delay:.9s" class="mini-w">${note('오늘 · 타이레놀 + 맥주','타이레놀 먹은 날 맥주예요. 같이 들어가면 간에 부담이 될 수 있어서, 오늘 술은 여기까지가 좋아요.',['img/tylenol.jpg','img/beer.jpg'])}</div></div>
      <h2>놓치면 안 될 때만,<br>한 줄로</h2><p>타이레놀 먹은 날 맥주를 찍으면, <b>간에 부담이 될 수 있다고</b> AI가 내 기록을 보고 한 줄로 챙겨 드려요.</p></section>
   <section class="slide"${why('할 일은 찍는 것뿐이라는 걸 보여 줘요. 기록 앱처럼 입력 부담이 있다고 오해하지 않게.')}><div class="viz"><div class="g9">${['coffee','dosirak','energy','banana','pizza','beer','tylenol','tteok','soju'].map((k,i) => `<span style="animation-delay:${.05+i*.06}s"><img src="img/${k}.jpg" alt=""></span>`).join('')}<div class="lock"><i data-lucide="lock"></i>이 휴대폰에만 저장돼요</div></div></div>
      <h2>찍어 두기만<br>하세요</h2><p>밥, 커피, 술, 약까지 뭐든요. <b>분석도, 질문도 없이</b> 조용히 모아 둬요.</p></section>
   <section class="slide"${why('다음 화면에서 약을 묻는 이유를 미리 보여 줘요. 설정이 설문처럼 느껴지지 않게.')}><div class="viz">
      <span class="chipviz" style="left:20px;top:20px;animation-delay:.1s"><i data-lucide="pill"></i>혈압약</span>
      <div class="ph" style="right:28px;top:12px;--r:5deg;animation-delay:.35s"><img src="img/ssanghwa.jpg" alt=""><span class="lb">쌍화탕</span></div>
      <div style="position:absolute;left:0;right:0;bottom:0" class="mini-w">${note('오늘 · 쌍화탕 + 혈압약','쌍화탕엔 감초가 들어 있어요. 혈압약을 드시는 동안은 맞지 않을 수 있어요. 오늘은 따뜻한 물이면 충분해요.',['img/ssanghwa.jpg'])}</div></div>
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

// ---- 나에 대해 알게 된 것: 내 기록이 의미 있게 겹칠 때만. 인과 표현 없음, 숫자 없음 ----
const AREAS = { gut:['배·소화','soup'], skin:['피부','sparkles'], energy:['잠·기운','moon'], body:['몸','footprints'], med:['약','pill'] };
// 규칙: 사용자가 직접 적은 메모가 두 번 이상, 매번 같은 무리의 기록과 겹칠 때만
const RULES = [
  { id:'gas', kind:'trig', sym:'아침 가스', area:'gut', re:/가스/, g:[['dairy','유제품'],['soy','콩'],['fizzy','탄산']], from:1, to:1, t:n => `아침에 배에 가스가 찼던 날은 매번 전날 ${n}이 있었어요.` },
  { id:'oily', kind:'trig', sym:'소화 불편', area:'gut', re:/소화가/, g:[['oily','기름진 음식']], from:0, to:1, t:n => `소화가 잘 안 됐던 날은 매번 그 전에 ${n}이 있었어요.` },
  { id:'bloat', kind:'trig', sym:'더부룩함', area:'gut', re:/더부룩|체했/, g:[['alcohol','술']], from:1, to:1, t:n => `속이 더부룩했던 날은 매번 전날 밤에 ${n}이 있었어요.` },
  { id:'skin', kind:'trig', sym:'뾰루지', area:'skin', re:/뾰루지|여드름|트러블/, g:[['sweet','단 것'],['dairy','유제품'],['alcohol','술']], from:1, to:3, t:n => `뾰루지가 났던 며칠 전엔 매번 ${n}이 있었어요.` },
  { id:'cramp', kind:'trig', sym:'다리에 쥐', area:'body', re:/쥐/, g:[['caffeine','커피']], from:0, to:3, need:2, t:() => '다리에 쥐가 났던 때는 매번 커피가 잦던 며칠 뒤였어요.' },
  { id:'calm', kind:'help', sym:'속 편한 날', pos:true, area:'gut', re:/속 편/, g:[['yogurt','요거트']], from:0, to:0, t:n => `속 편했던 날은 매번 아침에 ${n}가 있었어요.` },
  { id:'fresh', kind:'help', sym:'개운한 날', pos:true, area:'energy', re:/개운/, g:[['veg','채소']], from:0, to:1, t:n => `개운했던 날은 매번 그 전에 ${n}가 있었어요.` },
  { id:'skinok', kind:'help', sym:'피부 좋은 날', pos:true, area:'skin', re:/피부 좋/, g:[['soy','콩'],['veg','채소']], from:0, to:2, t:n => `피부가 좋았던 날은 매번 며칠 전에 ${n}이 있었어요.` },
];
function insights(){
  const es = visible(), t = today(), out = [];
  const near = (d, tag, from, to) => es.filter(e => (e.tags||[]).includes(tag) && gap(e.day, d) >= from && gap(e.day, d) <= to);
  for (const r of RULES) {
    const ms = es.filter(e => e.kind === 'memo' && r.re.test(e.text)); if (ms.length < 2) continue;
    const hit = r.g.filter(([tag]) => ms.every(m => near(m.day, tag, r.from, r.to).length >= (r.need || 1))); if (!hit.length) continue;
    const ev = ms.flatMap(m => { const x = hit.flatMap(([tag]) => near(m.day, tag, r.from, r.to)); return [m, x.sort((a,b) => a.day < b.day ? 1 : -1)[0]]; }).filter(Boolean);
    out.push({ id:r.id, area:r.area, kind:r.kind, pos:r.pos, rule:r, tags:hit.map(h => h[0]), what:hit.map(h => h[1]).join('·'), text:r.t(hit.map(h => h[1]).join('이나 ')), src:ev, latest: ms.map(m => m.day).sort().at(-1) });
  }
  { const isSym = e => e.kind === 'memo' && /피곤|속이 불편|소화 불편/.test(e.text);
    const tired = es.filter(e => e.kind === 'memo' && /피곤/.test(e.text)), gutc = es.filter(e => e.kind === 'memo' && /속이 불편|소화 불편/.test(e.text));
    const onCof = m => es.filter(e => (e.tags||[]).includes('coffee') && e.day === m.day);
    if (tired.length >= 2 && tired.every(m => onCof(m).length)) { const both = gutc.length >= 2 && gutc.every(m => onCof(m).length);
      const symDays = [...new Set([...tired, ...(both ? gutc : [])].map(m => m.day))];
      const ev = [...tired, ...(both ? gutc : [])].flatMap(m => [m, onCof(m)[0]]);
      // 자연스러운 대비가 쌓일 때만 한 단계씩 좁혀 감
      const steps = [];
      if (S.health && S.health.on) { const sh = symDays.filter(shortSleep); steps.push(sh.length ? { k:'sleep', t:'잠이 짧았던 날이기도 했어요. 잠과 겹쳤는지는 아직 몰라요.', open:true } : { k:'sleep', t:'그날들 잠은 평소와 비슷했어요.', src:'건강 데이터' }); }
      const cafOnly = [...new Set(es.filter(e => (e.tags||[]).includes('caffeine') && !(e.tags||[]).includes('coffee')).map(e => e.day))].filter(d => !es.some(e => e.day === d && (e.tags||[]).includes('coffee')) && !es.some(e => e.day === d && isSym(e)));
      if (cafOnly.length) steps.push({ k:'caf', t:'커피 없이 카페인만 있던 날(에너지 드링크)엔 피곤·속 불편 기록이 없었어요.' });
      const types = [...new Set(symDays.flatMap(d => es.filter(e => e.day === d && (e.tags||[]).includes('coffee')).map(e => e.text)))];
      const c = (S.checks||{}).coffee;
      out.push({ id:'coffee', area:'energy', kind:'swap', what:'커피', tags:['coffee'], focusSym:['피곤','속 불편'], rule:{ re:/피곤|속이 불편|소화 불편/, sym:'피곤함' }, types,
        text: both ? '피곤하고 속이 불편했던 날은 매번 커피가 있던 날이었어요.' : '피곤했던 날은 매번 커피가 있던 날이었어요.',
        steps, ambiguous: !c, src: ev, latest: symDays.sort().at(-1) }); } }
  if (S.health && S.health.on) { const sd = (S.health.short||[]).filter(d => d <= t), hit = sd.filter(d => near(d, 'caffeine', 0, 0).length >= 2);
    if (hit.length >= 2) out.push({ id:'sleep', area:'energy', health:true, hl:'이런 날이기도 했어요. 원인으로 보지는 않아요.', text:'잠이 짧았던 다음 날엔 커피가 늘었어요.', src: hit.flatMap(d => near(d,'caffeine',0,0).slice(-1).map(e => ({ ...e, sleep:true }))), latest: hit.sort().at(-1) }); }
  const days = [...new Set(es.map(e => e.day))];
  const ap = days.filter(d => es.some(e => e.day === d && (e.tags||[]).includes('apap')) && es.some(e => e.day === d && (e.tags||[]).includes('alcohol')));
  if (ap.length) out.push({ id:'apap', area:'med', inter:true, text:'타이레놀 먹은 날 술이 겹친 적이 있었어요. 감기약 먹는 날엔 밥심이 계속 챙길게요.', src: ap.flatMap(d => es.filter(e => e.day === d && ((e.tags||[]).includes('apap') || (e.tags||[]).includes('alcohol')))), latest: ap.sort().at(-1) });
  const ir = days.filter(d => es.some(e => e.day === d && (e.tags||[]).includes('iron')) && es.some(e => e.day === d && (e.tags||[]).includes('coffee')));
  if (ir.length) out.push({ id:'iron', area:'med', inter:true, text:'철분제 먹은 날 커피도 가까운 시간에 있었어요. 둘 사이를 조금 떼면 철분이 조금 더 잘 흡수될 수 있어요.', src: ir.flatMap(d => es.filter(e => e.day === d && ((e.tags||[]).includes('iron') || (e.tags||[]).includes('coffee')))), latest: ir.sort().at(-1) });
  const htn = S.profile.conds.includes('hypertension') || hasMed(/혈압/), lic = es.filter(e => (e.tags||[]).includes('licorice'));
  if (htn && lic.length) out.push({ id:'lic', area:'med', inter:true, text:'혈압약을 드시는 중에 쌍화탕 기록이 있었어요. 감기 기운엔 따뜻한 물·꿀물로도 충분할 수 있어요.', src: lic, latest: lic.map(e => e.day).sort().at(-1) });
  return out;
}
// 지금 지켜보는 불편 하나: 빈도 + 최근성 + 영향(일상에 주는 무게)
const DISCOMFORT = [['피곤',/피곤/,3],['속 불편',/속이 불편|소화/,3],['가스',/가스/,2],['더부룩함',/더부룩/,2],['두통',/두통/,3],['변비',/변비/,2],['설사',/설사/,3],['뾰루지',/뾰루지/,1],['다리에 쥐',/쥐/,2]];
function focus(){ const t = today(), ms = visible().filter(e => e.kind === 'memo');
  const sc = DISCOMFORT.map(([n, re, w]) => { const m = ms.filter(e => re.test(e.text) && gap(e.day, t) <= 14); if (!m.length) return null;
    const rec = Math.min(...m.map(e => gap(e.day, t))); return { n, score: m.length * w + Math.max(0, 7 - rec) * .5 }; }).filter(Boolean).sort((a, b) => b.score - a.score);
  return sc[0] ? sc[0].n : null; }
const josaO = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c % 28 ? '을' : '를'); };
const josaI = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c % 28 ? '이' : '가'); };
function checkState(x){
  const c = (S.checks || {})[x.id]; if (!c) return null; const t = today(), end = dk(add(new Date(c.start + 'T12:00:00'), 7));
  if (c.result) return c;
  if (t < end) return { ...c, prog: Math.max(0, gap(c.start, t)) };
  const es = S.entries.filter(e => e.day >= c.start && e.day < end), sym = es.filter(e => e.kind === 'memo' && x.rule && x.rule.re.test(e.text));
  const has = e => (x.tags || []).some(tg => (e.tags||[]).includes(tg));
  const short = S.health && S.health.on ? (S.health.short||[]).filter(d => d >= c.start && d < end) : [];
  const hl = !S.health || !S.health.on ? '' : short.some(d => sym.some(m => m.day === d)) ? '이런 날이기도 했어요: 잠이 짧았던 날.' : '잠은 평소와 비슷했어요.';
  const keep = c.variant === '디카페인' ? 'decaf' : 'filter'; let r;
  if (c.mode === 'more') { const ate = es.filter(has); r = ate.length < 3 ? { result:'kept', line:`확인하는 동안 ${josaI(c.what)} 많지 않았어요. 그래서 이번엔 판단하지 않을게요.` } : sym.length ? { result:'yes', line:`${josaO(c.what)} 더 먹은 주에도 ${josaI(x.rule.sym)} 이어졌어요.` } : { result:'same', line:'더 먹어봐도 비슷했어요.' }; }
  else { const ate = es.filter(e => has(e) && !(c.mode === 'swap' && (e.tags||[]).includes(keep)));
    r = ate.length ? { result:'kept', line:`확인하는 동안에도 ${josaI(c.mode === 'swap' ? '다른 커피' : c.what)} 있었어요. 그래서 이번엔 판단하지 않을게요.` }
      : !sym.length ? { result:'yes', line: c.mode === 'swap' ? `${c.variant}로 바꾼 주에는 ${josaI(x.rule.sym)} 없었어요.` : `${josaO(c.what)} 뺀 일주일 동안은 ${josaI(x.rule.sym)} 없었어요.` }
      : { result:'same', line: c.mode === 'swap' ? `${c.variant}로 바꿔봐도 비슷했어요. 커피 종류 때문은 아닌 것 같아요.` : `${c.what} 빼봐도 비슷했어요. ${c.what} 때문은 아닌 것 같아요.` }; }
  Object.assign(c, r, { health: hl }); save(); return c;
}
function startCheck(x, mode, variant){ S.checks = S.checks || {}; S.checks[x.id] = { mode, what: x.what, variant, start: today() }; save(); buzz(); }
// 제품 보기 (예시 데이터): 같은 종류 2~3개, 판매처별 최저가, 정품·인증 확인, 가장 싼 확인된 판매처 링크 하나
const PRODUCTS = { '필터 커피': { title:'드립백 · 필터 커피', why:'종이 필터로 걸러 커피 기름 성분이 적게 들어가는 방식이에요.', items:[
  { name:'A사 드립백 (10개입)', unit:'개당', sellers:[['A사 공식 스토어',8900,true,'공식 판매처'],['B마켓',8400,true,'정품 인증 판매자'],['C몰',7600,false,'판매자 정보 확인 안 됨']] },
  { name:'B사 드립백 (12개입)', unit:'개당', sellers:[['B사 공식 스토어',10800,true,'공식 판매처'],['B마켓',9900,true,'정품 인증 판매자']] },
  { name:'C사 종이 필터 + 원두 (200g)', unit:'세트', sellers:[['C사 공식 스토어',15000,true,'공식 판매처'],['D몰',13900,true,'정품 인증 판매자']] } ] } };
// ---- 큐레이션 사례 (예시 데이터, 가상의 제품) ----
// 각 사례는 기록에서 나온 카드/발견 하나에서만 열려요. 음식으로 충분하면 그 말을 먼저.
const V = (n, s) => [n, s[0], true, '공식 판매처'], OK = (n, p) => [n, p, true, '정품 인증 판매자'], NO = (n, p) => [n, p, false, '판매자 정보 확인 안 됨'];
Object.assign(PRODUCTS, {
  '디카페인': { title:'디카페인 커피', why:'카페인을 대부분 걷어 낸 원두라, 피곤함이 카페인 때문인지 가려 볼 때 쓸 수 있어요.', items:[
    { name:'A사 디카페인 드립백 (10개입)', unit:'개당', sellers:[['A사 공식 스토어',9900,true,'공식 판매처'],OK('B마켓',9300),NO('C몰',8200)] },
    { name:'B사 디카페인 캡슐 (10개입)', unit:'개당', sellers:[['B사 공식 스토어',7900,true,'공식 판매처'],OK('D몰',7400)] },
    { name:'C사 디카페인 원두 (200g)', unit:'봉', sellers:[['C사 공식 스토어',16000,true,'공식 판매처'],OK('B마켓',14500)] } ] },
  '숙취해소 음료': { title:'숙취해소 음료', why:'물과 꿀물로도 충분한 날이 많아요. 고른다면 성분이 비슷한 것끼리 값만 비교해요.', items:[
    { name:'A사 숙취 음료 (100ml × 10병)', unit:'병당', sellers:[['A사 공식 스토어',25000,true,'공식 판매처'],OK('B마켓',22800),NO('C몰',19900)] },
    { name:'B사 숙취 젤리 스틱 (10개입)', unit:'개당', sellers:[['B사 공식 스토어',21000,true,'공식 판매처'],OK('D몰',19500)] } ] },
  '마그네슘': { title:'마그네슘', why:'바나나·견과류·두부처럼 이미 드시는 음식에도 들어 있어요. 제품은 굳이 아니어도 돼요.', items:[
    { name:'A사 마그네슘 (60정)', unit:'정당', sellers:[['A사 공식 스토어',14900,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('B마켓',12900),NO('C몰',9900)] },
    { name:'B사 마그네슘 + 비타민B6 (90정)', unit:'정당', sellers:[['B사 공식 스토어',21000,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('D몰',18900)] } ] },
  '유산균': { title:'유산균 · 균주와 기능 기준', why:'요거트를 이미 드시니 그걸로도 충분할 수 있어요. 고른다면 이름 말고 균주와 인정받은 기능이 같은 것끼리 비교해요.', items:[
    { name:'A사 유산균 (30포) · 배변 활동 기능성', unit:'포당', sellers:[['A사 공식 스토어',29000,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('B마켓',25900),NO('C몰',19900)] },
    { name:'B사 유산균 (30캡슐) · 같은 기능성, 균주 다름', unit:'캡슐당', sellers:[['B사 공식 스토어',32000,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('D몰',28500)] },
    { name:'C사 유산균 (60캡슐) · 같은 기능성', unit:'캡슐당', sellers:[['C사 공식 스토어',45000,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('B마켓',41000)] } ] },
  '철분제': { title:'철분제 · 시간 맞추기 쉬운 형태', why:'커피와 시간을 떼기 쉬운 형태끼리 모았어요. 지금 드시는 걸 바꿀 필요는 없어요.', items:[
    { name:'A사 철분 (하루 한 알, 30정)', unit:'정당', sellers:[['A사 공식 스토어',12900,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('B마켓',11500),NO('C몰',8900)] },
    { name:'B사 액상 철분 (20병)', unit:'병당', sellers:[['B사 공식 스토어',24000,true,'공식 판매처 · 건강기능식품 신고 확인'],OK('D몰',21900)] } ] },
  '락토프리 우유': { title:'락토프리 우유', why:'유당을 미리 분해한 우유예요. 라떼를 그대로 드시면서 바꿔 볼 수 있어요.', items:[
    { name:'A사 락토프리 우유 (930ml)', unit:'팩', sellers:[['A사 공식 스토어',3500,true,'공식 판매처'],OK('B마켓',3200),NO('C몰',2700)] },
    { name:'B사 락토프리 우유 (190ml × 24팩)', unit:'팩당', sellers:[['B사 공식 스토어',23900,true,'공식 판매처'],OK('D몰',21500)] },
    { name:'C사 오트 음료 (1L)', unit:'팩', sellers:[['C사 공식 스토어',4200,true,'공식 판매처'],OK('B마켓',3800)] } ] },
  '저당 간식': { title:'단 게 당길 때 · 저당 간식', why:'단 걸 끊으라는 게 아니에요. 같은 자리에 둘 수 있는 것끼리만 모았어요. 과일이나 견과류로도 충분해요.', items:[
    { name:'A사 저당 초콜릿 (12개입)', unit:'개당', sellers:[['A사 공식 스토어',11900,true,'공식 판매처'],OK('B마켓',10500),NO('C몰',8800)] },
    { name:'B사 무가당 그릭요거트 (4개입)', unit:'개당', sellers:[['B사 공식 스토어',7900,true,'공식 판매처'],OK('D몰',7200)] },
    { name:'C사 구운 견과 (20봉)', unit:'봉당', sellers:[['C사 공식 스토어',19900,true,'공식 판매처'],OK('B마켓',17900)] } ] },
});
// 카드/발견 → 큐레이션 (음식 먼저 한 줄, 그다음 제품 보기)
const CURATE = [
  { key:'필터 커피', on:'coffee', food:'커피를 끊지 않고 내리는 방식만 바꿔 볼 수 있어요.', trig:'피곤·속 불편 메모 + 그날의 커피 사진 → 커피 종류 확인' },
  { key:'디카페인', on:'coffee', food:'카페인 때문인지 가려 보려면 몇 잔만 디카페인으로 바꿔도 돼요.', trig:'피곤 메모 + 커피 사진, 잠은 평소와 비슷' },
  { key:'숙취해소 음료', on:'bloat', food:'다음 날 아침엔 물과 꿀물이면 충분한 날이 많아요.', trig:'더부룩 메모 + 전날 밤 맥주·소주 사진' },
  { key:'마그네슘', on:'cramp', food:'바나나·두부처럼 이미 드시는 음식으로도 조금 도움이 될 수 있어요.', trig:'다리에 쥐 메모 + 커피 잦던 며칠' },
  { key:'락토프리 우유', on:'gas', when:x => /유제품/.test(x.what), food:'라떼는 그대로, 우유만 바꿔 볼 수 있어요.', trig:'아침 가스 메모 + 전날 라떼·우유 사진' },
  { key:'유산균', on:'calm', food:'지금처럼 요거트면 충분해요. 제품은 굳이 아니어도 돼요.', trig:'속 편한 날 메모 + 그날 아침 요거트 사진' },
  { key:'저당 간식', on:'skin', when:x => /단 것/.test(x.what), food:'단 게 당길 땐 과일이나 견과류를 같은 자리에 둘 수 있어요.', trig:'뾰루지 메모 + 며칠 전 단 것 사진' },
  { key:'철분제', on:'iron', food:'철분제와 커피 사이를 한두 시간만 떼면 돼요.', trig:'철분제 사진 + 같은 시간대 커피 사진' },
];
const curFor = x => CURATE.filter(c => c.on === x.id && (!c.when || c.when(x)) && !(x.id === 'coffee' && c.key === '필터 커피' && checkState(x) && checkState(x).result === 'yes'));
const curHTML = (x, first) => { const cs = curFor(x); if (!cs.length) return '';
  return `<div class="cur"${first ? why('발견 하나마다 음식으로 충분한 방법을 먼저 한 줄로. 제품은 그 아래 작게, 누른 사람에게만. 사라는 말은 하지 않아요.') : ''}>${cs.map(c => `<p>${esc(c.food)}</p><button class="pr-open" data-p="${esc(c.key)}">${esc(PRODUCTS[c.key].title.split(' · ')[0])} 제품 보기<i data-lucide="chevron-right"></i></button>`).join('')}</div>`; };
// 데모 전용 목록 (?products=1)
function productsIndex(){ const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'pidx';
  const ins = insights(), n0 = pick(); const isLive = c => ins.some(x => x.id === c.on && (!c.when || c.when(x)) && !(checkState(x) && checkState(x).result === 'same')) || (n0 && n0.id === c.on);
  ov.innerHTML = `<div class="in-top" style="justify-content:flex-start"><button id="pib" aria-label="뒤로"><i data-lucide="chevron-left"></i></button></div><div class="su ins">
    <h2>큐레이션 사례 (데모)</h2><p class="ins-sub">모두 예시 데이터예요. 각 사례가 어떤 기록에서 열리는지 함께 적었어요.</p>
    ${CURATE.map(c => `<button class="pi" data-p="${esc(c.key)}"><b>${esc(PRODUCTS[c.key].title)}</b><span>${esc(c.trig)}</span><small>${isLive(c) ? '샘플 기록에서 지금 보여요' : '샘플 기록에 아직 없어요'} · 음식 먼저: ${esc(c.food)}</small></button>`).join('')}</div>`;
  document.body.appendChild(ov); icons();
  $$('.pi', ov).forEach(b => b.onclick = () => productSheet(b.dataset.p)); $('#pib', ov).onclick = () => ov.remove(); }

// 출처 링크: 직접 열어 확인한 것만. 확인 못 한 출처는 링크 없이 글자로만.
const REFS = {
  tylenol:{ l:'식약처 의약품안전나라 · 타이레놀정500밀리그람', u:'https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=202106092' },
  ibuprofen:{ l:'식약처 의약품안전나라 · 부루펜정200밀리그램', u:'https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=197700120' },
  ssanghwa:{ l:'식약처 의약품안전나라 · 경방쌍화탕액', u:'https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=200707044' },
  galgeun:{ l:'식약처 의약품안전나라 · 경방갈근탕액', u:'https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=200711872' },
  licorice:{ l:'Penninkilampi 등, J Hum Hypertens 2017 (체계적 문헌고찰)', u:'https://pubmed.ncbi.nlm.nih.gov/28660884/' },
  honey:{ l:'Oduwole 등, Cochrane 2018 (어린이 기침과 꿀)', u:'https://doi.org/10.1002/14651858.CD007094.pub5' },
  chamomile:{ l:'Hieu 등, Phytother Res 2019 (체계적 문헌고찰)', u:'https://pubmed.ncbi.nlm.nih.gov/31006899/' },
};
const refA = k => { const r = REFS[k]; return r ? `<a class="ref" href="${r.u}" target="_blank" rel="noopener noreferrer">${esc(r.l)}<span aria-hidden="true">↗</span></a>` : ''; };
const won = n => n.toLocaleString('ko-KR') + '원';
// 가격 변동 (예시 데이터): 날짜로 정해지는 가상의 값
const seedOf = str => [...str].reduce((a, c) => a + c.charCodeAt(0), 0);
function priceOn(name, base, d){ const sd = seedOf(name), i = Math.round(new Date(d + 'T12:00:00') / 864e5);
  const f = j => 1 + .07 * Math.sin(j / 9 + sd) + .035 * Math.sin(j / 3.7 + sd * 2), i0 = Math.round(new Date(dk(base0) + 'T12:00:00') / 864e5); return Math.round(base * f(i) / f(i0) / 10) * 10; }
const base0 = new Date(base.getTime());
function history(name, base){ const t = today(); return Array.from({ length: 90 }, (_, k) => { const d = dk(add(new Date(t + 'T12:00:00'), k - 89)); return { d, p: priceOn(name, base, d) }; }); }
function chartHTML(name, base){ const h = history(name, base), ps = h.map(x => x.p), lo = Math.min(...ps), hi = Math.max(...ps), cur = ps.at(-1);
  const W = 320, H = 84, px = i => 4 + i * (W - 8) / (h.length - 1), py = p => 10 + (hi - p) * (H - 24) / ((hi - lo) || 1);
  const path = h.map((x, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(x.p).toFixed(1)}`).join('');
  const li = ps.indexOf(lo), hiI = ps.indexOf(hi), pos = (cur - lo) / ((hi - lo) || 1);
  const verdict = pos <= .15 ? '지금이 최근 최저가에 가까워요' : pos >= .75 ? '최근보다 비싼 편이에요' : '최근 가격과 비슷한 편이에요';
  const m0 = new Date(h[0].d + 'T12:00:00');
  return `<div class="pc"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="최근 석 달 가격 변동 (예시)"><path d="${path}" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${px(li)}" cy="${py(lo)}" r="3" fill="#2F6FD8"/><circle cx="${px(hiI)}" cy="${py(hi)}" r="3" fill="#C0362C"/><circle cx="${px(h.length-1)}" cy="${py(cur)}" r="4.5" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/></svg>
    <div class="pc-k"><span><i style="background:#2F6FD8"></i>최저 ${won(lo)}</span><span><i style="background:#C0362C"></i>최고 ${won(hi)}</span><span><i style="background:var(--accent);box-shadow:inset 0 0 0 1.5px var(--ink)"></i>지금 ${won(cur)}</span></div>
    <div class="pc-ax"><span>${m0.getMonth()+1}월</span><span>지금</span></div><p class="pc-v">${verdict}</p></div>`; }
function rangeHTML(it, first){ const all = it.sellers, lo = Math.min(...all.map(x => x[1])), hi = Math.max(...all.map(x => x[1]));
  const ver = all.filter(x => x[2]).sort((a, b) => a[1] - b[1]), best = ver[0], top = all.slice().sort((a, b) => b[1] - a[1])[0], cheapUnver = all.find(x => !x[2] && x[1] < best[1]);
  const pct = p => ((p - lo) / ((hi - lo) || 1) * 100).toFixed(1);
  const side = (x, lbl) => `<div class="rg-c"><small>${lbl}</small><b>${won(x[1])}</b><span>${esc(x[0])}</span><span class="pr-v${x[2] ? '' : ' no'}"><i data-lucide="${x[2] ? 'badge-check' : 'circle-help'}"></i>${esc(x[3])}</span></div>`;
  return `<div class="rg"${first ? why('판매처 사이 가격 폭을 막대 하나로. 표시는 확인된 판매처 중 가장 싼 곳에만 해요. 확인 안 된 곳이 더 싸면 흐리게만 알려요.') : ''}>
    <div class="rg-bar"><span class="rg-fill"></span><i class="rg-m" style="left:${pct(best[1])}%"></i>${cheapUnver ? `<i class="rg-u" style="left:${pct(cheapUnver[1])}%"></i>` : ''}</div>
    <div class="rg-ends"><span>${won(lo)}</span><span>${won(hi)}</span></div>
    <div class="rg-cols"${first ? why('가장 싼 확인된 곳과 가장 비싼 곳을 나란히 두어 차이를 바로 보게 해요. 어느 쪽도 권하지 않아요.') : ''}>${side(best, '확인된 곳 중 가장 싼 곳')}${side(top, '가장 비싼 곳')}</div>
    ${cheapUnver ? `<p class="rg-note"><i data-lucide="circle-help"></i>${esc(cheapUnver[0])}가 더 싸지만 판매자 정보가 확인되지 않았어요.</p>` : ''}</div>`; }
const watching = name => !!(S.watch && S.watch[name]);
function productSheet(key){ const P = PRODUCTS[key]; if (!P) return;
  const rows = P.items.map(it => { const v = it.sellers.filter(x => x[2]).sort((a,b) => a[1] - b[1]); const best = v[0]; const cnt = parseInt((it.name.match(/(\d+)개입/)||[])[1] || 0);
    return { it, best, per: cnt ? Math.round(best[1] / cnt) : null }; });
  const cheapest = rows.slice().sort((a, b) => (a.per || a.best[1]) - (b.per || b.best[1]))[0];
  const bg = sheet(`<div class="s-eyebrow">제품으로 고른다면 · 예시 데이터</div><h2 class="s-title">${esc(P.title)}</h2><p class="pr-why">${esc(P.why)} 꼭 사지 않아도 돼요.</p>
    ${rows.map(r => `<div class="pr"${r === rows[0] ? why('비슷한 제품 2~3개만, 판매처마다 확인된 곳 중 가장 싼 값으로. 가격은 쇼핑 정보라 숫자를 보여 주는 유일한 예외예요.') : ''}><div class="pr-h"><b>${esc(r.it.name)}</b>${r.per ? `<span>${esc(r.it.unit)} ${won(r.per)}</span>` : ''}</div>
      ${rangeHTML(r.it, r === rows[0])}
      <div${r === rows[0] ? why('가격 추적기처럼 최근 석 달 흐름을 선 하나로. 지금 사도 괜찮은지 한 줄 판단만 덧붙이고, 사라고 권하지 않아요.') : ''}>${chartHTML(r.it.name, r.best[1])}</div>
      <label class="pw"${r === rows[0] ? why('원하는 사람만 켜는 가격 지켜보기. 내려가면 알림을 쏟아내지 않고, 다른 한 줄이 없는 날에만 홈·위젯에 한 줄로 알려요.') : ''}><span><i data-lucide="bell"></i>가격이 내려가면 한 줄로 알려 주기</span><input type="checkbox" data-w="${esc(r.it.name)}" data-b="${r.best[1]}" ${watching(r.it.name) ? 'checked' : ''}><em></em></label></div>`).join('')}
    <a class="pr-go" href="#" onclick="return false"${why('링크는 하나만, 확인된 판매처 중 가장 싼 곳으로. 특가 배너나 구매 유도 문구는 두지 않아요.')}>확인된 판매처 중 가장 싼 곳 보기<small>${esc(cheapest.it.name)} · ${esc(cheapest.best[0])} ${won(cheapest.best[1])}</small></a>
    <p class="disc">가격과 변동 그래프는 예시 데이터예요. 실제 제품·가격이 아니고, 이 앱은 판매 수수료를 받지 않는다는 가정이에요.</p>`);
  $$('[data-w]', bg).forEach(c => c.onchange = () => { S.watch = S.watch || {}; if (c.checked) S.watch[c.dataset.w] = { base: +c.dataset.b, at: priceOn(c.dataset.w, +c.dataset.b, today()), day: today(), key }; else delete S.watch[c.dataset.w]; save(); buzz(); });
  notesRefresh(); }
function insightsPage(){
  let list = insights(); const t = today(), fo = focus();
  const ds = d => { const n = gap(d, t); if (n <= 2) return dayName(d, t); const x = new Date(d + 'T12:00:00'); return `${x.getMonth()+1}월 ${x.getDate()}일 ${WD[x.getDay()]}`; };
  const stack = a => { const ph = a.filter(e => src(e)).slice(0, 4); return `<span class="stk">${ph.map(e => `<img src="${src(e)}" alt="">`).join('')}${a.some(e => !src(e)) ? '<span class="m"><i data-lucide="pen-line"></i></span>' : ''}</span>`; };
  const tline = a => { const by = {}; a.forEach(e => (by[e.day] = by[e.day] || []).push(e)); return `<ol class="tln">${Object.keys(by).sort().map(d => `<li><span class="d">${esc(ds(d))}</span><span class="r">${by[d].map(e => `<span class="ti">${src(e) ? `<img src="${src(e)}" alt="">` : '<i data-lucide="pen-line"></i>'}${esc(e.text)}${e.sleep ? '<em>잠이 짧았던 날</em>' : ''}</span>`).join('')}</span></li>`).join('')}</ol>`; };
  const act = x => { if (x.inter || x.id === 'sleep') return '';
    if (x.kind === 'swap' && !x.ambiguous) return '';
    const btn = (m, v, label, ic) => `<button class="ck-go" data-m="${m}" data-v="${v||''}"><i data-lucide="${ic}"></i>${label}</button>`;
    return `<div class="ck-acts"${why('음식이 정말 상관있는지 직접 가려 보는 방법. 질문이 아니라 원할 때 누르는 버튼이고, 알림 없이 조용히 지켜봐요. 커피처럼 끊기 어려운 건 끊지 않고 종류만 바꿔 봐요.')}>${x.kind === 'swap' ? btn('swap','필터 커피','필터 커피로만 며칠','coffee') + btn('swap','디카페인','디카페인으로 며칠','coffee') : x.kind === 'help' ? btn('more','','며칠 더 먹어보기','plus') : btn('avoid','','며칠만 빼보기','minus')}</div>`; };
  const ckHTML = (x, c) => {
    if (c.prog !== undefined) { const lbl = c.mode === 'swap' ? `${c.variant}로만 마셔 보는 중` : c.mode === 'more' ? `${josaO(c.what)} 더 먹어 보는 중` : `${josaO(c.what)} 빼 보는 중`;
      return `<div class="ck-prog"${why('진행 중이라는 건 점으로만. 날짜를 세라고 하지 않고, 알림도 보내지 않아요. 언제든 그만둘 수 있어요.')}><span class="ck-l">${esc(lbl)}</span><span class="ck-dots">${Array.from({length:7}, (_, i) => `<i class="${i < c.prog ? 'on' : ''}"></i>`).join('')}</span><button class="ck-stop">그만두기</button><small>일주일 동안 조용히 지켜볼게요</small></div>`; }
    if (c.result === 'yes') return `<div class="ck-res yes"${why('직접 해 본 결과는 그대로 한 줄로. 그래도 \'~수도 있어요\'처럼 단정하지 않아요.')}><span class="ck-b"><i data-lucide="check-circle-2"></i>직접 확인했어요</span><p>${esc(c.line)}</p>${c.health ? `<small><i data-lucide="heart-pulse"></i>${esc(c.health)}</small>` : ''}${c.guess ? `<p class="ck-guess">${esc(c.guess)}</p>` : ''}${c.variant && PRODUCTS[c.variant] ? `<button class="pr-open" data-p="${esc(c.variant)}">${esc(c.variant)} 제품 보기<i data-lucide="chevron-right"></i></button>` : ''}</div>`;
    if (c.result === 'kept') return `<div class="ck-res kept"${why('확인하는 동안 계속 먹었다면 결론을 내리지 않고 그대로 말해요. 탓하지 않아요.')}><p>${esc(c.line)}</p></div>${act(x)}`;
    return ''; };
  const stepsHTML = x => !x.steps || !x.steps.length ? '' : `<ol class="nar"${why('한 번에 결론 내지 않고, 대비되는 날이 쌓일 때마다 한 줄씩 좁혀 가요(잠 → 카페인 → 커피 종류). 그래도 애매할 때만 종류 바꾸기를 제안해요.')}>${x.steps.map(st => `<li class="${st.open ? 'open' : ''}">${esc(st.t)}${st.src ? `<em><i data-lucide="heart-pulse"></i>${esc(st.src)}</em>` : ''}</li>`).join('')}${x.ambiguous && x.kind === 'swap' ? `<li class="open">${x.types && x.types.length ? esc(x.types.join('·')) + ' 중 어느 쪽인지는 아직 애매해요.' : '어떤 커피인지는 아직 애매해요.'}</li>` : ''}</ol>`;
  const card = (x, hero) => { const c = checkState(x);
    return `<article class="fd${x.inter ? ' inter' : ''}${x.pos ? ' pos' : ''}${hero ? ' hero' : ''}" data-id="${x.id}">
      ${hero ? `<div class="fd-new"${why('가장 최근에 알게 된 것 하나만 위로. 새로 생겼다는 건 작은 점으로만 알려요.')}><i></i>새로 알게 된 것</div>` : ''}
      ${x.inter ? `<div class="fd-tag"${why('밥심이 실제로 챙겼던 약 조합. 같은 카드 형식이지만 옅은 바탕으로 조용히 구분해요.')}><i data-lucide="shield-check"></i>챙겼던 조합</div>` : ''}
      ${x.pos ? `<div class="fd-tag pos"${why('좋았던 날의 겹침도 같은 규칙으로 모아요. 잎 하나로만 구분해요.')}><i data-lucide="leaf"></i>좋았던 날</div>` : ''}
      <p class="fd-t">${esc(x.text)}</p>
      ${x.hl ? `<p class="fd-hl"${why('건강 데이터는 원인으로 쓰지 않고, \'이런 날이기도 했어요\'처럼 곁들여 적기만 해요.')}><i data-lucide="heart-pulse"></i>${esc(x.hl)}</p>` : ''}
      ${stepsHTML(x)}
      ${c ? ckHTML(x, c) : act(x)}
      ${curHTML(x, hero)}
      <div class="fd-f"${hero ? why('근거는 겹친 사진 몇 장으로만 보여 주고, 날짜별 기록은 원할 때만 펼쳐요. 숫자로 몇 번인지 세지 않아요.') : ''}>${stack(x.src)}<span class="ai" aria-label="AI가 쓴 문장"${hero ? why('알게 된 것의 문장도 AI가 기록을 보고 써요. 근거 사진 옆, 같은 작은 표시.') : ''}>AI</span><button class="fd-more">기록 보기<i data-lucide="chevron-down"></i></button></div>
      <div class="fd-ev">${tline(x.src)}</div></article>`; };
  let body = '';
  if (list.length) {
    list.forEach(x => { const c = checkState(x); if (c && c.result === 'yes') x.latest = dk(add(new Date(c.start + 'T12:00:00'), 7)); });
    const gone = list.filter(x => { const c = checkState(x); return c && c.result === 'same'; }); list = list.filter(x => !gone.includes(x));
    const hero = list.find(x => fo && (x.focusSym||[]).includes(fo)) || list.slice().sort((a,b) => (a.latest < b.latest ? 1 : a.latest > b.latest ? -1 : (a.inter ? 1 : 0) - (b.inter ? 1 : 0)))[0];
    body += card(hero, true);
    for (const [k, [name, ic]] of Object.entries(AREAS)) { const g = list.filter(x => x.area === k && x !== hero); if (!g.length) continue;
      body += `<section class="ar"><h3${k==='gut'?why('몸의 부위별로 묶어서, 비슷한 카드가 끝없이 이어지는 기록처럼 보이지 않게 했어요.'):''}><i data-lucide="${ic}"></i>${name}</h3>${g.map(x => card(x)).join('')}</section>`; }
    if (gone.length) body += `<details class="gone"${why('빼봐도 비슷했던 건 지우지 않고 흐리게 접어 둬요. 틀렸다고 판정하지 않고, 지나간 것으로.')}><summary><i data-lucide="archive"></i>비슷했던 것</summary>${gone.map(x => `<div class="gone-it"><p>${esc(x.text)}</p><small>${esc(checkState(x).line)}</small></div>`).join('')}</details>`;
  } else body = `<div class="ins-empty"${why('빈 화면이 고장처럼 보이지 않게, 저절로 채워진다는 걸 알려요. 할 일을 주지 않아요.')}><i data-lucide="sprout"></i><b>아직 알게 된 게 없어요</b><span>기록이 쌓여 겹치는 게 보이면 여기에 조용히 적혀요.</span></div>`;
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'ins';
  ov.innerHTML = `<div class="in-top" style="justify-content:flex-start"><button id="ib" aria-label="뒤로"><i data-lucide="chevron-left"></i></button></div><div class="su ins">
    <h2${why('\'내 몸 사용설명서\'는 진단처럼 들려서, 내 기록에서 보인 것만 담는다는 뜻으로 지었어요.')}>나에 대해 알게 된 것</h2><p class="ins-sub"${why('설명은 한 줄로. 원인을 단정하지 않는다는 건 아래 안내에 한 번만.')}>내 기록에서 겹쳐 보인 것만 적어 둬요.</p>${fo ? `<p class="focus"${why('한 번에 불편 하나만 지켜봐요. 자주, 최근에, 일상에 크게 걸리는 것을 골라요. 여러 개를 동시에 쫓으면 아무것도 가려지지 않아요.')}><i data-lucide="crosshair"></i><span>지금은 <b>${esc(fo)}</b>${/[가-힣]/.test(fo) && (fo.charCodeAt(fo.length-1)-0xAC00)%28 ? '을' : '를'} 지켜보고 있어요</span></p>` : ''}
    ${body}<p class="disc">기록이 겹쳤다는 뜻일 뿐, 원인을 뜻하지 않아요.</p></div>`;
  document.body.appendChild(ov); icons();
  $$('.fd-more', ov).forEach(b => b.onclick = () => { const c = b.closest('.fd'); c.classList.toggle('open'); b.firstChild.textContent = c.classList.contains('open') ? '접기' : '기록 보기'; buzz(); notesRefresh(); });
  $$('.ck-go', ov).forEach(b => b.onclick = () => { const id = b.closest('.fd').dataset.id, x = list.find(y => y.id === id); startCheck(x, b.dataset.m, b.dataset.v || undefined); ov.remove(); insightsPage(); });
  $$('.ck-stop', ov).forEach(b => b.onclick = () => { delete S.checks[b.closest('.fd').dataset.id]; save(); ov.remove(); insightsPage(); });
  $$('.pr-open', ov).forEach(b => b.onclick = () => productSheet(b.dataset.p));
  $('#ib', ov).onclick = () => { ov.classList.add('out'); setTimeout(() => { ov.remove(); notesRefresh(); }, 250); };
  $('.su', ov).addEventListener('scroll', () => notesOn && notesRefresh(), { passive: true });
  notesRefresh();
}

// ---- 건강 데이터 연결 (목업 권한 화면, 한 번만, 선택) ----
function healthConnect(){
  const isA = /iPhone|iPad/.test(navigator.userAgent);
  const bg = sheet(`<div class="hc"><div class="hc-ic"><i data-lucide="heart-pulse"></i></div><div class="s-eyebrow" style="text-align:center;margin:12px 0 0">${isA ? 'Apple 건강' : 'Health Connect'}</div>
    <h2 class="s-title" style="text-align:center;margin:6px 0 8px">밥심이 읽을 수 있는 정보</h2>
    <p class="hc-p"${why('왜 필요한지 먼저 말해요. 숫자를 보여 주려는 게 아니라, 한 줄의 근거를 조금 더 정확하게 하려는 것뿐이에요.')}>잠이 짧았던 날 같은 맥락을 조용히 참고해요. 숫자로 보여 주거나 따로 화면을 만들지 않아요.</p>
    ${[['moon','수면'],['footprints','걸음 수'],['activity','심박수']].map(([i,l]) => `<label class="hc-row"><span><i data-lucide="${i}"></i>${l}</span><input type="checkbox" checked><em></em></label>`).join('')}
    <p class="hc-f"><i data-lucide="lock"></i>읽기만 해요. 이 휴대폰 밖으로 보내지 않아요.</p>
    <button class="primary" id="hc-ok">허용</button><button class="ghost" id="hc-no">허용 안 함</button></div>`);
  $('#hc-ok', bg).onclick = () => { S.health = { on:true, sample:true, short:[12,6,4].map(d => dk(add(base,-d))) }; save(); buzz(); bg.close(); render(); };
  $('#hc-no', bg).onclick = () => bg.close();
  notesRefresh();
}

// ---- Android One UI 알림창 위젯 목업 (?widget=1) ----
function widget(){
  $$('#shade').forEach(x => x.remove());
  const n = pick(), t = new Date(), hh = String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0');
  const d = new Date(today() + 'T12:00:00'), date = `${d.getMonth()+1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일`;
  const ov = document.createElement('div'); ov.className = 'shade'; ov.id = 'shade';
  const qs8 = ['wifi','bluetooth','volume-2','flashlight','plane','rotate-ccw'];
  ov.innerHTML = `<div class="sh-status"><span>${hh}</span><span class="r"><i data-lucide="wifi"></i><i data-lucide="signal"></i><i data-lucide="battery-full"></i></span></div>
    <div class="sh-head"><div><b>${hh}</b><span>${date}</span></div><span class="r"><i data-lucide="search"></i><i data-lucide="settings"></i></span></div>
    <div class="sh-qs">${qs8.map((q,i) => `<span class="${i<2?'on':''}"><i data-lucide="${q}"></i></span>`).join('')}</div>
    <div class="sh-bright"><i data-lucide="sun"></i><span><i style="width:62%"></i></span></div>
    <div class="ow ${n ? 'has' : ''}" id="ow"${why('늘 떠 있는 진행 중 알림 위젯. 앱을 열지 않고 알림창을 내린 김에 바로 찍게 해요. 찍는 습관이 끊기지 않게 하는 입구예요.')}>
      <span class="ow-ic"${why('어떤 앱인지 한눈에. 로고 하나면 충분해서 앱 이름 줄은 따로 두지 않았어요.')}><i></i></span>
      <button class="ow-line" id="owl"${why(n ? '한 줄 카드와 같은 내용을 더 짧게. 누르면 앱에서 이유와 대안이 열려요. 다음 날이면 스스로 기본 문구로 돌아가요.' : '기본 상태는 할 일 하나만: 찍어 두기. 정보가 없을 땐 아무 정보도 보여 주지 않아요.')}>${n ? `<small>${esc(n.pair)}<span class="ai" aria-label="AI가 쓴 문장">AI</span></small>${esc(n.short)}` : '찍어 두기만 하세요'}</button>
      <button class="ow-shot" id="ows" aria-label="찍어 두기 (길게 누르면 몸 상태 적기)"${why('유일한 동작. 셔터 모양이라 설명이 필요 없어요. 누르면 카메라, 길게 누르면 몸 상태 칩이 나와요.')}><i data-lucide="camera"></i></button>
    </div>
    <div class="sh-n"><span class="ic"><i data-lucide="message-circle"></i></span><div><b>메시지</b><span>오늘 저녁 7시 괜찮아?</span></div><em>방금</em></div>
    <div class="sh-foot"><button id="owx">닫기</button></div>`;
  document.body.appendChild(ov); icons();
  const close = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 260); };
  let lp = null, lpFired = false; const ows = $('#ows', ov);
  ows.addEventListener('pointerdown', () => { lpFired = false; lp = setTimeout(() => { lpFired = true; buzz(); owChips(); }, 480); });
  ['pointerup','pointerleave','pointercancel'].forEach(ev => ows.addEventListener(ev, () => clearTimeout(lp)));
  ows.onclick = () => { if (lpFired) return; buzz(); close(); capture(false); };
  function owChips(){ $$('.ow-pop', ov).forEach(x => x.remove()); const pop = document.createElement('div'); pop.className = 'ow-pop';
    pop.setAttribute('data-why', '셔터를 길게 누르면 몸 상태를 한 번 탭으로. 앱을 열지 않아도 되고, 질문은 없어요.');
    pop.innerHTML = [...freqOrder(MEMO_NEG), ...freqOrder(MEMO_POS)].map(c => `<button data-m="${esc(memoText(c))}">${esc(c)}</button>`).join('');
    $('#ow', ov).after(pop);
    $$('button', pop).forEach(b => b.onclick = () => { saveMemo(b.dataset.m); pop.innerHTML = '<span class="ok">적어 뒀어요</span>'; setTimeout(() => { pop.remove(); render(); }, 900); });
    notesRefresh(); }
  $('#owl', ov).onclick = () => { close(); if (n) setTimeout(() => n.product ? productSheet(n.product) : detail(n), 280); };
  $('#owx', ov).onclick = close;
  notesRefresh();
}

// ---- 디자인 노트 (?notes=1) ----
let notesOn = false;
function notesRefresh(){ if (!notesOn) return; requestAnimationFrame(() => { $$('.why-pin,.why-panel').forEach(x => x.remove());
  const top = $$('.sh-bg').at(-1) || $$('.shade').at(-1) || $$('.ov').at(-1); const scope = top || document;
  const els = $$('[data-why]', scope).filter(el => { const r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight && r.left < innerWidth && r.right > 0; });
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
  if (qs.has('widget')) widget();
  if (qs.has('products')) productsIndex();
  document.addEventListener('click', ev => { const b = ev.target.closest('.sh .pr-open'); if (b) productSheet(b.dataset.p); });
  if (qs.has('insights')) insightsPage();
  if (qs.has('memo')) composer();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); })();
window.__bapsim = { S, render };
})();
