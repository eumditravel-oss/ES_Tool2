// app.js
const $ = (id) => document.getElementById(id);

const TRADE_MAP = {
  1: "",
  2: "건축",
  3: "토목",
  4: "기계",
  5: "기계설비",
  6: "전기",
  7: "통신",
  8: "소방",
  9: "조경"
};

const CATEGORY_MAP = {
  1: "",
  2: "기존비목(K0)",
  3: "신규비목(K1)",
  4: "신규비목(K2)",
  5: "신규비목(K3)",
  6: "신규비목(K4)",
  7: "신규비목(K5)",
  8: "신규비목(K6)",
  9: "신규비목(K7)"
};

const TRADE_OPTIONS = ["", "건축", "토목", "기계", "기계설비", "전기", "통신", "소방", "조경"];
const CATEGORY_OPTIONS = ["", "기존비목(K0)", "신규비목(K1)", "신규비목(K2)", "신규비목(K3)", "신규비목(K4)", "신규비목(K5)", "신규비목(K6)", "신규비목(K7)"];

const state = {
  items: [
    {
      id: cryptoRandom(),
      code: "A-001",
      trade: "건축",
      category: "기존비목(K0)",
      name: "철근콘크리트",
      spec: "기초부",
      unit: "식",
      total: 15000000,
      labor: 3000000,
      machineDomestic: 800000,
      machineForeign: 300000,
      misc: 500000,
      mine: 1200000,
      manufacture: 2500000,
      utility: 200000,
      agri: 0,
      g1: 0,
      g2: 0,
      g3: 0,
      g4: 0,
      g5: 0,
      note: "기본 예시",
      checked: false
    }
  ],
  selectedItemId: null
};

const INPUT_IDS = [
  "escRound","reportDate","demandOrg","contractName","contractor","contractMethod","orderType",
  "techDept","managerName","managerTitle","managerPhone","contractAmount","excludedAmount1",
  "directLaborAmount","advanceDeduction","etcDeduction","safetyRate","employmentGrade",
  "plannedProgress","actualProgress","bidDate","contractDate","adjustDate","prevAdjustDate",
  "baseLaborIndex","compareLaborIndex","baseMineIndex","compareMineIndex",
  "baseManufactureIndex","compareManufactureIndex","baseUtilityIndex","compareUtilityIndex",
  "baseAgriIndex","compareAgriIndex","basePublishedMonth","comparePublishedMonth",
  "k0Amount","k1Amount","k2Amount","k3Amount","k0Rate","k1Rate","k2Rate","k3Rate",
  "selectedTrade","selectedCategory","codePrefix","itemSearch"
];

const DETAIL_FIELDS = [
  "code","trade","category","name","spec","unit","total","labor",
  "machineDomestic","machineForeign","misc","mine","manufacture","utility",
  "agri","g1","g2","g3","g4","g5","note"
];

function cryptoRandom() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatCurrency(value) {
  return `${Math.round(value).toLocaleString("ko-KR")} 원`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function formatPercent(value, digits = 4) {
  return `${toNumber(value).toFixed(digits)}%`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatMonth(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function diffDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.max(Math.floor((e - s) / (1000 * 60 * 60 * 24)) - 1, 0);
}

function floorToThousand(value) {
  return Math.floor(value / 1000) * 1000;
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function getSelectedTradeLabel(value) {
  return TRADE_MAP[toNumber(value)] || "";
}

function getSelectedCategoryLabel(value) {
  return CATEGORY_MAP[toNumber(value)] || "";
}

function showScreen(screenName) {
  $("inputScreen").classList.remove("active");
  $("reportScreen").classList.remove("active");
  $("stepChipInput").classList.remove("active");
  $("stepChipReport").classList.remove("active");

  if (screenName === "report") {
    $("reportScreen").classList.add("active");
    $("stepChipReport").classList.add("active");
  } else {
    $("inputScreen").classList.add("active");
    $("stepChipInput").classList.add("active");
  }
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      button.classList.add("active");
      $(button.dataset.tab).classList.add("active");
    });
  });
}

function itemExpenseTotal(item) {
  return toNumber(item.machineDomestic) + toNumber(item.machineForeign) + toNumber(item.misc);
}

function itemMaterialTotal(item) {
  return toNumber(item.mine) + toNumber(item.manufacture) + toNumber(item.utility) + toNumber(item.agri);
}

function itemStdTotal(item) {
  return toNumber(item.g1) + toNumber(item.g2) + toNumber(item.g3) + toNumber(item.g4) + toNumber(item.g5);
}

function itemCheckTotal(item) {
  return toNumber(item.labor) + itemExpenseTotal(item) + itemMaterialTotal(item) + itemStdTotal(item);
}

