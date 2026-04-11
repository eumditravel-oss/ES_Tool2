const STORAGE_KEY = 'ES_ADJUSTMENT_REPORT_EXCEL_SYNC_V1';
const DEFAULT_PAGE = 'overview';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createNewItem(name = '신규 비목') {
  return { id: uid(), name, cost: 0, baseIndex: 100, compareIndex: 100, note: '' };
}

function createNewGroup(name = '신규 비목군') {
  return { id: uid(), name, items: [createNewItem()] };
}

// 엑셀 규격 전체 제비율 표준 템플릿 100% 반영
const SAMPLE_STATE = {
  meta: { agency: '', projectName: '', bidDate: '', contractDate: '', compareDate: '', memo: '' },
  groups: [
    {
      id: uid(), name: '직접공사비',
      items: [
        { id: uid(), name: '재료비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '노무비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '산출경비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' }
      ]
    },
    {
      id: uid(), name: '간접노무비 및 제경비',
      items: [
        { id: uid(), name: '간접노무비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '산재보험료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '고용보험료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '국민건강보험료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '국민연금보험료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '노인장기요양보험료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '건설근로자퇴직공제부금비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '산업안전보건관리비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '안전관리비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '환경보전비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '하도급대금지급보증서발급수수료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '건설기계대여금지급보증서수수료', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '기타경비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' }
      ]
    },
    {
      id: uid(), name: '일반관리비 및 이윤',
      items: [
        { id: uid(), name: '일반관리비', cost: 0, baseIndex: 100, compareIndex: 100, note: '' },
        { id: uid(), name: '이윤', cost: 0, baseIndex: 100, compareIndex: 100, note: '' }
      ]
    }
  ]
};

let state = loadState();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  topTabs: $$('.topTab'), topPrintBtn: $('#topPrintBtn'),
  agency: $('#agency'), projectName: $('#projectName'), bidDate: $('#bidDate'),
  contractDate: $('#contractDate'), compareDate: $('#compareDate'), memo: $('#memo'),
  tableBody: $('#tableBody'), kpiTotalCost: $('#kpiTotalCost'), kpiCoefficient: $('#kpiCoefficient'),
  kpiES: $('#kpiES'), kpiStatus: $('#kpiStatus'), tfootTotalCost: $('#tfootTotalCost'),
  tfootCoefficient: $('#tfootCoefficient'), tfootES: $('#tfootES'),
  summaryAgency: $('#summaryAgency'), summaryProject: $('#summaryProject'),
  summaryCompareDate: $('#summaryCompareDate'), statusBox: $('#statusBox'),
  saveBtn: $('#saveBtn'), loadSampleBtn: $('#loadSampleBtn'),
  addGroupBtn: $('#addGroupBtn'), validateBtn: $('#validateBtn'),
  exportExcelBtn: $('#exportExcelBtn'), exportBtn: $('#exportBtn'),
  importInput: $('#importInput'), resetBtn: $('#resetBtn'),
  toastHost: $('#toastHost'), modalBackdrop: $('#modalBackdrop'),
  modalTitle: $('#modalTitle'), modalBody: $('#modalBody'),
  modalClose: $('#modalClose'), modalOk: $('#modalOk')
};

init();

function init() {
  bindMeta();
  bindActions();
  bindSideMenu();
  activatePage(DEFAULT_PAGE);
  render();
}

function normalizeStateShape(rawState) {
  const next = clone(rawState);
  if (!next.meta || typeof next.meta !== 'object') next.meta = clone(SAMPLE_STATE.meta);
  else next.meta = { ...clone(SAMPLE_STATE.meta), ...next.meta };
  
  if (!Array.isArray(next.groups) || next.groups.length === 0) return clone(SAMPLE_STATE);
  
  next.groups = next.groups.map(group => {
    const safeGroup = {
      id: group?.id || uid(), name: group?.name || '신규 비목군',
      items: Array.isArray(group?.items) && group.items.length > 0 ? group.items : [createNewItem()]
    };
    safeGroup.items = safeGroup.items.map(item => ({
      id: item?.id || uid(), name: item?.name ?? '',
      cost: parseNumber(item?.cost), baseIndex: parseNumber(item?.baseIndex),
      compareIndex: parseNumber(item?.compareIndex), note: item?.note ?? ''
    }));
    return safeGroup;
  });
  return next;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(SAMPLE_STATE);
    const parsed = JSON.parse(raw);
    return normalizeStateShape(parsed);
  } catch (error) { return clone(SAMPLE_STATE); }
}

