const STORAGE_KEY = 'ES_ADJUSTMENT_WEBAPP_FINAL';
const DEFAULT_PAGE = 'overview';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createNewItem(name = '신규 비목') {
  return { id: uid(), name, cost: 0, baseIndex: 0, compareIndex: 0, note: '' };
}

function createNewGroup(name = '신규 비목군') {
  return { id: uid(), name, items: [createNewItem()] };
}

const SAMPLE_STATE = {
  meta: { agency: '', projectName: '', bidDate: '', contractDate: '', compareDate: '', memo: '' },
  groups: [
    {
      id: uid(), name: '직접공사비',
      items: [
        { id: uid(), name: '노무비', cost: 0, baseIndex: 100, compareIndex: 102.29, note: '' },
        { id: uid(), name: '재료비', cost: 0, baseIndex: 100, compareIndex: 103.58, note: '' },
        { id: uid(), name: '경비', cost: 0, baseIndex: 121.93, compareIndex: 123.39, note: '' }
      ]
    },
    {
      id: uid(), name: '제요율경비',
      items: [
        { id: uid(), name: '산재보험료', cost: 0, baseIndex: 100, compareIndex: 102.28, note: '' },
        { id: uid(), name: '일반관리비', cost: 0, baseIndex: 100, compareIndex: 101.89, note: '' }
      ]
    }
  ]
};

