<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">레미콘 자재 현황 관리</h1>
    </div>

    <!-- 자재 입력 카드 -->
    <div class="card-section">
      <div class="card-header">
        <h4 class="card-title">자재 현황 입력</h4>
      </div>
      <div class="card-body">
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
            <label class="form-label">판매량 (루베)</label>
            <input type="number" step="0.001" v-model.number="form.salesVolume" class="form-control" />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-md-3">
            <label class="form-label">G1 (자갈25mm)</label>
            <input type="number" step="0.001" v-model.number="form.g1Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">S2 (자갈19mm)</label>
            <input type="number" step="0.001" v-model.number="form.s2Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">S1 (해광샌드밀)</label>
            <input type="number" step="0.001" v-model.number="form.s1Qty" class="form-control" />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-md-3">
            <label class="form-label">C1 (시멘트)</label>
            <input type="number" step="0.001" v-model.number="form.c1Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">C2 (플라이애쉬)</label>
            <input type="number" step="0.001" v-model.number="form.c2Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">C3 (슬래그)</label>
            <input type="number" step="0.001" v-model.number="form.c3Qty" class="form-control" />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-md-3">
            <label class="form-label">AD1 (혼화제1)</label>
            <input type="number" step="0.001" v-model.number="form.ad1Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">AD2 (혼화제2)</label>
            <input type="number" step="0.001" v-model.number="form.ad2Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">AD3 (혼화제3)</label>
            <input type="number" step="0.001" v-model.number="form.ad3Qty" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">비고</label>
            <input type="text" v-model="form.memo" class="form-control" />
          </div>
        </div>

        <div class="button-group mt-3">
          <button @click="saveMaterial" class="btn-custom btn-primary">
            {{ editMode ? '수정' : '등록' }}
          </button>
          <button v-if="editMode" @click="resetForm" class="btn-custom btn-secondary">
            취소
          </button>
        </div>
      </div>
    </div>

    <!-- 자재 현황 조회 카드 -->
    <div class="card-section mt-4">
      <div class="card-header">
        <h4 class="card-title">자재 현황 조회</h4>
      </div>
      <div class="card-body">
        <div class="filter-group">
          <div class="filter-item">
            <label class="form-label">년도</label>
            <input type="number" v-model.number="searchYear" class="form-control" />
          </div>
          <div class="filter-item">
            <label class="form-label">월</label>
            <input type="number" min="1" max="12" v-model.number="searchMonth" class="form-control" />
          </div>
          <div class="filter-item">
            <button @click="loadData" class="btn-custom btn-primary">조회</button>
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="data-table">
            <thead>
              <tr class="main-header">
                <th rowspan="2" class="text-center">날짜</th>
                <th rowspan="2" class="text-center">판매량<br/>(루베)</th>
                <th colspan="2" class="text-center">G1 (자갈25mm)</th>
                <th colspan="2" class="text-center">S2 (자갈19mm)</th>
                <th colspan="2" class="text-center">S1 (해광샌드밀)</th>
                <th colspan="2" class="text-center">C1 (시멘트)</th>
                <th colspan="2" class="text-center">C2 (플라이애쉬)</th>
                <th colspan="2" class="text-center">C3 (슬래그)</th>
                <th colspan="3" class="text-center">혼화제</th>
                <th rowspan="2" class="text-center">작업</th>
              </tr>
              <tr class="sub-header">
                <th class="text-center">수량</th>
                <th class="text-center">비율</th>
                <th class="text-center">수량</th>
                <th class="text-center">비율</th>
                <th class="text-center">수량</th>
                <th class="text-center">비율</th>
                <th class="text-center">수량</th>
                <th class="text-center">비율</th>
                <th class="text-center">수량</th>
                <th class="text-center">비율</th>
                <th class="text-center">수량</th>
                <th class="text-center">비율</th>
                <th class="text-center">AD1</th>
                <th class="text-center">AD2</th>
                <th class="text-center">AD3</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!materials || materials.length === 0">
                <td colspan="18" class="text-center empty-cell">
                  <p class="empty-message">조회된 데이터가 없습니다.</p>
                </td>
              </tr>
              <tr v-for="item in materials" :key="item.inventoryId" v-else class="data-row">
                <td class="text-center">{{ formatDate(item.workDate) }}</td>
                <td class="text-right">{{ formatNumber(item.salesVolume) }}</td>
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
                  <button @click="editItem(item)" class="btn-icon btn-edit">✏️</button>
                  <button @click="deleteItem(item.inventoryId)" class="btn-icon btn-delete">🗑️</button>
                </td>
              </tr>
              <tr v-if="materials && materials.length > 0" class="total-row">
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
      </div>
    </div>
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

const openDatePicker = (event) => {
  event.target.showPicker?.();
};

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

const loadData = async () => {
  try {
    const response = await api.post(`${API_URL}/monthly`, {
      year: searchYear.value,
      month: searchMonth.value
    });
    
    if (Array.isArray(response)) {
      materials.value = response;
    } else if (response.data && Array.isArray(response.data.data)) {
      materials.value = response.data.data;
    } else {
      console.warn('응답 데이터가 배열이 아닙니다:', response.data);
      materials.value = [];
    }
  } catch (error) {
    console.error('데이터 조회 실패:', error);
    materials.value = [];
    alert('데이터 조회 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
  }
};

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
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

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

const resetForm = () => {
  form.value = {
    inventoryId: null,
    workDate: new Date().toISOString().split('T')[0],
    salesVolume: 0,
    g1Qty: 0, s2Qty: 0, s1Qty: 0,
    c1Qty: 0, c2Qty: 0, c3Qty: 0,
    ad1Qty: 0, ad2Qty: 0, ad3Qty: 0,
    memo: ''
  };
  editMode.value = false;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatNumber = (value) => {
  if (!value || value === 0) return '';
  return Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 3 });
};

const formatRatio = (value) => {
  if (!value || value === 0) return '';
  return Number(value).toFixed(3);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-container {
  padding: 1.5rem;
  max-width: 1920px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.card-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-body {
  /* padding는 card-section에서 처리 */
}

.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.col-md-3 {
  flex: 1;
  min-width: 200px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  font-size: 0.9375rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  transition: all 0.2s ease;
}

.form-control:hover {
  border-color: #cbd5e1;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input {
  padding-right: 35px;
  cursor: pointer;
}

.calendar-icon {
  position: absolute;
  right: 10px;
  color: #8898aa;
  pointer-events: none;
  font-size: 1.1rem;
}

.date-input:hover ~ .calendar-icon,
.date-input:focus ~ .calendar-icon {
  color: #3b82f6;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.btn-custom {
  padding: 0.625rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #e2e8f0;
  color: #64748b;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.filter-item {
  flex: 0 0 auto;
  min-width: 120px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  padding: 0.75rem 0.5rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.main-header th {
  font-size: 0.9rem;
}

.sub-header th {
  font-size: 0.8rem;
  background: #f1f5f9;
}

.data-table tbody td {
  padding: 0.75rem 0.5rem;
  border: 1px solid #e2e8f0;
  vertical-align: middle;
}

.data-row:hover {
  background: #f8fafc;
}

.total-row {
  background: #f1f5f9 !important;
  font-weight: 700;
  color: #1e293b;
  border-top: 2px solid #cbd5e1 !important;
}

.empty-cell {
  padding: 3rem !important;
  text-align: center;
  background: #f8fafc;
}

.empty-message {
  color: #94a3b8;
  margin: 0;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>