function nextCode(prefix = "A") {
  const used = state.items
    .map(item => item.code || "")
    .filter(code => code.startsWith(`${prefix}-`))
    .map(code => Number(code.split("-")[1]))
    .filter(num => Number.isFinite(num));

  const maxNum = used.length ? Math.max(...used) : 0;
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

function createEmptyItem() {
  const prefix = $("codePrefix").value.trim() || "A";
  const selectedTrade = getSelectedTradeLabel($("selectedTrade").value);
  const selectedCategory = getSelectedCategoryLabel($("selectedCategory").value);

  return {
    id: cryptoRandom(),
    code: nextCode(prefix),
    trade: selectedTrade || "건축",
    category: selectedCategory || "기존비목(K0)",
    name: "",
    spec: "",
    unit: "식",
    total: 0,
    labor: 0,
    machineDomestic: 0,
    machineForeign: 0,
    misc: 0,
    mine: 0,
    manufacture: 0,
    utility: 0,
    agri: 0,
    g1: 0,
    g2: 0,
    g3: 0,
    g4: 0,
    g5: 0,
    note: "",
    checked: false
  };
}

function ensureSelectedItem() {
  if (!state.selectedItemId && state.items.length) {
    state.selectedItemId = state.items[0].id;
  }
  if (state.selectedItemId && !state.items.find(item => item.id === state.selectedItemId)) {
    state.selectedItemId = state.items[0]?.id || null;
  }
}

function filteredItemsForWork() {
  const search = $("itemSearch").value.trim().toLowerCase();
  const selectedTrade = getSelectedTradeLabel($("selectedTrade").value);
  const selectedCategory = getSelectedCategoryLabel($("selectedCategory").value);

  return state.items.filter((item) => {
    const tradeMatch = !selectedTrade || item.trade === selectedTrade;
    const categoryMatch = !selectedCategory || item.category === selectedCategory;
    const searchMatch = !search
      || (item.code || "").toLowerCase().includes(search)
      || (item.name || "").toLowerCase().includes(search)
      || (item.spec || "").toLowerCase().includes(search);

    return tradeMatch && categoryMatch && searchMatch;
  });
}

function populateSelect(selectId, options) {
  const select = $(selectId);
  select.innerHTML = "";
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value || "선택";
    select.appendChild(option);
  });
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildSelectHTML(id, field, options, selected) {
  return `
    <select data-field="${field}" data-id="${id}">
      ${options.map(option => `<option value="${escapeAttr(option)}" ${option === selected ? "selected" : ""}>${option || "선택"}</option>`).join("")}
    </select>
  `;
}

