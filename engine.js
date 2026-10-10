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

const EXTRA_RULES = [
  { cond:'kidney', tag:'potassium', action:'warn', msg:'신장질환이 있으면 칼륨 섭취 제한이 필요할 수 있어 양을 약사·영양사와 확인하세요.' },
  { cond:'allergy:대두', tag:'soy', action:'exclude', msg:'대두 알레르기로 제외했어요.' },
  { cond:'allergy:계란', tag:'egg', action:'exclude', msg:'계란 알레르기로 제외했어요.' },
  { cond:'anticoag', tag:'garlic', action:'warn', msg:'흑마늘 등 마늘 농축 제품은 항응고제와 함께 섭취 시 출혈 경향이 보고되어 약사와 확인하세요.' },
];
SAFETY_RULES.push(...EXTRA_RULES);

// ---------- 검진 결과(선택) 규칙: 결과를 조용히 조정 ----------
SAFETY_RULES.push(
  { cond:'chk:bp', tag:'licorice', action:'exclude', msg:'검진에서 혈압이 높게 나왔다면 감초 함유 제제는 혈압 상승과 관련이 보고되어 제외했어요.' },
  { cond:'chk:bp', tag:'ephedra', action:'exclude', msg:'검진에서 혈압이 높게 나왔다면 마황 함유 제제는 제외했어요.' },
  { cond:'chk:glucose', tag:'sugar', action:'warn', msg:'검진에서 혈당이 높게 나왔다면 당이 많은 음식은 양을 줄이는 게 좋아요.' },
  { cond:'chk:glucose', tag:'ginseng', action:'warn', msg:'혈당 관련 약을 드신다면 홍삼의 혈당 저하 작용에 주의하세요.' },
  { cond:'chk:liver', tag:'herbalext', action:'warn', msg:'간 수치가 높게 나왔다면 농축 추출물 제품은 의사·약사와 먼저 확인하세요.' },
);
const CHECKUPS = [['bp','혈압 높음'],['glucose','혈당 높음'],['lipid','콜레스테롤·중성지방 높음'],['liver','간 수치 높음'],['anemia','빈혈 소견']];

// ---------- 평소 한 끼 (괜찮아요 · 뭐 먹을까) : 시간대별 ----------
const EVERYDAY = {
  morning: [
    { name:'달걀 · 토마토 스크램블', comp:'단백질·라이코펜', effect:'아침 단백질은 포만감 유지와 관련이 보고되어 있고, 토마토의 라이코펜은 연구에서 항산화 작용이 보고되어 있어요', tags:['egg'], boost:['glucose','anemia'] },
    { name:'오트밀 · 바나나', comp:'베타글루칸·칼륨', effect:'귀리의 베타글루칸 성분이 연구에서 혈중 콜레스테롤 관련 개선 작용이 보고되어 있어요', tags:['potassium'], boost:['lipid'] },
    { name:'두부 된장국 · 잡곡밥', comp:'콩 단백질·식이섬유', effect:'잡곡의 식이섬유는 연구에서 식후 혈당 상승 완화 작용이 보고되어 있어요', tags:['soy'], boost:['glucose','lipid'] },
    { name:'플레인 요거트 · 견과 한 줌', comp:'유산균·불포화지방산', effect:'요거트의 유산균과 견과의 불포화지방산을 함께 섭취할 수 있어요', tags:['dairy','nuts'] },
  ],
  lunch: [
    { name:'생선구이 · 나물 정식', comp:'EPA/DHA·식이섬유', effect:'등푸른생선의 EPA·DHA는 연구에서 혈중 중성지질 관련 개선 작용이 보고되어 있어요', tags:['fish','omega3'], boost:['lipid','bp'] },
    { name:'채소 듬뿍 비빔밥 (잡곡)', comp:'식이섬유·비타민', effect:'다양한 채소의 식이섬유는 연구에서 식후 혈당 상승 완화 작용이 보고되어 있어요', tags:['egg'], boost:['glucose'] },
    { name:'소고기 미역국 · 잡곡밥', comp:'철분·단백질', effect:'소고기의 헴철은 체내 산소운반과 혈액생성에 필요한 철분의 흡수율이 높은 공급원이에요', tags:[], boost:['anemia'] },
    { name:'닭가슴살 샐러드 · 고구마', comp:'단백질·식이섬유', effect:'지방이 적은 단백질과 식이섬유를 함께 섭취할 수 있는 가벼운 한 끼예요', tags:['potassium'], boost:['glucose','lipid'] },
  ],
  evening: [
    { name:'두부 · 버섯 전골 (싱겁게)', comp:'콩 단백질·베타글루칸', effect:'버섯의 베타글루칸 성분이 연구에서 면역 관련 작용이 보고되어 있고, 저녁에 부담이 적은 구성이에요', tags:['soy'], boost:['bp','lipid','glucose'] },
    { name:'고등어구이 · 쌈채소', comp:'EPA/DHA·칼륨', effect:'등푸른생선의 오메가3 지방산과 채소의 칼륨을 함께 섭취할 수 있어요', tags:['fish','omega3','potassium'], boost:['lipid','bp'] },
    { name:'시금치 · 소고기 볶음', comp:'철분·엽산', effect:'철분과 엽산은 혈액생성에 필요한 영양소로 알려져 있어요', tags:[], boost:['anemia'] },
  ],
  night: [
    { name:'따뜻한 두유 한 잔', comp:'콩 단백질·이소플라본', effect:'늦은 시간엔 소화 부담이 적은 따뜻한 음료가 무난해요', tags:['soy'], boost:['glucose'] },
    { name:'바나나 반 개', comp:'트립토판·칼륨', effect:'트립토판은 세로토닌·멜라토닌 합성의 원료로 알려져 있어요', tags:['potassium'] },
    { name:'따뜻한 우유 한 잔', comp:'트립토판·칼슘', effect:'트립토판 성분이 연구에서 수면 관련 작용이 보고되어 있어요', tags:['dairy'] },
  ],
};
// 기존 주제 음식에 검진 가중치
const BOOST = { '시금치 · 소고기':['anemia'], '양배추':['glucose'], '무(무즙·뭇국)':['bp'], '콩나물국':['liver'], '고등어 · 연어':['lipid'], '블루베리':['glucose'] };

