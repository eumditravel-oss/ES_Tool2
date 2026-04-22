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

const state = {
  items: [
    {
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
      note: "기본 예시"
    }
  ]
};

const INPUT_IDS = [
  "escRound",
  "reportDate",
  "demandOrg",
  "contractName",
  "contractor",
  "contractMethod",
  "techDept",
  "managerName",
  "managerTitle",
  "managerPhone",
  "contractAmount",
  "excludedAmount1",
  "directLaborAmount",
  "advanceDeduction",
  "etcDeduction",
  "plannedProgress",
  "actualProgress",
  "bidDate",
  "contractDate",
  "adjustDate",
  "prevAdjustDate",
  "baseLaborIndex",
  "compareLaborIndex",
  "baseMineIndex",
  "compareMineIndex",
  "baseManufactureIndex",
  "compareManufactureIndex",
  "baseUtilityIndex",
  "compareUtilityIndex",
  "baseAgriIndex",
  "compareAgriIndex",
  "basePublishedMonth",
  "comparePublishedMonth",
  "k0Amount",
  "k1Amount",
  "k2Amount",
  "k3Amount",
  "k0Rate",
  "k1Rate",
  "k2Rate",
  "k3Rate",
  "selectedTrade",
  "selectedCategory"
];

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatCurrency(value) {
  return `${Math.round(value).toLocaleString("ko-KR")} 원`;
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
  const node = $(id);
  if (node) node.textContent = value;
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

function createSelect(options, selectedValue, onChange) {
  const select = document.createElement("select");
  options.forEach((optionText) => {
    const option = document.createElement("option");
    option.value = optionText;
    option.textContent = optionText || "선택";
    if (optionText === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  select.addEventListener("change", onChange);
  return select;
}

function createInput(value, type, onChange) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.addEventListener("input", onChange);
  return input;
}

function getTradeOptions() {
  return ["", "건축", "토목", "기계", "기계설비", "전기", "통신", "소방", "조경"];
}

function getCategoryOptions() {
  return [
    "",
    "기존비목(K0)",
    "신규비목(K1)",
    "신규비목(K2)",
    "신규비목(K3)",
    "신규비목(K4)",
    "신규비목(K5)",
    "신규비목(K6)",
    "신규비목(K7)"
  ];
}

function renderItemsTable() {
  const tbody = $("itemsBody");
  tbody.innerHTML = "";

  state.items.forEach((item, index) => {
    const tr = document.createElement("tr");

    const configs = [
      { key: "code", type: "text" },
      { key: "trade", type: "select", options: getTradeOptions() },
      { key: "category", type: "select", options: getCategoryOptions() },
      { key: "name", type: "text" },
      { key: "spec", type: "text" },
      { key: "unit", type: "text" },
      { key: "total", type: "number" },
      { key: "labor", type: "number" },
      { key: "machineDomestic", type: "number" },
      { key: "machineForeign", type: "number" },
      { key: "misc", type: "number" },
      { key: "mine", type: "number" },
      { key: "manufacture", type: "number" },
      { key: "utility", type: "number" },
      { key: "agri", type: "number" },
      { key: "g1", type: "number" },
      { key: "g2", type: "number" },
      { key: "g3", type: "number" },
      { key: "g4", type: "number" },
      { key: "g5", type: "number" },
      { key: "note", type: "text" }
    ];

    configs.forEach((config) => {
      const td = document.createElement("td");

      if (config.type === "select") {
        td.appendChild(
          createSelect(config.options, item[config.key], (e) => {
            state.items[index][config.key] = e.target.value;
            renderAll();
          })
        );
      } else {
        td.appendChild(
          createInput(item[config.key], config.type, (e) => {
            state.items[index][config.key] = config.type === "number" ? toNumber(e.target.value) : e.target.value;
            renderAll();
          })
        );
      }

      tr.appendChild(td);
    });

    const removeTd = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "삭제";
    removeBtn.addEventListener("click", () => {
      state.items.splice(index, 1);
      renderItemsTable();
      renderAll();
    });
    removeTd.appendChild(removeBtn);
    tr.appendChild(removeTd);

    tbody.appendChild(tr);
  });
}

function addItemRow() {
  state.items.push({
    code: "",
    trade: "",
    category: "",
    name: "",
    spec: "",
    unit: "",
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
    note: ""
  });
  renderItemsTable();
}

function getSelectedTradeLabel(value) {
  return TRADE_MAP[toNumber(value)] || "";
}

function getSelectedCategoryLabel(value) {
  return CATEGORY_MAP[toNumber(value)] || "";
}

function buildTitle(baseTitle, tradeNumber, categoryNumber) {
  const tradeLabel = getSelectedTradeLabel(tradeNumber);
  const categoryLabel = getSelectedCategoryLabel(categoryNumber);
  const tradeIsAll = toNumber(tradeNumber) === 1;
  const categoryIsAll = toNumber(categoryNumber) === 1;

  if (tradeIsAll && categoryIsAll) return `【 ${baseTitle} 】`;
  if (tradeIsAll && !categoryIsAll) return `【 ${baseTitle} - ${categoryLabel} 】`;
  if (!tradeIsAll && categoryIsAll) return `【 ${baseTitle} - ${tradeLabel} 】`;
  return `【 ${baseTitle} - ${tradeLabel} ${categoryLabel} 】`;
}

function collectData() {
  const data = {};
  INPUT_IDS.forEach((id) => {
    data[id] = $(id).value;
  });

  data.escRound = Math.max(toNumber(data.escRound), 1);
  data.contractAmount = toNumber(data.contractAmount);
  data.excludedAmount1 = toNumber(data.excludedAmount1);
  data.directLaborAmount = toNumber(data.directLaborAmount);
  data.advanceDeduction = toNumber(data.advanceDeduction);
  data.etcDeduction = toNumber(data.etcDeduction);
  data.plannedProgress = toNumber(data.plannedProgress);
  data.actualProgress = toNumber(data.actualProgress);

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

  data.k0Weight = data.k0Amount / data.totalKBase;
  data.k1Weight = data.k1Amount / data.totalKBase;
  data.k2Weight = data.k2Amount / data.totalKBase;
  data.k3Weight = data.k3Amount / data.totalKBase;

  data.k0Weighted = data.k0Weight * (data.k0Rate / 100);
  data.k1Weighted = data.k1Weight * (data.k1Rate / 100);
  data.k2Weighted = data.k2Weight * (data.k2Rate / 100);
  data.k3Weighted = data.k3Weight * (data.k3Rate / 100);

  data.finalKDecimal = data.k0Weighted + data.k1Weighted + data.k2Weighted + data.k3Weighted;
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

  data.filteredItems = state.items.filter((item) => {
    const selectedTradeLabel = getSelectedTradeLabel(data.selectedTrade);
    const selectedCategoryLabel = getSelectedCategoryLabel(data.selectedCategory);

    const tradeMatch = toNumber(data.selectedTrade) === 1 ? true : item.trade === selectedTradeLabel;
    const categoryMatch = toNumber(data.selectedCategory) === 1 ? true : item.category === selectedCategoryLabel;

    return tradeMatch && categoryMatch;
  });

  return data;
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

function itemCheckSum(item) {
  return toNumber(item.labor) + itemExpenseTotal(item) + itemMaterialTotal(item) + itemStdTotal(item);
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
  setText("submitRecipient", `${data.contractor} 귀중`);
  setText(
    "submitText",
    `${data.contractName}에 대하여 기준시점 및 비교시점 자료, 지수조정율 산정값, 물가변동 적용대가를 검토한 결과를 아래와 같이 제출합니다.`
  );
  setText("submitAmountTitle", `물가변동으로 인한 계약금액 조정 ( 제 ${data.escRound}회 ESC )`);
  setText("submitAmountValue", `일금 ${formatCurrency(data.finalAdjustAmount)} (￦ ${Math.round(data.finalAdjustAmount).toLocaleString("ko-KR")})`);
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
  setText("a2B", formatCurrency(data.contractAmount));
  setText("a2C", formatCurrency(data.excludedAmount));
  setText("a2C1", formatCurrency(data.excludedAmount1));
  setText("a2C2", formatCurrency(data.directLaborAmount));
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

  setText("a21K0Amount", formatCurrency(data.k0Amount));
  setText("a21K1Amount", formatCurrency(data.k1Amount));
  setText("a21K2Amount", formatCurrency(data.k2Amount));
  setText("a21K3Amount", formatCurrency(data.k3Amount));

  setText("a21K0Weight", data.k0Weight.toFixed(4));
  setText("a21K1Weight", data.k1Weight.toFixed(4));
  setText("a21K2Weight", data.k2Weight.toFixed(4));
  setText("a21K3Weight", data.k3Weight.toFixed(4));

  setText("a21K0Rate", formatPercent(data.k0Rate, 4));
  setText("a21K1Rate", formatPercent(data.k1Rate, 4));
  setText("a21K2Rate", formatPercent(data.k2Rate, 4));
  setText("a21K3Rate", formatPercent(data.k3Rate, 4));

  setText("a21K0Result", formatPercent(data.k0Weighted * 100, 4));
  setText("a21K1Result", formatPercent(data.k1Weighted * 100, 4));
  setText("a21K2Result", formatPercent(data.k2Weighted * 100, 4));
  setText("a21K3Result", formatPercent(data.k3Weighted * 100, 4));

  setText("a21TotalAmount", formatCurrency(data.totalKBase));
  setText("a21TotalWeight", (data.k0Weight + data.k1Weight + data.k2Weight + data.k3Weight).toFixed(4));
  setText("a21FinalK", formatPercent(data.finalKPercent, 4));
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

  body9.innerHTML = data.filteredItems.map((item) => {
    const expenseTotal = itemExpenseTotal(item);
    const materialTotal = itemMaterialTotal(item);
    const stdTotal = itemStdTotal(item);
    const checkTotal = itemCheckSum(item);

    return `
      <tr>
        <td>${item.code || "-"}</td>
        <td>${item.trade || "-"}</td>
        <td>${item.category || "-"}</td>
        <td>${item.name || "-"}</td>
        <td>${item.spec || "-"}</td>
        <td>${item.unit || "-"}</td>
        <td>${formatCurrency(item.total)}</td>
        <td>${formatCurrency(item.labor)}</td>
        <td>${formatCurrency(expenseTotal)}</td>
        <td>${formatCurrency(materialTotal)}</td>
        <td>${formatCurrency(stdTotal)}</td>
        <td>${formatCurrency(checkTotal)}</td>
        <td>${item.note || "-"}</td>
      </tr>
    `;
  }).join("");

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

function renderAll() {
  const data = collectData();
  renderSummary(data);
  renderCover(data);
  renderSubmitPage(data);
  renderTOC(data);
  renderAttach1(data);
  renderAttach2(data);
  renderAttach21(data);
  renderAttach9And10(data);
}

function saveDraft() {
  const saved = {};
  INPUT_IDS.forEach((id) => {
    saved[id] = $(id).value;
  });

  localStorage.setItem("esc_report_form_v3", JSON.stringify({
    fields: saved,
    items: state.items
  }));

  alert("입력값을 저장했습니다.");
}

function loadDraft() {
  const raw = localStorage.getItem("esc_report_form_v3");
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

  renderItemsTable();
  renderAll();
  alert("입력값을 불러왔습니다.");
}

function bindInputEvents() {
  document.querySelectorAll("input, select").forEach((node) => {
    node.addEventListener("input", renderAll);
    node.addEventListener("change", renderAll);
  });
}

$("addItemBtn").addEventListener("click", () => {
  addItemRow();
  renderAll();
});

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
renderItemsTable();
bindInputEvents();
renderAll();
showScreen("input");
