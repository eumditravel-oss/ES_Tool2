const STORAGE_KEY = 'ES_ADJUSTMENT_REPORT_V4';
const DEFAULT_PAGE = 'overview';

// 실무 엑셀 ROUND 함수 구현 (소수점 n자리 반올림)
function round(num, precision) {
  const factor = Math.pow(10, precision);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function createNewItem(name = '신규 비목') {
  return { id: uid(), name, cost: 0, baseIndex: 100, compareIndex: 100, note: '' };
}

function createNewGroup(name = '신규 비목군') {
  return { id: uid(), name, items: [createNewItem()] };
}

const SAMPLE_STATE = {
  meta: { agency: '', projectName: '', bidDate: '', contractDate: '', compareDate: '', memo: '' },
  groups: [
    {
      id: uid(),
      name: '직접공사비',
      items: [
        { id: uid(), name: '노무비', cost: 500000000, baseIndex: 100, compareIndex: 104.5, note: '시중노임단가' },
        { id: uid(), name: '재료비', cost: 300000000, baseIndex: 120.5, compareIndex: 125.8, note: '생산자물가지수' },
        { id: uid(), name: '경비', cost: 100000000, baseIndex: 110.2, compareIndex: 112.4, note: '' }
      ]
    },
    {
      id: uid(),
      name: '제요율경비',
      items: [
        { id: uid(), name: '기타경비', cost: 50000000, baseIndex: 100, compareIndex: 103.2, note: '지수 조정' },
        { id: uid(), name: '일반관리비', cost: 30000000, baseIndex: 100, compareIndex: 103.2, note: '' }
      ]
    }
  ]
};

let state = loadState();

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const els = {
  topTabs: $$('.topTab'),
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
  kpiDecision: $('#kpiDecision'),
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
  modalBackdrop: $('#modalBackdrop'),
  modalTitle: $('#modalTitle'),
  modalBody: $('#modalBody'),
  modalClose: $('#modalClose'),
  modalOk: $('#modalOk')
};

function init() {
  bindMeta();
  bindActions();
  bindSideMenu();
  activatePage(DEFAULT_PAGE);
  render();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SAMPLE_STATE));
  } catch (e) { return JSON.parse(JSON.stringify(SAMPLE_STATE)); }
}

function saveState(showToast = false) {
  syncMetaFromFields();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showToast) toast('저장되었습니다.');
}

