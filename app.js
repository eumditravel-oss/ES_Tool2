// app.js
const $ = (id) => document.getElementById(id);

const fields = {
  escRound: $("escRound"),
  reportDate: $("reportDate"),
  demandOrg: $("demandOrg"),
  contractName: $("contractName"),
  contractor: $("contractor"),
  contractMethod: $("contractMethod"),
  techDept: $("techDept"),
  managerName: $("managerName"),
  managerTitle: $("managerTitle"),
  managerPhone: $("managerPhone"),
  bidDate: $("bidDate"),
  contractDate: $("contractDate"),
  adjustDate: $("adjustDate"),
  prevAdjustDate: $("prevAdjustDate"),
  contractAmount: $("contractAmount"),
  excludedAmount1: $("excludedAmount1"),
  directLaborAmount: $("directLaborAmount"),
  plannedProgress: $("plannedProgress"),
  actualProgress: $("actualProgress"),
  kRate: $("kRate"),
  k0Amount: $("k0Amount"),
  k1Amount: $("k1Amount"),
  k2Amount: $("k2Amount"),
  k3Amount: $("k3Amount"),
  k0Rate: $("k0Rate"),
  k1Rate: $("k1Rate"),
  k2Rate: $("k2Rate"),
  k3Rate: $("k3Rate")
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value) {
  return `${Math.round(value).toLocaleString("ko-KR")} 원`;
}

