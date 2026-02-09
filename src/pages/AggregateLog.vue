<template>
  <div class="content">
    <!-- 자재 입력 -->
    <card>
      <h4 slot="header" class="title">레미콘 자재 현황 관리</h4>
      
      <div class="row">
        <div class="col-md-3">
          <label class="form-label">작업 일자</label>
          <div class="date-input-wrapper">
            <input 
              type="date" 
              v-model="form.workDate" 
              class="form-control date-input"
              @click="openDatePicker"
            />
            <i class="ni ni-calendar-grid-58 calendar-icon"></i>
          </div>
        </div>
        <div class="col-md-3">
          <base-input label="판매량 (루베)" type="number" step="0.001" v-model.number="form.salesVolume"></base-input>
        </div>
      </div>

      <div class="row">
        <div class="col-md-3">
          <base-input label="G1 (자갈25mm)" type="number" step="0.001" v-model.number="form.g1Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="S2 (자갈19mm)" type="number" step="0.001" v-model.number="form.s2Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="S1 (해광샌드밀)" type="number" step="0.001" v-model.number="form.s1Qty"></base-input>
        </div>
      </div>

      <div class="row">
        <div class="col-md-3">
          <base-input label="C1 (시멘트)" type="number" step="0.001" v-model.number="form.c1Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="C2 (플라이애쉬)" type="number" step="0.001" v-model.number="form.c2Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="C3 (슬래그)" type="number" step="0.001" v-model.number="form.c3Qty"></base-input>
        </div>
      </div>

      <div class="row">
        <div class="col-md-3">
          <base-input label="AD1 (혼화제1)" type="number" step="0.001" v-model.number="form.ad1Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="AD2 (혼화제2)" type="number" step="0.001" v-model.number="form.ad2Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="AD3 (혼화제3)" type="number" step="0.001" v-model.number="form.ad3Qty"></base-input>
        </div>
        <div class="col-md-3">
          <base-input label="비고" v-model="form.memo"></base-input>
        </div>
      </div>

      <base-button type="info" @click="saveMaterial">{{ editMode ? '수정' : '등록' }}</base-button>
      <base-button v-if="editMode" type="default" @click="resetForm">취소</base-button>
    </card>

    <!-- 자재 현황 조회 -->
    <card class="mt-4">
      <h4 slot="header" class="title">자재 현황 조회</h4>
      
      <div class="row mb-3">
        <div class="col-md-2">
          <base-input label="년도" type="number" v-model.number="searchYear"></base-input>
        </div>
        <div class="col-md-2">
          <base-input label="월" type="number" min="1" max="12" v-model.number="searchMonth"></base-input>
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <base-button type="primary" @click="loadData">조회</base-button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered table-hover material-table">
          <thead>
            <tr class="main-header">
              <th rowspan="2" class="text-center align-middle">날짜</th>
              <th rowspan="2" class="text-center align-middle header-sales">판매량<br/>(루베)</th>
              <th colspan="2" class="text-center header-aggregate">G1 (자갈25mm)</th>
              <th colspan="2" class="text-center header-aggregate">S2 (자갈19mm)</th>
              <th colspan="2" class="text-center header-aggregate">S1 (해광샌드밀)</th>
              <th colspan="2" class="text-center header-cement">C1 (시멘트)</th>
              <th colspan="2" class="text-center header-cement">C2 (플라이애쉬)</th>
              <th colspan="2" class="text-center header-cement">C3 (슬래그)</th>
              <th colspan="3" class="text-center header-admixture">혼화제</th>
              <th rowspan="2" class="text-center align-middle">작업</th>
            </tr>
            <tr class="sub-header">
              <th class="text-center sub-aggregate">수량</th>
              <th class="text-center sub-aggregate">비율</th>
              <th class="text-center sub-aggregate">수량</th>
              <th class="text-center sub-aggregate">비율</th>
              <th class="text-center sub-aggregate">수량</th>
              <th class="text-center sub-aggregate">비율</th>
              <th class="text-center sub-cement">수량</th>
              <th class="text-center sub-cement">비율</th>
              <th class="text-center sub-cement">수량</th>
              <th class="text-center sub-cement">비율</th>
              <th class="text-center sub-cement">수량</th>
              <th class="text-center sub-cement">비율</th>
              <th class="text-center sub-admixture">AD1</th>
              <th class="text-center sub-admixture">AD2</th>
              <th class="text-center sub-admixture">AD3</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!materials || materials.length === 0">
              <td colspan="18" class="text-center py-4">
                <p class="mb-0 text-muted">조회된 데이터가 없습니다.</p>
              </td>
            </tr>
            <tr v-for="item in materials" :key="item.inventoryId" v-else>
              <td class="text-center">{{ formatDate(item.workDate) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(item.salesVolume) }}</td>
              <td class="text-right">{{ formatNumber(item.g1Qty) }}</td>
              <td class="text-right">{{ formatRatio(item.g1Ratio) }}</td>
              <td class="text-right">{{ formatNumber(item.s2Qty) }}</td>
              <td class="text-right">{{ formatRatio(item.s2Ratio) }}</td>
              <td class="text-right">{{ formatNumber(item.s1Qty) }}</td>
              <td class="text-right">{{ formatRatio(item.s1Ratio) }}</td>
              <td class="text-right">{{ formatNumber(item.c1Qty) }}</td>
              <td class="text-right">{{ formatRatio(item.c1Ratio) }}</td>
              <td class="text-right">{{ formatNumber(item.c2Qty) }}</td>
              <td class="text-right">{{ formatRatio(item.c2Ratio) }}</td>
              <td class="text-right">{{ formatNumber(item.c3Qty) }}</td>
              <td class="text-right">{{ formatRatio(item.c3Ratio) }}</td>
              <td class="text-right">{{ formatNumber(item.ad1Qty) }}</td>
              <td class="text-right">{{ formatNumber(item.ad2Qty) }}</td>
              <td class="text-right">{{ formatNumber(item.ad3Qty) }}</td>
              <td class="text-center">
                <base-button type="warning" size="sm" @click="editItem(item)">수정</base-button>
                <base-button type="danger" size="sm" @click="deleteItem(item.inventoryId)">삭제</base-button>
              </td>
            </tr>
            <tr v-if="materials && materials.length > 0" class="table-active font-weight-bold">
              <td class="text-center">합계</td>
              <td class="text-right">{{ formatNumber(totals.salesVolume) }}</td>
              <td class="text-right">{{ formatNumber(totals.g1Qty) }}</td>
              <td class="text-right">{{ formatRatio(totals.g1Ratio) }}</td>
              <td class="text-right">{{ formatNumber(totals.s2Qty) }}</td>
              <td class="text-right">{{ formatRatio(totals.s2Ratio) }}</td>
              <td class="text-right">{{ formatNumber(totals.s1Qty) }}</td>
              <td class="text-right">{{ formatRatio(totals.s1Ratio) }}</td>
              <td class="text-right">{{ formatNumber(totals.c1Qty) }}</td>
              <td class="text-right">{{ formatRatio(totals.c1Ratio) }}</td>
              <td class="text-right">{{ formatNumber(totals.c2Qty) }}</td>
              <td class="text-right">{{ formatRatio(totals.c2Ratio) }}</td>
              <td class="text-right">{{ formatNumber(totals.c3Qty) }}</td>
              <td class="text-right">{{ formatRatio(totals.c3Ratio) }}</td>
              <td class="text-right">{{ formatNumber(totals.ad1Qty) }}</td>
              <td class="text-right">{{ formatNumber(totals.ad2Qty) }}</td>
              <td class="text-right">{{ formatNumber(totals.ad3Qty) }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

const API_URL = '/material/inventory';

const form = ref({
  inventoryId: null,
  workDate: new Date().toISOString().split('T')[0],
  salesVolume: 0,
  g1Qty: 0, s2Qty: 0, s1Qty: 0,
  c1Qty: 0, c2Qty: 0, c3Qty: 0,
  ad1Qty: 0, ad2Qty: 0, ad3Qty: 0,
  memo: ''
});

const materials = ref([]);
const searchYear = ref(new Date().getFullYear());
const searchMonth = ref(new Date().getMonth() + 1);
const editMode = ref(false);
const editId = ref(null);

// 날짜 선택기 열기
const openDatePicker = (event) => {
  event.target.showPicker?.();
};

// 합계 계산
const totals = computed(() => {
  if (!materials.value || !Array.isArray(materials.value)) {
    return {
      salesVolume: 0,
      g1Qty: 0, g1Ratio: 0, s2Qty: 0, s2Ratio: 0, s1Qty: 0, s1Ratio: 0,
      c1Qty: 0, c1Ratio: 0, c2Qty: 0, c2Ratio: 0, c3Qty: 0, c3Ratio: 0,
      ad1Qty: 0, ad2Qty: 0, ad3Qty: 0
    };
  }
  
  return materials.value.reduce((acc, item) => {
    acc.salesVolume += item.salesVolume || 0;
    acc.g1Qty += item.g1Qty || 0;
    acc.g1Ratio += item.g1Ratio || 0;
    acc.s2Qty += item.s2Qty || 0;
    acc.s2Ratio += item.s2Ratio || 0;
    acc.s1Qty += item.s1Qty || 0;
    acc.s1Ratio += item.s1Ratio || 0;
    acc.c1Qty += item.c1Qty || 0;
    acc.c1Ratio += item.c1Ratio || 0;
    acc.c2Qty += item.c2Qty || 0;
    acc.c2Ratio += item.c2Ratio || 0;
    acc.c3Qty += item.c3Qty || 0;
    acc.c3Ratio += item.c3Ratio || 0;
    acc.ad1Qty += item.ad1Qty || 0;
    acc.ad2Qty += item.ad2Qty || 0;
    acc.ad3Qty += item.ad3Qty || 0;
    return acc;
  }, {
    salesVolume: 0,
    g1Qty: 0, g1Ratio: 0, s2Qty: 0, s2Ratio: 0, s1Qty: 0, s1Ratio: 0,
    c1Qty: 0, c1Ratio: 0, c2Qty: 0, c2Ratio: 0, c3Qty: 0, c3Ratio: 0,
    ad1Qty: 0, ad2Qty: 0, ad3Qty: 0
  });
});

// 자재 저장
const saveMaterial = async () => {
  try {
    if (editMode.value) {
      await api.post(`${API_URL}/update`, form.value);
      alert('자재 현황이 수정되었습니다.');
    } else {
      await api.post(`${API_URL}/create`, form.value);
      alert('자재 현황이 등록되었습니다.');
    }
    resetForm();
    loadData();
  } catch (error) {
    alert('저장 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
  }
};

// 데이터 조회
const loadData = async () => {
  try {
    const response = await api.post(`${API_URL}/monthly`, {
      year: searchYear.value,
      month: searchMonth.value
    });
    
    // 응답 데이터가 배열인지 확인
    if (Array.isArray(response)) {
      materials.value = response;
    } else if (response.data && Array.isArray(response.data.data)) {
      // 중첩된 data 구조인 경우
      materials.value = response.data.data;
    } else {
      // 배열이 아닌 경우 빈 배열로 초기화
      console.warn('응답 데이터가 배열이 아닙니다:', response.data);
      materials.value = [];
    }
  } catch (error) {
    console.error('데이터 조회 실패:', error);
    materials.value = []; // 에러 발생 시 빈 배열로 초기화
    alert('데이터 조회 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
  }
};

// 수정
const editItem = (item) => {
  form.value = {
    inventoryId: item.inventoryId,
    workDate: item.workDate,
    salesVolume: item.salesVolume,
    g1Qty: item.g1Qty, s2Qty: item.s2Qty, s1Qty: item.s1Qty,
    c1Qty: item.c1Qty, c2Qty: item.c2Qty, c3Qty: item.c3Qty,
    ad1Qty: item.ad1Qty, ad2Qty: item.ad2Qty, ad3Qty: item.ad3Qty,
    memo: item.memo || ''
  };
  editMode.value = true;
  editId.value = item.inventoryId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 삭제
const deleteItem = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  try {
    await api.post(`${API_URL}/delete`, { inventoryId: id });
    alert('삭제되었습니다.');
    loadData();
  } catch (error) {
    alert('삭제 중 오류가 발생했습니다.');
  }
};

// 폼 초기화
const resetForm = () => {
  form.value = {
    inventoryId: null,
    work_date: new Date().toISOString().split('T')[0],
    sales_volume: 0,
    g1Qty: 0, s2Qty: 0, s1Qty: 0,
    c1Qty: 0, c2Qty: 0, c3Qty: 0,
    ad1Qty: 0, ad2Qty: 0, ad3Qty: 0,
    memo: ''
  };
  editMode.value = false;
  editId.value = null;
};

// 날짜 포맷
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// 숫자 포맷
const formatNumber = (value) => {
  if (!value || value === 0) return '';
  return Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 3 });
};

// 비율 포맷
const formatRatio = (value) => {
  if (!value || value === 0) return '';
  return Number(value).toFixed(3);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 날짜 입력 래퍼 */
.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* 날짜 입력 필드 스타일 개선 */
.date-input {
  padding-right: 35px;
  cursor: pointer;
  font-size: 0.875rem;
  height: 40px;
  border: 1px solid #d2d6da;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in;
}

.date-input:hover {
  border-color: #5e72e4;
}

.date-input:focus {
  border-color: #5e72e4;
  outline: 0;
  box-shadow: 0 3px 9px rgba(50, 50, 9, 0.05), 3px 4px 8px rgba(94, 114, 228, 0.1);
}

/* 달력 아이콘 */
.calendar-icon {
  position: absolute;
  right: 10px;
  color: #8898aa;
  pointer-events: none;
  font-size: 1.1rem;
}

.date-input:hover ~ .calendar-icon,
.date-input:focus ~ .calendar-icon {
  color: #5e72e4;
}

/* 폼 레이블 */
.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #344767;
}

/* 날짜 입력 필드 캘린더 버튼 스타일 개선 (Webkit 브라우저) */
.date-input::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 10px;
  cursor: pointer;
  opacity: 0;
  width: 20px;
  height: 20px;
}

