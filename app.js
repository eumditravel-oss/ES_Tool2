// 1. DOM 요소 가져오기
const inputs = {
    contractName: document.getElementById('contractName'),
    contractAmount: document.getElementById('contractAmount'),
    baseDate: document.getElementById('baseDate'),
    compareDate: document.getElementById('compareDate'),
    kValue: document.getElementById('kValue')
};

const results = {
    resDays: document.getElementById('resDays'),
    reqDays: document.getElementById('reqDays'),
    resK: document.getElementById('resK'),
    reqK: document.getElementById('reqK'),
    resAmount: document.getElementById('resAmount')
};

const downloadBtn = document.getElementById('downloadBtn');

// 2. 현재 계산 상태 저장 객체
let calcData = {};

// 3. 자동 계산 함수 (요건 판정 및 금액 산출)
function calculate() {
    const amount = parseFloat(inputs.contractAmount.value) || 0;
    const k = parseFloat(inputs.kValue.value) || 0;
    const base = new Date(inputs.baseDate.value);
    const compare = new Date(inputs.compareDate.value);

    // 날짜 차이 계산 (경과일수)
    const diffTime = Math.abs(compare - base);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // 조정금액 = 계약금액 * (K값 / 100) -> 엑셀 원가계산처럼 소수점 절사(Floor)
    const adjustAmount = Math.floor(amount * (k / 100));

    // 데이터 저장
    calcData = {
        name: inputs.contractName.value,
        amount: amount,
        baseDate: inputs.baseDate.value,
        compareDate: inputs.compareDate.value,
        k: k,
        diffDays: diffDays,
        adjustAmount: adjustAmount
    };

    updateUI();
}

// 4. 화면 UI 업데이트 함수
function updateUI() {
    // 경과일수 요건 판정 (90일 이상)
    results.resDays.textContent = `${calcData.diffDays}일`;
    if (calcData.diffDays >= 90) {
        results.reqDays.textContent = '✅ 충족 (90일 이상)';
        results.reqDays.className = 'badge success';
    } else {
        results.reqDays.textContent = '❌ 미달 (90일 미만)';
        results.reqDays.className = 'badge danger';
    }

    // 등락율 요건 판정 (3% 이상)
    results.resK.textContent = `${calcData.k.toFixed(2)}%`;
    if (Math.abs(calcData.k) >= 3.0) {
        results.reqK.textContent = '✅ 충족 (3% 이상)';
        results.reqK.className = 'badge success';
    } else {
        results.reqK.textContent = '❌ 미달 (3% 미만)';
        results.reqK.className = 'badge danger';
    }

    // 조정금액 표시
    results.resAmount.textContent = `${calcData.adjustAmount.toLocaleString()} 원`;
}

// 5. 입력창에 값이 바뀔 때마다 실시간 계산 실행
Object.values(inputs).forEach(input => {
    input.addEventListener('input', calculate);
});

// 초기 실행
calculate();


// 6. 엑셀 다운로드 로직 (ExcelJS 사용)
downloadBtn.addEventListener('click', async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        
        // ----------------------------------------
        // 시트 1: 보고서 표지
        // ----------------------------------------
        const coverSheet = workbook.addWorksheet('표지');
        coverSheet.getColumn('A').width = 80;
        
        const titleCell = coverSheet.getCell('A3');
        titleCell.value = '물가변동으로 인한 계약금액 조정 보고서\n[ 1회ESC ]';
        titleCell.font = { size: 24, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        coverSheet.getRow(3).height = 100;

        const nameCell = coverSheet.getCell('A10');
        nameCell.value = `공사명 : ${calcData.name}`;
        nameCell.font = { size: 16, bold: true };
        nameCell.alignment = { horizontal: 'center' };
        
        const dateCell = coverSheet.getCell('A15');
        const today = new Date();
        dateCell.value = `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
        dateCell.alignment = { horizontal: 'center' };

        // ----------------------------------------
        // 시트 2: 붙임 1. 종합의견서
        // ----------------------------------------
        const sheet1 = workbook.addWorksheet('붙임1_종합의견서');
        sheet1.getColumn('A').width = 25;
        sheet1.getColumn('B').width = 40;
        
        sheet1.getCell('A1').value = '[ 붙임 1 ]';
        sheet1.getCell('A2').value = '물가변동으로 인한 계약금액 조정에 대한 종합의견서';
        sheet1.getCell('A2').font = { size: 16, bold: true };
        
        sheet1.getCell('A4').value = '1. 공사명:';
        sheet1.getCell('B4').value = calcData.name;
        
        sheet1.getCell('A5').value = '2. 계약금액:';
        sheet1.getCell('B5').value = calcData.amount;
        sheet1.getCell('B5').numFmt = '#,##0" 원"';
        
        sheet1.getCell('A6').value = '3. 기준시점(입찰일):';
        sheet1.getCell('B6').value = calcData.baseDate;

        sheet1.getCell('A7').value = '4. 비교시점(조정일):';
        sheet1.getCell('B7').value = calcData.compareDate;
        
        sheet1.getCell('A8').value = '5. 조정율 (K):';
        sheet1.getCell('B8').value = calcData.k / 100;
        sheet1.getCell('B8').numFmt = '0.0000%';
        
        sheet1.getCell('A9').value = '6. 조정 대상 금액:';
        sheet1.getCell('B9').value = calcData.adjustAmount;
        sheet1.getCell('B9').numFmt = '#,##0" 원"';
        sheet1.getCell('B9').font = { bold: true, color: { argb: 'FFFF0000' } };

        // ----------------------------------------
        // 파일 생성 및 다운로드 (FileSaver.js)
        // ----------------------------------------
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `1.보고서_ESC_${calcData.name}.xlsx`);

    } catch (error) {
        alert("엑셀 생성 중 오류가 발생했습니다.");
        console.error(error);
    }
});
