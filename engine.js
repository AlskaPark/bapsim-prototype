// 밥심 — 클라이언트 사이드 규칙 엔진 (백엔드 없음)
(function(){
// 규칙 기반 지식베이스 (시나리오 데모 응답 엔진)
// ⚠️ 건강기능식품 문구는 식약처 고시형 기능성 문구 요약, 한방 일반의약품 문구는 대표 품목 허가사항 요약입니다.
//    실제 서비스 전 각 제품의 허가사항/표시사항 원문 대조가 필요합니다.

const TOPICS = [
  {
    id: 'chill', label: '환절기 · 으슬으슬함',
    keywords: ['으슬','환절기','감기','오한','몸살','콧물','재채기','목이','목 아','칼칼','추워','춥','한기','코막'],
    foods: [
      { name: '생강차', comp: '진저롤·쇼가올', effect: '진저롤 성분이 연구에서 항염·체온 관련 작용이 보고되어, 몸을 따뜻하게 하는 데 도움이 될 수 있어요', tags: ['ginger'] },
      { name: '대추차', comp: '사포닌·플라보노이드', effect: '대추의 플라보노이드 성분이 연구에서 항산화 작용이 보고되어, 컨디션 관리에 도움이 될 수 있어요', tags: [] },
      { name: '귤 · 유자차', comp: '비타민C·헤스페리딘', effect: '비타민C는 항산화 작용으로 유해산소로부터 세포를 보호하는 데 필요한 영양소로 알려져 있어요', tags: ['citrus'] },
      { name: '닭고기 수프(맑은 닭곰탕)', comp: '단백질·카르노신', effect: '닭고기 수프가 연구에서 상기도 점막 관련 염증 반응을 완화하는 작용이 보고되어, 회복기 식사로 도움이 될 수 있어요', tags: [] },
    ],
    supplements: [
      { name: '비타민C', claim: '항산화 작용을 하여 유해산소로부터 세포를 보호하는데 필요', tags: ['vitc'] },
      { name: '아연', claim: '정상적인 면역기능에 필요', tags: ['zinc'] },
      { name: '홍삼', claim: '면역력 증진·피로개선에 도움을 줄 수 있음', tags: ['ginseng'] },
    ],
    otc: [
      { name: '쌍화탕', claim: '피로회복, 허약체질, 병후의 체력저하 (대표 품목 허가사항 요약)', tags: ['licorice'], ingredients: '작약·숙지황·황기·당귀·천궁·계피·감초·생강·대추' },
      { name: '갈근탕', claim: '감기, 코감기, 두통, 어깨결림, 근육통 (대표 품목 허가사항 요약)', tags: ['licorice','ephedra'], ingredients: '갈근·마황·계지·작약·감초·생강·대추' },
    ],
  },
  {
    id: 'fatigue', label: '피로 · 기운 없음',
    keywords: ['피곤','피로','기운이 없','기운 없','무기력','지쳐','지침','힘이 없','늘어','에너지','체력','나른'],
    foods: [
      { name: '돼지고기 안심 · 현미', comp: '비타민B1(티아민)', effect: '비타민B1은 탄수화물과 에너지 대사에 필요한 영양소로 알려져 있어요', tags: [] },
      { name: '시금치 · 소고기', comp: '철분', effect: '철분은 체내 산소운반과 혈액생성에 필요한 영양소로, 부족 시 피로와 관련이 보고되어 있어요', tags: [] },
      { name: '바나나 · 견과류', comp: '마그네슘·칼륨', effect: '마그네슘은 에너지 이용과 신경·근육 기능 유지에 필요한 영양소로 알려져 있어요', tags: ['nuts'] },
      { name: '마(산약)', comp: '디오스게닌·뮤신', effect: '마의 디오스게닌 성분이 연구에서 피로 관련 지표 개선 작용이 보고되어, 기력 관리에 도움이 될 수 있어요', tags: [] },
    ],
    supplements: [
      { name: '홍삼', claim: '피로개선·면역력 증진에 도움을 줄 수 있음', tags: ['ginseng'] },
      { name: '비타민B군(B1·B2·B6 등)', claim: '탄수화물과 에너지 대사에 필요', tags: [] },
      { name: '마그네슘', claim: '에너지 이용에 필요, 신경과 근육 기능 유지에 필요', tags: ['magnesium'] },
    ],
    otc: [
      { name: '쌍화탕', claim: '피로회복, 허약체질, 병후의 체력저하 (대표 품목 허가사항 요약)', tags: ['licorice'], ingredients: '작약·숙지황·황기·당귀·천궁·계피·감초·생강·대추' },
    ],
  },
  {
    id: 'digest', label: '소화 · 더부룩함',
    keywords: ['소화','더부룩','체한','체했','속이','배가 빵','가스','위가','명치','속쓰','변비','장이','배변','설사'],
    foods: [
      { name: '무(무즙·뭇국)', comp: '디아스타제(아밀라아제)', effect: '무의 디아스타제 효소가 연구에서 전분 분해 작용이 보고되어, 소화에 도움이 될 수 있어요', tags: [] },
      { name: '양배추', comp: '비타민U(S-메틸메티오닌)', effect: '비타민U 성분이 연구에서 위 점막 보호 작용이 보고되어, 위 편안함에 도움이 될 수 있어요', tags: [] },
      { name: '매실차', comp: '구연산·유기산', effect: '매실의 유기산 성분이 연구에서 소화액 분비 촉진 작용이 보고되어, 식후 편안함에 도움이 될 수 있어요', tags: [] },
      { name: '플레인 요거트', comp: '유산균', effect: '요거트의 유산균이 연구에서 장내 균총 개선 작용이 보고되어, 장 건강에 도움이 될 수 있어요', tags: ['dairy'] },
      { name: '김치 · 된장(발효식품)', comp: '식물성 유산균', effect: '발효식품의 유산균이 연구에서 장내 균총 개선 작용이 보고되어 있어요 (짠 편이라 양은 적당히)', tags: [] },
    ],
    supplements: [
      { name: '프로바이오틱스', claim: '유산균 증식 및 유해균 억제에 도움을 줄 수 있음, 배변활동 원활에 도움을 줄 수 있음', tags: [] },
      { name: '식이섬유(난소화성말토덱스트린 등)', claim: '배변활동 원활에 도움을 줄 수 있음', tags: [] },
    ],
    otc: [
      { name: '평위산', claim: '식욕부진, 소화불량, 위부팽만감 (대표 품목 허가사항 요약)', tags: ['licorice'], ingredients: '창출·후박·진피·감초·생강·대추' },
    ],
  },
  {
    id: 'sleep', label: '수면 · 긴장',
    keywords: ['잠','수면','불면','못 자','못자','깨','스트레스','긴장','예민','불안','초조'],
    foods: [
      { name: '따뜻한 우유', comp: '트립토판', effect: '트립토판은 세로토닌·멜라토닌 합성의 원료로, 연구에서 수면 관련 작용이 보고되어 있어요', tags: ['dairy'] },
      { name: '체리(타트체리)', comp: '멜라토닌', effect: '타트체리의 멜라토닌 성분이 연구에서 수면 시간·질 관련 개선 작용이 보고되어, 숙면에 도움이 될 수 있어요', tags: [] },
      { name: '캐모마일차', comp: '아피제닌', effect: '아피제닌 성분이 연구에서 진정 관련 작용이 보고되어, 편안한 휴식에 도움이 될 수 있어요', tags: ['ragweed'] },
      { name: '녹차(저카페인/디카페인) ', comp: 'L-테아닌', effect: 'L-테아닌 성분이 연구에서 긴장 완화 작용이 보고되어 있어요 (일반 녹차는 카페인이 있어 저녁엔 주의)', tags: [] },
    ],
    supplements: [
      { name: 'L-테아닌', claim: '스트레스로 인한 긴장완화에 도움을 줄 수 있음', tags: [] },
      { name: '미강주정추출물', claim: '수면의 질 개선에 도움을 줄 수 있음', tags: [] },
      { name: '마그네슘', claim: '신경과 근육 기능 유지에 필요', tags: ['magnesium'] },
    ],
    otc: [
      { name: '천왕보심단', claim: '신경쇠약, 불면, 건망증, 가슴두근거림 (대표 품목 허가사항 요약)', tags: ['licorice'], ingredients: '지황·인삼·당귀·산조인·백자인·천문동·맥문동 등' },
    ],
  },
  {
    id: 'eye', label: '눈 피로',
    keywords: ['눈이','눈 피','침침','눈건강','모니터','눈이 뻑'],
    foods: [
      { name: '시금치 · 케일', comp: '루테인·지아잔틴', effect: '루테인 성분이 연구에서 황반색소밀도 유지 작용이 보고되어, 눈 건강에 도움이 될 수 있어요', tags: [] },
      { name: '블루베리', comp: '안토시아닌', effect: '안토시아닌 성분이 연구에서 눈의 피로 관련 지표 개선 작용이 보고되어 있어요', tags: [] },
      { name: '고등어 · 연어', comp: 'EPA·DHA', effect: 'DHA는 망막 구성 성분으로, 연구에서 건조한 눈 관련 개선 작용이 보고되어 있어요', tags: ['fish','omega3'] },
    ],
    supplements: [
      { name: '루테인', claim: '노화로 인해 감소될 수 있는 황반색소밀도를 유지하여 눈 건강에 도움을 줄 수 있음', tags: [] },
      { name: 'EPA 및 DHA 함유 유지(오메가3)', claim: '건조한 눈을 개선하여 눈 건강에 도움을 줄 수 있음', tags: ['omega3','fish'] },
    ],
    otc: [],
  },
  {
    id: 'hangover', label: '음주 후 · 간 컨디션',
    keywords: ['숙취','술','음주','회식','간 건강','간이'],
    foods: [
      { name: '콩나물국', comp: '아스파라긴산', effect: '아스파라긴산 성분이 연구에서 알코올 대사 관련 작용이 보고되어, 음주 후 컨디션에 도움이 될 수 있어요', tags: [] },
      { name: '북엇국', comp: '메티오닌·타우린', effect: '북어의 아미노산 성분이 연구에서 간 해독 관련 작용이 보고되어 있어요', tags: ['fish'] },
      { name: '꿀물', comp: '과당', effect: '과당이 연구에서 알코올 분해 속도 관련 작용이 보고되어 있어요', tags: ['sugar'] },
    ],
    supplements: [
      { name: '밀크씨슬(카르두스 마리아누스) 추출물', claim: '간 건강에 도움을 줄 수 있음', tags: ['ragweed'] },
    ],
    otc: [],
  },
];

// 안전 규칙: 프로필 조건 × 태그 → exclude(제외) 또는 warn(주의)
const SAFETY_RULES = [
  { cond: 'hypertension', tag: 'licorice', action: 'exclude', msg: '감초가 들어 있어요. 감초의 글리시리진은 장기·과량 복용 시 혈압 상승·부종과 관련이 보고되어 고혈압이 있으면 제외했어요.' },
  { cond: 'hypertension', tag: 'ephedra', action: 'exclude', msg: '마황(에페드린 계열)은 혈압·심박수를 올릴 수 있어 고혈압이 있으면 제외했어요.' },
  { cond: 'heart', tag: 'ephedra', action: 'exclude', msg: '마황은 심박수를 올릴 수 있어 심장질환이 있으면 제외했어요.' },
  { cond: 'heart', tag: 'licorice', action: 'warn', msg: '감초는 칼륨 저하와 관련이 보고되어 심장질환이 있으면 약사와 먼저 확인하세요.' },
  { cond: 'kidney', tag: 'licorice', action: 'warn', msg: '감초는 부종·칼륨 저하와 관련이 보고되어 신장질환이 있으면 약사와 먼저 확인하세요.' },
  { cond: 'kidney', tag: 'magnesium', action: 'exclude', msg: '신장 기능이 떨어지면 마그네슘 배설이 어려워 보충제는 제외했어요.' },
  { cond: 'diabetes', tag: 'ephedra', action: 'warn', msg: '마황은 혈당에 영향을 줄 수 있어 당뇨가 있으면 약사와 먼저 확인하세요.' },
  { cond: 'diabetes', tag: 'ginseng', action: 'warn', msg: '홍삼은 혈당을 낮추는 작용이 보고되어 당뇨약을 드신다면 저혈당에 주의하세요.' },
  { cond: 'diabetes', tag: 'sugar', action: 'warn', msg: '당 함량이 있어 혈당 관리 중이라면 양을 줄이거나 생략하세요.' },
  { cond: 'thyroid', tag: 'ephedra', action: 'exclude', msg: '마황은 갑상선기능항진증이 있으면 증상을 악화시킬 수 있어 제외했어요.' },
  { cond: 'pregnant', tag: 'ephedra', action: 'exclude', msg: '임신·수유 중에는 마황 함유 제제는 제외했어요.' },
  { cond: 'pregnant', tag: 'licorice', action: 'exclude', msg: '임신·수유 중에는 한방 일반의약품은 제외했어요. 필요하면 약사·한의사와 상의하세요.' },
  { cond: 'pregnant', tag: 'ginseng', action: 'exclude', msg: '임신·수유 중 홍삼 섭취는 안전성 자료가 충분하지 않아 제외했어요.' },
  { cond: 'pregnant', tag: 'ragweed', action: 'warn', msg: '임신·수유 중에는 허브차·허브 추출물 섭취 전 약사와 확인하세요.' },
  { cond: 'pregnant', tag: 'ginger', action: 'warn', msg: '생강은 음식으로 먹는 양은 괜찮지만 고농축 섭취는 피하세요.' },
  { cond: 'anticoag', tag: 'ginseng', action: 'exclude', msg: '홍삼은 혈소판 응집 억제 작용이 있어 항응고제·항혈소판제(와파린, 아스피린 등)와 함께 드시면 출혈 위험이 있어 제외했어요.' },
  { cond: 'anticoag', tag: 'omega3', action: 'warn', msg: '오메가3는 항응고제와 함께 고용량 섭취 시 출혈 경향이 보고되어 약사와 확인하세요.' },
  { cond: 'anticoag', tag: 'ginger', action: 'warn', msg: '생강 고농축 섭취는 항응고제와 상호작용이 보고되어 음식 수준으로만 드세요.' },
  { cond: 'anticoag', tag: 'licorice', action: 'warn', msg: '복용 중인 약이 있으면 한방 일반의약품은 약사와 먼저 확인하세요.' },
  { cond: 'otherMeds', tag: 'licorice', action: 'warn', msg: '복용 중인 약이 있으면 한방 일반의약품은 약사와 먼저 확인하세요 (특히 이뇨제·스테로이드는 감초와 상호작용 보고).' },
  { cond: 'otherMeds', tag: 'ephedra', action: 'warn', msg: '마황은 여러 약과 상호작용이 있어 약사와 먼저 확인하세요.' },
  { cond: 'otherMeds', tag: 'ginseng', action: 'warn', msg: '홍삼은 일부 약과 상호작용이 보고되어 약사와 확인하세요.' },
  { cond: 'allergy:유제품', tag: 'dairy', action: 'exclude', msg: '유제품 알레르기로 제외했어요.' },
  { cond: 'allergy:견과류', tag: 'nuts', action: 'exclude', msg: '견과류 알레르기로 제외했어요.' },
  { cond: 'allergy:생선', tag: 'fish', action: 'exclude', msg: '생선 알레르기로 제외했어요.' },
  { cond: 'allergy:국화과', tag: 'ragweed', action: 'exclude', msg: '국화과 식물(캐모마일·밀크씨슬 등) 알레르기로 제외했어요.' },
  { cond: 'allergy:감귤류', tag: 'citrus', action: 'exclude', msg: '감귤류 알레르기로 제외했어요.' },
];

const RED_FLAGS = ['흉통','가슴이 아','가슴 통증','호흡곤란','숨이 차','숨쉬기','의식','기절','실신','피를 토','혈변','토혈','마비','39도','40도','고열','경련','자살','극심한','심한 통증'];
const OUT_OF_SCOPE = ['운동','헬스','스트레칭','요가','걷기','러닝','달리기','산책','명상','홈트','필라테스'];



const DISCLAIMER = '이 정보는 진단·처방이 아닌 일반 건강정보예요. 식품은 질병의 예방·치료를 위한 것이 아니며, 일반의약품은 제품 설명서를 확인하고 약사와 상담 후 복용하세요.';
// ---------- 규칙 기반 폴백 ----------
function matchTopics(text) {
  const scored = TOPICS.map(t => ({ t, s: t.keywords.filter(k => text.includes(k)).length })).filter(x => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.map(x => x.t);
}

function profileConds(p) {
  if (!p) return [];
  const c = [...(p.conditions || [])];
  if (p.meds && p.meds.trim()) {
    if (/와파린|아스피린|항응고|항혈소판|클로피도그렐|플라빅스|엘리퀴스|자렐토|리바록사반|아픽사반/.test(p.meds)) c.push('anticoag');
    else c.push('otherMeds');
  }
  (p.allergies || []).forEach(a => c.push('allergy:' + a));
  return c;
}

function applySafety(items, conds, warnings, excluded) {
  const out = [];
  for (const it of items) {
    const hits = SAFETY_RULES.filter(r => conds.includes(r.cond) && (it.tags || []).includes(r.tag));
    const exs = hits.filter(h => h.action === 'exclude');
    if (exs.length) { excluded.push({ name: it.name, reason: [...new Set(exs.map(h => h.msg))].join(' ') }); continue; }
    const notes = [...new Set(hits.map(h => h.msg))];
    out.push({ ...it, note: notes.join(' ') || undefined });
    notes.forEach(n => warnings.push(`${it.name}: ${n}`));
  }
  return out;
}

function ruleBased(messages, profile) {
  const userTexts = messages.filter(m => m.role === 'user').map(m => m.content);
  const last = userTexts[userTexts.length - 1] || '';
  let topics = matchTopics(last);
  if (!topics.length) topics = matchTopics(userTexts.join(' '));
  if (!topics.length) {
    return { type: 'notice', text: '어떤 컨디션인지 조금 더 일상적인 말로 알려주실래요? 예를 들어 "환절기라 으슬으슬해요", "요즘 너무 피곤해요", "밥 먹고 더부룩해요", "잠을 잘 못 자요"처럼요.', chips: ['환절기라 으슬으슬해요', '요즘 피곤해요', '속이 더부룩해요', '잠을 잘 못 자요'] };
  }
  const topic = topics[0];
  const conds = profileConds(profile);
  const warnings = [], excluded = [];
  const foods = applySafety(topic.foods, conds, warnings, excluded);
  const supplements = applySafety(topic.supplements, conds, warnings, excluded);
  const otc = applySafety(topic.otc, conds, warnings, excluded).map(o => ({ ...o, claim: o.claim, note: [o.note, `성분: ${o.ingredients}. 일반의약품이므로 제품 설명서를 확인하고 약사와 상담 후 복용하세요.`].filter(Boolean).join(' ') }));
  if (profile && profile.allergyOther) warnings.push(`기타 알레르기(${profile.allergyOther}): 원재료를 꼭 확인하세요.`);
  const intros = {
    chill: '몸이 으슬으슬하고 컨디션이 떨어지셨군요. 몸을 따뜻하게 하고 컨디션을 챙기는 데 참고할 만한 먹거리를 골라봤어요.',
    fatigue: '요즘 기운이 없으시군요. 에너지 대사와 관련된 영양소 중심으로 먹거리를 골라봤어요.',
    digest: '속이 편하지 않으시군요. 소화와 장 건강 관련 성분 중심으로 골라봤어요.',
    sleep: '편하게 쉬기 어려우시군요. 긴장 완화·수면과 관련해 연구된 성분 중심으로 골라봤어요.',
    eye: '눈이 피로하시군요. 눈 건강 관련 성분 중심으로 골라봤어요.',
    hangover: '음주 후 컨디션 관리에 참고할 먹거리를 골라봤어요.',
  };
  return {
    type: 'answer', topic: topic.label,
    intro: intros[topic.id],
    foods, supplements, otc, warnings: [...new Set(warnings)], excluded,
    followup: topics[1] ? `"${topics[1].label}" 관련 먹거리도 알려드릴까요?` : '다른 컨디션도 궁금하시면 편하게 말씀해 주세요.',
  };
}

// ---------- 대화 오케스트레이션 ----------
async function handleChat({ messages = [], profile = null }) {
  const last = (messages.filter(m => m.role === 'user').pop() || {}).content || '';
  if (RED_FLAGS.some(k => last.includes(k))) {
    return { type: 'notice', level: 'danger', text: '말씀하신 내용은 먹는 것으로 관리할 범위를 넘어 보여요. 이런 경우엔 음식이나 일반의약품 추천을 드리지 않아요. 의료진 상담이 필요해요. 증상이 심하거나 급하면 119에 연락하세요.' };
  }
  if (OUT_OF_SCOPE.some(k => last.includes(k)) && !matchTopics(last).length) {
    return { type: 'notice', text: '저희는 운동이나 생활습관은 다루지 않고, 오직 "먹는 것"만 안내해요. 지금 컨디션이나 원하는 목표(예: 피로, 소화, 환절기 컨디션)를 말씀해 주시면 먹거리로 추천해 드릴게요.' };
  }
  if (!profile) {
    return { type: 'safety', text: '추천 전에 안전하게 고를 수 있도록 몇 가지만 확인할게요. 해당되는 것을 선택해 주세요. (일반의약품·건강기능식품도 체질이나 복용 중인 약에 따라 맞지 않을 수 있어요)' };
  }
  return ruleBased(messages, profile);
}


window.BapsimEngine = { chat: async (state) => ({ ...(await handleChat(state)), disclaimer: DISCLAIMER }) };
})();
