// 밥심 — 클라이언트 사이드 규칙 엔진 (백엔드 없음)
(function(){
// 규칙 기반 지식베이스 (시나리오 데모 응답 엔진)
// ⚠️ 건강기능식품 문구는 식약처 고시형 기능성 문구 요약, 한방 일반의약품 문구는 대표 품목 허가사항 요약입니다.
//    실제 서비스 전 각 제품의 허가사항/표시사항 원문 대조가 필요합니다.

const TOPICS = [
  {
    id: 'chill', label: '환절기 · 으슬으슬함',
    keywords: ['으슬','환절기','감기','오한','몸살','콧물','재채기','추워','춥','한기','코막'],
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
    keywords: ['소화','더부룩','체한','체했','속이','배가 빵','가스','위가','명치','속쓰','설사'],
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
    keywords: ['눈이','눈 피','침침','눈건강','모니터','눈이 뻑','눈이 피곤','눈 피곤'],
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
    keywords: ['숙취','술','음주','회식','간 건강','간이','마셔','마심','마신'],
    foods: [
      { name: '콩나물국', comp: '아스파라긴산', effect: '아스파라긴산 성분이 연구에서 알코올 대사 관련 작용이 보고되어, 음주 후 컨디션에 도움이 될 수 있어요', tags: [] },
      { name: '북엇국', comp: '메티오닌·타우린', effect: '북어의 아미노산 성분이 연구에서 간 해독 관련 작용이 보고되어 있어요', tags: ['fish'] },
      { name: '꿀물', comp: '과당', effect: '과당이 연구에서 알코올 분해 속도 관련 작용이 보고되어 있어요', tags: ['sugar'] },
    ],
    supplements: [
      { name: '숙취해소 음료', claim: '일반식품이에요. 숙취해소 표시는 인체적용시험 근거가 있는 제품만 할 수 있어요', tags: ['herbalext'] },
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


// ---------- 추가 주제 ----------
TOPICS.push(
  { id: 'coldfeet', label: '손발 참', keywords: ['발이 차','손발','손이 차','수족냉'],
    foods: [ { name: '생강차', comp: '진저롤', effect: '진저롤 성분이 말초 혈류 관련 작용이 보고되어, 조금이라도 따뜻해지는 데 도움이 될 수 있어요', tags: ['ginger','warm'] },
             { name: '계피차', comp: '신남알데히드', effect: '계피 성분이 혈류 관련 작용이 보고되어 있어요', tags: ['warm'] } ],
    supplements: [], otc: [] },
  { id: 'cramp', label: '다리 쥐', keywords: ['쥐가','쥐 나','종아리','다리 경련'],
    foods: [ { name: '바나나', comp: '칼륨·마그네슘', effect: '칼륨·마그네슘이 근육 수축·이완에 관여해요', tags: ['potassium'] },
             { name: '두부', comp: '마그네슘', effect: '마그네슘이 근육 기능에 관여해요', tags: ['soy'] },
             { name: '아몬드 한 줌', comp: '마그네슘', effect: '마그네슘이 근육 기능에 관여해요', tags: ['nut'] } ],
    supplements: [ { name: '마그네슘', claim: '신경과 근육 기능 유지에 필요', tags: ['magnesium'] } ], otc: [] },
  { id: 'itch', label: '피부 간지러움', keywords: ['간지러','가려','두드러기','피부가'],
    foods: [ { name: '물·보리차', comp: '수분', effect: '건조할 때 수분 보충이 조금이라도 도움이 될 수 있어요', tags: [] } ],
    supplements: [], otc: [] },
  { id: 'mouthsore', label: '입병', keywords: ['입병','입안','구내염','혓바늘','입술이 터'],
    foods: [ { name: '달걀', comp: '비타민B2', effect: '비타민B2가 피부·점막 유지에 필요해요', tags: ['egg'] },
             { name: '우유·요구르트', comp: '비타민B2', effect: '비타민B2가 점막 유지에 필요해요', tags: ['dairy'] } ],
    supplements: [ { name: '비타민B2(리보플라빈)', claim: '피부와 점막을 유지하는 데 필요', tags: [] } ], otc: [] },
  { id:'throat', label:'목 칼칼함', keywords:['목','칼칼','인후','따끔','목이','기침','가래','건조'],
    foods:[
      { name:'도라지차', comp:'플라티코딘(사포닌)', effect:'도라지의 사포닌 성분이 연구에서 기도 점액 분비 관련 작용이 보고되어, 목 컨디션 관리에 도움이 될 수 있어요', tags:[] },
      { name:'배숙 · 배즙', comp:'루테올린·수분', effect:'배의 루테올린 성분이 연구에서 항염 관련 작용이 보고되어 있어요', tags:[] },
      { name:'대추생강차', comp:'진저롤·대추 플라보노이드', effect:'진저롤 성분이 연구에서 항염 작용이 보고되어, 따뜻하게 마시면 목이 편해질 수 있어요', tags:['ginger','warm'] },
      { name:'꿀물(따뜻하게)', comp:'과당·폴리페놀', effect:'꿀이 연구에서 기침 관련 증상 완화 작용이 보고되어 있어요 (돌 전 아기에게는 금지)', tags:['sugar'] },
    ],
    supplements:[ { name:'아연', claim:'정상적인 면역기능에 필요', tags:['zinc'] }, { name:'비타민C', claim:'항산화 작용을 하여 유해산소로부터 세포를 보호하는데 필요', tags:['vitc'] } ],
    otc:[ { name:'은교산', claim:'감기로 인한 발열, 두통, 인후통 (대표 품목 허가사항 요약)', tags:['licorice'], ingredients:'금은화·연교·길경·감초·박하·우방자 등' } ] },
  { id:'constipation', label:'변비', keywords:['변비','배변','화장실','변이','장이','똥'],
    foods:[
      { name:'키위', comp:'식이섬유·액티니딘', effect:'키위가 연구에서 배변 빈도 개선 작용이 보고되어, 배변 활동에 도움이 될 수 있어요', tags:[] },
      { name:'사과(껍질째) · 푸룬', comp:'펙틴·소르비톨', effect:'펙틴·소르비톨 성분이 연구에서 배변 활동 관련 작용이 보고되어 있어요', tags:[] },
      { name:'귀리 · 현미밥', comp:'불용성·수용성 식이섬유', effect:'통곡물의 식이섬유는 연구에서 장 통과 시간 관련 개선 작용이 보고되어 있어요', tags:[] },
      { name:'요거트 · 김치', comp:'유산균', effect:'발효식품의 유산균이 연구에서 장내 균총 개선 작용이 보고되어 있어요', tags:['dairy'] },
    ],
    supplements:[ { name:'프로바이오틱스', claim:'유산균 증식 및 유해균 억제에 도움을 줄 수 있음, 배변활동 원활에 도움을 줄 수 있음', tags:[] }, { name:'식이섬유(차전자피·난소화성말토덱스트린)', claim:'배변활동 원활에 도움을 줄 수 있음', tags:[] } ],
    otc:[] },
  { id:'lipid', label:'콜레스테롤·중성지방', keywords:['LDL','ldl','콜레스테롤','중성지방','고지혈','이상지질','지질'],
    foods:[
      { name:'귀리 · 보리밥', comp:'베타글루칸', effect:'귀리·보리의 베타글루칸 성분이 연구에서 혈중 LDL 콜레스테롤 관련 개선 작용이 보고되어 있어요', tags:[] },
      { name:'고등어 · 연어', comp:'EPA·DHA', effect:'등푸른생선의 EPA·DHA가 연구에서 혈중 중성지질 관련 개선 작용이 보고되어 있어요', tags:['fish','omega3'] },
      { name:'두부 · 콩', comp:'콩 단백질·이소플라본', effect:'콩 단백질이 연구에서 혈중 콜레스테롤 관련 개선 작용이 보고되어 있어요', tags:['soy'] },
      { name:'무염 견과', comp:'불포화지방산', effect:'포화지방 대신 불포화지방을 섭취하는 것이 연구에서 혈중 지질 관련 개선과 연관이 보고되어 있어요', tags:['nuts'] },
    ],
    supplements:[ { name:'오메가3(EPA·DHA)', claim:'혈중 중성지질 개선·혈행 개선에 도움을 줄 수 있음', tags:['omega3','fish'] }, { name:'식물스테롤', claim:'혈중 콜레스테롤 개선에 도움을 줄 수 있음', tags:[] } ],
    otc:[] },
  { id:'glucose', label:'혈당', keywords:['혈당','당뇨 전','공복혈당','당화혈색소','HbA1c'],
    foods:[
      { name:'잡곡밥 · 채소 먼저 먹기', comp:'식이섬유', effect:'식이섬유를 먼저 섭취하는 순서가 연구에서 식후 혈당 상승 완화 작용이 보고되어 있어요', tags:[] },
      { name:'두부 · 달걀 반찬', comp:'단백질', effect:'단백질을 함께 섭취하면 식후 혈당 상승 완화와 관련이 보고되어 있어요', tags:['soy','egg'] },
    ],
    supplements:[ { name:'난소화성말토덱스트린', claim:'식후 혈당상승 억제에 도움을 줄 수 있음', tags:[] }, { name:'바나바잎 추출물', claim:'식후 혈당상승 억제에 도움을 줄 수 있음', tags:[] } ],
    otc:[] },
  { id:'latesnack', label:'야식', keywords:['야식','밤에 먹','늦게 먹','자기 전에 먹','새벽에 먹'],
    foods:[
      { name:'따뜻한 두유 한 잔', comp:'콩 단백질', effect:'출출할 땐 소화 부담이 적은 따뜻한 음료가 무난해요', tags:['soy'] },
      { name:'삶은 달걀 · 방울토마토', comp:'단백질·라이코펜', effect:'적은 열량으로 포만감을 줄 수 있는 간식 조합이에요', tags:['egg'] },
      { name:'바나나', comp:'트립토판·칼륨', effect:'트립토판은 세로토닌·멜라토닌 합성의 원료로 알려져 있어요', tags:['potassium'] },
    ],
    supplements:[], otc:[] },
);

// 식습관 인사이트 (입력에서 패턴 감지)
const HABITS = [
  { id:'latenight', verdict:'조금 아쉬워요', keys:['야식','밤에 먹','늦게 먹','자기 전에','새벽'], text:'늦은 시간 식사가 잦으면 연구에서 수면의 질·소화 부담과의 연관이 보고되어 있어요. 저녁을 조금 넉넉히, 야식은 따뜻한 음료나 가벼운 단백질로 바꿔 보세요.' },
  { id:'sodium', verdict:'조금 아쉬워요', keys:['라면','국물','짜게','짠','찌개','배달'], text:'국물은 건더기 위주로 드시면 충분해요.' },
  { id:'sugar', verdict:'조금 아쉬워요', keys:['단거','단 거','디저트','음료','탄산','과자','빵','믹스커피'], text:'단 음료·간식이 잦으면 첨가당 섭취가 늘기 쉬워요. 단 음료를 무가당 차·탄산수로 바꾸는 것부터 시작해 보세요.' },
  { id:'alcohol', verdict:'조금 아쉬워요', keys:['술','음주','회식','소주','맥주'], text:'음주 다음 날은 수분과 전해질이 부족해지기 쉬워요. 물과 국물 있는 담백한 식사로 시작해 보세요.' },
  { id:'fiber', verdict:'조금 아쉬워요', keys:['변비','배변'], text:'변비가 잦다면 식이섬유와 수분 섭취가 부족하지 않은지 먼저 살펴보세요. 식이섬유를 늘릴 땐 물도 함께 늘려야 해요.' },
  { id:'checkup', verdict:null, keys:['검진','LDL','ldl','콜레스테롤','중성지방','혈당','수치'], text:'검진 수치는 식단으로 일부 관리할 수 있지만, 수치 해석과 치료 여부는 의사의 안내를 우선 따라 주세요.' },
];

// 제품 비교 (⚠️ 모두 예시 데이터: 가상의 제품명·번호·가격)
const VARIANTS = {
  '프로바이오틱스': { axis:['균주 구성','보장균수','인정 기능성'], items:[
    { name:'A사 유산균', vals:['락토바실러스 중심','많은 편','유산균 증식·유해균 억제, 배변활동 원활'], badge:'건강기능식품 · 품목신고 제2026-0000001호(예시)', price:'예시가 15,900원', seller:'예시몰 A' },
    { name:'B사 프로바이오틱스', vals:['비피도박테리움 포함','보통','유산균 증식·유해균 억제, 배변활동 원활'], badge:'건강기능식품 · 품목신고 제2026-0000002호(예시)', price:'예시가 12,500원', seller:'예시몰 B' },
    { name:'C사 신바이오틱스', vals:['여러 균주 + 프리바이오틱스','적은 편','배변활동 원활'], badge:'건강기능식품 · 품목신고 제2026-0000003호(예시)', price:'예시가 18,000원', seller:'예시몰 C' } ] },
  '오메가3(EPA·DHA)': { axis:['EPA·DHA 함량','형태·원료','인정 기능성'], items:[
    { name:'A사 rTG 오메가3', vals:['높은 편','rTG형 · 어유','중성지질·혈행 개선, 건조한 눈'], badge:'건강기능식품 · 품목신고 제2026-0000011호(예시)', price:'예시가 24,900원', seller:'예시몰 A' },
    { name:'B사 오메가3', vals:['보통','EE형 · 어유','중성지질·혈행 개선'], badge:'건강기능식품 · 품목신고 제2026-0000012호(예시)', price:'예시가 11,900원', seller:'예시몰 B' },
    { name:'C사 식물성 오메가3', vals:['보통','미세조류 유래','중성지질·혈행 개선'], badge:'건강기능식품 · 품목신고 제2026-0000013호(예시)', price:'예시가 29,000원', seller:'예시몰 C' } ] },
  '홍삼': { axis:['진세노사이드','형태','원산지'], items:[
    { name:'A사 홍삼정', vals:['진한 편','농축액(정)','국내산'], badge:'건강기능식품 · 품목신고 제2026-0000021호(예시)', price:'예시가 59,000원', seller:'예시몰 A' },
    { name:'B사 홍삼스틱', vals:['보통','스틱(액상)','국내산'], badge:'건강기능식품 · 품목신고 제2026-0000022호(예시)', price:'예시가 32,000원', seller:'예시몰 B' } ] },
  '갈근탕': { axis:['제형','복용 형태','특징'], items:[
    { name:'A제약 갈근탕액', vals:['액제(병)','한 병씩','마시기 편함, 당 함유'], badge:'일반의약품 · 허가(예시)', price:'예시가 5,500원(3병)', seller:'예시 약국' },
    { name:'B제약 갈근탕 연조엑스', vals:['연조엑스(포)','한 포씩','휴대 편리'], badge:'일반의약품 · 허가(예시)', price:'예시가 7,000원(6포)', seller:'예시 약국' },
    { name:'C제약 갈근탕정', vals:['정제','알약','물과 함께 복용'], badge:'일반의약품 · 허가(예시)', price:'예시가 8,000원', seller:'예시 약국' } ] },
  '쌍화탕': { axis:['제형','복용 형태','특징'], items:[
    { name:'A제약 쌍화탕', vals:['액제','한 병씩','당 함유 가능'], badge:'일반의약품 · 허가(예시)', price:'예시가 6,000원(10병)', seller:'예시 약국' },
    { name:'B제약 쌍화 과립', vals:['과립(포)','한 포씩','휴대 편리'], badge:'일반의약품 · 허가(예시)', price:'예시가 7,500원', seller:'예시 약국' } ] },
  '숙취해소 음료': { axis:['주원료','숙취해소 표시 근거','후기(예시)'], items:[
    { name:'A사 헛개 음료', vals:['헛개나무열매','인체적용시험(예시)','평점 4.6 · 후기 많음'], pro:'근거 표시 있음', con:'당이 조금 있는 편', badge:'식품 · HACCP·숙취해소 표시 근거(예시)', price:'가격(예시) 3,000원', seller:'예시 편의점' },
    { name:'B사 숙취해소 환', vals:['식물 추출물 혼합','인체적용시험(예시)','평점 4.4'], pro:'휴대 편함', con:'물과 같이 먹어야 해요', badge:'식품 · HACCP·숙취해소 표시 근거(예시)', price:'가격(예시) 4,500원', seller:'예시 약국' },
    { name:'C사 꿀물 음료', vals:['꿀·과당','표시 없음','평점 4.2'], pro:'순하고 저렴', con:'숙취해소 근거 표시는 없어요', badge:'일반식품 · HACCP(예시)', price:'가격(예시) 1,500원', seller:'예시 마트' } ] },
  '생강차': { axis:['생강 농도','원산지','인증'], items:[
    { name:'A사 생강차', vals:['보통','국내산','HACCP(예시)'], badge:'일반식품 · HACCP·원산지 표시(예시)', price:'예시가 9,900원', seller:'예시몰 A' },
    { name:'B사 생강청', vals:['진한 편','국내산','HACCP(예시)'], badge:'일반식품 · HACCP·원산지 표시(예시)', price:'예시가 14,000원', seller:'예시몰 B' },
    { name:'C사 생강차 티백', vals:['순한 편','중국산','—'], badge:'일반식품 · 원산지 표시(예시)', price:'예시가 4,500원', seller:'예시몰 C' } ] },
  '대추차': { axis:['대추 농도','원산지','인증'], items:[
    { name:'A사 대추차', vals:['보통','국내산','HACCP(예시)'], badge:'일반식품 · HACCP·원산지 표시(예시)', price:'예시가 10,900원', seller:'예시몰 A' },
    { name:'B사 대추 진액', vals:['진한 편','국내산','HACCP(예시)'], badge:'일반식품 · HACCP·원산지 표시(예시)', price:'예시가 21,000원', seller:'예시몰 B' } ] },
  '도라지차': { axis:['맛·농도','원산지','인증'], items:[
    { name:'A사 도라지배즙', vals:['배 위주, 순한 맛','국내산','HACCP(예시)'], badge:'일반식품 · HACCP·원산지 표시(예시)', price:'예시가 16,000원', seller:'예시몰 A' },
    { name:'B사 도라지차', vals:['도라지만, 진한 맛','국내산','—'], badge:'일반식품 · 원산지 표시(예시)', price:'예시가 6,900원', seller:'예시몰 B' } ] },
};
VARIANTS['식이섬유(차전자피·난소화성말토덱스트린)'] = { axis:['주원료','특징','인정 기능성'], items:[
  { name:'A사 차전자피 식이섬유', vals:['차전자피','물에 타서','배변활동 원활'], badge:'건강기능식품 · 품목신고 제2026-0000031호(예시)', price:'예시가 13,900원', seller:'예시몰 A' },
  { name:'B사 난소화성말토덱스트린', vals:['옥수수 유래','물에 타서','배변활동 원활, 식후 혈당상승 억제'], badge:'건강기능식품 · 품목신고 제2026-0000032호(예시)', price:'예시가 12,000원', seller:'예시몰 B' } ] };

const PROSCONS = {
  'A사 유산균':['보장균수가 많은 편','가격이 중간'], 'B사 프로바이오틱스':['가격 부담이 적음','보장균수는 보통'], 'C사 신바이오틱스':['프리바이오틱스 포함','가장 비싼 편'],
  'A사 rTG 오메가3':['함량이 높은 편','알이 큰 편'], 'B사 오메가3':['가격 부담이 적음','함량은 보통'], 'C사 식물성 오메가3':['생선 원료가 아님','비싼 편'],
  'A사 홍삼정':['진한 편','비싼 편'], 'B사 홍삼스틱':['간편함','함량은 보통'],
  'A제약 갈근탕액':['마시기 편함','당이 들어 있음'], 'B제약 갈근탕 연조엑스':['휴대 편리','맛이 진함'], 'C제약 갈근탕정':['당 걱정 적음','알약이 여러 개'],
  'A제약 쌍화탕':['구하기 쉬움','당이 들어 있을 수 있음'], 'B제약 쌍화 과립':['휴대 편리','물에 타야 함'],
  'A사 생강차':['무난한 맛','당이 들어 있음'], 'B사 생강청':['진한 맛','당이 많은 편'], 'C사 생강차 티백':['저렴함','원산지 수입'],
  'A사 대추차':['무난한 맛','당이 들어 있음'], 'B사 대추 진액':['진함','비싼 편'],
  'A사 도라지배즙':['마시기 편함','도라지는 적음'], 'B사 도라지차':['도라지만','맛이 씀'],
  'A사 차전자피 식이섬유':['효과 체감이 빠른 편','물을 충분히 마셔야 함'], 'B사 난소화성말토덱스트린':['물에 잘 녹음','가격이 중간'],
};
Object.values(VARIANTS).forEach(v => v.items.forEach(i => { const pc = PROSCONS[i.name]; if (pc) { i.pro = pc[0]; i.con = pc[1]; } }));
const CONSULT_KEYS = ['계속','몇 주','몇주','오래','심해','심하','안 나아','안나아','한 달','반복','아직','검진','수치','LDL','ldl','약 먹','복용','같이 먹어도'];

function parseMeds(text) {
  const m = [];
  if (/아스피린|와파린|항응고|항혈소판|클로피도그렐|플라빅스|엘리퀴스|자렐토/.test(text)) m.push('아스피린류');
  if (/스타틴|아토르바|로수바|고지혈증약/.test(text)) m.push('스타틴');
  if (/혈압약|암로디핀|로사르탄/.test(text)) m.push('혈압약');
  return m;
}


// ---------- 생활 기록 분류: 필요가 담긴 입력만 답변 ----------
const NEED_WORDS = ['아파','아픈','칼칼','따끔','더부룩','변비','피곤','힘들','높게','높다','안 좋','추천','뭐 먹','먹으면','좋을까','괜찮을까','같이 먹어도','심해','심하','으슬','몸살','속쓰','체한','체했','?','도와','어떡','방법','쓰려','막혀','콧물','기침'];
const NOTE_TAGS = [
  ['alcohol', ['술','회식','소주','맥주','한잔','와인','2차']],
  ['late', ['야식','늦게','새벽','밤늦']],
  ['sleepless', ['잠 못','못 잤','못잤','밤샘','설쳤','잠을 못']],
  ['salty', ['라면','국물','짜게','짠 거','찌개']],
  ['fried', ['치킨','삼겹','튀김','기름진','곱창']],
  ['overwork', ['야근','마감','밤샘 작업']],
  ['stress', ['스트레스']],
];
function noteTags(text){ return NOTE_TAGS.filter(([,ks]) => ks.some(k => text.includes(k))).map(([t]) => t); }
function classify(text){
  text = (text || '').trim();
  const need = RED_FLAGS.some(k => text.includes(k)) || NEED_WORDS.some(k => text.includes(k)) || /못 자요|기운 있|기운이|더부룩|차요|쥐가|간지러|가려|입병|구내염|혓바늘|피곤|해요\?|\?$/.test(text);
  return { need, tags: noteTags(text) };
}

const KN = ['','한','두','세','네','다섯','여섯','일곱'];
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? w + a : w + b; };

function personalLine(topicId, recent) {
  const snaps = recent.filter(e => e.kind === 'photo'), cnt = t => snaps.filter(e => (e.tags||[]).includes(t)).length;
  if (topicId === 'cramp') { const c = cnt('coffee_pm'), a = cnt('alcohol');
    if (c + a >= 2) return `이번 주 ${[c?`커피 ${KN[c]||c} 번`:'', a?`술 ${KN[a]||a} 번`:''].filter(Boolean).join('·')}이 있었죠. 둘 다 마그네슘이 빠져나가기 쉬워요.`; }
  if (topicId === 'itch') {
    const seenBefore = new Set(recent.filter(e => e.dayDiff > 2 && e.kind === 'photo').map(e => e.text));
    const fresh = snaps.find(e => e.dayDiff <= 2 && !seenBefore.has(e.text) && /새우|게|땅콩|복숭아|고등어|자몽|키위|견과/.test(e.text));
    if (fresh) return `${fresh.dayDiff === 0 ? '오늘' : fresh.dayDiff === 1 ? '어제' : '그저께'} 처음 기록된 ${josa(fresh.text,'이','가')} 있었죠. 간지러움이 그 뒤로 시작됐다면 한동안 빼 보고 지켜보세요.`; }
  return null;
}
function connectLine(topicId, recent) {
  if (['eye','constipation','lipid','glucose','coldfeet','itch','cramp','latesnack'].includes(topicId)) return null;
  const c = t => recent.filter(e => (e.tags || []).includes(t)).length, bits = [];
  if (c('alcohol')) bits.push(`회식·술자리가 ${KN[Math.min(c('alcohol'),7)]} 번 있었고`);
  if (c('overwork') >= 2) bits.push('야근이 잦았고');
  if (c('sleepless')) bits.push(bits.length ? '잠도 부족하셨죠' : '잠을 설친 날이 있었죠');
  if (topicId === 'lipid' && c('fried')) bits.splice(0, bits.length, `${recent.filter(e => (e.tags||[]).includes('fried')).map(e => e.text).slice(0,2).join(', ')} 기록이 있었죠`);
  if (!bits.length) return null;
  let line = '최근 일주일 ' + bits.join(', ');
  if (!/죠$/.test(line)) line = line.replace(/고$/, '어요');
  return line + '.';
}
const SUBJ = c => c === 'hypertension' ? '혈압이 있으시니' : c === 'anticoag' ? null : c === 'pregnant' ? '임신 중이시니' : c === 'kidney' ? '신장이 안 좋으시니' : c === 'diabetes' ? '당뇨가 있으시니' : c === 'heart' ? '심장질환이 있으시니' : c === 'thyroid' ? '갑상선 질환이 있으시니' : c.startsWith('allergy:') ? c.slice(8) + ' 알레르기가 있으시니' : c.startsWith('chk:') ? '검진 결과가 있으시니' : '복용 중인 약이 있으시니';
const ING = { licorice:'감초 든 ', ephedra:'마황 든 ' };
function safetyLine(excluded, conds, meds) {
  if (!excluded.length) return null;
  const e = excluded[0];
  const rule = SAFETY_RULES.find(r => r.action === 'exclude' && conds.includes(r.cond) && e.reason === r.msg || (e.reason.includes(r.msg) && r.action === 'exclude' && conds.includes(r.cond)));
  let subj = rule ? SUBJ(rule.cond) : '내 정보 기준으로';
  if (rule && rule.cond === 'hypertension' && /혈압약/.test(meds || '')) subj = '혈압약 드시니';
  if (rule && rule.cond === 'anticoag') subj = `${(meds || '').match(/아스피린|와파린|[가-힣]+/)?.[0] || '항응고제'} 드시니`;
  const ing = rule ? (ING[rule.tag] || '') : '';
  return `다만 ${subj} ${ing}${josa(e.name, '은', '는')} 피하세요.`;
}
function shortWhy(i, kind) {
  if (kind === 'supp') return i.claim.split(/[,·]/)[0].trim();
  if (kind === 'otc') return i.claim.replace(/ \(.*\)$/, '').split(',').slice(0, 2).join(',');
  const e = i.effect || '', tail = e.includes(', ') ? e.split(', ').pop() : e;
  return tail;
}
function answer(text, profile, memory) {
  memory = memory || { events:[] };
  text = (text || '').trim();
  if (!text) return { type:'empty' };
  if (RED_FLAGS.some(k => text.includes(k))) return { type:'stop', title:'의료진 상담이 필요해 보여요.', text:'급하면 119에 연락하세요.' };
  const p = JSON.parse(JSON.stringify(profile || {}));
  const textMeds = parseMeds(text);
  if (textMeds.length) p.meds = [p.meds, ...textMeds].filter(Boolean).join(', ');
  const conds = profileConds(p);
  ((p && p.checkups) || []).forEach(c => conds.push('chk:' + c));
  const insights = [];
  // 맥락이 생긴 경우에만: 이전에 LDL 등 검진 이야기를 했고, 지금 관련 있는 걸 기록할 때
  const hadLipid = (memory.events || []).some(e => e.topic === 'lipid');
  if (hadLipid && !/LDL|ldl|콜레스테롤|중성지방/.test(text) && /야식|치킨|튀김|삼겹|고기|라면|술|회식|버터|빵/.test(text))
    insights.unshift({ verdict:'피하는 게 좋아요', text:'지난번 검진에서 LDL이 높게 나왔다고 하셨죠. 튀김·삼겹살 같은 기름진 음식은 피하고 생선·콩 단백질로 바꿔 보세요.' });
  const scope = OUT_OF_SCOPE.some(k => text.includes(k)) ? '운동·생활습관은 다루지 않고, 먹는 것만 안내해요.' : null;
  const topics = matchTopics(text);
  // 생활 기록을 배경으로: 지금 필요와 관련 있을 때만 짧게 언급
  const nt = memory.recentNoteTags || [];
  const cnt = t => nt.filter(x => x === t).length;
  if (topics[0] && ['chill','throat','fatigue'].includes(topics[0].id) && (cnt('alcohol') >= 2 || cnt('sleepless') >= 2))
    insights.push({ verdict:'조금 아쉬워요', text: cnt('alcohol') >= 2 ? '최근 기록을 보면 술자리가 잦았어요. 몸이 지쳐 있을 수 있으니 이번엔 따뜻하고 순한 것 위주로 골랐어요.' : '최근 기록을 보면 잠을 설친 날이 많았어요. 이번엔 따뜻하고 순한 것 위주로 골랐어요.' });
  // 식사 사진은 배경 맥락으로만: 관련 있는 질문일 때 한 줄 덧붙임
  const mt = memory.recentMealTags || [];
  const salty = mt.filter(x => x === 'salty').length, late = mt.filter(x => x === 'late').length;
  if (topics[0] && ['digest','sleep','latesnack','lipid','glucose','fatigue'].includes(topics[0].id) && (salty >= 3 || late >= 3))
    insights.push({ verdict:'조금 아쉬워요', text: late >= 3 ? '저장해 두신 식사 사진을 보면 요즘 저녁이 늦은 편이에요. 이것도 영향을 줄 수 있어요.' : '저장해 두신 식사 사진을 보면 요즘 짠 음식이 잦은 편이에요. 이것도 영향을 줄 수 있어요.' });
  const consultWhy = [];
  if (CONSULT_KEYS.some(k => text.includes(k))) consultWhy.push(/검진|수치|LDL|ldl/.test(text) ? '검진 수치는 전문가와 보는 게 좋아요' : /약|복용|같이 먹어도/.test(text) ? '약과 함께 먹어도 되는지 확인이 필요해요' : '오래가면 상담을 권해요');
  if (!topics.length) {
    return { type:'answer', title:'딱 맞는 추천을 찾지 못했어요', insights, scope, groups:[], excluded:[], warnings:[], textMeds,
      hint:'조금 더 구체적으로 적어 주세요.', consult:{ emphasize: consultWhy.length>0 || textMeds.length>0, why: consultWhy[0] || (textMeds.length ? '복용 중인 약과 함께 먹어도 되는지는 약사 확인이 필요해요' : '') }, disclaimer:DISCLAIMER };
  }
  const t = topics[0];
  const warnings = [], excluded = [];
  const recent = memory.recentEntries || [];
  const tired = recent.some(e => (e.tags||[]).some(x => ['alcohol','sleepless','overwork'].includes(x)));
  const foodsSorted = tired ? [...t.foods].sort((a,b) => (b.tags||[]).includes('warm') - (a.tags||[]).includes('warm')) : t.foods;
  const last = (memory.lastTops || [])[0], seen = memory.seen || {};
  const ordered = [...foodsSorted].sort((a,b) => ((a.name===last)*2 + ((seen[a.name]||0)>=2)) - ((b.name===last)*2 + ((seen[b.name]||0)>=2)));
  const foods = applySafety(ordered, conds, warnings, excluded).slice(0, 3);
  const askSupp = /영양제|건강기능식품|추천|뭐 먹|먹으면|같이 먹어도/.test(text) || ['lipid','glucose','constipation'].includes(t.id);
  const suppsAll = applySafety(t.supplements, conds, askSupp ? warnings : [], excluded).slice(0, 2);
  const supps = askSupp ? suppsAll : [];
  const otc = applySafety(t.otc, conds, warnings, excluded).slice(0, 1);
  const withVar = arr => arr.map(x => ({ ...x, variants: VARIANTS[x.name] || (x.name==='대추생강차' ? VARIANTS['생강차'] : null) }));
  const groups = [
    { kind:'food', label:'🥣 음식 · 차', items: withVar(foods) },
    { kind:'supp', label:'💊 건강기능식품', items: withVar(supps) },
    { kind:'otc', label:'🌿 한방 일반의약품', items: withVar(otc) },
  ].filter(g => g.items.length);
  if (warnings.length && /약/.test(p.meds || '')) consultWhy.push('약과 함께 먹어도 되는지 확인이 필요해요');
  if ((p.checkups || []).length && t.id === 'lipid') consultWhy.push('검진 결과는 의사의 안내를 우선 따라 주세요');
  const titles = { hangover:'술 마신 다음 날', chill:'으슬으슬 감기 기운', throat:'목이 칼칼할 때', digest:'속이 더부룩할 때', fatigue:'피곤하고 기운 없을 때', sleep:'잠·긴장', eye:'눈 피로', constipation:'변비가 있을 때', lipid:'LDL·콜레스테롤 관리', glucose:'혈당 관리', latesnack:'야식이 잦을 때' };
  const g0 = groups[0], i0 = g0 ? (g0.items.find(i => !i.note) || g0.items[0]) : null;
  const top = g0 ? { ...i0, kind: g0.kind, why: shortWhy(i0, g0.kind) } : null;
  const enough = top && top.kind === 'food' && !['lipid','glucose'].includes(t.id);
  const fl = null; // 습관 교정 문구 없음
  const pl = personalLine(t.id, recent);
  const lines = fl ? [fl.line, safetyLine(excluded, conds, p.meds)].filter(Boolean) : [pl || connectLine(t.id, recent), top ? (top.kind === 'food' ? `${enough ? top.name : josa(top.name,'을','를')}${enough ? (/국$|탕$/.test(top.name) ? ' 한 그릇이 조금이라도 도움이 될 수 있어요.' : /차$|즙$|물$/.test(top.name) ? ' 한 잔이 조금이라도 도움이 될 수 있어요.' : ' 정도가 조금이라도 도움이 될 수 있어요.') : ' 곁들여 보세요. 조금이라도 도움이 될 수 있어요.'}` : `${top.name}을 고려해 볼 만해요.`) : null, safetyLine(excluded, conds, p.meds)].filter(Boolean);
  const trace = fl ? fl.trace.map(e => ({ day:e.day, text:e.text })) : recent.filter(e => (e.tags||[]).some(x => ['alcohol','sleepless','overwork','fried'].includes(x))).map(e => ({ day:e.day, text:e.text }));
  return { type:'answer', topic:t.id, top, lines, enough, trace, title: titles[t.id] || t.label, insights, scope, groups, excluded, warnings:[...new Set(warnings)], textMeds,
    consult:{ emphasize: consultWhy.length > 0, why: consultWhy[0] || '' }, disclaimer:DISCLAIMER };
}

const SAMPLES = {
  checkup: { label:'건강검진 결과지 (샘플)', text:'검진에서 LDL 콜레스테롤과 중성지방이 높게 나옴' },
  meds: { label:'약 봉투 (샘플)', text:'아스피린 복용 중인데 같이 먹어도 되는 영양제? 요즘 피곤해요' },
};


// 잘 알려진 상호작용만 (문구는 예시, 약사 검수 전)
const CATCHES = [
  { id:'alc-apap', med:/아세트아미노펜|타이레놀|종합감기약|감기약/, ctx:/술|회식|음주|소주|맥주|와인|마셔|마심|마신/, line:m=>`술 드신 날엔 ${m}의 아세트아미노펜이 간에 부담이 될 수 있어요. 술과 같은 날은 피하세요.` },
  { id:'alc-asp', med:/아스피린/, ctx:/술|회식|음주|소주|맥주|와인|마셔|마심|마신/, line:()=>'아스피린 드시는데 술이 겹치면 위 출혈 위험이 커질 수 있어요.' },
  { id:'grapefruit', med:/스타틴|아토르바|심바스타|암로디핀|칼슘채널|고지혈증약/, ctx:/자몽/, line:()=>'드시는 약은 자몽·자몽주스와 같이 먹으면 약 효과가 세질 수 있어요.' },
  { id:'iron-coffee', med:/철분/, ctx:/커피|녹차|홍차/, line:()=>'철분제는 커피·녹차와 1~2시간 간격을 두세요. 흡수를 방해해요.' },
  { id:'abx-milk', med:/항생제|테트라사이클린|퀴놀론|시프로/, ctx:/우유|요구르트|치즈|칼슘/, line:()=>'일부 항생제는 우유·칼슘과 같이 먹으면 흡수가 줄어요. 2시간쯤 간격을 두세요.' },
  { id:'warfarin-k', med:/와파린/, ctx:/시금치|케일|브로콜리|청국장|녹즙|나물/, line:()=>'와파린 드시면 시금치·케일 같은 녹색 채소는 갑자기 늘리지 말고 늘 비슷한 양으로 드세요.' },
];
function crossCatch(text, profile, memory) {
  const meds = [profile.meds || '', ...(memory.recentEntries || []).map(e => e.text), text].join(' ');
  const ctx = [text, ...(memory.recentEntries || []).filter(e => e.dayDiff == null || e.dayDiff <= 2).map(e => e.text)].join(' ');
  const done = memory.lastCatches || [];
  for (const c of CATCHES) {
    const mm = meds.match(c.med); if (!mm || !c.ctx.test(ctx) || done.includes(c.id)) continue;
    return { id: c.id, line: c.line(mm[0]) };
  }
  return null;
}

// 기록을 엮은 구체적 음식 제안 (일상 톤)
const FOOD_LINKS = [
  { topic:/digest/, rec:/야식|늦게 (저녁|먹)|밤에 (먹|라면)|10시|11시|치킨/, min:2, line:n=>`이번 주 늦은 저녁이 ${n}번 있었죠. 오늘 저녁은 8시 전에 두부된장국에 밥 반 공기 정도로 가볍게 드셔 보세요.` },
  { topic:/sleep/, rec:/커피|아메리카노|라떼|카페/, min:2, line:n=>`오후 커피 기록이 ${n}번 있었죠. 커피는 점심 직후까지만 드시고, 오후엔 보리차나 루이보스로 바꿔 보세요.` },
  { topic:/fatigue/, rec:/점심 거름|아침 거름|굶|컵라면/, min:2, line:n=>`끼니를 건너뛰거나 대충 때운 날이 ${n}번 있었죠. 내일 아침은 삶은 달걀 두 개와 바나나면 충분해요.` },
  { topic:/constipation/, rec:/물 안|커피|빵|라면|배달/, min:2, line:n=>`빵·면 위주 끼니가 ${n}번 있었죠. 한 끼만 잡곡밥과 나물로 바꾸고 물을 자주 드셔 보세요.` },
];
function foodLink(topicId, recent) {
  for (const f of FOOD_LINKS) {
    if (!f.topic.test(topicId)) continue;
    const hits = recent.filter(e => f.rec.test(e.text));
    if (hits.length >= f.min) return { line: f.line(KN[hits.length] || hits.length), trace: hits };
  }
  return null;
}
const NOTE_TIPS = {
  alcohol: ['자기 전 물 한 잔, 내일 아침은 콩나물국이나 북엇국이 편해요.', '안주는 튀김보다 두부·생선구이 쪽이 속이 편해요.', '다음 날 아침은 기름진 해장보다 맑은 국물이 좋아요.'],
  sleepless: ['오늘 저녁 커피는 쉬고, 따뜻한 우유나 두유 한 잔 어때요.', '늦은 밤 간식은 바나나 정도로 가볍게요.'],
  overwork: ['야근 땐 컵라면보다 김밥·두유처럼 덜 짠 쪽이 나아요.', '늦은 저녁은 양을 줄이고 따뜻한 국 위주로요.'],
  fried: ['다음 끼니엔 나물이나 쌈채소를 곁들여 보세요.'],
};
function noteTip() { return null;
}
window.BapsimEngine = { CHECKUPS, answer, classify, noteTip, crossCatch, SAMPLES, DISCLAIMER };
})();