let state = loadState();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  topTabs: $$('.topTab'),
  topPrintBtn: $('#topPrintBtn'),
  agency: $('#agency'),
  projectName: $('#projectName'),
  bidDate: $('#bidDate'),
  contractDate: $('#contractDate'),
  compareDate: $('#compareDate'),
  memo: $('#memo'),
  tableBody: $('#tableBody'),
  kpiTotalCost: $('#kpiTotalCost'),
  kpiCoefficient: $('#kpiCoefficient'),
  kpiES: $('#kpiES'),
  kpiStatus: $('#kpiStatus'),
  tfootTotalCost: $('#tfootTotalCost'),
  tfootCoefficient: $('#tfootCoefficient'),
  tfootES: $('#tfootES'),
  summaryAgency: $('#summaryAgency'),
  summaryProject: $('#summaryProject'),
  summaryCompareDate: $('#summaryCompareDate'),
  statusBox: $('#statusBox'),
  saveBtn: $('#saveBtn'),
  printBtn: $('#printBtn'),
  loadSampleBtn: $('#loadSampleBtn'),
  addGroupBtn: $('#addGroupBtn'),
  addItemBtn: $('#addItemBtn'),
  validateBtn: $('#validateBtn'),
  exportExcelBtn: $('#exportExcelBtn'),
  exportBtn: $('#exportBtn'),
  importInput: $('#importInput'),
  resetBtn: $('#resetBtn'),
  toastHost: $('#toastHost'),
  modalBackdrop: $('#modalBackdrop'),
  modalTitle: $('#modalTitle'),
  modalBody: $('#modalBody'),
  modalClose: $('#modalClose'),
  modalOk: $('#modalOk')
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
  
  if (!Array.isArray(next.groups) || next.groups.length === 0) {
    next.groups = clone(SAMPLE_STATE.groups);
    return next;
  }
  next.groups = next.groups.map((group) => {
    const safeGroup = {
      id: group?.id || uid(),
      name: group?.name || '신규 비목군',
      items: Array.isArray(group?.items) && group.items.length > 0 ? group.items : [createNewItem()]
    };
    safeGroup.items = safeGroup.items.map((item) => ({
      id: item?.id || uid(),
      name: item?.name ?? '',
      cost: parseNumber(item?.cost),
      baseIndex: parseNumber(item?.baseIndex),
      compareIndex: parseNumber(item?.compareIndex),
      note: item?.note ?? ''
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
    if (!parsed || !Array.isArray(parsed.groups)) return clone(SAMPLE_STATE);
    return normalizeStateShape(parsed);
  } catch (error) {
    return clone(SAMPLE_STATE);
  }
}

function saveState(showToast = false) {
  syncMetaFromFields();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showToast) toast('브라우저에 저장했습니다.');
}

function bindMeta() {
  els.agency.value = state.meta.agency || '';
  els.projectName.value = state.meta.projectName || '';
  els.bidDate.value = state.meta.bidDate || '';
  els.contractDate.value = state.meta.contractDate || '';
  els.compareDate.value = state.meta.compareDate || '';
  els.memo.value = state.meta.memo || '';

  [els.agency, els.projectName, els.bidDate, els.contractDate, els.compareDate, els.memo].forEach((el) => {
    el.addEventListener('input', () => { syncMetaFromFields(); render(false); saveState(false); });
  });
}

// === 메뉴 전환 핵심 로직 (모든 탭/사이드메뉴 활성화) ===
function activatePage(pageName) {
  // 1. 모든 섹션 숨기고 선택된 페이지만 보이기
  $$('.pageSection').forEach((section) => {
    if (section.id === `page-${pageName}`) {
      section.style.display = 'block';
      section.classList.add('is-active');
    } else {
      section.style.display = 'none';
      section.classList.remove('is-active');
    }
  });

  // 2. 사이드 메뉴 하이라이트
  $$('#sideMenu .side-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // 3. 상단 탭 하이라이트
  els.topTabs.forEach((tab) => {
    if (tab.dataset.target) {
      tab.classList.toggle('active', tab.dataset.target === pageName);
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindSideMenu() {
  // 사이드 메뉴 클릭
  $$('#sideMenu .side-item').forEach((button) => {
    button.addEventListener('click', () => { activatePage(button.dataset.page || DEFAULT_PAGE); });
  });
  
  // 상단 탭 클릭
  els.topTabs.forEach(tab => {
    tab.addEventListener('click', (e) => { 
      if (e.target.dataset.target) activatePage(e.target.dataset.target); 
    });
  });
}

function bindActions() {
  els.saveBtn.addEventListener('click', () => saveState(true));
  els.printBtn.addEventListener('click', () => window.print());
  if (els.topPrintBtn) els.topPrintBtn.addEventListener('click', () => window.print());
  
  els.loadSampleBtn.addEventListener('click', () => {
    state = clone(SAMPLE_STATE);
    refreshMetaFields(); render(); saveState(false); toast('샘플 데이터를 불러왔습니다.');
  });

  els.addGroupBtn.addEventListener('click', () => { state.groups.push(createNewGroup()); render(); saveState(false); });
  els.addItemBtn.addEventListener('click', () => {
    const directGroup = state.groups.find(g => g.name === '직접공사비') || state.groups[0];
    if (!directGroup) return;
    directGroup.items.push(createNewItem());
    render(); saveState(false);
  });

  els.validateBtn.addEventListener('click', () => {
    const stats = calculateStats();
    const messages = buildValidationMessages(stats);
    if (messages.length === 0) {
      if (Math.abs(stats.finalES) >= 0.03) showModal('검토 결과', '계수 합계와 지수 입력이 정상입니다.\n최종 조정율이 3%를 초과하여 조정 대상에 해당합니다.');
      else showModal('검토 결과', '계수 합계와 지수 입력은 정상이나,\n최종 조정율이 3% 미만으로 요건에 미달합니다.');
    } else {
      showModal('검토 필요', messages.join('\n'));
    }
  });

  els.exportExcelBtn.addEventListener('click', exportCSV);
  els.exportBtn.addEventListener('click', exportJSON);
  els.resetBtn.addEventListener('click', () => {
    if (!confirm('현재 입력값을 초기화할까요?')) return;
    state = clone(SAMPLE_STATE); refreshMetaFields(); render(); saveState(false);
  });

  els.importInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.groups)) throw new Error('invalid');
      state = normalizeStateShape(parsed);
      refreshMetaFields(); render(); saveState(false); toast('JSON 데이터를 복구했습니다.');
    } catch (error) {
      showModal('불러오기 실패', '유효한 JSON 백업 파일이 아닙니다.');
    } finally {
      event.target.value = '';
    }
  });

  els.modalClose.addEventListener('click', closeModal);
  els.modalOk.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', (e) => { if (e.target === els.modalBackdrop) closeModal(); });
}

function syncMetaFromFields() {
  state.meta.agency = els.agency.value;
  state.meta.projectName = els.projectName.value;
  state.meta.bidDate = els.bidDate.value;
  state.meta.contractDate = els.contractDate.value;
  state.meta.compareDate = els.compareDate.value;
  state.meta.memo = els.memo.value;
}

function refreshMetaFields() {
  els.agency.value = state.meta.agency || '';
  els.projectName.value = state.meta.projectName || '';
  els.bidDate.value = state.meta.bidDate || '';
  els.contractDate.value = state.meta.contractDate || '';
  els.compareDate.value = state.meta.compareDate || '';
  els.memo.value = state.meta.memo || '';
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return Number(String(value ?? '').replace(/,/g, '').trim()) || 0;
}

function formatNumber(value) { return new Intl.NumberFormat('ko-KR').format(parseNumber(value)); }
function formatFixed(value, digits = 4) { return parseNumber(value).toFixed(digits); }

// 실무 엑셀 산출용 반올림 함수
function roundTo(num, digits) {
  const factor = Math.pow(10, digits);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

function calculateStats() {
  const flatItems = state.groups.flatMap(g => (g.items || []).map(i => ({ group: g, item: i })));
  const totalCost = flatItems.reduce((sum, entry) => sum + parseNumber(entry.item.cost), 0);

  let actualTotalCoefficient = 0;
  let finalES = 0;
  let zeroBaseCount = 0;
  let emptyNameCount = 0;

  const computed = flatItems.map(({ group, item }) => {
    const cost = parseNumber(item.cost);
    const baseIndex = parseNumber(item.baseIndex);
    const compareIndex = parseNumber(item.compareIndex);
    
    // 엑셀 규격: 계수 4자리, 변동율 4자리, 조정계수 5자리
    const coefficient = totalCost > 0 ? roundTo(cost / totalCost, 4) : 0;
    const fluctuationRate = baseIndex > 0 ? roundTo(compareIndex / baseIndex, 4) : 1;
    const adjustmentCoefficient = baseIndex > 0 ? roundTo(coefficient * (fluctuationRate - 1), 5) : 0;

    actualTotalCoefficient += coefficient;
    finalES += adjustmentCoefficient;

    if (baseIndex <= 0) zeroBaseCount += 1;
    if (!String(item.name || '').trim()) emptyNameCount += 1;

    return { key: `${group.id}:${item.id}`, cost, baseIndex, compareIndex, coefficient, fluctuationRate, adjustmentCoefficient };
  });

  return { totalCost, actualTotalCoefficient, finalES, zeroBaseCount, emptyNameCount, computed };
}

function buildValidationMessages(stats) {
  const messages = [];
  if (stats.totalCost <= 0) messages.push('- 총 적용대가가 0입니다.');
  if (Math.abs(stats.actualTotalCoefficient - 1) > 0.0002 && stats.totalCost > 0) messages.push('- 계수 합계가 1.0000이 아닙니다.');
  if (stats.zeroBaseCount > 0) messages.push(`- 기준지수가 0인 비목 ${stats.zeroBaseCount}건이 있습니다.`);
  if (stats.emptyNameCount > 0) messages.push(`- 비목명 미입력 ${stats.emptyNameCount}건이 있습니다.`);
  return messages;
}

function render(showToastOnSave = false) {
  syncMetaFromFields();
  const stats = calculateStats();
  const computedMap = new Map(stats.computed.map(entry => [entry.key, entry]));

  els.tableBody.innerHTML = '';

  state.groups.forEach((group, groupIndex) => {
    const subtotalCost = (group.items || []).reduce((sum, item) => sum + parseNumber(item.cost), 0);
    const subtotalCoefficient = stats.totalCost > 0 ? roundTo(subtotalCost / stats.totalCost, 4) : 0;

    const groupRow = document.createElement('tr');
    groupRow.className = 'groupRow';
    groupRow.innerHTML = `
      <td><input class="tableInput groupName" data-role="group-name" data-group-index="${groupIndex}" value="${escapeHtml(group.name || '')}"></td>
      <td class="mono right">${formatNumber(subtotalCost)}</td>
      <td class="mono right">${formatFixed(subtotalCoefficient, 4)}</td>
      <td colspan="5"></td>
      <td class="no-print center">
        <button class="btn smallAction" data-action="add-item" data-group-index="${groupIndex}">비목 추가</button>
        <button class="btn smallAction" data-action="delete-group" data-group-index="${groupIndex}">삭제</button>
      </td>
    `;
    els.tableBody.appendChild(groupRow);

    group.items.forEach((item, itemIndex) => {
      const c = computedMap.get(`${group.id}:${item.id}`) || { coefficient: 0, fluctuationRate: 1, adjustmentCoefficient: 0 };
      const signClass = c.adjustmentCoefficient < 0 ? 'value-negative' : 'value-positive';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input class="tableInput" data-role="item-name" data-group-index="${groupIndex}" data-item-index="${itemIndex}" value="${escapeHtml(item.name || '')}"></td>
        <td><input class="tableInput right mono" data-role="item-cost" data-group-index="${groupIndex}" data-item-index="${itemIndex}" value="${formatNumber(item.cost)}"></td>
        <td><input class="tableInput readonly right mono" value="${formatFixed(c.coefficient, 4)}" readonly></td>
        <td><input class="tableInput right mono" data-role="item-base" data-group-index="${groupIndex}" data-item-index="${itemIndex}" value="${item.baseIndex || 0}"></td>
        <td><input class="tableInput right mono" data-role="item-compare" data-group-index="${groupIndex}" data-item-index="${itemIndex}" value="${item.compareIndex || 0}"></td>
        <td><input class="tableInput readonly right mono" value="${formatFixed(c.fluctuationRate, 4)}" readonly></td>
        <td><input class="tableInput readonly right mono ${signClass}" value="${formatFixed(c.adjustmentCoefficient, 5)}" readonly></td>
        <td><input class="tableInput" data-role="item-note" data-group-index="${groupIndex}" data-item-index="${itemIndex}" value="${escapeHtml(item.note || '')}"></td>
        <td class="no-print center"><button class="btn smallAction" data-action="delete-item" data-group-index="${groupIndex}" data-item-index="${itemIndex}">×</button></td>
      `;
      els.tableBody.appendChild(row);
    });
  });

  bindTableInputs();

  els.kpiTotalCost.textContent = formatNumber(stats.totalCost);
  els.kpiCoefficient.textContent = formatFixed(stats.actualTotalCoefficient, 4);
  els.kpiES.textContent = `${formatFixed(stats.finalES * 100, 2)}%`;
  els.tfootTotalCost.textContent = formatNumber(stats.totalCost);
  els.tfootCoefficient.textContent = formatFixed(stats.actualTotalCoefficient, 4);
  els.tfootES.textContent = `${formatFixed(stats.finalES * 100, 2)}%`;
  
  els.summaryAgency.textContent = state.meta.agency || '-';
  els.summaryProject.textContent = state.meta.projectName || '-';
  els.summaryCompareDate.textContent = state.meta.compareDate || '-';

  const messages = buildValidationMessages(stats);
  const isOver3Percent = Math.abs(stats.finalES) >= 0.03;

  if (messages.length === 0) {
    if (stats.totalCost > 0 && isOver3Percent) {
      els.kpiStatus.textContent = '조정 대상';
      els.statusBox.textContent = `검토 완료 · 3% 요건 충족`;
      els.statusBox.style.color = '#166534'; els.statusBox.style.background = '#dcfce7'; els.statusBox.style.borderColor = '#bbf7d0';
    } else if (stats.totalCost > 0 && !isOver3Percent) {
      els.kpiStatus.textContent = '3% 미달';
      els.statusBox.textContent = `검토 완료 · 요건 미달 (3% 미만)`;
      els.statusBox.style.color = '#92400e'; els.statusBox.style.background = '#fef3c7'; els.statusBox.style.borderColor = '#fde68a';
    } else {
      els.kpiStatus.textContent = '데이터 없음';
      els.statusBox.textContent = '초기화 상태입니다.';
    }
  } else {
    els.kpiStatus.textContent = '확인 필요';
    els.statusBox.textContent = `오류 · ${messages[0]}`;
    els.statusBox.style.color = '#991b1b'; els.statusBox.style.background = '#fee2e2'; els.statusBox.style.borderColor = '#fecaca';
  }

  if (showToastOnSave) saveState(true);
}

function bindTableInputs() {
  $$('#tableBody [data-role]').forEach(i => i.addEventListener('input', handleInputChange));
  $$('#tableBody [data-action]').forEach(b => b.addEventListener('click', handleTableAction));
}

function handleInputChange(e) {
  const { role, groupIndex, itemIndex } = e.target.dataset;
  const gIdx = Number(groupIndex), iIdx = Number(itemIndex);

  if (role === 'group-name') state.groups[gIdx].name = e.target.value;
  if (role === 'item-name') state.groups[gIdx].items[iIdx].name = e.target.value;
  if (role === 'item-note') state.groups[gIdx].items[iIdx].note = e.target.value;
  if (role === 'item-cost') {
    const cln = e.target.value.replace(/[^0-9.-]/g, '');
    state.groups[gIdx].items[iIdx].cost = parseNumber(cln);
    e.target.value = cln ? formatNumber(cln) : '';
  }
  if (role === 'item-base') state.groups[gIdx].items[iIdx].baseIndex = parseNumber(e.target.value.replace(/[^0-9.-]/g, ''));
  if (role === 'item-compare') state.groups[gIdx].items[iIdx].compareIndex = parseNumber(e.target.value.replace(/[^0-9.-]/g, ''));

  render(); saveState(false);
}

function handleTableAction(e) {
  const { action, groupIndex, itemIndex } = e.target.dataset;
  const gIdx = Number(groupIndex), iIdx = Number(itemIndex);

  if (action === 'add-item') state.groups[gIdx].items.push(createNewItem());
  if (action === 'delete-item') {
    state.groups[gIdx].items.splice(iIdx, 1);
    if (state.groups[gIdx].items.length === 0) state.groups[gIdx].items.push(createNewItem());
  }
  if (action === 'delete-group') {
    state.groups.splice(gIdx, 1);
    if (state.groups.length === 0) state.groups.push(createNewGroup());
  }
  render(); saveState(false);
}

function escapeCsv(str) {
  if (str == null) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCSV() {
  syncMetaFromFields();
  const stats = calculateStats();
  const cMap = new Map(stats.computed.map(c => [c.key, c]));
  let csv = '\uFEFF';
  
  csv += `수요기관,${escapeCsv(state.meta.agency)}\n공사명,${escapeCsv(state.meta.projectName)}\n입찰일,${escapeCsv(state.meta.bidDate)}\n계약일,${escapeCsv(state.meta.contractDate)}\n비교시점,${escapeCsv(state.meta.compareDate)}\n\n`;
  csv += '비목 / 비목군,물가변동 적용대가,계수(①),기준시점 지수(②),비교시점 지수(③),지수변동율(④),조정계수(⑤),비고\n';

  state.groups.forEach(g => {
    const subCost = (g.items || []).reduce((s, i) => s + parseNumber(i.cost), 0);
    const subCoeff = stats.totalCost > 0 ? (subCost / stats.totalCost) : 0;
    csv += `${escapeCsv('[' + g.name + ']')},${subCost},${formatFixed(subCoeff, 4)},,,,,\n`;

    g.items.forEach(i => {
      const c = cMap.get(`${g.id}:${i.id}`);
      csv += `${escapeCsv('    ' + i.name)},${i.cost},${formatFixed(c.coefficient, 4)},${i.baseIndex},${i.compareIndex},${formatFixed(c.fluctuationRate, 4)},${formatFixed(c.adjustmentCoefficient, 5)},${escapeCsv(i.note)}\n`;
    });
  });

  csv += `\n총 계,${stats.totalCost},${formatFixed(stats.actualTotalCoefficient, 4)},,,최종 ES 추정치(K),${formatFixed(stats.finalES * 100, 2)}%,\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${state.meta.projectName || 'ES_산출기'}.csv`;
  link.click(); URL.revokeObjectURL(link.href);
}

function exportJSON() {
  syncMetaFromFields();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${state.meta.projectName || 'ES_산출기_백업'}.json`;
  link.click(); URL.revokeObjectURL(link.href);
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
  els.toastHost.appendChild(t); setTimeout(() => t.remove(), 2200);
}

function showModal(title, text) {
  els.modalTitle.textContent = title; els.modalBody.textContent = text; els.modalBackdrop.classList.remove('hidden');
}

function closeModal() { els.modalBackdrop.classList.add('hidden'); }

function escapeHtml(val) {
  return String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
