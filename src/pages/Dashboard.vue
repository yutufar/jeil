<template>
  <div class="dashboard-container">
    <div class="header-row">
      <h1 class="dashboard-title">📊 자재 현황 대시보드</h1>
      <button @click="downloadExcel" class="btn-excel">
        📥 엑셀 다운로드
      </button>
    </div>

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
      <div class="table-caption">
        <span>레미콘 판매량 ({{ selectedMonth }}월)</span>
        <div class="header-btns">
          <button v-if="!salesEditMode" @click="enterSalesEdit" class="btn-edit-sales">✏️ 입력</button>
          <template v-else>
            <button @click="saveSales" class="btn-save-sales">💾 저장</button>
            <button @click="cancelSalesEdit" class="btn-cancel-sales">취소</button>
          </template>
        </div>
      </div>
      <table class="stat-table sales-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>수량</th>
            <th>평균단가</th>
            <th>금액</th>
            <th>부가세</th>
            <th>총액</th>
          </tr>
        </thead>
        <tbody>
          <!-- 사급 -->
          <tr>
            <td class="div-label">사 급</td>
            <template v-if="salesEditMode">
              <td><input type="number" v-model.number="salesForm.sagup.quantity" class="sales-input" step="0.01"
                  @input="calcSales('sagup')" /></td>
              <td><input type="number" v-model.number="salesForm.sagup.avgUnitPrice" class="sales-input"
                  @input="calcSales('sagup')" /></td>
              <td><input type="number" v-model.number="salesForm.sagup.amount" class="sales-input" /></td>
              <td><input type="number" v-model.number="salesForm.sagup.vat" class="sales-input"
                  @input="calcTotal('sagup')" /></td>
              <td><input type="number" v-model.number="salesForm.sagup.totalAmount" class="sales-input" readonly /></td>
            </template>
            <template v-else>
              <td class="text-right">{{ formatNumber(salesData.sagup.quantity) }}</td>
              <td class="text-right">{{ formatNumber(salesData.sagup.avgUnitPrice) }}</td>
              <td class="text-right">{{ formatNumber(salesData.sagup.amount) }}</td>
              <td class="text-right">{{ formatNumber(salesData.sagup.vat) }}</td>
              <td class="text-right">{{ formatNumber(salesData.sagup.totalAmount) }}</td>
            </template>
          </tr>

          <!-- 관급 -->
          <tr>
            <td class="div-label">관 급</td>
            <template v-if="salesEditMode">
              <td><input type="number" v-model.number="salesForm.gwangup.quantity" class="sales-input" step="0.01"
                  @input="calcSales('gwangup')" /></td>
              <td><input type="number" v-model.number="salesForm.gwangup.avgUnitPrice" class="sales-input"
                  @input="calcSales('gwangup')" /></td>
              <td><input type="number" v-model.number="salesForm.gwangup.amount" class="sales-input" /></td>
              <td><input type="number" v-model.number="salesForm.gwangup.vat" class="sales-input"
                  @input="calcTotal('gwangup')" /></td>
              <td><input type="number" v-model.number="salesForm.gwangup.totalAmount" class="sales-input" readonly />
              </td>
            </template>
            <template v-else>
              <td class="text-right">{{ formatNumber(salesData.gwangup.quantity) }}</td>
              <td class="text-right">{{ formatNumber(salesData.gwangup.avgUnitPrice) }}</td>
              <td class="text-right">{{ formatNumber(salesData.gwangup.amount) }}</td>
              <td class="text-right">{{ formatNumber(salesData.gwangup.vat) }}</td>
              <td class="text-right">{{ formatNumber(salesData.gwangup.totalAmount) }}</td>
            </template>
          </tr>

          <!-- 합계 (자동 계산) -->
          <tr class="total-row">
            <td class="div-label">합 계</td>
            <td class="text-right">{{ formatNumber(salesTotals.quantity) }}</td>
            <td class="text-right">{{ formatNumber(salesTotals.avgUnitPrice) }}</td>
            <td class="text-right">{{ formatNumber(salesTotals.amount) }}</td>
            <td class="text-right">{{ formatNumber(salesTotals.vat) }}</td>
            <td class="text-right">{{ formatNumber(salesTotals.totalAmount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. 주유량 요약 -->
    <div class="stat-card">
      <div class="table-caption">
        <span>주유량 ({{ selectedMonth }}월)</span>
        <div class="header-btns">
          <button v-if="!fuelEditMode" @click="enterFuelEdit" class="btn-edit-sales">✏️ 단가 입력</button>
          <template v-else>
            <button @click="saveFuelUnitPrice" class="btn-save-sales">💾 저장</button>
            <button @click="cancelFuelEdit" class="btn-cancel-sales">취소</button>
          </template>
        </div>
      </div>
      <table class="stat-table">
        <thead>
          <tr>
            <th>총 주유량 (L)</th>
            <th>단가 (원/L)</th>
            <th>총액 (원)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="total-row">
            <td class="text-right">{{ formatNumber(fuelSummary.totalLiters) }} L</td>
            <td class="text-right">
              <template v-if="fuelEditMode">
                <input type="number" v-model.number="fuelUnitPriceInput" class="sales-input" min="0" step="1" />
              </template>
              <template v-else>
                {{ formatNumber(fuelSummary.unitPrice) }}
              </template>
            </td>
            <td class="text-right">
              <template v-if="fuelEditMode">
                {{ formatNumber(Math.round((fuelSummary.totalLiters || 0) * (fuelUnitPriceInput || 0))) }}
              </template>
              <template v-else>
                {{ formatNumber(fuelSummary.totalAmount) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. 월별 자재 사용량 -->
    <div class="stat-card">
      <div class="table-caption">{{ selectedMonth }}월 자재 사용량</div>
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
      <div class="table-caption">{{ selectedMonth }}월 재고 현황</div>
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
      <div class="table-caption">원자재 단가</div>
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

const fuelSummary = ref({ totalLiters: 0, unitPrice: 0, totalAmount: 0 });
const fuelEditMode = ref(false);
const fuelUnitPriceInput = ref(0);

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

    const [prod, usage, stock, prices, fuel] = await Promise.all([
      api.post('/material/stock/dashboard/production', params),
      api.post('/material/stock/dashboard/material-usage', params),
      api.post('/material/stock/summary', params),
      api.post('/material/stock/dashboard/unit-prices'),
      api.post('/fuel/dashboard/monthly-summary', params)
    ]);

    production.value = prod.data || prod;
    materialUsage.value = usage.data || usage;
    stockSummary.value = stock.data || stock;
    unitPrices.value = prices.data || prices;
    fuelSummary.value = fuel.data || fuel;
    fuelUnitPriceInput.value = fuelSummary.value.unitPrice || 0;
    loadSales();
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
      { width: 18 },
      { width: 18 }   // ← 추가
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

    // ──────────────────────────────────────────────
    //  1. 레미콘 판매량
    // ──────────────────────────────────────────────
    const section1TitleRow = worksheet.getRow(currentRow);
    section1TitleRow.getCell(1).value = '레미콘 판매량';
    worksheet.mergeCells(currentRow, 1, currentRow, 6);  // ② 6열로 확장
    section1TitleRow.getCell(1).font = { size: 11, bold: true };
    section1TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    section1TitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    section1TitleRow.getCell(1).border = allBorders;
    section1TitleRow.height = 20;
    currentRow++;

    // 헤더: 구분 / 수량 / 평균단가 / 금액 / 부가세 / 총액
    const section1HeaderRow = worksheet.getRow(currentRow);
    ['구분', '수량', '평균단가', '금액', '부가세', '총액'].forEach((header, idx) => {
      const cell = section1HeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { size: 10, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorders;
    });
    section1HeaderRow.height = 20;
    currentRow++;

    // 사급 / 관급 / 합계 데이터 행 공통 헬퍼
    const writeSalesRow = (rowData, isBold = false, bgArgb = null) => {
      const row = worksheet.getRow(currentRow);
      rowData.forEach((value, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = value;
        cell.font = { size: 10, bold: isBold || idx === 0 };
        cell.alignment = { horizontal: idx === 0 ? 'center' : 'right', vertical: 'middle' };
        cell.border = allBorders;
        if (bgArgb) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        if (typeof value === 'number') cell.numFmt = '#,##0';
      });
      row.height = 20;
      currentRow++;
    };

    const sd = salesData.value;
    writeSalesRow([
      '사 급',
      Number(sd.sagup.quantity || 0),
      Number(sd.sagup.avgUnitPrice || 0),
      Number(sd.sagup.amount || 0),
      Number(sd.sagup.vat || 0),
      Number(sd.sagup.totalAmount || 0)
    ]);
    writeSalesRow([
      '관 급',
      Number(sd.gwangup.quantity || 0),
      Number(sd.gwangup.avgUnitPrice || 0),
      Number(sd.gwangup.amount || 0),
      Number(sd.gwangup.vat || 0),
      Number(sd.gwangup.totalAmount || 0)
    ]);

    const tot = salesTotals.value;
    writeSalesRow([
      '합 계',
      Number(tot.quantity || 0),
      Number(tot.avgUnitPrice || 0),
      Number(tot.amount || 0),
      Number(tot.vat || 0),
      Number(tot.totalAmount || 0)
    ], true, 'FFFFF2CC');

    // ③ 원가율 행 (자재비 / 총액)
    const totalMatAmt = Number(totalUsageAmount.value || 0);
    const totalSalesAmt = Number(tot.amount || 0);   // ← totalAmount → amount
const costRate = totalSalesAmt > 0
  ? totalMatAmt / totalSalesAmt * 100
  : 0;
    const isGood = costRate >= 55 && costRate <= 60;   // 55~60% 사이가 양호
const bgArgb = isGood ? 'FFE2EFDA' : 'FFFCE4D6';
const txtArgb = isGood ? 'FF375623' : 'FF843C0C';

    const marginRow = worksheet.getRow(currentRow);

    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    marginRow.getCell(1).value = `원가율 (금액 대비 자재비)  ※ 기준: 55~60% 사이이면 양호`
    marginRow.getCell(1).font = { size: 10, bold: true };
    marginRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    marginRow.getCell(1).border = allBorders;
    marginRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };

    marginRow.getCell(5).value = isGood ? '✅ 양호' : '⚠️ 미달';
    marginRow.getCell(5).font = { size: 10, bold: true, color: { argb: txtArgb } };
    marginRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    marginRow.getCell(5).border = allBorders;
    marginRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };

    marginRow.getCell(6).value = costRate / 100;
    marginRow.getCell(6).numFmt = '0.0%';
    marginRow.getCell(6).font = { size: 12, bold: true, color: { argb: txtArgb } };
    marginRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    marginRow.getCell(6).border = allBorders;
    marginRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    marginRow.height = 22;
    currentRow++;

    currentRow += 2; // 섹션 간 간격

    // ──────────────────────────────────────────────
    //  2. 월별 자재 사용량
    // ──────────────────────────────────────────────
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

    // ──────────────────────────────────────────────
    //  3. 월별 재고 현황
    // ──────────────────────────────────────────────
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

    // ──────────────────────────────────────────────
    //  4. 원자재 단가
    // ──────────────────────────────────────────────
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

const salesEditMode = ref(false)

const emptySales = () => ({
  quantity: 0, avgUnitPrice: 0, amount: 0, vat: 0, totalAmount: 0
})

const salesData = ref({ sagup: emptySales(), gwangup: emptySales() })
const salesForm = ref({ sagup: emptySales(), gwangup: emptySales() })

// 합계 computed
const salesTotals = computed(() => {
  const s = salesEditMode.value ? salesForm.value : salesData.value

  const qty = Number(s.sagup.quantity || 0) + Number(s.gwangup.quantity || 0)
  const amt = Number(s.sagup.amount || 0) + Number(s.gwangup.amount || 0)
  const vat = Number(s.sagup.vat || 0) + Number(s.gwangup.vat || 0)
  const total = Number(s.sagup.totalAmount || 0) + Number(s.gwangup.totalAmount || 0)

  const avg = qty > 0 ? Math.round(amt / qty) : 0

  // 👉 자재비 (이건 네가 가지고 있는 값으로 바꿔야 함)
  const materialCost = 0  // ← 여기에 자재비 넣어야 함

  // ✅ 원가율
  const costRate = amt > 0 ? materialCost / amt : 0

  return {
    quantity: qty,
    avgUnitPrice: avg,
    amount: amt,
    vat,
    totalAmount: total,
    costRate // 추가
  }
})
// 금액 자동계산: 수량 × 평균단가
const calcSales = (key) => {
  const row = salesForm.value[key]
  row.amount = Math.round((row.quantity || 0) * (row.avgUnitPrice || 0))
  row.totalAmount = row.amount + (row.vat || 0)
}

// 총액 자동계산: 금액 + 부가세
const calcTotal = (key) => {
  const row = salesForm.value[key]
  row.totalAmount = (row.amount || 0) + (row.vat || 0)
}

// 편집 진입 - 현재 데이터를 폼에 복사
const enterSalesEdit = () => {
  salesForm.value = {
    sagup: { ...salesData.value.sagup },
    gwangup: { ...salesData.value.gwangup }
  }
  salesEditMode.value = true
}

const cancelSalesEdit = () => {
  salesEditMode.value = false
}

const mapData = (src = {}) => ({
  quantity: Number(src.quantity || 0),
  avgUnitPrice: Number(src.avgUnitPrice || 0),
  amount: Number(src.amount || 0),
  vat: Number(src.vat || 0),
  totalAmount: Number(src.totalAmount || 0)
})

const loadSales = async () => {
  try {
    const res = await api.post('/material/stock/sales/list', {
      year: selectedYear.value,
      month: selectedMonth.value
    })

    const data = res
    console.log('판매량 데이터:', data)

    let sagup = {}
    let gwangup = {}

    // ✅ 1. 배열 형태 대응
    if (Array.isArray(data)) {
      sagup = data.find(d => d.divType === '사급') || {}
      gwangup = data.find(d => d.divType === '관급') || {}
    }
    // ✅ 2. 객체 형태 대응
    else {
      sagup = data.sagup || {}
      gwangup = data.gwangup || {}
    }

    // ✅ 3. 항상 동일 구조로 강제 변환
    salesForm.value = {
      sagup: mapData(sagup),
      gwangup: mapData(gwangup)
    }

    // ✅ 4. computed에서 사용하는 데이터 동기화
    salesData.value = {
      sagup: { ...salesForm.value.sagup },
      gwangup: { ...salesForm.value.gwangup }
    }

  } catch (e) {
    console.error('판매량 조회 오류:', e)

    // ❗ 에러나도 화면 안깨지게 초기화
    salesForm.value = {
      sagup: mapData(),
      gwangup: mapData()
    }
    salesData.value = {
      sagup: mapData(),
      gwangup: mapData()
    }
  }
}

// 저장
const saveSales = async () => {
  try {
    const payload = [
      { year: selectedYear.value, month: selectedMonth.value, divType: '사급', ...salesForm.value.sagup },
      { year: selectedYear.value, month: selectedMonth.value, divType: '관급', ...salesForm.value.gwangup }
    ]
    await api.post('/material/stock/sales/save', payload)
    salesData.value = {
      sagup: { ...salesForm.value.sagup },
      gwangup: { ...salesForm.value.gwangup }
    }
    salesEditMode.value = false
    loadSales()  // 저장 후 최신 데이터 재조회
  } catch (e) {
    console.error('판매량 저장 오류:', e)
    alert('저장 중 오류가 발생했습니다: ' + e.message)
  }
}

const enterFuelEdit = () => {
  fuelUnitPriceInput.value = fuelSummary.value.unitPrice || 0;
  fuelEditMode.value = true;
};

const cancelFuelEdit = () => {
  fuelEditMode.value = false;
};

const saveFuelUnitPrice = async () => {
  try {
    await api.post('/fuel/dashboard/unit-price/save', {
      year: selectedYear.value,
      month: selectedMonth.value,
      unitPrice: fuelUnitPriceInput.value
    });
    const fuel = await api.post('/fuel/dashboard/monthly-summary', {
      year: selectedYear.value,
      month: selectedMonth.value
    });
    fuelSummary.value = fuel.data || fuel;
    fuelEditMode.value = false;
  } catch (e) {
    alert('단가 저장 중 오류가 발생했습니다.');
  }
};

onMounted(loadData);
</script>

<style scoped>
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

.table-caption {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.header-btns {
  display: flex;
  gap: .5rem;
}

.btn-edit-sales {
  padding: .4rem 1rem;
  font-size: .875rem;
  font-weight: 600;
  background: #e8f0fe;
  color: #1a56db;
  border: 1px solid #c7d7f8;
  border-radius: .5rem;
  cursor: pointer;
}

.btn-edit-sales:hover {
  background: #c7d7f8;
}

.btn-save-sales {
  padding: .4rem 1rem;
  font-size: .875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: .5rem;
  cursor: pointer;
}

.btn-cancel-sales {
  padding: .4rem 1rem;
  font-size: .875rem;
  font-weight: 600;
  background: #e2e8f0;
  color: #64748b;
  border: none;
  border-radius: .5rem;
  cursor: pointer;
}

.sales-table .div-label {
  font-weight: 700;
  text-align: center;
}

.sales-input {
  width: 100%;
  min-width: 110px;
  padding: .3rem .5rem;
  font-size: .875rem;
  border: 1px solid #c8d8e8;
  border-radius: .375rem;
  text-align: right;
  box-sizing: border-box;
}

.sales-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.sales-input[readonly] {
  background: #f1f5f9;
  color: #64748b;
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
  display: block;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
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