function slotOf(h){ return h>=5&&h<11?'morning': h>=11&&h<16?'lunch': h>=16&&h<21?'evening':'night'; }
const SLOT_LABEL = { morning:'아침', lunch:'점심', evening:'저녁', night:'늦은 밤' };
const DOW = ['일','월','화','수','목','금','토'];
function seasonOf(m){ return m>=3&&m<=5?'spring': m>=6&&m<=8?'summer': m>=9&&m<=11?'autumn':'winter'; }
const SEASON_LABEL = { spring:'봄', summer:'여름', autumn:'가을', winter:'겨울' };
const isTransition = m => [3,4,9,10,11].includes(m);
const SEASONAL = {
  spring: { name:'냉이·달래 된장국', comp:'비타민C·식이섬유', effect:'봄나물의 비타민C·식이섬유를 제철에 섭취할 수 있어요', tags:['soy'] },
  summer: { name:'오이냉국 · 콩국수', comp:'수분·콩 단백질', effect:'더운 날 수분과 콩 단백질을 함께 섭취할 수 있는 시원한 한 끼예요', tags:['soy'] },
  autumn: { name:'버섯 · 무 들깨국', comp:'베타글루칸·디아스타제', effect:'버섯의 베타글루칸 성분이 연구에서 면역 관련 작용이 보고되어 있어요', tags:[] },
  winter: { name:'무 · 배 생강차', comp:'진저롤·루테올린', effect:'생강의 진저롤 성분이 연구에서 체온 관련 작용이 보고되어, 몸을 따뜻하게 하는 데 도움이 될 수 있어요', tags:['ginger'] },
};
const MOMENT_TITLE = { everyday:null, hangover:'혹시 어젯밤 한잔하셨다면', digest:'속이 무거운 날엔', fatigue:'한 주를 시작하는 날엔', chill:'아침저녁 쌀쌀한 환절기엔', sleep:'하루를 마무리하는 시간엔', eye:'눈이 피로한 날엔' };
const MOMENT_LABEL = { everyday:'평소 한 끼', hangover:'숙취 케어', digest:'속 편한 한 끼', fatigue:'기운 보충', chill:'따뜻하게', sleep:'편안한 밤', eye:'눈 휴식' };