function bindMeta() {
  const update = () => { syncMetaFromFields(); render(false); saveState(false); };
  [els.agency, els.projectName, els.bidDate, els.contractDate, els.compareDate, els.memo].forEach(el => {
    el.addEventListener('input', update);
  });
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

function parseNumber(v) {
  return Number(String(v || '').replace(/,/g, '')) || 0;
}

function formatNumber(v) {
  return new Intl.NumberFormat('ko-KR').format(v);
}

// 핵심 계산 로직 (엑셀 참조 문서 근거)
function calculateStats() {
  const flatItems = state.groups.flatMap(g => (g.items || []).map(i => ({ group: g, item: i })));
  const totalCost = flatItems.reduce((sum, entry) => sum + parseNumber(entry.item.cost), 0);

  let sumA = 0; // 계수 합계
  let sumC = 0; // 조정계수 합계

  const computed = flatItems.map(({ group, item }) => {
    const cost = parseNumber(item.cost);
    const base = parseNumber(item.baseIndex);
    const comp = parseNumber(item.compareIndex);

    // 계수(①): ROUND 5
    const coeff = totalCost > 0 ? round(cost / totalCost, 5) : 0;
    // 변동율(④): ROUND 5
    const rate = base > 0 ? round(comp / base, 5) : 1;
    // 조정계수(⑤): ROUND 6
    const adj = base > 0 ? round(coeff * (rate - 1), 6) : 0;

    sumA += coeff;
    sumC += adj;

    return { key: `${group.id}:${item.id}`, coeff, rate, adj };
  });

  const finalES = sumC;
  // 3% 판정 로직: 절대값 0.03 이상
  const isOver3 = Math.abs(finalES) >= 0.03;

  return { totalCost, sumA, finalES, isOver3, computed };
}

function render(showToastOnSave = false) {
  const stats = calculateStats();
  const cMap = new Map(stats.computed.map(e => [e.key, e]));

  els.tableBody.innerHTML = '';
  state.groups.forEach((group, gIdx) => {
    const gCost = group.items.reduce((s, i) => s + parseNumber(i.cost), 0);
    const gCoeff = stats.totalCost > 0 ? round(gCost / stats.totalCost, 5) : 0;

    const gRow = document.createElement('tr');
    gRow.className = 'groupRow';
    gRow.innerHTML = `
      <td><input class="tableInput groupName" data-role="g-name" data-g="${gIdx}" value="${group.name}"></td>
      <td class="mono right">${formatNumber(gCost)}</td>
      <td class="mono right">${gCoeff.toFixed(5)}</td>
      <td colspan="5"></td>
      <td class="no-print center">
        <button class="btn smallAction" data-action="add-i" data-g="${gIdx}">+ 비목</button>
        <button class="btn smallAction" data-action="del-g" data-g="${gIdx}">삭제</button>
      </td>
    `;
    els.tableBody.appendChild(gRow);

    group.items.forEach((item, iIdx) => {
      const c = cMap.get(`${group.id}:${item.id}`);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input class="tableInput" data-role="i-name" data-g="${gIdx}" data-i="${iIdx}" value="${item.name}"></td>
        <td><input class="tableInput right mono" data-role="i-cost" data-g="${gIdx}" data-i="${iIdx}" value="${formatNumber(item.cost)}"></td>
        <td><input class="tableInput readonly right mono" value="${c.coeff.toFixed(5)}" readonly></td>
        <td><input class="tableInput right mono" data-role="i-base" data-g="${gIdx}" data-i="${iIdx}" value="${item.baseIndex}"></td>
        <td><input class="tableInput right mono" data-role="i-comp" data-g="${gIdx}" data-i="${iIdx}" value="${item.compareIndex}"></td>
        <td><input class="tableInput readonly right mono" value="${c.rate.toFixed(5)}" readonly></td>
        <td><input class="tableInput readonly right mono ${c.adj < 0 ? 'value-negative' : 'value-positive'}" value="${c.adj.toFixed(6)}" readonly></td>
        <td><input class="tableInput" data-role="i-note" data-g="${gIdx}" data-i="${iIdx}" value="${item.note}"></td>
        <td class="no-print center"><button class="btn smallAction" data-action="del-i" data-g="${gIdx}" data-i="${iIdx}">×</button></td>
      `;
      els.tableBody.appendChild(row);
    });
  });

  bindTableInputs();

  // KPI 업데이트
  els.kpiTotalCost.textContent = formatNumber(stats.totalCost);
  els.kpiCoefficient.textContent = stats.sumA.toFixed(5);
  els.kpiES.textContent = (stats.finalES * 100).toFixed(4) + '%';
  els.tfootTotalCost.textContent = formatNumber(stats.totalCost);
  els.tfootCoefficient.textContent = stats.sumA.toFixed(5);
  els.tfootES.textContent = (stats.finalES * 100).toFixed(4) + '%';
  
  // 3% 판정 결과
  if (stats.totalCost > 0) {
    els.kpiDecision.textContent = stats.isOver3 ? "조정 대상 (3% 초과)" : "미달 (3% 미만)";
    els.kpiDecision.style.color = stats.isOver3 ? "#e11d48" : "#64748b";
    els.statusBox.textContent = stats.isOver3 ? "검토 완료: 조정 가능" : "검토 완료: 조정 불가";
  }

  els.summaryAgency.textContent = state.meta.agency || '-';
  els.summaryProject.textContent = state.meta.projectName || '-';
  els.summaryCompareDate.textContent = state.meta.compareDate || '-';

  if (showToastOnSave) saveState(true);
}

function bindTableInputs() {
  $$('#tableBody input[data-role]').forEach(el => el.addEventListener('input', handleInputChange));
  $$('#tableBody button[data-action]').forEach(el => el.addEventListener('click', handleTableAction));
}

function handleInputChange(e) {
  const { role, g, i } = e.target.dataset;
  const gIdx = Number(g), iIdx = Number(i);

  if (role === 'g-name') state.groups[gIdx].name = e.target.value;
  if (role === 'i-name') state.groups[gIdx].items[iIdx].name = e.target.value;
  if (role === 'i-note') state.groups[gIdx].items[iIdx].note = e.target.value;
  if (role === 'i-cost') {
    const val = parseNumber(e.target.value);
    state.groups[gIdx].items[iIdx].cost = val;
    e.target.value = formatNumber(val);
  }
  if (role === 'i-base') state.groups[gIdx].items[iIdx].baseIndex = parseNumber(e.target.value);
  if (role === 'i-comp') state.groups[gIdx].items[iIdx].compareIndex = parseNumber(e.target.value);

  render();
  saveState(false);
}

function handleTableAction(e) {
  const { action, g, i } = e.target.dataset;
  const gIdx = Number(g), iIdx = Number(i);

  if (action === 'add-i') state.groups[gIdx].items.push(createNewItem());
  if (action === 'del-i') state.groups[gIdx].items.splice(iIdx, 1);
  if (action === 'del-g') state.groups.splice(gIdx, 1);
  
  if (state.groups.length === 0) state.groups.push(createNewGroup());
  render();
  saveState(false);
}

function bindActions() {
  els.saveBtn.addEventListener('click', () => saveState(true));
  els.printBtn.addEventListener('click', () => window.print());
  els.loadSampleBtn.addEventListener('click', () => {
    state = JSON.parse(JSON.stringify(SAMPLE_STATE));
    refreshMetaFields(); render(); toast('샘플을 불러왔습니다.');
  });
  els.addGroupBtn.addEventListener('click', () => { state.groups.push(createNewGroup()); render(); });
  els.addItemBtn.addEventListener('click', () => { state.groups[0].items.push(createNewItem()); render(); });
  els.resetBtn.addEventListener('click', () => { if(confirm('초기화할까요?')) { state = JSON.parse(JSON.stringify(SAMPLE_STATE)); refreshMetaFields(); render(); } });
  
  els.exportExcelBtn.addEventListener('click', exportCSV);
  els.modalOk.addEventListener('click', () => els.modalBackdrop.classList.add('hidden'));
  els.modalClose.addEventListener('click', () => els.modalBackdrop.classList.add('hidden'));
}

function exportCSV() {
  const stats = calculateStats();
  const cMap = new Map(stats.computed.map(e => [e.key, e]));
  let csv = '\uFEFF비목 / 비목군,적용대가,계수(①),기준지수,비교지수,변동율(④),조정계수(⑤),비고\n';
  
  state.groups.forEach(g => {
    const gCost = g.items.reduce((s, i) => s + parseNumber(i.cost), 0);
    csv += `[${g.name}],${gCost},${(gCost/stats.totalCost).toFixed(5)},,,,,\n`;
    g.items.forEach(i => {
      const c = cMap.get(`${g.id}:${i.id}`);
      csv += `  ${i.name},${i.cost},${c.coeff.toFixed(5)},${i.baseIndex},${i.compareIndex},${c.rate.toFixed(5)},${c.adj.toFixed(6)},${i.note}\n`;
    });
  });
  csv += `총계,${stats.totalCost},${stats.sumA.toFixed(5)},,,최종 지수조정율(K),${(stats.finalES*100).toFixed(4)}%,\n`;
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ES_산출서_${state.meta.projectName || '기본'}.csv`;
  link.click();
}

function bindSideMenu() {
  $$('.side-item').forEach(btn => btn.addEventListener('click', () => activatePage(btn.dataset.page)));
  els.topTabs.forEach(tab => tab.addEventListener('click', (e) => { if(e.target.dataset.target) activatePage(e.target.dataset.target); }));
}

function activatePage(id) {
  $$('.pageSection').forEach(s => s.classList.toggle('is-active', s.id === `page-${id}`));
  $$('.side-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === id));
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
  $('#toastHost').appendChild(t); setTimeout(() => t.remove(), 2000);
}

init();
