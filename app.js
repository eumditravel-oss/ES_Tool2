// app.js
const $ = (id) => document.getElementById(id);

const tradeOptions = [
  "", "건축", "토목", "기계", "기계설비", "전기", "통신", "소방", "조경"
];

const categoryOptions = [
  "", "기존비목(K0)", "신규비목(K1)", "신규비목(K2)", "신규비목(K3)",
  "신규비목(K4)", "신규비목(K5)", "신규비목(K6)", "신규비목(K7)"
];

const state = {
  items: [
    {
      trade: "건축",
      category: "기존비목(K0)",
      code: "A-001",
      name: "철근콘크리트",
      spec: "기초부",
      unit: "식",
      total: 15000000,
      labor: 3000000,
      machine: 1500000,
      misc: 500000,
      mine: 1200000,
      note: "기본 예시"
    }
  ]
};

const fieldIds = [
  "escRound","reportDate","demandOrg","contractName","contractor","contractMethod",
  "techDept","managerName","managerTitle","managerPhone","contractAmount",
  "excludedAmount1","directLaborAmount","advanceDeduction","etcDeduction",
  "safeRate","employmentGrade","bidDate","contractDate","adjustDate","prevAdjustDate",
  "baseLaborIndex","compareLaborIndex","basePpiMonth","comparePpiMonth",
  "baseMineIndex","compareMineIndex","baseManufactureIndex","compareManufactureIndex",
  "baseUtilityIndex","compareUtilityIndex","baseAgriIndex","compareAgriIndex",
  "k0Amount","k1Amount","k2Amount","k3Amount","k0Rate","k1Rate","k2Rate","k3Rate",
  "plannedProgress","actualProgress"
];

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(v) {
  return `${Math.round(v).toLocaleString("ko-KR")} 원`;
}

function formatPercent(v, digits = 4) {
  return `${toNumber(v).toFixed(digits)}%`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatMonth(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function diffDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) - 1;
  return Math.max(diff, 0);
}

function floorToThousand(v) {
  return Math.floor(v / 1000) * 1000;
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function showScreen(screen) {
  $("inputScreen").classList.remove("active");
  $("reportScreen").classList.remove("active");
  $("stepChip1").classList.remove("active");
  $("stepChip2").classList.remove("active");

  if (screen === "report") {
    $("reportScreen").classList.add("active");
    $("stepChip2").classList.add("active");
  } else {
    $("inputScreen").classList.add("active");
    $("stepChip1").classList.add("active");
  }
}

function bindTabButtons() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $(btn.dataset.tab).classList.add("active");
    });
  });
}