// 앱이 이미 아는 맥락으로 '오늘의 순간' 후보를 순위대로 만든다 (질문 없음)
function buildContext(now, profile, signals) {
  const d = new Date(now), h = d.getHours(), m = d.getMonth()+1, dow = d.getDay();
  const slot = slotOf(h), season = seasonOf(m), trans = isTransition(m);
  const cands = []; const add = (moment, why) => { if (!cands.find(c => c.moment === moment)) cands.push({ moment, why }); };
  const sig = (signals || []).find(x => x.daysAgo <= 1);
  if (sig) add(sig.topic, `어제 알려주신 내용을 이어서 '${MOMENT_LABEL[sig.topic]}' 쪽으로`);
  if ((dow === 6 || dow === 0) && slot === 'morning') add('hangover', `${DOW[dow]}요일 아침이라, 어젯밤 모임이 있었을 수 있어요`);
  if (slot === 'night') add('sleep', '늦은 시간이라 부담 없는 것 위주로');
  if (trans && (slot === 'morning' || slot === 'evening')) add('chill', `${SEASON_LABEL[season]} 환절기, 일교차가 큰 시기예요`);
  if (season === 'winter' && slot !== 'lunch') add('chill', '추운 겨울이에요');
  if (dow === 1 && slot === 'morning') add('fatigue', '월요일 아침이에요');
  if (dow === 5 && slot === 'evening') add('everyday', '금요일 저녁, 가볍게 시작해요');
  add('everyday', `${DOW[dow]}요일 ${SLOT_LABEL[slot]} 다음 끼니`);
  ['fatigue','digest','chill','sleep','hangover','eye'].forEach(x => add(x, '오늘은 다른 쪽이 필요할 수도 있어요'));
  return { now:d.toISOString(), hour:h, month:m, dow, slot, season, trans,
    label: `${m}월 · ${DOW[dow]}요일 ${SLOT_LABEL[slot]}${trans ? ' · 환절기' : ' · ' + SEASON_LABEL[season]}`, cands };
}

function resultFor(moment, ctx, profile) {
  const conds = profileConds(profile);
  const chk = (profile && profile.checkups) || [];
  chk.forEach(c => conds.push('chk:' + c));
  let foods, extras = [];
  if (moment === 'everyday') {
    foods = [SEASONAL[ctx.season], ...EVERYDAY[ctx.slot]].map(f => ({ ...f }));
    if (ctx.slot === 'night') foods = EVERYDAY.night.map(f => ({ ...f }));
  } else {
    const t = TOPICS.find(x => x.id === moment);
    foods = t.foods.map(f => ({ ...f, boost: BOOST[f.name] || [] }));
    extras = [...t.otc.map(o => ({ ...o, kind:'한방 일반의약품' })), ...t.supplements.map(s => ({ ...s, kind:'건강기능식품' }))];
  }
  foods.sort((a,b) => (b.boost||[]).filter(x=>chk.includes(x)).length - (a.boost||[]).filter(x=>chk.includes(x)).length);
  const warnings = [], excluded = [];
  const safeFoods = applySafety(foods, conds, warnings, excluded);
  const safeExtras = applySafety(extras, conds, warnings, excluded);
  const top = safeFoods[0], alts = [];
  if (safeFoods[1]) alts.push({ ...safeFoods[1], kind:'음식' });
  if (safeExtras[0]) alts.push(safeExtras[0]); else if (safeFoods[2]) alts.push({ ...safeFoods[2], kind:'음식' });
  const notes = [];
  if (chk.length) notes.push('검진 결과를 반영해 순서를 조정했어요. 검진 결과에 대해서는 의사의 안내를 우선 따라 주세요.');
  const title = MOMENT_TITLE[moment] ? MOMENT_TITLE[moment] : `오늘 ${SLOT_LABEL[ctx.slot]}엔 이렇게`;
  return { type:'result', moment, momentLabel:MOMENT_LABEL[moment], title, top, alts, excluded, notes, disclaimer:DISCLAIMER };
}

// 질문 없이 오늘 카드 만들기. swap: '오늘은 좀 달라요' 누른 횟수, text: 선택 한 줄 피드백
function autoCard(now, profile, { swap = 0, text = '', signals = [] } = {}) {
  const ctx = buildContext(now, profile, signals);
  let cand = ctx.cands[swap % ctx.cands.length], fb = null;
  if (text) {
    if (RED_FLAGS.some(k => text.includes(k))) return { type:'stop', ctx, title:'먹는 것으로 챙길 범위를 넘어 보여요', text:'열이 높거나 통증이 심하면 음식·일반의약품 추천을 드리지 않아요. 의료진 상담이 필요해요. 급하면 119에 연락하세요.' };
    const t = matchTopics(text)[0];
    if (t) { cand = { moment:t.id, why:`'${text}'라고 알려주셔서` }; fb = t.id; }
    else if (OUT_OF_SCOPE.some(k => text.includes(k))) cand = { ...cand, why: cand.why + ' · 운동·생활습관은 다루지 않아요' };
    else cand = { ...cand, why: cand.why + ' · 알려주신 내용은 잘 몰라서 기본 추천을 보여드려요' };
  }
  const r = resultFor(cand.moment, ctx, profile);
  return { ...r, ctx, why: cand.why, feedbackTopic: fb, swappable: !text };
}

window.BapsimEngine = { CHECKUPS, autoCard, buildContext, slotOf, SLOT_LABEL, DISCLAIMER };
})();