function saveState(showToast = false) {
  syncMetaFromFields();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showToast) toast('진행 상황이 브라우저에 안전하게 저장되었습니다.');
}

function bindMeta() {
  els.agency.value = state.meta.agency || '';
  els.projectName.value = state.meta.projectName || '';
  els.bidDate.value = state.meta.bidDate || '';
  els.contractDate.value = state.meta.contractDate || '';
  els.compareDate.value = state.meta.compareDate || '';
  els.memo.value = state.meta.memo || '';

  [els.agency, els.projectName, els.bidDate, els.contractDate, els.compareDate, els.memo].forEach(el => {
    el.addEventListener('input', () => { syncMetaFromFields(); render(false); saveState(false); });
  });
}

// === 메뉴(탭) 활성화 완벽 반영 ===
function activatePage(pageName) {
  $$('.pageSection').forEach(section => {
    if (section.id === `page-${pageName}`) {
      section.style.display = 'block'; setTimeout(() => section.classList.add('is-active'), 10);
    } else {
      section.style.display = 'none'; section.classList.remove('is-active');
    }
  });

  $$('#sideMenu .side-item').forEach(item => item.classList.toggle('active', item.dataset.page === pageName));
  els.topTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.target === pageName));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindSideMenu() {
  $$('#sideMenu .side-item').forEach(btn => btn.addEventListener('click', () => activatePage(btn.dataset.page)));
  els.topTabs.forEach(tab => tab.addEventListener('click', e => { if (e.target.dataset.target) activatePage(e.target.dataset.target); }));
  
  // 데이터 관리 탭 내의 카드 타이틀 클릭 시 다른 탭으로 이동할 수 있는 경우도 대응
  $$('.dashCardTitleLink').forEach(link => link.addEventListener('click', () => {
    if(link.textContent === '데이터 백업 및 엑셀 출력') activatePage('data');
  }));
}

function bindActions() {
  els.saveBtn.addEventListener('click', () => saveState(true));
  if (els.topPrintBtn) els.topPrintBtn.addEventListener('click', () => window.print());
  
  // 인쇄버튼 (개요 페이지 내)
  const mainPrintBtn = $('#printBtn');
  if(mainPrintBtn) mainPrintBtn.addEventListener('click', () => window.print());

  els.loadSampleBtn.addEventListener('click', () => {
    if(confirm('기존 입력값이 지워지고 건축/토목 표준 제비율 템플릿을 불러옵니다. 계속할까요?')) {
      state = clone(SAMPLE_STATE); refreshMetaFields(); render(); saveState(false); toast('표준 템플릿 로드 완료');
    }
  });

  els.addGroupBtn.addEventListener('click', () => { state.groups.push(createNewGroup()); render(); saveState(false); });

  els.validateBtn.addEventListener('click', () => {
    const stats = calculateStats();
    const msgs = buildValidationMessages(stats);
    if (msgs.length === 0) {
      if (Math.abs(stats.finalES) >= 0.03) showModal('정밀 검토 통과 (조정 대상)', '1. 계수 합계 및 지수 연산 정상\n2. 최종 지수조정율(K)이 3% 이상이므로 물가변동 적용 대상입니다.');
      else showModal('정밀 검토 통과 (요건 미달)', '1. 계수 합계 및 지수 연산 정상\n2. 다만, 최종 지수조정율(K)이 3% 미만(절대값 기준)이므로 물가변동 적용이 불가합니다.');
    } else {
      showModal('검토 필요 (오류 발생)', msgs.join('\n'));
    }
  });

  els.exportExcelBtn.addEventListener('click', exportCSV);
  els.exportBtn.addEventListener('click', exportJSON);
  els.resetBtn.addEventListener('click', () => {
    if (!confirm('모든 데이터가 완전히 삭제됩니다. 진행할까요?')) return;
    state = clone(SAMPLE_STATE); state.groups = [createNewGroup('비목군 1')]; // 완전 초기화
    refreshMetaFields(); render(); saveState(false); toast('초기화 되었습니다.');
  });

  els.importInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text(); const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.groups)) throw new Error('invalid');
      state = normalizeStateShape(parsed); refreshMetaFields(); render(); saveState(false); toast('데이터 복구 성공');
    } catch (err) { showModal('복구 실패', '유효한 JSON 파일이 아닙니다.'); }
    finally { e.target.value = ''; }
  });

  els.modalClose.addEventListener('click', closeModal);
  els.modalOk.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', e => { if (e.target === els.modalBackdrop) closeModal(); });
}

