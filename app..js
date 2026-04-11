function calculate() {

  const contractAmount = Number(document.getElementById("contractAmount").value);
  const directCost = Number(document.getElementById("directCost").value);
  const indirectCost = Number(document.getElementById("indirectCost").value);
  const startIndex = Number(document.getElementById("startIndex").value);
  const currentIndex = Number(document.getElementById("currentIndex").value);

  if (!contractAmount || !startIndex || !currentIndex) {
    alert("필수값 입력 필요");
    return;
  }

  // 1. 지수변동률
  const rate = (currentIndex - startIndex) / startIndex;

  // 2. K0 (비목군 계수)
  const k0 = (directCost + indirectCost) / contractAmount;

  // 3. 지수조정율
  const adjustRate = rate * k0;

  // 4. 조정금액
  const resultAmount = contractAmount * adjustRate;

  // 출력
  document.getElementById("rate").innerText = (rate * 100).toFixed(2) + "%";
  document.getElementById("k0").innerText = k0.toFixed(4);
  document.getElementById("adjustRate").innerText = (adjustRate * 100).toFixed(2) + "%";
  document.getElementById("resultAmount").innerText = resultAmount.toLocaleString() + " 원";
}


// JSON 저장
function saveData() {

  const data = {
    contractAmount: document.getElementById("contractAmount").value,
    directCost: document.getElementById("directCost").value,
    indirectCost: document.getElementById("indirectCost").value,
    startIndex: document.getElementById("startIndex").value,
    currentIndex: document.getElementById("currentIndex").value
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "es_data.json";
  a.click();
}
