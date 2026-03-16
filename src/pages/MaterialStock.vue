<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">원자재 재고 관리</h1>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tabs-section">
      <button class="tab-btn" :class="{ active: activeTab === 'incoming' }" @click="activeTab = 'incoming'">
        📥 입고 관리
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">
        📊 재고 현황
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">
        📈 월별 요약
      </button>
    </div>

    <!-- 입고 관리 탭 -->
    <div v-show="activeTab === 'incoming'">
      <!-- 입고 등록 카드 -->
      <div class="card-section">
        <div class="card-header">
          <h4 class="card-title">원자재 입고 등록</h4>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <label class="form-label">입고 일자</label>
              <div class="date-input-wrapper">
                <input type="date" v-model="incomingForm.workDate" class="form-control" @click="openDatePicker" />
                <i class="ni ni-calendar-grid-58 calendar-icon"></i>
              </div>
            </div>

            <div class="col-md-3">
              <label class="form-label">자재 종류 *</label>
              <div class="custom-select-wrapper">
                <select v-model="incomingForm.materialType" @change="onMaterialTypeChange" class="form-control">
                  <option value="">선택하세요</option>
                  <optgroup label="골재류">
                    <option value="G1">G1 (자갈 25mm)</option>
                    <option value="S1">S1 (샌드밀)</option>
                    <option value="S2">S2 (자갈 19mm)</option>
                  </optgroup>
                  <optgroup label="시멘트류">
                    <option value="C1">C1 (시멘트)</option>
                    <option value="C2">C2 (플라이애쉬)</option>
                    <option value="C3">C3 (슬래그)</option>
                  </optgroup>
                  <optgroup label="혼화제류">
                    <option value="AD1">AD1 (혼화제 1)</option>
                    <option value="AD2">AD2 (혼화제 2)</option>
                    <option value="AD3">AD3 (혼화제 3)</option>
                  </optgroup>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>

            <div class="col-md-3">
              <label class="form-label">공급업체</label>
              <input type="text" v-model="incomingForm.supplier" class="form-control" placeholder="공급업체명" />
            </div>

            <div class="col-md-3">
              <label class="form-label">{{ isAdmixture ? '입고 수량' : '차대수' }} *</label>
              <input type="number" v-model.number="incomingForm.truckCount" @input="calculateIncoming"
                class="form-control" :placeholder="isAdmixture ? '예: 100' : '예: 2'" />
            </div>
          </div>

          <div class="row mt-3" v-if="!isAdmixture">
            <div class="col-md-3">
              <label class="form-label">차량당 수량 (톤)</label>
              <input type="number" step="0.001" v-model.number="incomingForm.quantityPerTruck"
                @input="calculateIncoming" class="form-control" />
            </div>

            <div class="col-md-3">
              <label class="form-label">단가 (원/톤)</label>
              <input type="number" v-model.number="incomingForm.unitPrice" @input="calculateIncoming"
                class="form-control" />
            </div>

            <div class="col-md-3">
              <label class="form-label">총 입고량 (톤)</label>
              <input type="number" v-model.number="incomingForm.totalQuantity" class="form-control calculated-field"
                readonly />
            </div>

            <div class="col-md-3">
              <label class="form-label">총 금액 (원)</label>
              <input type="text" :value="formatNumber(incomingForm.totalPrice)"
                class="form-control calculated-field-price" readonly />
            </div>
          </div>

          <div class="row mt-3" v-else>
            <div class="col-md-3">
              <label class="form-label">단가 (원/L)</label>
              <input type="number" v-model.number="incomingForm.unitPrice" @input="calculateIncoming"
                class="form-control" />
            </div>

            <div class="col-md-3">
              <label class="form-label">총 입고량 (L)</label>
              <input type="number" v-model.number="incomingForm.totalQuantity" class="form-control calculated-field"
                readonly />
            </div>

            <div class="col-md-3">
              <label class="form-label">총 금액 (원)</label>
              <input type="text" :value="formatNumber(incomingForm.totalPrice)"
                class="form-control calculated-field-price" readonly />
            </div>
          </div>

          <div class="row mt-3">
            <div class="col-md-9">
              <label class="form-label">비고</label>
              <input type="text" v-model="incomingForm.memo" class="form-control" placeholder="비고사항을 입력하세요" />
            </div>

            <div class="col-md-3 d-flex align-items-end">
              <button @click="saveIncoming" class="btn-custom btn-primary btn-block">
                {{ incomingEditMode ? '수정' : '입고 등록' }}
              </button>
            </div>
          </div>

          <div class="row mt-2" v-if="incomingEditMode">
            <div class="col-md-12">
              <button @click="resetIncomingForm" class="btn-custom btn-secondary">
                취소
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 입고 내역 조회 카드 -->
      <div class="card-section mt-4">
        <div class="card-header">
          <h4 class="card-title">입고 내역 조회</h4>
        </div>
        <div class="card-body">
          <div class="filter-group">
            <div class="filter-item">
              <label class="form-label">년도</label>
              <input type="number" v-model.number="searchYear" class="form-control" />
            </div>
            <div class="filter-item">
              <label class="form-label">월</label>
              <input type="number" v-model.number="searchMonth" min="1" max="12" class="form-control" />
            </div>
            <div class="filter-item">
              <button @click="loadIncomingData" class="btn-custom btn-primary">
                조회
              </button>
            </div>
          </div>

          <div class="table-responsive mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">일자</th>
                  <th class="text-center">자재</th>
                  <th class="text-center">공급업체</th>
                  <th class="text-center">차대수/수량</th>
                  <th class="text-center">차량당 수량</th>
                  <th class="text-center">총 입고량</th>
                  <th class="text-center">단가</th>
                  <th class="text-center">총 금액</th>
                  <th class="text-center">비고</th>
                  <th class="text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="incomingList.length === 0">
                  <td colspan="10" class="empty-cell">
                    <p class="empty-message">입고 내역이 없습니다.</p>
                  </td>
                </tr>
                <tr v-for="item in incomingList" :key="item.incomingId" class="data-row">
                  <td class="text-center">{{ formatDate(item.workDate) }}</td>
                  <td class="text-center">{{ item.materialName }}</td>
                  <td>{{ item.supplier }}</td>
                  <td class="text-center">
                    <span v-if="isAdmixtureType(item.materialType)">
                      {{ formatNumber(item.truckCount) }}L
                    </span>
                    <span v-else>
                      {{ item.truckCount }}대
                    </span>
                  </td>
                  <td class="text-right">
                    <span v-if="!isAdmixtureType(item.materialType)">
                      {{ formatNumber(item.quantityPerTruck) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="text-right font-weight-bold">{{ formatNumber(item.totalQuantity) }}</td>
                  <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                  <td class="text-right font-weight-bold">{{ formatNumber(item.totalPrice) }}</td>
                  <td>{{ item.memo || '-' }}</td>
                  <td class="text-center">
                    <button @click="editIncoming(item)" class="btn-icon">✏️</button>
                    <button @click="deleteIncoming(item.incomingId)" class="btn-icon">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 재고 현황 탭 -->
    <div v-show="activeTab === 'stock'">
      <div class="card-section">
        <div class="card-header">
          <h4 class="card-title">재고 현황 조회</h4>
        </div>
        <div class="card-body">
          <div class="filter-group">
            <div class="filter-item">
              <label class="form-label">년도</label>
              <input type="number" v-model.number="searchYear" class="form-control" />
            </div>
            <div class="filter-item">
              <label class="form-label">월</label>
              <input type="number" v-model.number="searchMonth" min="1" max="12" class="form-control" />
            </div>
            <div class="filter-item">
              <button @click="loadStockData" class="btn-custom btn-primary">
                조회
              </button>
            </div>
          </div>

          <div class="table-responsive mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">일자</th>
                  <th class="text-center">자재</th>
                  <th class="text-center">입고</th>
                  <th class="text-center">출고</th>
                  <th class="text-center">현재고</th>
                  <th class="text-center">비고</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="stockList.length === 0">
                  <td colspan="6" class="empty-cell">
                    <p class="empty-message">재고 현황이 없습니다.</p>
                  </td>
                </tr>
                <tr v-for="item in stockList" :key="item.stockId" class="data-row">
                  <td class="text-center">{{ formatDate(item.workDate) }}</td>
                  <td class="text-center">{{ item.materialName }}</td>
                  <td class="text-right">
                    <span v-if="item.incomingQty > 0" class="text-success">
                      +{{ formatNumber(item.incomingQty) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="text-right">
                    <span v-if="item.outgoingQty > 0" class="text-danger">
                      -{{ formatNumber(item.outgoingQty) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="text-right font-weight-bold">
                    {{ formatNumber(item.currentStock) }}
                  </td>
                  <td>{{ item.memo || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 월별 요약 탭 -->
    <div v-show="activeTab === 'summary'">
      <!-- 전월이월 설정 카드 -->
      <div class="card-section">
        <div class="card-header">
          <h4 class="card-title">📝 전월이월 설정</h4>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <label class="form-label">년도</label>
              <input type="number" v-model.number="openingForm.year" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">월</label>
              <input type="number" v-model.number="openingForm.month" min="1" max="12" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">자재 종류 *</label>
              <div class="custom-select-wrapper">
                <select v-model="openingForm.materialType" class="form-control">
                  <option value="">선택하세요</option>
                  <optgroup label="골재류">
                    <option value="G1">G1 (자갈 25mm)</option>
                    <option value="S1">S1 (샌드밀)</option>
                    <option value="S2">S2 (자갈 19mm)</option>
                  </optgroup>
                  <optgroup label="시멘트류">
                    <option value="C1">C1 (시멘트)</option>
                    <option value="C2">C2 (플라이애쉬)</option>
                    <option value="C3">C3 (슬래그)</option>
                  </optgroup>
                  <optgroup label="혼화제류">
                    <option value="AD1">AD1 (혼화제 1)</option>
                    <option value="AD2">AD2 (혼화제 2)</option>
                    <option value="AD3">AD3 (혼화제 3)</option>
                  </optgroup>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label">전월이월 재고 *</label>
              <input type="number" step="0.001" v-model.number="openingForm.openingStock" class="form-control"
                placeholder="예: 150.500" />
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-md-12">
              <button @click="saveOpening" class="btn-custom btn-primary">
                💾 전월이월 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 월별 요약 카드 -->
      <div class="card-section mt-4">
        <div class="card-header">
          <h4 class="card-title">월별 재고 요약</h4>
        </div>
        <div class="card-body">
          <div class="filter-group">
            <div class="filter-item">
              <label class="form-label">년도</label>
              <input type="number" v-model.number="searchYear" class="form-control" />
            </div>
            <div class="filter-item">
              <label class="form-label">월</label>
              <input type="number" v-model.number="searchMonth" min="1" max="12" class="form-control" />
            </div>
            <div class="filter-item">
              <button @click="loadSummaryData" class="btn-custom btn-primary">
                조회
              </button>
            </div>
          </div>

          <div class="table-responsive mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">자재</th>
                  <th class="text-center">전월이월</th>
                  <th class="text-center">총 입고</th>
                  <th class="text-center">총 출고</th>
                  <th class="text-center">마감재고</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="summaryList.length === 0">
                  <td colspan="5" class="empty-cell">
                    <p class="empty-message">요약 데이터가 없습니다.</p>
                  </td>
                </tr>
                <tr v-for="item in summaryList" :key="item.materialType" class="data-row">
                  <td class="font-weight-bold">{{ item.materialName }}</td>
                  <td class="text-right">{{ formatNumber(item.openingStock) }}</td>
                  <td class="text-right text-success font-weight-bold">{{ formatNumber(item.totalIncoming) }}</td>
                  <td class="text-right text-danger font-weight-bold">{{ formatNumber(item.totalOutgoing) }}</td>
                  <td class="text-right font-weight-bold">{{ formatNumber(item.closingStock) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

const activeTab = ref('incoming');
const searchYear = ref(new Date().getFullYear());
const searchMonth = ref(new Date().getMonth() + 1);

const incomingForm = ref({
  incomingId: null,
  workDate: new Date().toISOString().split('T')[0],
  materialType: '',
  supplier: '',
  truckCount: 0,
  quantityPerTruck: 17.000,
  totalQuantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  memo: ''
});

const incomingEditMode = ref(false);
const incomingList = ref([]);
const stockList = ref([]);
const summaryList = ref([]);

// ✅ 서버에서 불러온 단가를 저장하는 ref (하드코딩 제거)
const defaultPrices = ref({});

// 공급업체·차량 용량은 서버 단가와 무관한 운영 정보이므로 별도 유지
const materialMeta = {
  'G1':  { supplier: '해광산업개발',    capacity: 17 },
  'S1':  { supplier: '해광산업개발',    capacity: 17 },
  'S2':  { supplier: '해광산업개발',    capacity: 17 },
  'C1':  { supplier: '성신양회',        capacity: 1  },
  'C2':  { supplier: '에이지산업',      capacity: 1  },
  'C3':  { supplier: '고려기초',        capacity: 1  },
  'AD1': { supplier: '혼화제 공급사 1', capacity: 1  },
  'AD2': { supplier: '혼화제 공급사 2', capacity: 1  },
  'AD3': { supplier: '혼화제 공급사 3', capacity: 1  },
};

// ✅ 대시보드와 동일한 API로 단가 로드
const loadUnitPrices = async () => {
  try {
    const response = await api.post('/material/stock/dashboard/unit-prices');
    const priceList = response.data || response || [];

    priceList.forEach(item => {
      const meta = materialMeta[item.materialType] || { supplier: '', capacity: 1 };
      defaultPrices.value[item.materialType] = {
        unitPrice: item.totalPrice,   // 단가 + 운반비 합계
        supplier:  meta.supplier,
        capacity:  meta.capacity,
      };
    });
  } catch (error) {
    console.error('단가 로드 오류:', error);
  }
};

const isAdmixture = computed(() => {
  return ['AD1', 'AD2', 'AD3'].includes(incomingForm.value.materialType);
});

const isAdmixtureType = (materialType) => {
  return ['AD1', 'AD2', 'AD3'].includes(materialType);
};

const openDatePicker = (event) => {
  event.target.showPicker?.();
};

const onMaterialTypeChange = () => {
  const materialType = incomingForm.value.materialType;
  const priceInfo = defaultPrices.value[materialType];

  if (priceInfo) {
    incomingForm.value.supplier         = priceInfo.supplier;
    incomingForm.value.unitPrice        = priceInfo.unitPrice;
    incomingForm.value.quantityPerTruck = priceInfo.capacity;

    if (isAdmixture.value) {
      incomingForm.value.truckCount = 0;
    }
    calculateIncoming();
  }
};

const calculateIncoming = () => {
  const trucks    = incomingForm.value.truckCount || 0;
  const unitPrice = incomingForm.value.unitPrice  || 0;

  if (isAdmixture.value) {
    incomingForm.value.totalQuantity = trucks;
    incomingForm.value.totalPrice    = trucks * unitPrice;
  } else {
    const qtyPerTruck = incomingForm.value.quantityPerTruck || 0;
    incomingForm.value.totalQuantity = trucks * qtyPerTruck;
    incomingForm.value.totalPrice    = trucks * qtyPerTruck * unitPrice;
  }
};

const saveIncoming = async () => {
  try {
    if (!incomingForm.value.workDate) {
      alert('입고 일자를 입력해주세요');
      return;
    }
    if (!incomingForm.value.materialType) {
      alert('자재 종류를 선택해주세요');
      return;
    }
    if (incomingForm.value.truckCount <= 0) {
      alert(isAdmixture.value ? '입고 수량을 입력해주세요' : '차대수를 입력해주세요');
      return;
    }

    const url = incomingEditMode.value
      ? '/material/stock/incoming/update'
      : '/material/stock/incoming/create';

    await api.post(url, incomingForm.value);
    alert(incomingEditMode.value ? '입고 내역이 수정되었습니다' : '입고 등록이 완료되었습니다');

    resetIncomingForm();
    loadIncomingData();
  } catch (error) {
    console.error('입고 저장 오류:', error);
    alert('입고 저장 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
  }
};

const editIncoming = (item) => {
  incomingForm.value = {
    incomingId:       item.incomingId,
    workDate:         item.workDate,
    materialType:     item.materialType,
    supplier:         item.supplier,
    truckCount:       item.truckCount,
    quantityPerTruck: item.quantityPerTruck,
    totalQuantity:    item.totalQuantity,
    unitPrice:        item.unitPrice,
    totalPrice:       item.totalPrice,
    memo:             item.memo || ''
  };
  incomingEditMode.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteIncoming = async (incomingId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  try {
    await api.post('/material/stock/incoming/delete', { incomingId });
    alert('삭제되었습니다');
    loadIncomingData();
  } catch (error) {
    console.error('삭제 오류:', error);
    alert('삭제 중 오류가 발생했습니다');
  }
};

const resetIncomingForm = () => {
  incomingForm.value = {
    incomingId:       null,
    workDate:         new Date().toISOString().split('T')[0],
    materialType:     '',
    supplier:         '',
    truckCount:       0,
    quantityPerTruck: 17.000,
    totalQuantity:    0,
    unitPrice:        0,
    totalPrice:       0,
    memo:             ''
  };
  incomingEditMode.value = false;
};

const loadIncomingData = async () => {
  try {
    const response = await api.post('/material/stock/incoming/monthly', {
      year:  searchYear.value,
      month: searchMonth.value
    });
    incomingList.value = response.data || response || [];
  } catch (error) {
    console.error('입고 내역 조회 오류:', error);
    incomingList.value = [];
  }
};

const loadStockData = async () => {
  try {
    const response = await api.post('/material/stock/monthly', {
      year:  searchYear.value,
      month: searchMonth.value
    });
    stockList.value = response.data || response || [];
  } catch (error) {
    console.error('재고 조회 오류:', error);
    stockList.value = [];
  }
};

const loadSummaryData = async () => {
  try {
    const response = await api.post('/material/stock/summary', {
      year:  searchYear.value,
      month: searchMonth.value
    });
    summaryList.value = response.data || response || [];
  } catch (error) {
    console.error('요약 조회 오류:', error);
    summaryList.value = [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatNumber = (value) => {
  if (!value || value === 0) return '0';
  return Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 3 });
};

const openingForm = ref({
  year:          new Date().getFullYear(),
  month:         new Date().getMonth() + 1,
  materialType:  '',
  openingStock:  0
});

const saveOpening = async () => {
  try {
    if (!openingForm.value.materialType) {
      alert('자재 종류를 선택해주세요');
      return;
    }
    if (!openingForm.value.openingStock || openingForm.value.openingStock < 0) {
      alert('전월이월 재고를 입력해주세요');
      return;
    }

    await api.post('/material/stock/opening/set', {
      year:         openingForm.value.year,
      month:        openingForm.value.month,
      materialType: openingForm.value.materialType,
      openingStock: openingForm.value.openingStock
    });

    alert('전월이월이 설정되었습니다');

    openingForm.value = {
      year:         openingForm.value.year,
      month:        openingForm.value.month,
      materialType: '',
      openingStock: 0
    };

    if (searchYear.value === openingForm.value.year &&
        searchMonth.value === openingForm.value.month) {
      loadSummaryData();
    }
  } catch (error) {
    console.error('전월이월 설정 오류:', error);
    alert('전월이월 설정 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
  }
};

onMounted(async () => {
  // ✅ 단가를 서버에서 먼저 불러온 뒤 입고 내역 조회
  await loadUnitPrices();
  loadIncomingData();
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
  color: #fdfdfd;
  margin: 0;
}

.tabs-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f8fafc;
  color: #3b82f6;
}

.tab-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
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

.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.col-md-3 {
  flex: 1;
  min-width: 200px;
}

.col-md-9 {
  flex: 3;
  min-width: 400px;
}

.col-md-12 {
  flex: 1;
  width: 100%;
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
  padding: 0.5rem 0.75rem;
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
}

.calendar-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #8898aa;
  pointer-events: none;
  font-size: 1.1rem;
}

.custom-select-wrapper select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
  padding-right: 2rem;
}

.custom-select-wrapper {
  position: relative;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
  font-size: 0.75rem;
}

.calculated-field {
  background: #fef3c7;
  font-weight: 700;
  color: #92400e;
  border-color: #fbbf24;
}

.calculated-field-price {
  background: #dcfce7;
  font-weight: 700;
  color: #166534;
  border-color: #4ade80;
  font-size: 1rem;
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

.btn-block {
  width: 100%;
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

.data-table tbody td {
  padding: 0.75rem 0.5rem;
  border: 1px solid #e2e8f0;
  vertical-align: middle;
}

.data-row:hover {
  background: #f8fafc;
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

.text-success {
  color: #10b981;
}

.text-danger {
  color: #ef4444;
}

.font-weight-bold {
  font-weight: 700;
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

.d-flex {
  display: flex;
}

.align-items-end {
  align-items: flex-end;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>