.date-input::-webkit-inner-spin-button,
.date-input::-webkit-clear-button {
  display: none;
}

/* 테이블 기본 스타일 */
.material-table {
  font-size: 0.9rem;
}

.material-table th,
.material-table td {
  padding: 10px 8px;
  vertical-align: middle;
  border: 1px solid #dee2e6;
}

/* 메인 헤더 스타일 */
.main-header th {
  font-weight: 700;
  font-size: 0.95rem;
  border: 2px solid #495057;
  padding: 12px 8px;
}

/* 서브 헤더 스타일 */
.sub-header th {
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid #adb5bd;
}

/* 서브 헤더 - 골재류 */
.sub-aggregate {
  background-color: #ffb74d !important;
  color: #000 !important;
}

/* 서브 헤더 - 시멘트류 */
.sub-cement {
  background-color: #42a5f5 !important;
  color: #fff !important;
}

/* 서브 헤더 - 혼화제 */
.sub-admixture {
  background-color: #66bb6a !important;
  color: #fff !important;
}

/* 골재류 헤더 (주황/노랑 계열) */
.header-aggregate {
  background-color: #ff9800 !important;
  color: #000 !important;
}

/* 시멘트류 헤더 (파랑 계열) */
.header-cement {
  background-color: #2196f3 !important;
  color: #fff !important;
}

/* 혼화제 헤더 (초록 계열) */
.header-admixture {
  background-color: #4caf50 !important;
  color: #fff !important;
}

/* 판매량 헤더 (보라 계열) */
.header-sales {
  background-color: #9c27b0 !important;
  color: #fff !important;
  font-size: 0.9rem;
  font-weight: 700;
}

/* 날짜, 작업 컬럼 */
.main-header th:first-child,
.main-header th:last-child {
  background-color: #6c757d !important;
  color: #fff !important;
}

/* 합계 행 스타일 */
.table-active {
  background-color: #383838 !important;
  color: #000 !important;  /* 검정색 글씨로 변경 */
  font-weight: 700 !important;
  border-top: 3px solid #495057 !important;
}

.text-right { 
  text-align: right; 
}

/* 호버 효과 */
.material-table tbody tr:hover {
  background-color: #686868;
}
</style>