function formatPercent(value, digits = 4) {
  return `${toNumber(value).toFixed(digits)}%`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

function formatMonth(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function diffDays(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((e - s) / oneDay) - 1);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setHTML(id, value) {
  const el = $(id);
  if (el) el.innerHTML = value;
}

function weightedResult(amount, rate, total) {
  if (!total) return 0;
  return (amount / total) * (rate / 100);
}

function buildAttach3Rows(applicableAmount) {
  const labor = applicableAmount * 0.18;
  const expense = applicableAmount * 0.12;
  const material = applicableAmount * 0.70;

  const rows = [
    {
      name: "① 노무비 합계",
      amount: labor,
      coeff: labor / applicableAmount,
      baseIdx: 100,
      compareIdx: 102.72,
      note: ""
    },
    {
      name: "② 경비 합계",
      amount: expense,
      coeff: expense / applicableAmount,
      baseIdx: 100,
      compareIdx: 101.55,
      note: ""
    },
    {
      name: "③ 재료비 합계",
      amount: material,
      coeff: material / applicableAmount,
      baseIdx: 100,
      compareIdx: 103.08,
      note: ""
    }
  ];

  return rows;
}

function renderAttach3(applicableAmount) {
  const tbody = $("attach3Body");
  if (!tbody) return;

  const rows = buildAttach3Rows(applicableAmount);

  tbody.innerHTML = rows.map((row) => {
    const changeRate = row.baseIdx === 0 ? 0 : row.compareIdx / row.baseIdx;
    const adjustCoeff = row.coeff * changeRate;
    return `
      <tr>
        <td>${row.name}</td>
        <td>${formatCurrency(row.amount)}</td>
        <td>${row.coeff.toFixed(4)}</td>
        <td>${row.baseIdx.toFixed(2)}</td>
        <td>${row.compareIdx.toFixed(2)}</td>
        <td>${changeRate.toFixed(4)}</td>
        <td>${adjustCoeff.toFixed(8)}</td>
        <td>${row.note || "-"}</td>
      </tr>
    `;
  }).join("");
}

function collectData() {
  const escRound = Math.max(1, toNumber(fields.escRound.value));
  const reportDate = fields.reportDate.value;
  const demandOrg = fields.demandOrg.value.trim();
  const contractName = fields.contractName.value.trim();
  const contractor = fields.contractor.value.trim();
  const contractMethod = fields.contractMethod.value.trim();
  const techDept = fields.techDept.value.trim();
  const managerName = fields.managerName.value.trim();
  const managerTitle = fields.managerTitle.value.trim();
  const managerPhone = fields.managerPhone.value.trim();
  const bidDate = fields.bidDate.value;
  const contractDate = fields.contractDate.value;
  const adjustDate = fields.adjustDate.value;
  const prevAdjustDate = fields.prevAdjustDate.value;

  const contractAmount = toNumber(fields.contractAmount.value);
  const excludedAmount1 = toNumber(fields.excludedAmount1.value);
  const directLaborAmount = toNumber(fields.directLaborAmount.value);
  const plannedProgress = toNumber(fields.plannedProgress.value);
  const actualProgress = toNumber(fields.actualProgress.value);
  const kRate = toNumber(fields.kRate.value);

  const k0Amount = toNumber(fields.k0Amount.value);
  const k1Amount = toNumber(fields.k1Amount.value);
  const k2Amount = toNumber(fields.k2Amount.value);
  const k3Amount = toNumber(fields.k3Amount.value);

  const k0Rate = toNumber(fields.k0Rate.value);
  const k1Rate = toNumber(fields.k1Rate.value);
  const k2Rate = toNumber(fields.k2Rate.value);
  const k3Rate = toNumber(fields.k3Rate.value);

  const elapsedBaseDate = escRound === 1 ? contractDate : (prevAdjustDate || contractDate);
  const elapsedDays = diffDays(elapsedBaseDate, adjustDate);

  const excludedAmount2 = directLaborAmount;
  const excludedAmount = excludedAmount1 + excludedAmount2;
  const applicableAmount = Math.max(0, contractAmount - excludedAmount);
  const adjustAmount = Math.floor(applicableAmount * (kRate / 100));

  const totalKAmount = k0Amount + k1Amount + k2Amount + k3Amount || 1;
  const k0Weight = k0Amount / totalKAmount;
  const k1Weight = k1Amount / totalKAmount;
  const k2Weight = k2Amount / totalKAmount;
  const k3Weight = k3Amount / totalKAmount;

  const k0Result = weightedResult(k0Amount, k0Rate, totalKAmount);
  const k1Result = weightedResult(k1Amount, k1Rate, totalKAmount);
  const k2Result = weightedResult(k2Amount, k2Rate, totalKAmount);
  const k3Result = weightedResult(k3Amount, k3Rate, totalKAmount);
  const weightedKRate = (k0Result + k1Result + k2Result + k3Result) * 100;

  return {
    escRound,
    reportDate,
    demandOrg,
    contractName,
    contractor,
    contractMethod,
    techDept,
    managerName,
    managerTitle,
    managerPhone,
    bidDate,
    contractDate,
    adjustDate,
    prevAdjustDate,
    contractAmount,
    excludedAmount1,
    directLaborAmount,
    excludedAmount2,
    excludedAmount,
    applicableAmount,
    plannedProgress,
    actualProgress,
    kRate,
    adjustAmount,
    elapsedDays,
    totalKAmount,
    k0Amount, k1Amount, k2Amount, k3Amount,
    k0Rate, k1Rate, k2Rate, k3Rate,
    k0Weight, k1Weight, k2Weight, k3Weight,
    k0Result, k1Result, k2Result, k3Result,
    weightedKRate
  };
}

function renderSummary(data) {
  setText("sumElapsedDays", `${data.elapsedDays.toLocaleString("ko-KR")}일`);
  setText("sumKRate", formatPercent(data.kRate, 4));
  setText("sumAdjustAmount", formatCurrency(data.adjustAmount));

  const daysBadge = $("sumDaysBadge");
  if (data.elapsedDays >= 90) {
    daysBadge.textContent = "충족 (90일 이상)";
    daysBadge.className = "pill pass";
  } else {
    daysBadge.textContent = "미달 (90일 미만)";
    daysBadge.className = "pill fail";
  }

  const kBadge = $("sumKBadge");
  if (Math.abs(data.kRate) >= 3) {
    kBadge.textContent = "충족 (3% 이상)";
    kBadge.className = "pill pass";
  } else {
    kBadge.textContent = "미달 (3% 미만)";
    kBadge.className = "pill fail";
  }
}

function renderCover(data) {
  setText("coverProjectName", data.contractName);
  setText("coverRound", `[ ${data.escRound}회 ESC ]`);
  setText("coverContractor", data.contractor);
  setText("coverReportMonth", formatMonth(data.reportDate));
}

function renderSubmitPage(data) {
  setText("submitRecipient", `${data.contractor}  귀중`);
  setText(
    "submitText1",
    `본 보고서는 「${data.contractName}」 현장에 대하여 물가변동으로 인한 계약금액 조정보고를 완료하고, 검토 결과를 제출하기 위하여 작성한 자료입니다.`
  );
  setText("submitAmountTitle", `물가변동으로 인한 계약금액조정 ( 제${data.escRound}회 ESC )`);
  setText("submitAmountValue", `일금 ${formatCurrency(data.adjustAmount)} (￦ ${Math.round(data.adjustAmount).toLocaleString("ko-KR")})`);
  setText("submitDate", formatMonth(data.reportDate));
}

function renderTOC(data) {
  setText("tocProjectName", `◈ 공사명 : ${data.contractName}`);
}

function renderAttach1(data) {
  setText("a1ProjectName", `◈ 공사명 : ${data.contractName}`);
  setText("a1DemandOrg", data.demandOrg);
  setText("a1ContractName", data.contractName);
  setText("a1ContractMethod", data.contractMethod);
  setText("a1Contractor", data.contractor);
  setText("a1TechDept", data.techDept);
  setText("a1Manager", `${data.managerTitle} ${data.managerName}`);
  setText("a1ManagerPhone", `전화 : ${data.managerPhone}`);
  setText("a1EscRound", `${data.escRound}회`);
  setText("a1ContractDate1", formatDate(data.contractDate));
  setText("a1ContractDate2", formatDate(data.contractDate));
  setText("a1BidDate1", formatDate(data.bidDate));
  setText("a1BidDate2", formatDate(data.bidDate));
  setText("a1AdjustDate1", formatDate(data.adjustDate));
  setText("a1AdjustDate2", formatDate(data.adjustDate));
  setText("a1Round", `${data.escRound}회`);
  setText("a1AdjustDate", formatDate(data.adjustDate));
  setText("a1KRate", formatPercent(data.kRate, 4));
  setText("a1AdjustAmount", formatCurrency(data.adjustAmount));
  setText("a1ElapsedDays", `${data.elapsedDays}일`);

  const opinion = [
    `1) 조정기준일 기준 경과일수는 ${data.elapsedDays}일입니다.`,
    `2) 지수조정율은 ${formatPercent(data.kRate, 4)}입니다.`,
    `3) 물가변동 적용대가는 ${formatCurrency(data.applicableAmount)}이며, 조정금액은 ${formatCurrency(data.adjustAmount)}입니다.`,
    `4) 경과일수 90일 및 등락율 3% 요건은 각각 ${data.elapsedDays >= 90 ? "충족" : "미달"}, ${Math.abs(data.kRate) >= 3 ? "충족" : "미달"} 상태입니다.`
  ].join("\n");

  setText("a1Opinion", opinion);
}

function renderAttach2(data) {
  setText("a2ProjectName", `◈ 공사명 : ${data.contractName}`);
  setText("a2Line1", `□ 수요기관 : ${data.demandOrg}`);
  setText("a2Line2", `□ 물가변동 작성 및 검토자 : 소속 : ${data.techDept} / 직급 : ${data.managerTitle} / 성명 : ${data.managerName}`);
  setText("a2Line3", `□ 공 사 명 : ${data.contractName}`);
  setText("a2Line4", `□ 물가변동 경과기간 : ${data.elapsedDays}일 [ 기준시점 : ${formatDate(data.escRound === 1 ? data.contractDate : (data.prevAdjustDate || data.contractDate))}, 비교시점 : ${formatDate(data.adjustDate)} ]`);

  setText("a2B", formatCurrency(data.contractAmount));
  setText("a2C", formatCurrency(data.excludedAmount));
  setText("a2C1", formatCurrency(data.excludedAmount1));
  setText("a2C2", formatCurrency(data.excludedAmount2));
  setText("a2D", formatCurrency(data.applicableAmount));
  setText("a2Days", `${data.elapsedDays.toLocaleString("ko-KR")}`);
  setText("a2K", data.kRate.toFixed(4));
  setText("a2AdjustAmount", formatCurrency(data.adjustAmount));
}

function renderAttach21(data) {
  setText("a21ProjectName", `◈ 공사명 : ${data.contractName}`);

  setText("a21K0Label", `기존비목(K0) (${formatDate(data.bidDate).replace(/년 |월 /g, ".").replace("일", "")})`);
  setText("a21K1Label", `신규비목(K1)`);
  setText("a21K2Label", `신규비목(K2)`);
  setText("a21K3Label", `신규비목(K3)`);

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

  setText("a21K0Result", data.k0Result.toFixed(4));
  setText("a21K1Result", data.k1Result.toFixed(4));
  setText("a21K2Result", data.k2Result.toFixed(4));
  setText("a21K3Result", data.k3Result.toFixed(4));

  setText("a21TotalAmount", formatCurrency(data.totalKAmount));
  setText("a21TotalWeight", (data.k0Weight + data.k1Weight + data.k2Weight + data.k3Weight).toFixed(4));
  setText("a21TotalResult", formatPercent(data.weightedKRate, 4));
}

function renderAttach4(data) {
  setText("a4ProjectName", `◈ 공사명 : ${data.contractName}`);
}

function renderAttach5(data) {
  setText("a5ProjectName", `◈ 공사명 : ${data.contractName}`);

  const labor = data.applicableAmount * 0.18;
  const expense = data.applicableAmount * 0.12;
  const material = data.applicableAmount * 0.70;

  const laborExclude = data.excludedAmount * 0.25;
  const expenseExclude = data.excludedAmount * 0.15;
  const materialExclude = data.excludedAmount * 0.60;

  setText("a5TotalContract", formatCurrency(data.contractAmount));
  setText("a5Exclude", formatCurrency(data.excludedAmount));
  setText("a5Applicable", formatCurrency(data.applicableAmount));

  setText("a5Labor", formatCurrency(labor + laborExclude));
  setText("a5LaborExclude", formatCurrency(laborExclude));
  setText("a5LaborApplicable", formatCurrency(labor));

  setText("a5Expense", formatCurrency(expense + expenseExclude));
  setText("a5ExpenseExclude", formatCurrency(expenseExclude));
  setText("a5ExpenseApplicable", formatCurrency(expense));

  setText("a5Material", formatCurrency(material + materialExclude));
  setText("a5MaterialExclude", formatCurrency(materialExclude));
  setText("a5MaterialApplicable", formatCurrency(material));
}

function renderAttach6(data) {
  setText("a6ProjectName", `◈ 공사명 : ${data.contractName}`);
}

function renderAttach7(data) {
  setText("a7ProjectName", `◈ 공사명 : ${data.contractName}`);
}

function renderAttach8(data) {
  setText("a8ProjectName", `◈ 공사명 : ${data.contractName}`);
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
  renderAttach3(data.applicableAmount);
  renderAttach4(data);
  renderAttach5(data);
  renderAttach6(data);
  renderAttach7(data);
  renderAttach8(data);
}

Object.values(fields).forEach((input) => {
  input.addEventListener("input", renderAll);
  input.addEventListener("change", renderAll);
});

$("printBtn").addEventListener("click", () => {
  window.print();
});

$("topBtn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderAll();