function createSelect(options, value, onChange) {
  const select = document.createElement("select");
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt || "선택";
    if (opt === value) option.selected = true;
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

function renderItemsTable() {
  const tbody = $("itemsTbody");
  tbody.innerHTML = "";

  state.items.forEach((item, index) => {
    const tr = document.createElement("tr");

    const tdTrade = document.createElement("td");
    tdTrade.appendChild(createSelect(tradeOptions, item.trade, (e) => {
      state.items[index].trade = e.target.value;
      renderAll();
    }));
    tr.appendChild(tdTrade);

    const tdCategory = document.createElement("td");
    tdCategory.appendChild(createSelect(categoryOptions, item.category, (e) => {
      state.items[index].category = e.target.value;
      renderAll();
    }));
    tr.appendChild(tdCategory);

    const fields = [
      ["code", "text"],
      ["name", "text"],
      ["spec", "text"],
      ["unit", "text"],
      ["total", "number"],
      ["labor", "number"],
      ["machine", "number"],
      ["misc", "number"],
      ["mine", "number"],
      ["note", "text"]
    ];

    fields.forEach(([key, type]) => {
      const td = document.createElement("td");
      td.appendChild(createInput(item[key], type, (e) => {
        state.items[index][key] = type === "number" ? toNumber(e.target.value) : e.target.value;
        renderAll();
      }));
      tr.appendChild(td);
    });

    const tdRemove = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "삭제";
    removeBtn.addEventListener("click", () => {
      state.items.splice(index, 1);
      renderItemsTable();
      renderAll();
    });
    tdRemove.appendChild(removeBtn);
    tr.appendChild(tdRemove);

    tbody.appendChild(tr);
  });
}

function addItemRow() {
  state.items.push({
    trade: "",
    category: "",
    code: "",
    name: "",
    spec: "",
    unit: "",
    total: 0,
    labor: 0,
    machine: 0,
    misc: 0,
    mine: 0,
    note: ""
  });
  renderItemsTable();
}

function getValues() {
  const data = {};
  fieldIds.forEach((id) => {
    data[id] = $(id).value;
  });

  data.escRound = Math.max(1, toNumber(data.escRound));
  data.contractAmount = toNumber(data.contractAmount);
  data.excludedAmount1 = toNumber(data.excludedAmount1);
  data.directLaborAmount = toNumber(data.directLaborAmount);
  data.advanceDeduction = toNumber(data.advanceDeduction);
  data.etcDeduction = toNumber(data.etcDeduction);

  data.k0Amount = toNumber(data.k0Amount);
  data.k1Amount = toNumber(data.k1Amount);
  data.k2Amount = toNumber(data.k2Amount);
  data.k3Amount = toNumber(data.k3Amount);

  data.k0Rate = toNumber(data.k0Rate);
  data.k1Rate = toNumber(data.k1Rate);
  data.k2Rate = toNumber(data.k2Rate);
  data.k3Rate = toNumber(data.k3Rate);

  const excludedAmount = data.excludedAmount1 + data.directLaborAmount;
  const applicableAmount = Math.max(0, data.contractAmount - excludedAmount);

  const baseDateForElapsed = data.escRound === 1
    ? data.contractDate
    : (data.prevAdjustDate || data.contractDate);

  const elapsedDays = diffDays(baseDateForElapsed, data.adjustDate);

  const totalKAmount = data.k0Amount + data.k1Amount + data.k2Amount + data.k3Amount || 1;

  const k0Weight = data.k0Amount / totalKAmount;
  const k1Weight = data.k1Amount / totalKAmount;
  const k2Weight = data.k2Amount / totalKAmount;
  const k3Weight = data.k3Amount / totalKAmount;

  const k0Result = k0Weight * (data.k0Rate / 100);
  const k1Result = k1Weight * (data.k1Rate / 100);
  const k2Result = k2Weight * (data.k2Rate / 100);
  const k3Result = k3Weight * (data.k3Rate / 100);

  const finalKRateDecimal = k0Result + k1Result + k2Result + k3Result;
  const finalKRatePercent = finalKRateDecimal * 100;

  const rawAdjustAmount = floorToThousand(applicableAmount * finalKRateDecimal);
  const finalAdjustAmount = floorToThousand(rawAdjustAmount - data.advanceDeduction - data.etcDeduction);

  const periodPass = elapsedDays >= 90;
  const ratePass = Math.abs(finalKRatePercent) >= 3;
  const finalPass = periodPass && ratePass;

  return {
    ...data,
    items: state.items,
    excludedAmount,
    applicableAmount,
    baseDateForElapsed,
    elapsedDays,
    totalKAmount,
    k0Weight, k1Weight, k2Weight, k3Weight,
    k0Result, k1Result, k2Result, k3Result,
    finalKRateDecimal,
    finalKRatePercent,
    rawAdjustAmount,
    finalAdjustAmount,
    periodPass,
    ratePass,
    finalPass
  };
}

function renderSummary(data) {
  setText("sumElapsedDays", `${data.elapsedDays.toLocaleString("ko-KR")}일`);
  setText("sumKRate", formatPercent(data.finalKRatePercent, 4));
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

function renderSubmit(data) {
  setText("submitRecipient", `${data.contractor} 귀중`);
  setText(
    "submitText1",
    `${data.contractName}에 대하여 물가변동으로 인한 계약금액 조정 검토를 완료하였으며, 기준시점 및 비교시점 자료를 반영한 결과를 아래와 같이 제출합니다.`
  );
  setText("submitAmountTitle", `물가변동으로 인한 계약금액 조정 (제 ${data.escRound}회 ESC)`);
  setText("submitAmountValue", `일금 ${formatCurrency(data.finalAdjustAmount)} (￦ ${Math.round(data.finalAdjustAmount).toLocaleString("ko-KR")})`);
  setText("submitDate", formatMonth(data.reportDate));
}

function renderAttach1(data) {
  setText("a1ProjectName", `◈ 공사명 : ${data.contractName}`);
  setText("a1DemandOrg", data.demandOrg);
  setText("a1ContractName", data.contractName);
  setText("a1ContractMethod", data.contractMethod);
  setText("a1Contractor", data.contractor);
  setText("a1TechDept", data.techDept);
  setText("a1Manager", `${data.managerTitle} ${data.managerName}`);
  setText("a1ManagerPhone", data.managerPhone);
  setText("a1EscRound", `${data.escRound}회`);
  setText("a1BaseDate", formatDate(data.baseDateForElapsed));
  setText("a1AdjustDate", formatDate(data.adjustDate));
  setText("a1ElapsedDays", `${data.elapsedDays}일`);
  setText("a1KRate", formatPercent(data.finalKRatePercent, 4));
  setText("a1RawAdjustAmount", formatCurrency(data.rawAdjustAmount));
  setText("a1AdjustAmount", formatCurrency(data.finalAdjustAmount));

  const opinion = [
    `1) 경과일수는 ${data.elapsedDays}일이며 ${data.periodPass ? "기간요건을 충족합니다." : "기간요건을 충족하지 않습니다."}`,
    `2) 최종 지수조정율은 ${formatPercent(data.finalKRatePercent, 4)}이며 ${data.ratePass ? "등락요건을 충족합니다." : "등락요건을 충족하지 않습니다."}`,
    `3) 물가변동 적용대가는 ${formatCurrency(data.applicableAmount)}입니다.`,
    `4) 산출 조정금액은 ${formatCurrency(data.rawAdjustAmount)}이며, 선금급 공제 ${formatCurrency(data.advanceDeduction)} 및 기타 공제 ${formatCurrency(data.etcDeduction)} 반영 후 최종 조정적용금액은 ${formatCurrency(data.finalAdjustAmount)}입니다.`,
    `5) 최종 판정: ${data.finalPass ? "물가변동 조정 가능" : "물가변동 조정 불가"}`
  ].join("\n");

  setText("a1Opinion", opinion);
}

function renderAttach2(data) {
  setText("a2ProjectName", `◈ 공사명 : ${data.contractName}`);
  setText("a2B", formatCurrency(data.contractAmount));
  setText("a2C", formatCurrency(data.excludedAmount));
  setText("a2C1", formatCurrency(data.excludedAmount1));
  setText("a2C2", formatCurrency(data.directLaborAmount));
  setText("a2D", formatCurrency(data.applicableAmount));
  setText("a2Days", `${data.elapsedDays}일`);
  setText("a2K", formatPercent(data.finalKRatePercent, 4));
  setText("a2RawAdjustAmount", formatCurrency(data.rawAdjustAmount));
  setText("a2Advance", formatCurrency(data.advanceDeduction));
  setText("a2Etc", formatCurrency(data.etcDeduction));
  setText("a2AdjustAmount", formatCurrency(data.finalAdjustAmount));
  setText("a2Judge", data.finalPass ? "기간 및 등락 요건 충족" : "요건 불충족");
}

function renderAttach21(data) {
  setText("a21ProjectName", `◈ 공사명 : ${data.contractName}`);
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

  setText("a21K0Result", formatPercent(data.k0Result * 100, 4));
  setText("a21K1Result", formatPercent(data.k1Result * 100, 4));
  setText("a21K2Result", formatPercent(data.k2Result * 100, 4));
  setText("a21K3Result", formatPercent(data.k3Result * 100, 4));

  setText("a21TotalAmount", formatCurrency(data.totalKAmount));
  setText("a21TotalWeight", (data.k0Weight + data.k1Weight + data.k2Weight + data.k3Weight).toFixed(4));
  setText("a21TotalResult", formatPercent(data.finalKRatePercent, 4));
}

function buildAttachTitle(baseTitle, items) {
  const trade = items.find((v) => v.trade)?.trade || "";
  const category = items.find((v) => v.category)?.category || "";
  if (!trade && !category) return baseTitle;
  if (trade && !category) return `${baseTitle} - ${trade}`;
  if (!trade && category) return `${baseTitle} - ${category}`;
  return `${baseTitle} - ${trade} ${category}`;
}

function renderItemsReport(data) {
  setText("a9ProjectName", `◈ 공사명 : ${data.contractName}`);
  setText("a10ProjectName", `◈ 공사명 : ${data.contractName}`);
  setText("attach9Title", buildAttachTitle("물가변동 적용대가의 비목군 분류 일위대가표", data.items));
  setText("attach10Title", buildAttachTitle("물가변동 적용대가의 비목군 분류 산출근거", data.items));

  const attach9Body = $("attach9Body");
  const attach10Body = $("attach10Body");

  if (!data.items.length) {
    attach9Body.innerHTML = `<tr><td colspan="12">입력된 내역이 없습니다.</td></tr>`;
    attach10Body.innerHTML = `<tr><td colspan="12">입력된 내역이 없습니다.</td></tr>`;
    return;
  }

  attach9Body.innerHTML = data.items.map((item) => `
    <tr>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.code || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${item.spec || "-"}</td>
      <td>${item.unit || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(item.machine)}</td>
      <td>${formatCurrency(item.misc)}</td>
      <td>${formatCurrency(item.mine)}</td>
      <td>${item.note || "-"}</td>
    </tr>
  `).join("");

  attach10Body.innerHTML = data.items.map((item) => `
    <tr>
      <td>${item.trade || "-"}</td>
      <td>${item.category || "-"}</td>
      <td>${item.code || "-"}</td>
      <td>${item.name || "-"}</td>
      <td>${item.spec || "-"}</td>
      <td>${item.unit || "-"}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${formatCurrency(item.labor)}</td>
      <td>${formatCurrency(item.machine)}</td>
      <td>${formatCurrency(item.misc)}</td>
      <td>${formatCurrency(item.mine)}</td>
      <td>${item.note || "-"}</td>
    </tr>
  `).join("");
}

function renderAll() {
  const data = getValues();

  setText("tocProjectName", `◈ 공사명 : ${data.contractName}`);

  renderSummary(data);
  renderCover(data);
  renderSubmit(data);
  renderAttach1(data);
  renderAttach2(data);
  renderAttach21(data);
  renderItemsReport(data);
}

function saveDraft() {
  const formData = {};
  fieldIds.forEach((id) => {
    formData[id] = $(id).value;
  });
  localStorage.setItem("esc_report_form_v2", JSON.stringify({
    formData,
    items: state.items
  }));
  alert("입력값을 저장했습니다.");
}

function loadDraft() {
  const raw = localStorage.getItem("esc_report_form_v2");
  if (!raw) {
    alert("저장된 입력값이 없습니다.");
    return;
  }
  const saved = JSON.parse(raw);
  if (saved.formData) {
    Object.entries(saved.formData).forEach(([key, value]) => {
      if ($(key)) $(key).value = value;
    });
  }
  state.items = Array.isArray(saved.items) ? saved.items : [];
  renderItemsTable();
  renderAll();
  alert("입력값을 불러왔습니다.");
}

document.querySelectorAll("input").forEach((el) => {
  el.addEventListener("input", renderAll);
  el.addEventListener("change", renderAll);
});

$("addItemRowBtn").addEventListener("click", () => {
  addItemRow();
  renderAll();
});

$("toReportBtn").addEventListener("click", () => {
  renderAll();
  showScreen("report");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("toInputBtn").addEventListener("click", () => {
  showScreen("input");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("saveDraftBtn").addEventListener("click", saveDraft);
$("loadDraftBtn").addEventListener("click", loadDraft);
$("printBtn").addEventListener("click", () => {
  showScreen("report");
  window.print();
});

bindTabButtons();
renderItemsTable();
renderAll();
showScreen("input");
