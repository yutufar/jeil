<template>
  <div class="dashboard-container">
    <div class="header-row">
      <h1 class="dashboard-title">📊 자재 현황 대시보드</h1>
      <button @click="downloadExcel" class="btn-excel">
        📥 엑셀 다운로드
      </button>
    </div>

    <!-- 기존 HTML 그대로... -->
    <!-- 월 선택 -->
    <div class="month-selector">
      <select v-model="selectedYear" @change="loadData">
        <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
      </select>
      <select v-model="selectedMonth" @change="loadData">
        <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
      </select>
    </div>

    <!-- 1. 레미콘 판매량 (임시) -->
    <div class="stat-card">
      <h3>레미콘 판매량 ({{ selectedMonth }}월)</h3>
      <table class="stat-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>상차도</th>
            <th>제품</th>
            <th>생산량</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ selectedMonth }}월</td>
            <td>{{ formatNumber(production.truckLoads) }}</td>
            <td>{{ formatNumber(production.productAmount) }}</td>
            <td>{{ formatNumber(production.productionQty) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="note">※ 레미콘 판매 데이터 저장 기능은 추후 구현 예정</p>
    </div>

    <!-- 2. 월별 자재 사용량 -->
    <div class="stat-card">
      <h3>{{ selectedMonth }}월 자재 사용량</h3>
      <table class="stat-table">
        <thead>
          <tr>
            <th>재료명</th>
            <th>사용량</th>
            <th>단가</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in materialUsage" :key="item.materialType">
            <td>{{ item.materialName }}</td>
            <td class="text-right">{{ formatNumber(item.usageQty) }}</td>
            <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
            <td class="text-right">{{ formatNumber(item.totalAmount) }}</td>
          </tr>
          <tr class="total-row">
            <td>합계</td>
            <td></td>
            <td></td>
            <td class="text-right">{{ formatNumber(totalUsageAmount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. 월별 재고 현황 -->
    <div class="stat-card">
      <h3>{{ selectedMonth }}월 재고 현황</h3>
      <table class="stat-table">
        <thead>
          <tr>
            <th>재료명</th>
            <th>전월이월</th>
            <th>입고</th>
            <th>출고</th>
            <th>재고</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in stockSummary" :key="item.materialType">
            <td>{{ item.materialName }}</td>
            <td class="text-right">{{ formatNumber(item.openingStock) }}</td>
            <td class="text-right">{{ formatNumber(item.totalIncoming) }}</td>
            <td class="text-right">{{ formatNumber(item.totalOutgoing) }}</td>
            <td class="text-right">{{ formatNumber(item.closingStock) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4. 원자재 단가 -->
    <div class="stat-card">
      <h3>원자재 단가</h3>
      <table class="stat-table">
        <thead>
          <tr>
            <th>품목</th>
            <th>단가</th>
            <th>운반비</th>
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in unitPrices" :key="item.materialType">
            <td>{{ item.materialName }}</td>
            <td class="text-right">{{ formatNumber(item.basePrice) }}</td>
            <td class="text-right">{{ formatNumber(item.transportCost) }}</td>
            <td class="text-right">{{ formatNumber(item.totalPrice) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/api/axios';

const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);

const production = ref({
  truckLoads: 0,
  productAmount: 0,
  productionQty: 0
});

const materialUsage = ref([]);
const stockSummary = ref([]);
const unitPrices = ref([]);

const years = computed(() => {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1];
});

const totalUsageAmount = computed(() => {
  return materialUsage.value.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
});

const formatNumber = (value) => {
  if (!value || value === 0) return '0';
  return Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 0 });
};

const loadData = async () => {
  try {
    const params = {
      year: selectedYear.value,
      month: selectedMonth.value
    };

    const [prod, usage, stock, prices] = await Promise.all([
      api.post('/material/stock/dashboard/production', params),
      api.post('/material/stock/dashboard/material-usage', params),
      api.post('/material/stock/summary', params),
      api.post('/material/stock/dashboard/unit-prices')
    ]);

    production.value = prod.data || prod;
    materialUsage.value = usage.data || usage;
    stockSummary.value = stock.data || stock;
    unitPrices.value = prices.data || prices;
  } catch (error) {
    console.error('대시보드 데이터 조회 오류:', error);
    alert('데이터를 불러오는 중 오류가 발생했습니다');
  }
};

const downloadExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('자재현황');
    
    // 컬럼 너비 설정
    worksheet.columns = [
      { width: 20 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 }
    ];
    
    // 공통 테두리 스타일
    const allBorders = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    let currentRow = 1;
    
    // 메인 제목
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = `자재 현황 대시보드 - ${selectedYear.value}년 ${selectedMonth.value}월`;
    worksheet.mergeCells(currentRow, 1, currentRow, 5);
    titleRow.getCell(1).font = { size: 14, bold: true };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
    titleRow.getCell(1).border = allBorders;
    titleRow.height = 25;
    currentRow += 2;
    
    // 1. 레미콘 판매량
    const section1TitleRow = worksheet.getRow(currentRow);
    section1TitleRow.getCell(1).value = '레미콘 판매량';
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    section1TitleRow.getCell(1).font = { size: 11, bold: true };
    section1TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    section1TitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    section1TitleRow.getCell(1).border = allBorders;
    section1TitleRow.height = 20;
    currentRow++;
    
    const section1HeaderRow = worksheet.getRow(currentRow);
    ['구분', '상차도', '제품 (원)', '생산량 (㎥)'].forEach((header, idx) => {
      const cell = section1HeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorders;
    });
    section1HeaderRow.height = 20;
    currentRow++;
    
    const section1DataRow = worksheet.getRow(currentRow);
    [
      `${selectedMonth.value}월`,
      production.value.truckLoads || 0,
      production.value.productAmount || 0,
      production.value.productionQty || 0
    ].forEach((value, idx) => {
      const cell = section1DataRow.getCell(idx + 1);
      cell.value = value;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
      cell.border = allBorders;
      if (typeof value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
    section1DataRow.height = 20;
    currentRow += 3;
    
    // 2. 월별 자재 사용량
    const section2TitleRow = worksheet.getRow(currentRow);
    section2TitleRow.getCell(1).value = `${selectedMonth.value}월 자재 사용량`;
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    section2TitleRow.getCell(1).font = { size: 11, bold: true };
    section2TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    section2TitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    section2TitleRow.getCell(1).border = allBorders;
    section2TitleRow.height = 20;
    currentRow++;
    
    const section2HeaderRow = worksheet.getRow(currentRow);
    ['재료명', '사용량', '단가 (원)', '금액 (원)'].forEach((header, idx) => {
      const cell = section2HeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorders;
    });
    section2HeaderRow.height = 20;
    currentRow++;
    
    materialUsage.value.forEach(item => {
      const dataRow = worksheet.getRow(currentRow);
      [
        item.materialName,
        Number(item.usageQty || 0),
        Number(item.unitPrice || 0),
        Number(item.totalAmount || 0)
      ].forEach((value, idx) => {
        const cell = dataRow.getCell(idx + 1);
        cell.value = value;
        cell.font = { size: 10 };
        cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
        cell.border = allBorders;
        if (typeof value === 'number') {
          cell.numFmt = '#,##0';
        }
      });
      dataRow.height = 20;
      currentRow++;
    });
    
    const section2TotalRow = worksheet.getRow(currentRow);
    ['합계', '', '', Number(totalUsageAmount.value)].forEach((value, idx) => {
      const cell = section2TotalRow.getCell(idx + 1);
      cell.value = value;
      cell.font = { size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
      cell.border = allBorders;
      if (typeof value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
    section2TotalRow.height = 20;
    currentRow += 3;
    
    // 3. 월별 재고 현황
    const section3TitleRow = worksheet.getRow(currentRow);
    section3TitleRow.getCell(1).value = `${selectedMonth.value}월 재고 현황`;
    worksheet.mergeCells(currentRow, 1, currentRow, 5);
    section3TitleRow.getCell(1).font = { size: 11, bold: true };
    section3TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    section3TitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    section3TitleRow.getCell(1).border = allBorders;
    section3TitleRow.height = 20;
    currentRow++;
    
    const section3HeaderRow = worksheet.getRow(currentRow);
    ['재료명', '전월이월', '입고', '출고', '재고'].forEach((header, idx) => {
      const cell = section3HeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorders;
    });
    section3HeaderRow.height = 20;
    currentRow++;
    
    stockSummary.value.forEach(item => {
      const dataRow = worksheet.getRow(currentRow);
      [
        item.materialName,
        Number(item.openingStock || 0),
        Number(item.totalIncoming || 0),
        Number(item.totalOutgoing || 0),
        Number(item.closingStock || 0)
      ].forEach((value, idx) => {
        const cell = dataRow.getCell(idx + 1);
        cell.value = value;
        cell.font = { size: 10 };
        cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
        cell.border = allBorders;
        if (typeof value === 'number') {
          cell.numFmt = '#,##0';
        }
      });
      dataRow.height = 20;
      currentRow++;
    });
    currentRow += 2;
    
    // 4. 원자재 단가
    const section4TitleRow = worksheet.getRow(currentRow);
    section4TitleRow.getCell(1).value = '원자재 단가';
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    section4TitleRow.getCell(1).font = { size: 11, bold: true };
    section4TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    section4TitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    section4TitleRow.getCell(1).border = allBorders;
    section4TitleRow.height = 20;
    currentRow++;
    
    const section4HeaderRow = worksheet.getRow(currentRow);
    ['품목', '단가 (원)', '운반비 (원)', '합계 (원)'].forEach((header, idx) => {
      const cell = section4HeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorders;
    });
    section4HeaderRow.height = 20;
    currentRow++;
    
    unitPrices.value.forEach(item => {
      const dataRow = worksheet.getRow(currentRow);
      [
        item.materialName,
        Number(item.basePrice || 0),
        Number(item.transportCost || 0),
        Number(item.totalPrice || 0)
      ].forEach((value, idx) => {
        const cell = dataRow.getCell(idx + 1);
        cell.value = value;
        cell.font = { size: 10 };
        cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' };
        cell.border = allBorders;
        if (typeof value === 'number') {
          cell.numFmt = '#,##0';
        }
      });
      dataRow.height = 20;
      currentRow++;
    });
    
    // 파일 저장
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `자재현황_${selectedYear.value}년${selectedMonth.value}월.xlsx`);
    
    alert('엑셀 파일이 다운로드되었습니다');
    
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert('엑셀 다운로드 중 오류가 발생했습니다');
  }
};

onMounted(loadData);
</script>

<style scoped>
/* 기존 스타일 그대로 */
.dashboard-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.btn-excel {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-excel:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
}

.month-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.month-selector select {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.stat-table {
  width: 100%;
  border-collapse: collapse;
}

.stat-table thead th {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  color: #64748b;
}

.stat-table tbody td {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.text-right {
  text-align: right !important;
}

.total-row {
  background: #fef3c7;
  font-weight: 700;
}

.note {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>