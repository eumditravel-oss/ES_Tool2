let lastCalculatedData = null;

function getInputValues() {
  return {
    contractAmount: Number(document.getElementById("contractAmount").value),
    directCost: Number(document.getElementById("directCost").value),
    indirectCost: Number(document.getElementById("indirectCost").value),
    startIndex: Number(document.getElementById("startIndex").value),
    currentIndex: Number(document.getElementById("currentIndex").value)
  };
}

function validateInputs(data) {
  if (
    !data.contractAmount ||
    !data.startIndex ||
    !data.currentIndex
  ) {
    alert("계약금액, 착공시점 지수, 변동시점 지수는 반드시 입력해야 합니다.");
    return false;
  }

  if (data.contractAmount <= 0) {
    alert("계약금액은 0보다 커야 합니다.");
    return false;
  }

  if (data.startIndex <= 0 || data.currentIndex <= 0) {
    alert("지수값은 0보다 커야 합니다.");
    return false;
  }

  return true;
}

function calculateValues(data) {
  const rate = (data.currentIndex - data.startIndex) / data.startIndex;
  const k0 = (data.directCost + data.indirectCost) / data.contractAmount;
  const adjustRate = rate * k0;
  const resultAmount = data.contractAmount * adjustRate;

  return {
    ...data,
    rate,
    k0,
    adjustRate,
    resultAmount
  };
}

function renderResult(result) {
  document.getElementById("rate").innerText = (result.rate * 100).toFixed(2) + "%";
  document.getElementById("k0").innerText = result.k0.toFixed(4);
  document.getElementById("adjustRate").innerText = (result.adjustRate * 100).toFixed(2) + "%";
  document.getElementById("resultAmount").innerText = result.resultAmount.toLocaleString("ko-KR") + " 원";
}

function calculate() {
  const inputData = getInputValues();

  if (!validateInputs(inputData)) return;

  const result = calculateValues(inputData);
  lastCalculatedData = result;
  renderResult(result);
}

function exportToExcel() {
  if (!lastCalculatedData) {
    const inputData = getInputValues();

    if (!validateInputs(inputData)) return;

    lastCalculatedData = calculateValues(inputData);
    renderResult(lastCalculatedData);
  }

  const now = new Date();
  const reportDate = formatDate(now);
  const reportTime = formatTime(now);

  const inputSheetData = [
    ["ES 추정 산출기 결과보고서"],
    [],
    ["생성일자", reportDate],
    ["생성시간", reportTime],
    [],
    ["항목", "값"],
    ["계약금액", lastCalculatedData.contractAmount],
    ["직접공사비", lastCalculatedData.directCost],
    ["간접공사비", lastCalculatedData.indirectCost],
    ["착공시점 지수", lastCalculatedData.startIndex],
    ["변동시점 지수", lastCalculatedData.currentIndex]
  ];

  const resultSheetData = [
    ["ES 산출 결과"],
    [],
    ["항목", "값"],
    ["지수변동률", lastCalculatedData.rate],
    ["K0", lastCalculatedData.k0],
    ["지수조정율", lastCalculatedData.adjustRate],
    ["조정금액", lastCalculatedData.resultAmount]
  ];

  const wsInput = XLSX.utils.aoa_to_sheet(inputSheetData);
  const wsResult = XLSX.utils.aoa_to_sheet(resultSheetData);

  wsInput["!cols"] = [{ wch: 20 }, { wch: 20 }];
  wsResult["!cols"] = [{ wch: 20 }, { wch: 20 }];

  applyNumberFormat(wsInput, ["B7", "B8", "B9"], "#,##0");
  applyNumberFormat(wsInput, ["B10", "B11"], "0.00");

  applyNumberFormat(wsResult, ["B4", "B6"], "0.00%");
  applyNumberFormat(wsResult, ["B5"], "0.0000");
  applyNumberFormat(wsResult, ["B7"], "#,##0");

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsInput, "기초입력");
  XLSX.utils.book_append_sheet(workbook, wsResult, "산출결과");

  const fileName = `ES_결과보고서_${reportDate.replace(/-/g, "")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

function applyNumberFormat(worksheet, cellAddresses, format) {
  cellAddresses.forEach((address) => {
    if (worksheet[address]) {
      worksheet[address].z = format;
    }
  });
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