function syncMetaFromFields() {
  state.meta.agency = els.agency.value; state.meta.projectName = els.projectName.value;
  state.meta.bidDate = els.bidDate.value; state.meta.contractDate = els.contractDate.value;
  state.meta.compareDate = els.compareDate.value; state.meta.memo = els.memo.value;
}

function refreshMetaFields() {
  els.agency.value = state.meta.agency || ''; els.projectName.value = state.meta.projectName || '';
  els.bidDate.value = state.meta.bidDate || ''; els.contractDate.value = state.meta.contractDate || '';
  els.compareDate.value = state.meta.compareDate || ''; els.memo.value = state.meta.memo || '';
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return Number(String(value ?? '').replace(/,/g, '').trim()) || 0;
}

function formatNumber(val) { return new Intl.NumberFormat('ko-KR').format(parseNumber(val)); }
function formatFixed(val, digits = 4) { return parseNumber(val).toFixed(digits); }

// 부동소수점 오차를 방지하는 엑셀 ROUND 규격 (사사오입)
function roundTo(num, digits) {
  const factor = Math.pow(10, digits);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

// 핵심 연산: 전체구조맵.csv 규격
function calculateStats() {
  const flatItems = state.groups.flatMap(g => (g.items || []).map(i => ({ group: g, item: i })));
  const totalCost = flatItems.reduce((sum, e) => sum + parseNumber(e.item.cost), 0);

  let actualTotalCoefficient = 0;
  let finalES = 0;
  let zeroBaseCount = 0;
  let emptyNameCount = 0;

  const computed = flatItems.map(({ group, item }) => {
    const cost = parseNumber(item.cost);
    const baseIndex = parseNumber(item.baseIndex);
    const compareIndex = parseNumber(item.compareIndex);
    
    // 1. 계수 (A): 4자리 반올림
    const coefficient = totalCost > 0 ? roundTo(cost / totalCost, 4) : 0;
    
    // 2. 변동율 (K): 기준지수가 0일 경우 나눗셈 에러(NaN/Infinity) 방지. 4자리 반올림.
    const fluctuationRate = baseIndex > 0 ? roundTo(compareIndex / baseIndex, 4) : 0;
    
    // 3. 조정계수: 5자리 반올림
    const adjustmentCoefficient = baseIndex > 0 ? roundTo(coefficient * (fluctuationRate - 1), 5) : 0;

    actualTotalCoefficient += coefficient;
    finalES += adjustmentCoefficient;

    if (baseIndex <= 0 && cost > 0) zeroBaseCount += 1;
    if (!String(item.name || '').trim()) emptyNameCount += 1;

    return { key: `${group.id}:${item.id}`, cost, baseIndex, compareIndex, coefficient, fluctuationRate, adjustmentCoefficient };
  });

  return { totalCost, actualTotalCoefficient, finalES, zeroBaseCount, emptyNameCount, computed };
}

function buildValidationMessages(stats) {
  const messages = [];
  if (stats.totalCost <= 0) messages.push('- 총 적용대가가 0입니다.');
  if (Math.abs(stats.actualTotalCoefficient - 1) > 0.0002 && stats.totalCost > 0) messages.push('- 총 계수 합계가 1.0000이 아닙니다. (단가 조정 필요)');
  if (stats.zeroBaseCount > 0) messages.push(`- 기준지수가 0이거나 미입력된 비목이 ${stats.zeroBaseCount}건 있습니다.`);
  if (stats.emptyNameCount > 0) messages.push(`- 비목명 미입력 상태가 ${stats.emptyNameCount}건 있습니다.`);
  return messages;
}

function render(showToastOnSave = false) {
  syncMetaFromFields();
  const stats = calculateStats();
  const computedMap = new Map(stats.computed.map(c => [c.key, c]));

  els.tableBody.innerHTML = '';

  state.groups.forEach((group, gIdx) => {
    const subCost = group.items.reduce((s, i) => s + parseNumber(i.cost), 0);
    const subCoeff = stats.totalCost > 0 ? roundTo(subCost / stats.totalCost, 4) : 0;

    const gRow = document.createElement('tr'); gRow.className = 'groupRow';
    gRow.innerHTML = `
      <td><input class="tableInput groupName" data-role="g-name" data-g="${gIdx}" value="${escapeHtml(group.name)}"></td>
      <td class="mono right">${formatNumber(subCost)}</td>
      <td class="mono right">${formatFixed(subCoeff, 4)}</td>
      <td colspan="5"></td>
      <td class="no-print center">
        <button class="btn smallAction" data-action="add-item" data-g="${gIdx}">+ 추가</button>
        <button class="btn smallAction" data-action="del-group" data-g="${gIdx}">삭제</button>
      </td>
    `;
    els.tableBody.appendChild(gRow);

    group.items.forEach((item, iIdx) => {
      const c = computedMap.get(`${group.id}:${item.id}`) || { coefficient:0, fluctuationRate:0, adjustmentCoefficient:0 };
      const signClass = c.adjustmentCoefficient < 0 ? 'value-negative' : 'value-positive';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input class="tableInput" data-role="i-name" data-g="${gIdx}" data-i="${iIdx}" value="${escapeHtml(item.name)}"></td>
        <td><input class="tableInput right mono" data-role="i-cost" data-g="${gIdx}" data-i="${iIdx}" value="${formatNumber(item.cost)}"></td>
        <td><input class="tableInput readonly right mono" value="${formatFixed(c.coefficient, 4)}" readonly></td>
        <td><input class="tableInput right mono" data-role="i-base" data-g="${gIdx}" data-i="${iIdx}" value="${item.baseIndex || 0}"></td>
        <td><input class="tableInput right mono" data-role="i-comp" data-g="${gIdx}" data-i="${iIdx}" value="${item.compareIndex || 0}"></td>
        <td><input class="tableInput readonly right mono" value="${formatFixed(c.fluctuationRate, 4)}" readonly></td>
        <td><input class="tableInput readonly right mono ${signClass}" value="${formatFixed(c.adjustmentCoefficient, 5)}" readonly></td>
        <td><input class="tableInput" data-role="i-note" data-g="${gIdx}" data-i="${iIdx}" value="${escapeHtml(item.note)}"></td>
        <td class="no-print center"><button class="btn smallAction" data-action="del-item" data-g="${gIdx}" data-i="${iIdx}">X</button></td>
      `;
      els.tableBody.appendChild(row);
    });
  });

  bindTableInputs();

  // 지표 업데이트 (K 값 반영)
  els.kpiTotalCost.textContent = formatNumber(stats.totalCost);
  els.kpiCoefficient.textContent = formatFixed(stats.actualTotalCoefficient, 4);
  els.kpiES.textContent = `${formatFixed(stats.finalES * 100, 2)}%`;
  els.tfootTotalCost.textContent = formatNumber(stats.totalCost);
  els.tfootCoefficient.textContent = formatFixed(stats.actualTotalCoefficient, 4);
  els.tfootES.textContent = formatFixed(stats.finalES, 5); // Tfoot에는 원시값(5자리) 노출
  
  els.summaryAgency.textContent = state.meta.agency || '-';
  els.summaryProject.textContent = state.meta.projectName || '-';
  els.summaryCompareDate.textContent = state.meta.compareDate || '-';

  // 3% 판정 로직 반영
  const msgs = buildValidationMessages(stats);
  const isOver3 = Math.abs(stats.finalES) >= 0.03;

  if (msgs.length === 0) {
    if (stats.totalCost > 0 && isOver3) {
      els.kpiStatus.textContent = '조정 대상';
      els.statusBox.textContent = `검토 완료 · 3% 요건 충족`;
      els.statusBox.style.color = '#166534'; els.statusBox.style.background = '#dcfce7'; els.statusBox.style.borderColor = '#bbf7d0';
    } else if (stats.totalCost > 0 && !isOver3) {
      els.kpiStatus.textContent = '요건 미달';
      els.statusBox.textContent = `검토 완료 · 3% 미만`;
      els.statusBox.style.color = '#92400e'; els.statusBox.style.background = '#fef3c7'; els.statusBox.style.borderColor = '#fde68a';
    } else {
      els.kpiStatus.textContent = '입력 대기'; els.statusBox.textContent = '데이터를 입력해주세요.';
      els.statusBox.style.color = '#4b5563'; els.statusBox.style.background = '#f3f4f6'; els.statusBox.style.borderColor = '#e5e7eb';
    }
  } else {
    els.kpiStatus.textContent = '확인 필요';
    els.statusBox.textContent = `오류 · ${msgs[0]}`;
    els.statusBox.style.color = '#991b1b'; els.statusBox.style.background = '#fee2e2'; els.statusBox.style.borderColor = '#fecaca';
  }

  if (showToastOnSave) saveState(true);
}

function bindTableInputs() {
  $$('#tableBody [data-role]').forEach(el => el.addEventListener('input', handleInputChange));
  $$('#tableBody [data-action]').forEach(btn => btn.addEventListener('click', handleTableAction));
}

function handleInputChange(e) {
  const { role, g, i } = e.target.dataset; const gIdx = Number(g), iIdx = Number(i);
  if (role === 'g-name') state.groups[gIdx].name = e.target.value;
  if (role === 'i-name') state.groups[gIdx].items[iIdx].name = e.target.value;
  if (role === 'i-note') state.groups[gIdx].items[iIdx].note = e.target.value;
  if (role === 'i-cost') {
    const cln = e.target.value.replace(/[^0-9.-]/g, '');
    state.groups[gIdx].items[iIdx].cost = parseNumber(cln);
    e.target.value = cln ? formatNumber(cln) : '';
  }
  if (role === 'i-base') state.groups[gIdx].items[iIdx].baseIndex = parseNumber(e.target.value.replace(/[^0-9.-]/g, ''));
  if (role === 'i-comp') state.groups[gIdx].items[iIdx].compareIndex = parseNumber(e.target.value.replace(/[^0-9.-]/g, ''));

  render(); saveState(false);
}

function handleTableAction(e) {
  const { action, g, i } = e.target.dataset; const gIdx = Number(g), iIdx = Number(i);
  if (action === 'add-item') state.groups[gIdx].items.push(createNewItem());
  if (action === 'del-item') {
    state.groups[gIdx].items.splice(iIdx, 1);
    if (state.groups[gIdx].items.length === 0) state.groups[gIdx].items.push(createNewItem());
  }
  if (action === 'del-group') {
    state.groups.splice(gIdx, 1);
    if (state.groups.length === 0) state.groups.push(createNewGroup());
  }
  render(); saveState(false);
}

function escapeCsv(str) {
  if (str == null) return ''; const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCSV() {
  syncMetaFromFields(); const stats = calculateStats();
  const cMap = new Map(stats.computed.map(c => [c.key, c]));
  let csv = '\uFEFF'; // 한글 깨짐 방지 BOM
  
  csv += `수요기관,${escapeCsv(state.meta.agency)}\n공사명,${escapeCsv(state.meta.projectName)}\n입찰일,${escapeCsv(state.meta.bidDate)}\n계약일,${escapeCsv(state.meta.contractDate)}\n비교시점,${escapeCsv(state.meta.compareDate)}\n\n`;
  csv += '비목 / 비목군,적용대가,계수(A),기준지수,비교지수,지수변동율(K),조정계수,비고\n';

  state.groups.forEach(g => {
    const subCost = g.items.reduce((s, i) => s + parseNumber(i.cost), 0);
    const subCoeff = stats.totalCost > 0 ? roundTo(subCost / stats.totalCost, 4) : 0;
    csv += `${escapeCsv('[' + g.name + ']')},${subCost},${formatFixed(subCoeff, 4)},,,,,\n`;

    g.items.forEach(i => {
      const c = cMap.get(`${g.id}:${i.id}`);
      csv += `${escapeCsv('    ' + i.name)},${i.cost},${formatFixed(c.coefficient, 4)},${i.baseIndex},${i.compareIndex},${formatFixed(c.fluctuationRate, 4)},${formatFixed(c.adjustmentCoefficient, 5)},${escapeCsv(i.note)}\n`;
    });
  });

  csv += `\n총 계,${stats.totalCost},${formatFixed(stats.actualTotalCoefficient, 4)},,,최종 지수조정율(K),${formatFixed(stats.finalES, 5)},\n`;
  csv += `3% 판정결과,${Math.abs(stats.finalES) >= 0.03 ? '조정대상' : '조정불가'},,,,,,\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
  link.download = `ES_산출서_${state.meta.projectName || '출력본'}.csv`; link.click(); URL.revokeObjectURL(link.href);
}

function exportJSON() {
  syncMetaFromFields(); const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
  link.download = `ES_데이터백업.json`; link.click(); URL.revokeObjectURL(link.href);
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
  els.toastHost.appendChild(t); setTimeout(() => t.remove(), 2200);
}

function showModal(title, text) {
  els.modalTitle.textContent = title; els.modalBody.textContent = text; els.modalBackdrop.classList.remove('hidden');
}
function closeModal() { els.modalBackdrop.classList.add('hidden'); }
function escapeHtml(val) { return String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