function renderCodeList() {
  ensureSelectedItem();
  const list = $("codeList");
  const items = filteredItemsForWork();

  setText("itemCountLabel", `${items.length}건`);

  if (!items.length) {
    list.innerHTML = `<div class="detail-empty">조건에 맞는 항목이 없습니다.</div>`;
    return;
  }

  list.innerHTML = items.map((item) => `
    <div class="code-item ${item.id === state.selectedItemId ? "active" : ""}" data-id="${item.id}">
      <div class="code-item-top">
        <div class="code-main">${item.code || "-"}</div>
        <input class="code-check" type="checkbox" data-check-id="${item.id}" ${item.checked ? "checked" : ""} />
      </div>
      <div class="code-sub">
        ${item.trade || "-"} / ${item.category || "-"}<br />
        ${item.name || "공종명 미입력"}<br />
        합계 ${formatNumber(item.total)}
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".code-item").forEach((node) => {
    node.addEventListener("click", (e) => {
      if (e.target.classList.contains("code-check")) return;
      state.selectedItemId = node.dataset.id;
      renderEstimateWorkspace();
    });
  });

  list.querySelectorAll(".code-check").forEach((checkbox) => {
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = state.items.find(v => v.id === checkbox.dataset.checkId);
      if (!item) return;
      item.checked = checkbox.checked;
      renderWorkGrid();
      renderMiniGrid();
    });
  });
}

function renderWorkGrid() {
  ensureSelectedItem();
  const body = $("workGridBody");
  const items = filteredItemsForWork();
  setText("gridInfoLabel", `${items.length}행`);

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="22">조건에 맞는 항목이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = items.map((item) => `
    <tr class="${item.id === state.selectedItemId ? "active-row" : ""}" data-row-id="${item.id}">
      <td><input type="checkbox" class="grid-checkbox" data-check-id="${item.id}" ${item.checked ? "checked" : ""}></td>
      <td><input type="text" data-field="code" data-id="${item.id}" value="${escapeAttr(item.code)}"></td>
      <td>${buildSelectHTML(item.id, "trade", TRADE_OPTIONS, item.trade)}</td>
      <td>${buildSelectHTML(item.id, "category", CATEGORY_OPTIONS, item.category)}</td>
      <td><input type="text" data-field="name" data-id="${item.id}" value="${escapeAttr(item.name)}"></td>
      <td><input type="text" data-field="spec" data-id="${item.id}" value="${escapeAttr(item.spec)}"></td>
      <td><input type="text" data-field="unit" data-id="${item.id}" value="${escapeAttr(item.unit)}"></td>
      <td><input type="number" data-field="total" data-id="${item.id}" value="${item.total ?? 0}"></td>
      <td><input type="number" data-field="labor" data-id="${item.id}" value="${item.labor ?? 0}"></td>
      <td><input type="number" data-field="machineDomestic" data-id="${item.id}" value="${item.machineDomestic ?? 0}"></td>
      <td><input type="number" data-field="machineForeign" data-id="${item.id}" value="${item.machineForeign ?? 0}"></td>
      <td><input type="number" data-field="misc" data-id="${item.id}" value="${item.misc ?? 0}"></td>
      <td><input type="number" data-field="mine" data-id="${item.id}" value="${item.mine ?? 0}"></td>
      <td><input type="number" data-field="manufacture" data-id="${item.id}" value="${item.manufacture ?? 0}"></td>
      <td><input type="number" data-field="utility" data-id="${item.id}" value="${item.utility ?? 0}"></td>
      <td><input type="number" data-field="agri" data-id="${item.id}" value="${item.agri ?? 0}"></td>
      <td><input type="number" data-field="g1" data-id="${item.id}" value="${item.g1 ?? 0}"></td>
      <td><input type="number" data-field="g2" data-id="${item.id}" value="${item.g2 ?? 0}"></td>
      <td><input type="number" data-field="g3" data-id="${item.id}" value="${item.g3 ?? 0}"></td>
      <td><input type="number" data-field="g4" data-id="${item.id}" value="${item.g4 ?? 0}"></td>
      <td><input type="number" data-field="g5" data-id="${item.id}" value="${item.g5 ?? 0}"></td>
      <td><input type="text" data-field="note" data-id="${item.id}" value="${escapeAttr(item.note)}"></td>
    </tr>
  `).join("");

  body.querySelectorAll("tr[data-row-id]").forEach((tr) => {
    tr.addEventListener("click", (e) => {
      if (e.target.matches("input, select")) return;
      state.selectedItemId = tr.dataset.rowId;
      renderEstimateWorkspace();
    });
  });

  body.querySelectorAll(".grid-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const item = state.items.find(v => v.id === checkbox.dataset.checkId);
      if (!item) return;
      item.checked = checkbox.checked;
      renderCodeList();
      renderMiniGrid();
    });
  });

  body.querySelectorAll("[data-field][data-id]").forEach((input) => {
    const field = input.dataset.field;
    const id = input.dataset.id;
    const numberFields = [
      "total","labor","machineDomestic","machineForeign","misc","mine",
      "manufacture","utility","agri","g1","g2","g3","g4","g5"
    ];
    const isNumber = numberFields.includes(field);

    const handler = () => {
      const item = state.items.find(v => v.id === id);
      if (!item) return;
      item[field] = isNumber ? toNumber(input.value) : input.value;
      state.selectedItemId = id;
      syncDetailForm();
      renderCodeList();
      renderMiniGrid();
      renderAllReportsOnly();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}

function renderMiniGrid() {
  const body = $("miniGridBody");
  const items = filteredItemsForWork();

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="6">조건에 맞는 항목이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = items.slice(0, 12).map((item) => `
    <tr>
      <td>${item.code || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${formatNumber(item.total)}</td>
      <td>${formatNumber(itemExpenseTotal(item))}</td>
      <td>${formatNumber(itemMaterialTotal(item))}</td>
      <td>${formatNumber(itemStdTotal(item))}</td>
    </tr>
  `).join("");
}

function syncDetailForm() {
  ensureSelectedItem();
  const item = state.items.find(v => v.id === state.selectedItemId);

  if (!item) {
    $("detailEmpty").classList.remove("hidden");
    $("detailForm").classList.add("hidden");
    setText("selectedRowLabel", "선택 없음");
    return;
  }

  $("detailEmpty").classList.add("hidden");
  $("detailForm").classList.remove("hidden");
  setText("selectedRowLabel", `${item.code || "-"} / ${item.name || "미입력"}`);

  DETAIL_FIELDS.forEach((field) => {
    const el = $(`d_${field}`);
    if (!el) return;
    el.value = item[field] ?? "";
  });

  renderDetailSummary(item);
}

function renderDetailSummary(item) {
  setText("detailExpenseTotal", formatNumber(itemExpenseTotal(item)));
  setText("detailMaterialTotal", formatNumber(itemMaterialTotal(item)));
  setText("detailStdTotal", formatNumber(itemStdTotal(item)));
  setText("detailCheckTotal", formatNumber(itemCheckTotal(item)));
}

function renderEstimateWorkspace() {
  renderCodeList();
  renderWorkGrid();
  syncDetailForm();
  renderMiniGrid();
}

function bindDetailFormEvents() {
  populateSelect("d_trade", TRADE_OPTIONS);
  populateSelect("d_category", CATEGORY_OPTIONS);

  DETAIL_FIELDS.forEach((field) => {
    const el = $(`d_${field}`);
    if (!el) return;

    const numberFields = [
      "total","labor","machineDomestic","machineForeign","misc","mine",
      "manufacture","utility","agri","g1","g2","g3","g4","g5"
    ];
    const isNumber = numberFields.includes(field);

    el.addEventListener("input", () => {
      const item = state.items.find(v => v.id === state.selectedItemId);
      if (!item) return;
      item[field] = isNumber ? toNumber(el.value) : el.value;
      renderEstimateWorkspace();
      renderAllReportsOnly();
    });

    el.addEventListener("change", () => {
      const item = state.items.find(v => v.id === state.selectedItemId);
      if (!item) return;
      item[field] = isNumber ? toNumber(el.value) : el.value;
      renderEstimateWorkspace();
      renderAllReportsOnly();
    });
  });
}

function addItem() {
  const item = createEmptyItem();
  state.items.push(item);
  state.selectedItemId = item.id;
  renderEstimateWorkspace();
  renderAllReportsOnly();
}

function insertBelowSelected() {
  const item = createEmptyItem();
  const index = state.items.findIndex(v => v.id === state.selectedItemId);
  if (index === -1) state.items.push(item);
  else state.items.splice(index + 1, 0, item);
  state.selectedItemId = item.id;
  renderEstimateWorkspace();
  renderAllReportsOnly();
}

function duplicateSelectedItem() {
  const item = state.items.find(v => v.id === state.selectedItemId);
  if (!item) {
    alert("복제할 항목을 선택하세요.");
    return;
  }

  const prefix = $("codePrefix").value.trim() || "A";
  const clone = {
    ...structuredClone(item),
    id: cryptoRandom(),
    code: nextCode(prefix),
    checked: false
  };

  const index = state.items.findIndex(v => v.id === item.id);
  state.items.splice(index + 1, 0, clone);
  state.selectedItemId = clone.id;
  renderEstimateWorkspace();
  renderAllReportsOnly();
}

function deleteCheckedItems() {
  const checked = state.items.filter(item => item.checked);
  if (!checked.length) {
    alert("삭제할 항목을 체크하세요.");
    return;
  }

  if (!confirm(`${checked.length}개 항목을 삭제하시겠습니까?`)) return;

  state.items = state.items.filter(item => !item.checked);
  state.selectedItemId = state.items[0]?.id || null;
  renderEstimateWorkspace();
  renderAllReportsOnly();
}

function generateCodeForSelected() {
  const item = state.items.find(v => v.id === state.selectedItemId);
  if (!item) {
    alert("코드를 생성할 항목을 선택하세요.");
    return;
  }

  const prefix = $("codePrefix").value.trim() || "A";
  item.code = nextCode(prefix);
  renderEstimateWorkspace();
  renderAllReportsOnly();
}

function saveItemsOnly() {
  localStorage.setItem("esc_items_only_v3", JSON.stringify(state.items));
  alert("내역서를 저장했습니다.");
}

function loadItemsOnly() {
  const raw = localStorage.getItem("esc_items_only_v3");
  if (!raw) {
    alert("저장된 내역서가 없습니다.");
    return;
  }

  state.items = JSON.parse(raw);
  state.selectedItemId = state.items[0]?.id || null;
  renderEstimateWorkspace();
  renderAllReportsOnly();
  alert("내역서를 불러왔습니다.");
}

function buildTitle(baseTitle, tradeNumber, categoryNumber) {
  const tradeLabel = getSelectedTradeLabel(tradeNumber);
  const categoryLabel = getSelectedCategoryLabel(categoryNumber);
  const tradeAll = toNumber(tradeNumber) === 1;
  const categoryAll = toNumber(categoryNumber) === 1;

  if (tradeAll && categoryAll) return `【 ${baseTitle} 】`;
  if (tradeAll && !categoryAll) return `【 ${baseTitle} - ${categoryLabel} 】`;
  if (!tradeAll && categoryAll) return `【 ${baseTitle} - ${tradeLabel} 】`;
  return `【 ${baseTitle} - ${tradeLabel} ${categoryLabel} 】`;
}

function calcPpiIndex(base, compare) {
  if (!base || !compare) return 100;
  return Math.floor((compare / base) * 10000) / 100;
}

function calcRatioIndex(base, compare) {
  if (!base || !compare) return 100;
  return Math.floor((compare / base) * 10000) / 100;
}

function buildAttachment3Rows(data) {
  const rows = [];
  const total = data.applicableAmount || 1;

  const directLabor = data.applicableAmount * 0.12;
  const indirectLabor = data.applicableAmount * 0.05;
  const machine = data.applicableAmount * 0.06;
  const mine = data.applicableAmount * 0.08;
  const manu = data.applicableAmount * 0.12;
  const utility = data.applicableAmount * 0.03;
  const agri = data.applicableAmount * 0.01;
  const std = data.applicableAmount * 0.08;
  const accident = data.applicableAmount * 0.01;
  const safety = data.applicableAmount * 0.01;
  const employment = data.applicableAmount * 0.01;
  const retirement = data.applicableAmount * 0.01;
  const health = data.applicableAmount * 0.01;
  const pension = data.applicableAmount * 0.01;
  const elder = data.applicableAmount * 0.01;

  const etc = Math.max(
    data.applicableAmount - (
      directLabor + indirectLabor + machine + mine + manu + utility + agri +
      std + accident + safety + employment + retirement + health + pension + elder
    ),
    0
  );

  const laborIndex = calcRatioIndex(data.baseLaborIndex, data.compareLaborIndex);
  const machineIndex = 100;
  const mineIndex = calcPpiIndex(data.baseMineIndex, data.compareMineIndex);
  const manuIndex = calcPpiIndex(data.baseManufactureIndex, data.compareManufactureIndex);
  const utilityIndex = calcPpiIndex(data.baseUtilityIndex, data.compareUtilityIndex);
  const agriIndex = calcPpiIndex(data.baseAgriIndex, data.compareAgriIndex);
  const stdIndex = 100;
  const etcIndex = 100;

  const rawRows = [
    ["직접노무비", directLabor, 100, laborIndex],
    ["간접노무비", indirectLabor, 100, laborIndex],
    ["기계경비", machine, 100, machineIndex],
    ["광산품", mine, 100, mineIndex],
    ["공산품", manu, 100, manuIndex],
    ["전력수도", utility, 100, utilityIndex],
    ["농림수산", agri, 100, agriIndex],
    ["표준시장단가", std, 100, stdIndex],
    ["산재보험료", accident, 100, laborIndex],
    ["산업안전보건관리비", safety, 100, laborIndex],
    ["고용보험료", employment, 100, laborIndex],
    ["퇴직공제부금비", retirement, 100, laborIndex],
    ["국민건강보험료", health, 100, laborIndex],
    ["국민연금보험료", pension, 100, laborIndex],
    ["노인장기요양보험료", elder, 100, laborIndex],
    ["기타비목군", etc, 100, etcIndex]
  ];

  return rawRows.map(([name, amount, baseIndex, compareIndex]) => {
    const coeff = total ? Math.round((amount / total) * 10000) / 10000 : 0;
    const changeRatio = baseIndex ? Math.round((compareIndex / baseIndex) * 10000) / 10000 : 1;
    const adjustCoeff = Math.floor((coeff * changeRatio) * 100000000) / 100000000;
    return { name, amount, coeff, baseIndex, compareIndex, changeRatio, adjustCoeff };
  });
}

function collectData() {
  const data = {};
  INPUT_IDS.forEach((id) => {
    const el = $(id);
    if (el) data[id] = el.value;
  });

  data.escRound = Math.max(toNumber(data.escRound), 1);
  data.contractAmount = toNumber(data.contractAmount);
  data.excludedAmount1 = toNumber(data.excludedAmount1);
  data.directLaborAmount = toNumber(data.directLaborAmount);
  data.advanceDeduction = toNumber(data.advanceDeduction);
  data.etcDeduction = toNumber(data.etcDeduction);
  data.plannedProgress = toNumber(data.plannedProgress);
  data.actualProgress = toNumber(data.actualProgress);

  data.baseLaborIndex = toNumber(data.baseLaborIndex);
  data.compareLaborIndex = toNumber(data.compareLaborIndex);
  data.baseMineIndex = toNumber(data.baseMineIndex);
  data.compareMineIndex = toNumber(data.compareMineIndex);
  data.baseManufactureIndex = toNumber(data.baseManufactureIndex);
  data.compareManufactureIndex = toNumber(data.compareManufactureIndex);
  data.baseUtilityIndex = toNumber(data.baseUtilityIndex);
  data.compareUtilityIndex = toNumber(data.compareUtilityIndex);
  data.baseAgriIndex = toNumber(data.baseAgriIndex);
  data.compareAgriIndex = toNumber(data.compareAgriIndex);

  data.k0Amount = toNumber(data.k0Amount);
  data.k1Amount = toNumber(data.k1Amount);
  data.k2Amount = toNumber(data.k2Amount);
  data.k3Amount = toNumber(data.k3Amount);

  data.k0Rate = toNumber(data.k0Rate);
  data.k1Rate = toNumber(data.k1Rate);
  data.k2Rate = toNumber(data.k2Rate);
  data.k3Rate = toNumber(data.k3Rate);

  data.baseDateForElapsed = data.escRound === 1
    ? data.contractDate
    : (data.prevAdjustDate || data.contractDate);

  data.elapsedDays = diffDays(data.baseDateForElapsed, data.adjustDate);
  data.excludedAmount = data.excludedAmount1 + data.directLaborAmount;
  data.applicableAmount = Math.max(data.contractAmount - data.excludedAmount, 0);

  data.totalKBase = data.k0Amount + data.k1Amount + data.k2Amount + data.k3Amount || 1;

  data.k0Weight = Math.round((data.k0Amount / data.totalKBase) * 10000) / 10000;
  data.k1Weight = Math.round((data.k1Amount / data.totalKBase) * 10000) / 10000;
  data.k2Weight = Math.round((data.k2Amount / data.totalKBase) * 10000) / 10000;
  data.k3Weight = Math.round((data.k3Amount / data.totalKBase) * 10000) / 10000;

  data.k0Weighted = Math.floor((data.k0Weight * (data.k0Rate / 100)) * 10000) / 10000;
  data.k1Weighted = Math.floor((data.k1Weight * (data.k1Rate / 100)) * 10000) / 10000;
  data.k2Weighted = Math.floor((data.k2Weight * (data.k2Rate / 100)) * 10000) / 10000;
  data.k3Weighted = Math.floor((data.k3Weight * (data.k3Rate / 100)) * 10000) / 10000;

  data.finalKDecimal = Math.floor((data.k0Weighted + data.k1Weighted + data.k2Weighted + data.k3Weighted) * 10000) / 10000;
  data.finalKPercent = data.finalKDecimal * 100;

  data.rawAdjustAmount = floorToThousand(data.applicableAmount * data.finalKDecimal);
  data.finalAdjustAmount = Math.max(
    floorToThousand(data.rawAdjustAmount - data.advanceDeduction - data.etcDeduction),
    0
  );

  data.periodPass = data.elapsedDays >= 90;
  data.ratePass = Math.abs(data.finalKPercent) >= 3;
  data.finalJudge = data.periodPass && data.ratePass;

  data.attach9Title = buildTitle("물가변동 적용대가의 비목군 분류 일위대가표", data.selectedTrade, data.selectedCategory);
  data.attach10Title = buildTitle("물가변동 적용대가의 비목군 분류 산출근거", data.selectedTrade, data.selectedCategory);

  const selectedTrade = getSelectedTradeLabel(data.selectedTrade);
  const selectedCategory = getSelectedCategoryLabel(data.selectedCategory);

  data.filteredItems = state.items.filter((item) => {
    const tradeMatch = !selectedTrade || item.trade === selectedTrade;
    const categoryMatch = !selectedCategory || item.category === selectedCategory;
    return tradeMatch && categoryMatch;
  });

  data.attach3Rows = buildAttachment3Rows(data);

  return data;
}

function renderSummary(data) {
  setText("sumElapsedDays", `${data.elapsedDays.toLocaleString("ko-KR")}일`);
  setText("sumKRate", formatPercent(data.finalKPercent, 4));
  setText("sumAdjustAmount", formatCurrency(data.finalAdjustAmount));

  const daysBadge = $("sumDaysBadge");
  daysBadge.textContent = data.periodPass ? "충족 (90일 이상)" : "미달 (90일 미만)";
  daysBadge.className = `pill ${data.periodPass ? "pass" : "fail"}`;

  const kBadge = $("sumKBadge");
  kBadge.textContent = data.ratePass ? "충족 (3% 이상)" : "미달 (3% 미만)";
  kBadge.className = `pill ${data.ratePass ? "pass" : "fail"}`;
}

function renderCover(data) {
  setText("coverProjectName", data.contractName);
  setText("coverRound", `[ ${data.escRound}회 ESC ]`);
  setText("coverContractor", data.contractor);
  setText("coverReportMonth", formatMonth(data.reportDate));
}

function renderSubmitPage(data) {
  setText("submitRecipient", `${data.contractor}  귀중`);
  setText("submitText", `본 연구원은 『${data.contractName}』현장에 대하여 「물가변동으로 인한 계약금액 조정보고서」를 완료하여 다음과 같은 결과가 산출되었기에 이를 제출합니다.`);
  setText("submitAmountTitle", `물가변동으로 인한 계약금액조정 ( 제${data.escRound}회 ESC )`);
  setText("submitAmountValue", `일금 ${formatCurrency(data.finalAdjustAmount)} ( ￦ ${Math.round(data.finalAdjustAmount).toLocaleString("ko-KR")} )`);
  setText("submitDate", formatMonth(data.reportDate));
}

function renderTOC(data) {
  setText("tocProjectName", `◈ 공사명 : ${data.contractName}`);
}

function renderAttach1(data) {
  setText("a1ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  setText("a1DemandOrg", data.demandOrg);
  setText("a1ContractName", data.contractName);
  setText("a1ContractMethod", data.contractMethod);
  setText("a1Contractor", data.contractor);
  setText("a1TechDept", data.techDept);
  setText("a1Manager", `${data.managerTitle} ${data.managerName}`);
  setText("a1Phone", data.managerPhone);
  setText("a1Round", `${data.escRound}회`);
  setText("a1BaseDate", formatDate(data.baseDateForElapsed));
  setText("a1AdjustDate", formatDate(data.adjustDate));
  setText("a1Elapsed", `${data.elapsedDays}일`);
  setText("a1KRate", formatPercent(data.finalKPercent, 4));
  setText("a1RawAdjust", formatCurrency(data.rawAdjustAmount));
  setText("a1FinalAdjust", formatCurrency(data.finalAdjustAmount));

  const opinion = [
    `1) 기준시점은 ${formatDate(data.baseDateForElapsed)}, 비교시점은 ${formatDate(data.adjustDate)}이며 경과일수는 ${data.elapsedDays}일입니다.`,
    `2) 기간요건 판정 결과는 ${data.periodPass ? "충족" : "미달"}입니다.`,
    `3) 최종 지수조정율은 ${formatPercent(data.finalKPercent, 4)}이며 등락율 요건은 ${data.ratePass ? "충족" : "미달"}입니다.`,
    `4) 물가변동 적용대가는 ${formatCurrency(data.applicableAmount)}이고, 산출 조정금액은 ${formatCurrency(data.rawAdjustAmount)}입니다.`,
    `5) 선금급 공제 ${formatCurrency(data.advanceDeduction)}, 기타 공제 ${formatCurrency(data.etcDeduction)}를 반영한 최종 조정적용금액은 ${formatCurrency(data.finalAdjustAmount)}입니다.`,
    `6) 최종 판정: ${data.finalJudge ? "물가변동 조정 가능" : "물가변동 조정 불가"}`
  ].join("\n");

  setText("a1Opinion", opinion);
}

function renderAttach2(data) {
  setText("a2ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  setText("a2JudgeLine1", `기간요건 : ${data.elapsedDays}일 (${data.periodPass ? "충족" : "불충족"})`);
  setText("a2JudgeLine2", `등락요건 : ${data.finalKPercent.toFixed(4)}% (${data.ratePass ? "충족" : "불충족"})`);
  setText("a2B", formatCurrency(data.contractAmount));
  setText("a2C", formatCurrency(data.excludedAmount));
  setText("a2C1", formatCurrency(data.excludedAmount1));
  setText("a2C2", formatCurrency(data.directLaborAmount));
  setText("a2PlanProgress", formatPercent(data.plannedProgress, 2));
  setText("a2ActualProgress", formatPercent(data.actualProgress, 2));
  setText("a2D", formatCurrency(data.applicableAmount));
  setText("a2Days", `${data.elapsedDays}일`);
  setText("a2KRate", formatPercent(data.finalKPercent, 4));
  setText("a2RawAdjust", formatCurrency(data.rawAdjustAmount));
  setText("a2Advance", formatCurrency(data.advanceDeduction));
  setText("a2Etc", formatCurrency(data.etcDeduction));
  setText("a2FinalAdjust", formatCurrency(data.finalAdjustAmount));
  setText("a2Judge", data.finalJudge ? "기간 및 등락율 요건 충족" : "요건 불충족");
}

function renderAttach21(data) {
  setText("a21ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  setText("a21K0Label", `기존비목(K0) (${formatDate(data.escRound === 1 ? data.bidDate : (data.prevAdjustDate || data.bidDate))})`);
  setText("a21K1Label", "신규비목(K1)");
  setText("a21K2Label", "신규비목(K2)");
  setText("a21K3Label", "신규비목(K3)");

  setText("a21K0Amount", formatCurrency(data.k0Amount));
  setText("a21K1Amount", formatCurrency(data.k1Amount));
  setText("a21K2Amount", formatCurrency(data.k2Amount));
  setText("a21K3Amount", formatCurrency(data.k3Amount));

  setText("a21K0Weight", data.k0Weight.toFixed(4));
  setText("a21K1Weight", data.k1Weight.toFixed(4));
  setText("a21K2Weight", data.k2Weight.toFixed(4));
  setText("a21K3Weight", data.k3Weight.toFixed(4));

  setText("a21K0Rate", data.k0Rate.toFixed(4));
  setText("a21K1Rate", data.k1Rate.toFixed(4));
  setText("a21K2Rate", data.k2Rate.toFixed(4));
  setText("a21K3Rate", data.k3Rate.toFixed(4));

  setText("a21K0Result", data.k0Weighted.toFixed(4));
  setText("a21K1Result", data.k1Weighted.toFixed(4));
  setText("a21K2Result", data.k2Weighted.toFixed(4));
  setText("a21K3Result", data.k3Weighted.toFixed(4));

  setText("a21TotalAmount", formatCurrency(data.totalKBase));
  setText("a21TotalWeight", (data.k0Weight + data.k1Weight + data.k2Weight + data.k3Weight).toFixed(4));
  setText("a21FinalK", data.finalKDecimal.toFixed(4));
}

function renderAttach3(data) {
  setText("a3ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const body = $("attach3Body");
  body.innerHTML = data.attach3Rows.map(row => `
    <tr>
      <td>${row.name}</td>
      <td>${formatCurrency(row.amount)}</td>
      <td>${row.coeff.toFixed(4)}</td>
      <td>${row.baseIndex.toFixed(2)}</td>
      <td>${row.compareIndex.toFixed(2)}</td>
      <td>${row.changeRatio.toFixed(4)}</td>
      <td>${row.adjustCoeff.toFixed(8)}</td>
    </tr>
  `).join("");
}

function renderAttach4(data) {
  setText("a4ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const laborIndex = calcRatioIndex(data.baseLaborIndex, data.compareLaborIndex);
  const mineIndex = calcPpiIndex(data.baseMineIndex, data.compareMineIndex);
  const manuIndex = calcPpiIndex(data.baseManufactureIndex, data.compareManufactureIndex);
  const utilityIndex = calcPpiIndex(data.baseUtilityIndex, data.compareUtilityIndex);
  const agriIndex = calcPpiIndex(data.baseAgriIndex, data.compareAgriIndex);

  setText("a4LaborBase", formatNumber(data.baseLaborIndex));
  setText("a4LaborCompare", formatNumber(data.compareLaborIndex));
  setText("a4LaborIndex", laborIndex.toFixed(2));

  setText("a4MachineBase", "-");
  setText("a4MachineCompare", "-");
  setText("a4MachineIndex", "100.00");

  setText("a4MaterialBase", `${data.baseMineIndex} / ${data.baseManufactureIndex} / ${data.baseUtilityIndex} / ${data.baseAgriIndex}`);
  setText("a4MaterialCompare", `${data.compareMineIndex} / ${data.compareManufactureIndex} / ${data.compareUtilityIndex} / ${data.compareAgriIndex}`);
  setText("a4MaterialIndex", `${mineIndex.toFixed(2)} / ${manuIndex.toFixed(2)} / ${utilityIndex.toFixed(2)} / ${agriIndex.toFixed(2)}`);

  setText("a4StdBase", "-");
  setText("a4StdCompare", "-");
  setText("a4StdIndex", "100.00");

  setText("a4EtcBase", "-");
  setText("a4EtcCompare", "-");
  setText("a4EtcIndex", laborIndex.toFixed(2));
}

function renderAttach5(data) {
  setText("a5ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  setText("a5Contract", formatCurrency(data.contractAmount));
  setText("a5Excluded1", formatCurrency(data.excludedAmount1));
  setText("a5Excluded2", formatCurrency(data.directLaborAmount));
  setText("a5Applicable", formatCurrency(data.applicableAmount));
}

function renderAttach6(data) {
  setText("a6ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const body = $("attach6Body");
  if (!data.filteredItems.length) {
    body.innerHTML = `<tr><td colspan="11">조건에 해당하는 내역이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = data.filteredItems.map(item => `
    <tr>
      <td>${item.code || "-"}</td>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${item.spec || "-"}</td>
      <td>${item.unit || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(itemExpenseTotal(item))}</td>
      <td>${formatCurrency(itemMaterialTotal(item))}</td>
      <td>${formatCurrency(itemStdTotal(item))}</td>
    </tr>
  `).join("");
}

function renderAttach61(data) {
  setText("a61ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const body = $("attach61Body");
  if (!data.filteredItems.length) {
    body.innerHTML = `<tr><td colspan="8">조건에 해당하는 내역이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = data.filteredItems.map(item => `
    <tr>
      <td>${item.code || "-"}</td>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(itemMaterialTotal(item))}</td>
      <td>${formatCurrency(itemExpenseTotal(item) + itemStdTotal(item))}</td>
    </tr>
  `).join("");
}

function renderAttach62(data) {
  setText("a62ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const body = $("attach62Body");
  if (!data.filteredItems.length) {
    body.innerHTML = `<tr><td colspan="21">조건에 해당하는 내역이 없습니다.</td></tr>`;
    return;
  }

  body.innerHTML = data.filteredItems.map(item => `
    <tr>
      <td>${item.code || "-"}</td>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${item.spec || "-"}</td>
      <td>${item.unit || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(item.machineDomestic)}</td>
      <td>${formatCurrency(item.machineForeign)}</td>
      <td>${formatCurrency(item.misc)}</td>
      <td>${formatCurrency(item.mine)}</td>
      <td>${formatCurrency(item.manufacture)}</td>
      <td>${formatCurrency(item.utility)}</td>
      <td>${formatCurrency(item.agri)}</td>
      <td>${formatCurrency(item.g1)}</td>
      <td>${formatCurrency(item.g2)}</td>
      <td>${formatCurrency(item.g3)}</td>
      <td>${formatCurrency(item.g4)}</td>
      <td>${formatCurrency(item.g5)}</td>
      <td>${item.note || "-"}</td>
    </tr>
  `).join("");
}

function renderAttach7(data) {
  setText("a7ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const groups = {};
  data.filteredItems.forEach(item => {
    const key = item.category || "기타";
    groups[key] = (groups[key] || 0) + toNumber(item.total);
  });
  const body = $("attach7Body");
  const keys = Object.keys(groups);
  if (!keys.length) {
    body.innerHTML = `<tr><td colspan="2">조건에 해당하는 내역이 없습니다.</td></tr>`;
    return;
  }
  body.innerHTML = keys.map(key => `<tr><td>${key}</td><td>${formatCurrency(groups[key])}</td></tr>`).join("");
}

function renderAttach8(data) {
  setText("a8ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  const groups = {};
  let total = 0;
  data.filteredItems.forEach(item => {
    const key = item.trade || "기타";
    groups[key] = (groups[key] || 0) + toNumber(item.total);
    total += toNumber(item.total);
  });
  const body = $("attach8Body");
  const keys = Object.keys(groups);
  if (!keys.length) {
    body.innerHTML = `<tr><td colspan="3">조건에 해당하는 내역이 없습니다.</td></tr>`;
    return;
  }
  body.innerHTML = keys.map(key => {
    const share = total ? (groups[key] / total) * 100 : 0;
    return `<tr><td>${key}</td><td>${formatCurrency(groups[key])}</td><td>${share.toFixed(2)}%</td></tr>`;
  }).join("");
}

function renderAttach9And10(data) {
  setText("a9ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  setText("a10ProjectTitle", `◈ 공사명 : ${data.contractName}`);
  setText("attach9Title", data.attach9Title);
  setText("attach10Title", data.attach10Title);

  const body9 = $("attach9Body");
  const body10 = $("attach10Body");

  if (!data.filteredItems.length) {
    body9.innerHTML = `<tr><td colspan="13">조건에 해당하는 내역이 없습니다.</td></tr>`;
    body10.innerHTML = `<tr><td colspan="21">조건에 해당하는 내역이 없습니다.</td></tr>`;
    return;
  }

  body9.innerHTML = data.filteredItems.map((item) => `
    <tr>
      <td>${item.code || "-"}</td>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${item.spec || "-"}</td>
      <td>${item.unit || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(itemExpenseTotal(item))}</td>
      <td>${formatCurrency(itemMaterialTotal(item))}</td>
      <td>${formatCurrency(itemStdTotal(item))}</td>
      <td>${formatCurrency(itemCheckTotal(item))}</td>
      <td>${item.note || "-"}</td>
    </tr>
  `).join("");

  body10.innerHTML = data.filteredItems.map((item) => `
    <tr>
      <td>${item.code || "-"}</td>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${item.spec || "-"}</td>
      <td>${item.unit || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(item.machineDomestic)}</td>
      <td>${formatCurrency(item.machineForeign)}</td>
      <td>${formatCurrency(item.misc)}</td>
      <td>${formatCurrency(item.mine)}</td>
      <td>${formatCurrency(item.manufacture)}</td>
      <td>${formatCurrency(item.utility)}</td>
      <td>${formatCurrency(item.agri)}</td>
      <td>${formatCurrency(item.g1)}</td>
      <td>${formatCurrency(item.g2)}</td>
      <td>${formatCurrency(item.g3)}</td>
      <td>${formatCurrency(item.g4)}</td>
      <td>${formatCurrency(item.g5)}</td>
      <td>${item.note || "-"}</td>
    </tr>
  `).join("");
}

function renderAllReportsOnly() {
  const data = collectData();
  renderSummary(data);
  renderCover(data);
  renderSubmitPage(data);
  renderTOC(data);
  renderAttach1(data);
  renderAttach2(data);
  renderAttach21(data);
  renderAttach3(data);
  renderAttach4(data);
  renderAttach5(data);
  renderAttach6(data);
  renderAttach61(data);
  renderAttach62(data);
  renderAttach7(data);
  renderAttach8(data);
  renderAttach9And10(data);
}

function renderAll() {
  renderEstimateWorkspace();
  renderAllReportsOnly();
}

function saveDraft() {
  const saved = {};
  INPUT_IDS.forEach((id) => {
    const el = $(id);
    if (el) saved[id] = el.value;
  });

  localStorage.setItem("esc_report_form_v6", JSON.stringify({
    fields: saved,
    items: state.items,
    selectedItemId: state.selectedItemId
  }));

  alert("입력값을 저장했습니다.");
}

function loadDraft() {
  const raw = localStorage.getItem("esc_report_form_v6");
  if (!raw) {
    alert("저장된 입력값이 없습니다.");
    return;
  }

  const parsed = JSON.parse(raw);

  if (parsed.fields) {
    Object.entries(parsed.fields).forEach(([key, value]) => {
      if ($(key)) $(key).value = value;
    });
  }

  if (Array.isArray(parsed.items)) {
    state.items = parsed.items;
  }

  state.selectedItemId = parsed.selectedItemId || state.items[0]?.id || null;
  renderAll();
  alert("입력값을 불러왔습니다.");
}

function bindGeneralInputEvents() {
  document.querySelectorAll("input, select").forEach((node) => {
    if ((node.id || "").startsWith("d_")) return;
    node.addEventListener("input", renderAllReportsOnly);
    node.addEventListener("change", renderAll);
  });
}

$("addItemBtn").addEventListener("click", addItem);
$("insertBelowBtn").addEventListener("click", insertBelowSelected);
$("duplicateItemBtn").addEventListener("click", duplicateSelectedItem);
$("deleteSelectedBtn").addEventListener("click", deleteCheckedItems);
$("generateCodeBtn").addEventListener("click", generateCodeForSelected);
$("saveItemsBtn").addEventListener("click", saveItemsOnly);
$("loadItemsBtn").addEventListener("click", loadItemsOnly);

$("nextBtn").addEventListener("click", () => {
  renderAll();
  showScreen("report");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("backBtn").addEventListener("click", () => {
  showScreen("input");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("saveBtn").addEventListener("click", saveDraft);
$("loadBtn").addEventListener("click", loadDraft);
$("printBtn").addEventListener("click", () => {
  renderAll();
  showScreen("report");
  window.print();
});

bindTabs();
bindGeneralInputEvents();
bindDetailFormEvents();
renderAll();
showScreen("input");
