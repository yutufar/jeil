<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🪨 골재 운반비 입력</h1>
    </div>

    <!-- 필터 섹션 -->
    <div class="control-section">
      <div class="filter-group">
        <div class="filter-item">
          <label class="form-label">연도</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedYear" @change="loadData" class="custom-select">
              <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
        <div class="filter-item">
          <label class="form-label">월</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedMonth" @change="loadData" class="custom-select">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
        <div class="filter-item">
          <label class="form-label">차량번호 검색</label>
          <input type="text" v-model="filterCarNum" class="custom-input" placeholder="예) 7211" />
        </div>
        <div class="filter-item">
          <button @click="openAddModal" class="btn-custom btn-primary">➕ 골재 운반비 입력</button>
        </div>
        <div class="filter-item">
          <button @click="exportToExcel" class="btn-custom btn-export" :disabled="rawDeliveries.length === 0"
            :class="{ 'btn-disabled': rawDeliveries.length === 0 }">
            📄 세금계산서 엑셀
          </button>
        </div>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon" style="background:#fef3c7"><span style="font-size:1.5rem">💰</span></div>
        <div class="stat-content">
          <div class="stat-label">총 합계금액</div>
          <div class="stat-value">{{ formatNumber(grandTotal) }}원</div>
          <div class="stat-sub">공급가 + 부가세</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#dbeafe"><span style="font-size:1.5rem">🏗️</span></div>
        <div class="stat-content">
          <div class="stat-label">총 공급가액</div>
          <div class="stat-value">{{ formatNumber(grandSupply) }}원</div>
          <div class="stat-sub">부가세 제외</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#d1fae5"><span style="font-size:1.5rem">📦</span></div>
        <div class="stat-content">
          <div class="stat-label">총 수량</div>
          <div class="stat-value">{{ formatNumber(grandQuantity) }}</div>
          <div class="stat-sub">전체 합산 (루베)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#ede9fe"><span style="font-size:1.5rem">🔢</span></div>
        <div class="stat-content">
          <div class="stat-label">총 대수</div>
          <div class="stat-value">{{ formatNumber(grandTrip) }}대</div>
          <div class="stat-sub">1대 = 17루베</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fce7f3"><span style="font-size:1.5rem">🚛</span></div>
        <div class="stat-content">
          <div class="stat-label">부가세</div>
          <div class="stat-value">{{ formatNumber(grandVat) }}원</div>
          <div class="stat-sub">10%</div>
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div class="view-tabs">
      <button class="view-tab" :class="{ active: viewMode === 'date' }" @click="viewMode = 'date'">
        📅 날짜별 보기
      </button>
      <button class="view-tab" :class="{ active: viewMode === 'car' }" @click="viewMode = 'car'">
        🚛 차량별 보기
      </button>
    </div>

    <!-- ===== 날짜별 보기 ===== -->
    <div v-if="viewMode === 'date'" class="table-section">
      <div class="section-title">
        <h3>📅 {{ selectedYear }}년 {{ selectedMonth }}월 — 날짜별 입고 현황</h3>
      </div>
      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>로딩 중...</p></div>
      <div v-else-if="dateGroups.length === 0" class="empty-state">데이터가 없습니다</div>
      <div v-else class="table-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>입고일</th>
              <th>차량번호</th>
              <th v-for="mat in MATERIALS" :key="mat.code">{{ mat.label }}<br/><small>(차/루베)</small></th>
              <th>소계<br/><small>(루베)</small></th>
              <th>공급가액</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="dg in dateGroups">
              <tr v-for="(carRow, ci) in dg.cars" :key="dg.date + '_' + carRow.carNum" class="data-row">
                <td v-if="ci === 0" :rowspan="dg.cars.length" class="date-group-cell">
                  {{ dg.date }}
                </td>
                <td class="center-cell vehicle-cell">{{ carRow.carNum }}</td>
                <td v-for="mat in MATERIALS" :key="mat.code" class="number-cell">
                  <template v-if="getCarItemTrip(carRow, mat.code) > 0">
                    <span class="trip-val">{{ getCarItemTrip(carRow, mat.code) }}차</span>
                    <span class="qty-val">{{ formatNumber(getCarItemQty(carRow, mat.code)) }}</span>
                  </template>
                  <span v-else class="text-dim">-</span>
                </td>
                <td class="number-cell highlight">{{ formatNumber(carRow.totalQty) }}</td>
                <td class="number-cell">{{ formatNumber(carRow.totalSupply) }}원</td>
                <td class="center-cell">
                  <button @click="openEditModal(carRow.carNum, dg.date)" class="btn-icon" title="수정">✏️</button>
                  <button @click="deleteByDate(dg.date, carRow.carNum)" class="btn-icon" title="삭제">🗑️</button>
                </td>
              </tr>
              <!-- 일 합계 -->
              <tr class="subtotal-row" :key="dg.date + '_subtotal'">
                <td class="subtotal-label">{{ dg.date }} 합계</td>
                <td v-for="mat in MATERIALS" :key="mat.code" class="number-cell subtotal-val">
                  {{ formatNumber(dg.matTrip[mat.code]) }}차 / {{ formatNumber(dg.matQty[mat.code]) }}
                </td>
                <td class="number-cell subtotal-val">{{ formatNumber(dg.totalQty) }}</td>
                <td class="number-cell subtotal-val">{{ formatNumber(dg.totalSupply) }}원</td>
                <td></td>
              </tr>
            </template>
          </tbody>
          <tfoot v-if="dateGroups.length > 0">
            <tr class="total-row">
              <td class="total-label" :colspan="2">합계</td>
              <td v-for="mat in MATERIALS" :key="mat.code" class="total-value">
                {{ formatNumber(rawDeliveries.filter(r=>r.materialType===mat.code).reduce((s,r)=>s+(Number(r.tripCount)||0),0)) }}차
              </td>
              <td class="total-value">{{ formatNumber(grandQuantity) }}</td>
              <td class="total-value">{{ formatNumber(grandSupply) }}원</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ===== 차량별 보기 ===== -->
    <div v-if="viewMode === 'car'" class="table-section">
      <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
        <h3>🚛 {{ selectedYear }}년 {{ selectedMonth }}월 — 차량별 운반비 내역</h3>
        <div class="filter-inline">
          <input type="text" v-model="filterCarNum" class="custom-input" placeholder="차량번호 검색" style="width:160px" />
        </div>
      </div>
      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>로딩 중...</p></div>
      <div v-else-if="deliveryGroups.length === 0" class="empty-state">데이터가 없습니다</div>
      <div v-else class="table-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>차량</th>
              <th>입고일</th>
              <th>구분</th>
              <th>대수</th>
              <th>수량(루베)</th>
              <th>단가</th>
              <th>공급가액</th>
              <th>부가세</th>
              <th>합계</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, gi) in deliveryGroups">
              <!-- 각 날짜별 재료 행 -->
              <template v-for="(dateEntry, di) in group.dates">
                <tr v-for="(mat, mi) in MATERIALS" :key="group.carNum + '_' + dateEntry.date + '_' + mat.code" class="data-row">
                  <!-- 번호: 차량 전체에 걸쳐 rowspan -->
                  <td v-if="di === 0 && mi === 0"
                      :rowspan="group.dates.reduce((s,d)=>s+MATERIALS.length+1,0) + 1"
                      class="center-cell group-num">
                    {{ gi + 1 }}
                  </td>
                  <!-- 차량번호: 차량 전체 rowspan -->
                  <td v-if="di === 0 && mi === 0"
                      :rowspan="group.dates.reduce((s,d)=>s+MATERIALS.length+1,0) + 1"
                      class="center-cell vehicle-cell">
                    {{ group.carNum }}
                  </td>
                  <!-- 날짜: 해당 날짜의 재료 수만큼 rowspan -->
                  <td v-if="mi === 0" :rowspan="MATERIALS.length" class="center-cell date-col">
                    {{ dateEntry.date }}
                  </td>
                  <td class="material-label">{{ mat.label }}</td>
                  <td class="number-cell">
                    {{ getCarItemTrip(dateEntry, mat.code) > 0 ? getCarItemTrip(dateEntry, mat.code) + '차' : '-' }}
                  </td>
                  <td class="number-cell">
                    {{ getCarItemQty(dateEntry, mat.code) > 0 ? formatNumber(getCarItemQty(dateEntry, mat.code)) : '-' }}
                  </td>
                  <td class="number-cell">{{ formatNumber(mat.unitPrice) }}</td>
                  <td class="number-cell">
                    {{ getCarItemSupply(dateEntry, mat.code) > 0 ? formatNumber(getCarItemSupply(dateEntry, mat.code)) : '-' }}
                  </td>
                  <td class="number-cell">
                    {{ getCarItemVat(dateEntry, mat.code) > 0 ? formatNumber(getCarItemVat(dateEntry, mat.code)) : '-' }}
                  </td>
                  <td class="number-cell highlight">
                    {{ getCarItemTotal(dateEntry, mat.code) > 0 ? formatNumber(getCarItemTotal(dateEntry, mat.code)) : '-' }}
                  </td>
                  <!-- 날짜 단위 관리 버튼: 첫 번째 재료 행에만 -->
                  <td v-if="mi === 0" :rowspan="MATERIALS.length" class="center-cell">
                    <button @click="openEditModal(group.carNum, dateEntry.date)" class="btn-icon" title="수정">✏️</button>
                    <button @click="deleteByDate(dateEntry.date, group.carNum)" class="btn-icon" title="삭제">🗑️</button>
                  </td>
                </tr>
                <!-- 날짜 소계 -->
                <tr class="subtotal-row date-subtotal" :key="group.carNum + '_' + dateEntry.date + '_subtotal'">
                  <td class="subtotal-label">{{ dateEntry.date }} 소계</td>
                  <td class="number-cell subtotal-val">{{ formatNumber(dateEntry.totalTrip) }}차</td>
                  <td class="number-cell subtotal-val">{{ formatNumber(dateEntry.totalQty) }}</td>
                  <td class="center-cell">-</td>
                  <td class="number-cell subtotal-val">{{ formatNumber(dateEntry.totalSupply) }}</td>
                  <td class="number-cell subtotal-val">{{ formatNumber(dateEntry.totalVat) }}</td>
                  <td class="number-cell subtotal-val">{{ formatNumber(dateEntry.totalAmount) }}</td>
                  <td></td>
                </tr>
              </template>
              <!-- 차량 월 소계 -->
              <tr class="car-total-row" :key="group.carNum + '_total'">
                <td class="subtotal-label" colspan="2">{{ group.carNum }} 월 합계</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalTrip) }}차</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalQty) }}</td>
                <td class="center-cell">-</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalSupply) }}</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalVat) }}</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalAmount) }}</td>
                <td class="center-cell">
                  <button @click="deleteAllForCar(group.carNum)" class="btn-icon" title="차량 전체 삭제">🗑️전체</button>
                </td>
              </tr>
            </template>
            <!-- 전체 합계 -->
            <tr class="total-row">
              <td colspan="4" class="total-label">합계</td>
              <td class="total-value">{{ formatNumber(grandTrip) }}차</td>
              <td class="total-value">{{ formatNumber(grandQuantity) }}</td>
              <td class="center-cell">-</td>
              <td class="total-value">{{ formatNumber(grandSupply) }}</td>
              <td class="total-value">{{ formatNumber(grandVat) }}</td>
              <td class="total-value">{{ formatNumber(grandTotal) }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>🪨 {{ modal.isEdit ? '골재 운반비 수정' : '골재 운반비 입력' }}</h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">

          <div class="form-row-two">
            <!-- 입고일 — 최상단 공통 날짜 -->
            <div class="mb-3">
              <label class="form-label">입고일 *</label>
              <input type="date" v-model="modal.workDate" class="custom-input date-input-large"
                :disabled="modal.isEdit" />
              <div v-if="modal.isEdit" class="input-hint edit-hint">날짜는 수정할 수 없습니다</div>
            </div>
            <!-- 차량번호 -->
            <div class="mb-3">
              <label class="form-label">차량번호 *</label>
              <input type="text" v-model="modal.carNum" class="custom-input carnum-input"
                placeholder="예) 7211" :disabled="modal.isEdit" />
              <div v-if="!modal.isEdit" class="input-hint">숫자 4자리를 입력하세요</div>
              <div v-else class="input-hint edit-hint">차량번호는 수정할 수 없습니다</div>
            </div>
          </div>

          <div class="trip-notice">
            <span>📌 대수 입력 시 수량 자동 계산 <strong>(1대 = 17루베)</strong></span>
          </div>

          <table class="modal-material-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>단가</th>
                <th>대수 입력</th>
                <th>수량(루베) <span class="auto-badge">자동</span></th>
                <th>공급가액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mat in MATERIALS" :key="mat.code">
                <td class="mat-label-cell">{{ mat.label }}</td>
                <td class="mat-price-cell">{{ formatNumber(mat.unitPrice) }}원</td>
                <td class="mat-trip-cell">
                  <input type="number" v-model.number="modal.items[mat.code].tripCount" @input="calcItem(mat.code)"
                    min="0" class="mat-input" placeholder="0" />
                  <span class="trip-unit">차</span>
                </td>
                <td class="mat-qty-cell">
                  <template v-if="modal.items[mat.code].tripCount > 0">
                    <span class="qty-formula">{{ modal.items[mat.code].tripCount }}차 × 17 =</span>
                    <span class="qty-result">{{ formatNumber(modal.items[mat.code].quantity) }}루베</span>
                  </template>
                  <span v-else class="qty-empty">-</span>
                </td>
                <td class="mat-supply-cell">{{ formatNumber(modal.items[mat.code].supplyAmount) }}원</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="modal-total-row">
                <td colspan="2">합계</td>
                <td>{{ formatNumber(modalTotalTrip) }}대</td>
                <td>{{ formatNumber(modalTotalQty) }}루베</td>
                <td>{{ formatNumber(modalTotalSupply) }}원</td>
              </tr>
              <tr class="modal-total-row">
                <td colspan="2">부가세 (10%)</td>
                <td colspan="2">-</td>
                <td>{{ formatNumber(modalTotalVat) }}원</td>
              </tr>
              <tr class="modal-grand-row">
                <td colspan="2">최종 합계</td>
                <td colspan="2">-</td>
                <td>{{ formatNumber(modalGrandTotal) }}원</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="modal-footer">
          <button v-if="modal.isEdit" @click="deleteFromModal" class="btn-custom btn-danger">🗑️ 삭제</button>
          <button @click="closeModal" class="btn-custom btn-secondary">취소</button>
          <button @click="saveModal" class="btn-custom btn-success">💾 저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import ExcelJS from 'exceljs'

const QTY_PER_TRIP = 17

const MATERIALS = [
  { code: '자갈25MM',   label: '자갈25MM',    unitPrice: 5000 },
  { code: '해광샌드밀', label: '해광 샌드밀', unitPrice: 5000 },
]

const selectedYear  = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const filterCarNum  = ref('')
const rawDeliveries = ref([])
const loading       = ref(false)
const showModal     = ref(false)
const modal         = ref({})
const viewMode      = ref('date') // 'date' | 'car'

const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

// ── 날짜별 그룹 ────────────────────────────────────────────────────
const dateGroups = computed(() => {
  const map = {}
  rawDeliveries.value.forEach(r => {
    const date = r.workDate || 'unknown'
    if (!map[date]) {
      map[date] = { date, cars: {}, matTrip: {}, matQty: {}, totalTrip: 0, totalQty: 0, totalSupply: 0, totalVat: 0, totalAmount: 0 }
      MATERIALS.forEach(m => { map[date].matTrip[m.code] = 0; map[date].matQty[m.code] = 0 })
    }
    const dg = map[date]
    if (!dg.cars[r.carNum]) {
      dg.cars[r.carNum] = { carNum: r.carNum, items: {}, totalTrip: 0, totalQty: 0, totalSupply: 0, totalVat: 0, totalAmount: 0 }
    }
    const cg = dg.cars[r.carNum]
    cg.items[r.materialType] = r
    cg.totalTrip    += Number(r.tripCount)    || 0
    cg.totalQty     += Number(r.quantity)     || 0
    cg.totalSupply  += Number(r.supplyAmount) || 0
    cg.totalVat     += Number(r.vat)          || 0
    cg.totalAmount  += Number(r.totalAmount)  || 0

    dg.matTrip[r.materialType] = (dg.matTrip[r.materialType] || 0) + (Number(r.tripCount) || 0)
    dg.matQty[r.materialType]  = (dg.matQty[r.materialType]  || 0) + (Number(r.quantity)  || 0)
    dg.totalTrip   += Number(r.tripCount)    || 0
    dg.totalQty    += Number(r.quantity)     || 0
    dg.totalSupply += Number(r.supplyAmount) || 0
    dg.totalVat    += Number(r.vat)          || 0
    dg.totalAmount += Number(r.totalAmount)  || 0
  })
  return Object.values(map)
    .map(dg => ({ ...dg, cars: Object.values(dg.cars).sort((a,b) => a.carNum.localeCompare(b.carNum)) }))
    .sort((a, b) => a.date.localeCompare(b.date))
})

// ── 차량별 그룹 ────────────────────────────────────────────────────
const allDeliveryGroups = computed(() => {
  const map = {}
  rawDeliveries.value.forEach(r => {
    if (!map[r.carNum]) {
      map[r.carNum] = { carNum: r.carNum, dates: {}, totalTrip: 0, totalQty: 0, totalSupply: 0, totalVat: 0, totalAmount: 0 }
    }
    const car = map[r.carNum]
    const dateKey = r.workDate || 'unknown'
    if (!car.dates[dateKey]) {
      car.dates[dateKey] = { date: dateKey, items: {}, totalTrip: 0, totalQty: 0, totalSupply: 0, totalVat: 0, totalAmount: 0 }
    }
    const dg = car.dates[dateKey]
    dg.items[r.materialType] = r
    dg.totalTrip   += Number(r.tripCount)    || 0
    dg.totalQty    += Number(r.quantity)     || 0
    dg.totalSupply += Number(r.supplyAmount) || 0
    dg.totalVat    += Number(r.vat)          || 0
    dg.totalAmount += Number(r.totalAmount)  || 0

    car.totalTrip   += Number(r.tripCount)    || 0
    car.totalQty    += Number(r.quantity)     || 0
    car.totalSupply += Number(r.supplyAmount) || 0
    car.totalVat    += Number(r.vat)          || 0
    car.totalAmount += Number(r.totalAmount)  || 0
  })
  return Object.values(map)
    .map(car => ({
      ...car,
      dates: Object.values(car.dates).sort((a,b) => a.date.localeCompare(b.date))
    }))
    .sort((a, b) => a.carNum.localeCompare(b.carNum, 'ko-KR'))
})

const deliveryGroups = computed(() => {
  if (!filterCarNum.value.trim()) return allDeliveryGroups.value
  return allDeliveryGroups.value.filter(g => g.carNum.includes(filterCarNum.value.trim()))
})

// ── 총계 ──────────────────────────────────────────────────────────
const grandTrip     = computed(() => rawDeliveries.value.reduce((s,r) => s + (Number(r.tripCount)    || 0), 0))
const grandQuantity = computed(() => rawDeliveries.value.reduce((s,r) => s + (Number(r.quantity)     || 0), 0))
const grandSupply   = computed(() => rawDeliveries.value.reduce((s,r) => s + (Number(r.supplyAmount) || 0), 0))
const grandVat      = computed(() => rawDeliveries.value.reduce((s,r) => s + (Number(r.vat)          || 0), 0))
const grandTotal    = computed(() => rawDeliveries.value.reduce((s,r) => s + (Number(r.totalAmount)  || 0), 0))

// ── 아이템 헬퍼 ───────────────────────────────────────────────────
const getCarItemTrip   = (group, code) => Number(group.items?.[code]?.tripCount)    || 0
const getCarItemQty    = (group, code) => Number(group.items?.[code]?.quantity)     || 0
const getCarItemSupply = (group, code) => Number(group.items?.[code]?.supplyAmount) || 0
const getCarItemVat    = (group, code) => Number(group.items?.[code]?.vat)          || 0
const getCarItemTotal  = (group, code) => Number(group.items?.[code]?.totalAmount)  || 0

// ── 모달 계산 ─────────────────────────────────────────────────────
const modalTotalTrip   = computed(() => MATERIALS.reduce((s,m) => s + (modal.value.items?.[m.code]?.tripCount   || 0), 0))
const modalTotalQty    = computed(() => MATERIALS.reduce((s,m) => s + (modal.value.items?.[m.code]?.quantity    || 0), 0))
const modalTotalSupply = computed(() => MATERIALS.reduce((s,m) => s + (modal.value.items?.[m.code]?.supplyAmount|| 0), 0))
const modalTotalVat    = computed(() => Math.round(modalTotalSupply.value * 0.1))
const modalGrandTotal  = computed(() => modalTotalSupply.value + modalTotalVat.value)

const formatNumber = n => (n ? Number(n).toLocaleString('ko-KR') : '0')

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const makeEmptyItems = () => {
  const items = {}
  MATERIALS.forEach(m => {
    items[m.code] = { quantity: 0, tripCount: 0, supplyAmount: 0, unitPrice: m.unitPrice }
  })
  return items
}

const calcItem = (code) => {
  const item = modal.value.items[code]
  const mat  = MATERIALS.find(m => m.code === code)
  item.quantity     = (item.tripCount || 0) * QTY_PER_TRIP
  item.supplyAmount = item.quantity * (mat?.unitPrice || 0)
}

const openAddModal = () => {
  modal.value = { isEdit: false, workDate: todayStr(), carNum: '', items: makeEmptyItems() }
  showModal.value = true
}

const openEditModal = (carNum, workDate) => {
  const items = makeEmptyItems()
  // rawDeliveries에서 해당 차량+날짜 데이터 로드
  rawDeliveries.value
    .filter(r => r.carNum === carNum && r.workDate === workDate)
    .forEach(r => {
      items[r.materialType] = {
        quantity:     Number(r.quantity)     || 0,
        tripCount:    Number(r.tripCount)    || 0,
        supplyAmount: Number(r.supplyAmount) || 0,
        unitPrice:    Number(r.unitPrice)    || MATERIALS.find(m=>m.code===r.materialType)?.unitPrice || 0,
      }
    })
  modal.value = { isEdit: true, workDate, carNum, items }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; modal.value = {} }

const saveModal = async () => {
  const carNum   = (modal.value.carNum || '').trim()
  const workDate = (modal.value.workDate || '').trim()
  if (!carNum)   { alert('차량번호를 입력해주세요'); return }
  if (!workDate) { alert('입고일을 선택해주세요');   return }

  if (!modal.value.isEdit) {
    // 같은 날짜 + 차량이 이미 있으면 경고
    const exists = rawDeliveries.value.some(r => r.carNum === carNum && r.workDate === workDate)
    if (exists) {
      const ok = confirm(`${workDate}에 ${carNum} 차량 데이터가 이미 있습니다.\n덮어쓰시겠습니까?`)
      if (!ok) return
    }
  }

  if (!MATERIALS.some(m => (modal.value.items[m.code].tripCount || 0) > 0)) {
    alert('최소 1개 재료의 대수를 입력해주세요'); return
  }

  try {
    await api.post('/goljae/delivery/save', {
      workYear:  selectedYear.value,
      workMonth: selectedMonth.value,
      workDate,
      carNum,
      items: MATERIALS.map(m => ({
        materialType: m.code,
        tripCount:    modal.value.items[m.code].tripCount    || 0,
        quantity:     modal.value.items[m.code].quantity     || 0,
        unitPrice:    m.unitPrice,
        supplyAmount: modal.value.items[m.code].supplyAmount || 0,
        vat:          Math.round((modal.value.items[m.code].supplyAmount || 0) * 0.1),
        totalAmount:  Math.round((modal.value.items[m.code].supplyAmount || 0) * 1.1),
      }))
    })
    await loadData()
    closeModal()
    alert('저장되었습니다')
  } catch (error) {
    console.error('저장 오류:', error)
    alert('저장 오류: ' + (error.response?.data?.message || error.message))
  }
}

const deleteFromModal = async () => {
  if (!confirm(`${modal.value.workDate} / ${modal.value.carNum} 데이터를 삭제하시겠습니까?`)) return
  await deleteByDate(modal.value.workDate, modal.value.carNum)
  closeModal()
}

const deleteByDate = async (workDate, carNum) => {
  if (!confirm(`${workDate} / ${carNum} 데이터를 삭제하시겠습니까?`)) return
  try {
    await api.post('/goljae/delivery/delete-date', {
      workYear: selectedYear.value, workMonth: selectedMonth.value, workDate, carNum
    })
    await loadData()
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 오류: ' + (error.response?.data?.message || error.message))
  }
}

const deleteAllForCar = async (carNum) => {
  if (!confirm(`차량 ${carNum}의 ${selectedMonth.value}월 전체 데이터를 삭제하시겠습니까?`)) return
  try {
    await api.post('/goljae/delivery/delete', {
      workYear: selectedYear.value, workMonth: selectedMonth.value, carNum
    })
    await loadData()
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 오류: ' + (error.response?.data?.message || error.message))
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.post('/goljae/delivery/list', { year: selectedYear.value, month: selectedMonth.value })
    rawDeliveries.value = res.data || res
  } catch (error) {
    console.error('데이터 조회 오류:', error)
    alert('데이터 조회 오류: ' + error.message)
  } finally {
    loading.value = false
  }
}

// ── 엑셀 (기존 로직 유지) ─────────────────────────────────────────
const exportToExcel = async () => {
  if (rawDeliveries.value.length === 0) { alert('다운로드할 데이터가 없습니다'); return }
  try {
    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('골재운반비')
    const year = selectedYear.value, month = selectedMonth.value

    ws.columns = [
      { width: 7 }, { width: 10 }, { width: 12 }, { width: 10 },
      { width: 8 }, { width: 11 }, { width: 9 }, { width: 13 }, { width: 12 }, { width: 13 },
    ]
    ws.pageSetup = {
      paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.7, bottom: 0.7, header: 0.3, footer: 0.3 }
    }

    const bd = (s='thin') => ({ top:{style:s}, bottom:{style:s}, left:{style:s}, right:{style:s} })
    const nf = '#,##0'
    const ctr = { horizontal:'center', vertical:'middle' }
    const rgt = { horizontal:'right',  vertical:'middle' }
    const lft = { horizontal:'left',   vertical:'middle' }
    const ab  = (cell, s='thin') => { cell.border = bd(s) }
    const H_BG='FF203864', S_BG='FFD9E1F2', T_BG='FFFFD966', TL_BG='FF1F4E79', E_BG='FFF5F9FF'

    ws.mergeCells('A1:J1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `${year}년 ${month}월 골재 운반비`
    titleCell.font = { bold:true, size:16, color:{argb:'FFFFFFFF'} }
    titleCell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:TL_BG} }
    titleCell.alignment = ctr
    ws.getRow(1).height = 36

    const hr = ws.getRow(2)
    ;['번호','차량','구분','입고일','대수','수량(루베)','단가','공급가액','부가세','합계'].forEach((h,i) => {
      const c = hr.getCell(i+1)
      c.value = h; c.font = {bold:true,size:11,color:{argb:'FFFFFFFF'}}
      c.fill = {type:'pattern',pattern:'solid',fgColor:{argb:H_BG}}; c.alignment=ctr; ab(c,'medium')
    })
    hr.height = 24

    let cr = 3
    allDeliveryGroups.value.forEach((group, gi) => {
      const gsr = cr
      const isEven = gi % 2 === 0
      const bg = isEven ? E_BG : 'FFFFFFFF'

      group.dates.forEach(dateEntry => {
        MATERIALS.forEach(mat => {
          const row = ws.getRow(cr)
          const trip = getCarItemTrip(dateEntry, mat.code)
          const qty  = getCarItemQty(dateEntry, mat.code)
          const sup  = getCarItemSupply(dateEntry, mat.code)
          const vat  = getCarItemVat(dateEntry, mat.code)
          const tot  = getCarItemTotal(dateEntry, mat.code)
          const sc = (col, val, fmt, align) => {
            const c = row.getCell(col)
            c.value = val; c.font={size:10}
            c.fill = {type:'pattern',pattern:'solid',fgColor:{argb:bg}}
            c.alignment = align||rgt; if (fmt&&val) c.numFmt=fmt; ab(c)
          }
          sc(3, mat.label,         null, lft)
          sc(4, dateEntry.date,    null, ctr)
          sc(5, trip>0?trip:null,  nf)
          sc(6, qty>0?qty:null,    nf)
          sc(7, mat.unitPrice,     nf)
          sc(8, sup>0?sup:null,    nf)
          sc(9, vat>0?vat:null,    nf)
          sc(10,tot>0?tot:null,    nf)
          row.height = 18; cr++
        })
      })

      // 소계
      const sr = ws.getRow(cr)
      ;[[3,'소계',null,ctr],[4,null,null,ctr],[5,group.totalTrip,nf,rgt],[6,group.totalQty,nf,rgt],
        [7,null,null,ctr],[8,group.totalSupply,nf,rgt],[9,group.totalVat,nf,rgt],[10,group.totalAmount,nf,rgt]]
      .forEach(([col,val,fmt,align]) => {
        const c = sr.getCell(col); c.value=val; c.font={bold:true,size:10}
        c.fill={type:'pattern',pattern:'solid',fgColor:{argb:S_BG}}; c.alignment=align
        if (fmt&&val) c.numFmt=fmt; ab(c,'medium')
      })
      sr.height = 20

      // 번호/차량 병합 (gsr ~ cr 전체)
      ws.mergeCells(gsr, 1, cr, 1)
      const nc = ws.getCell(gsr, 1)
      nc.value = gi+1; nc.font={bold:true,size:13,color:{argb:'FF1F4E79'}}
      nc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD6E4F0'}}; nc.alignment=ctr; ab(nc,'medium')
      ws.mergeCells(gsr, 2, cr, 2)
      const cc = ws.getCell(gsr, 2)
      cc.value = group.carNum; cc.font={bold:true,size:12}
      cc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD6E4F0'}}; cc.alignment=ctr; ab(cc,'medium')
      cr++
    })

    // 합계 행
    ws.mergeCells(cr,1,cr,4)
    const tlc = ws.getCell(cr,1)
    tlc.value='합계'; tlc.font={bold:true,size:12,color:{argb:'FF92400E'}}
    tlc.fill={type:'pattern',pattern:'solid',fgColor:{argb:T_BG}}; tlc.alignment=ctr; ab(tlc,'medium')
    ;[[5,grandTrip.value],[6,grandQuantity.value],[7,null],[8,grandSupply.value],[9,grandVat.value],[10,grandTotal.value]]
    .forEach(([col,val]) => {
      const c = ws.getCell(cr,col); c.value=val
      c.font={bold:true,size:12,color:{argb:val?'FFC00000':'FF000000'}}
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:T_BG}}; c.alignment=rgt
      if (val) c.numFmt=nf; ab(c,'medium')
    })
    ws.getRow(cr).height=26; cr++

    // 월 총계
    cr+=2
    ws.mergeCells(cr,1,cr,7)
    const mtc = ws.getCell(cr,1)
    mtc.value=`${String(month).padStart(2,'0')}월 총계`
    mtc.font={bold:true,size:14,color:{argb:'FFFFFFFF'}}
    mtc.fill={type:'pattern',pattern:'solid',fgColor:{argb:TL_BG}}; mtc.alignment=ctr
    ws.getRow(cr).height=30; cr++
    ;['구분','차수','수량','단가','공급가액','부가세','합계'].forEach((h,i)=>{
      const c=ws.getCell(cr,i+1); c.value=h; c.font={bold:true,size:10,color:{argb:'FFFFFFFF'}}
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:H_BG}}; c.alignment=ctr; ab(c,'medium')
    })
    ws.getRow(cr).height=22; cr++

    MATERIALS.forEach((mat,mi) => {
      const all = rawDeliveries.value.filter(r=>r.materialType===mat.code)
      const matT=all.reduce((s,r)=>s+(Number(r.tripCount)||0),0)
      const matQ=all.reduce((s,r)=>s+(Number(r.quantity)||0),0)
      const matS=all.reduce((s,r)=>s+(Number(r.supplyAmount)||0),0)
      const matV=all.reduce((s,r)=>s+(Number(r.vat)||0),0)
      const matA=all.reduce((s,r)=>s+(Number(r.totalAmount)||0),0)
      if (matQ===0) return
      const bg = mi%2===0?E_BG:'FFFFFFFF'
      const row=ws.getRow(cr)
      ;[[1,mat.label,null,lft],[2,matT,nf,rgt],[3,matQ,nf,rgt],[4,mat.unitPrice,nf,rgt],
        [5,matS,nf,rgt],[6,matV,nf,rgt],[7,matA,nf,rgt]]
      .forEach(([col,val,fmt,align])=>{
        const c=row.getCell(col); c.value=val; c.font={size:10}
        c.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}}; c.alignment=align
        if (fmt) c.numFmt=fmt; ab(c)
      })
      row.height=20; cr++
    })

    const sumT=rawDeliveries.value.reduce((s,r)=>s+(Number(r.tripCount)||0),0)
    const sumQ=rawDeliveries.value.reduce((s,r)=>s+(Number(r.quantity)||0),0)
    const sumS=rawDeliveries.value.reduce((s,r)=>s+(Number(r.supplyAmount)||0),0)
    const sumV=rawDeliveries.value.reduce((s,r)=>s+(Number(r.vat)||0),0)
    const sumA=rawDeliveries.value.reduce((s,r)=>s+(Number(r.totalAmount)||0),0)
    ;[[1,'합계',null,ctr],[2,sumT,nf,rgt],[3,sumQ,nf,rgt],[4,null,null,ctr],
      [5,sumS,nf,rgt],[6,sumV,nf,rgt],[7,sumA,nf,rgt]]
    .forEach(([col,val,fmt,align])=>{
      const c=ws.getCell(cr,col); c.value=val
      c.font={bold:true,size:11,color:{argb:val==='합계'?'FF92400E':'FFC00000'}}
      c.fill={type:'pattern',pattern:'solid',fgColor:{argb:T_BG}}; c.alignment=align
      if (fmt&&val) c.numFmt=fmt; ab(c,'medium')
    })
    ws.getRow(cr).height=26; cr++

    cr++
    ws.mergeCells(cr,1,cr,7)
    const noteCell=ws.getCell(cr,1)
    noteCell.value='*  비고란에 덤프번호와 계좌번호 꼭 기입해주세요. (팩스 041-931-4357)'
    noteCell.font={bold:true,size:10,color:{argb:'FFC00000'}}
    noteCell.alignment={horizontal:'left',vertical:'middle'}
    ws.getRow(cr).height=22

    const buf = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href=url; link.download=`골재운반비_${year}년${month}월.xlsx`; link.click()
    window.URL.revokeObjectURL(url)
    alert('골재 운반비 세금계산서 엑셀이 다운로드되었습니다')
  } catch (error) {
    console.error('엑셀 오류:', error)
    alert('엑셀 다운로드 오류: ' + error.message)
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; }
.page-header { margin-bottom: .75rem; }
.page-title  { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0; }

.control-section {
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
  margin-bottom: .75rem;
}

.filter-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
.filter-item  { flex: 1; min-width: 150px; }
.filter-inline { display: flex; align-items: center; }

.form-label { font-size: .875rem; font-weight: 600; color: #64748b; margin-bottom: .5rem; display: block; }

.custom-select-wrapper { position: relative; }
.custom-select {
  width: 100%; font-size: .9375rem; border: 1px solid #e2e8f0; border-radius: .5rem;
  background: white; color: #334155; appearance: none; cursor: pointer; padding: .5rem 2rem .5rem .75rem;
}
.custom-select:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.select-arrow { position:absolute; right:1rem; top:50%; transform:translateY(-50%); pointer-events:none; color:#64748b; font-size:.75rem; }

.custom-input {
  width: 100%; font-size: .9375rem; border: 1px solid #e2e8f0; border-radius: .5rem;
  background: white; color: #334155; padding: .5rem .75rem; box-sizing: border-box;
}
.custom-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }

.stats-section {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: .75rem; margin-bottom: .75rem;
}
.stat-card { background: white; border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); display: flex; align-items: center; gap: .75rem; }
.stat-icon { width: 50px; height: 50px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-label { font-size: .75rem; color: #64748b; }
.stat-value { font-size: 1.3rem; font-weight: 700; color: #1e293b; }
.stat-sub   { font-size: .75rem; color: #94a3b8; margin-top: .25rem; }

/* 탭 */
.view-tabs {
  display: flex; gap: .5rem; margin-bottom: .75rem;
}
.view-tab {
  padding: .6rem 1.5rem; font-size: .9375rem; font-weight: 600;
  border: 1px solid #e2e8f0; border-radius: .5rem;
  background: white; color: #64748b; cursor: pointer; transition: all .2s;
}
.view-tab:hover { border-color: #f59e0b; color: #f59e0b; }
.view-tab.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: transparent; color: white;
  box-shadow: 0 2px 8px rgba(245,158,11,.3);
}

.table-section {
  background: white; border-radius: 1rem; padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
.section-title h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; }
.table-wrapper { overflow-x: auto; }

.delivery-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.delivery-table thead th {
  background: linear-gradient(135deg, #1e3a5f, #203864); color: white;
  font-weight: 700; padding: .75rem .5rem; text-align: center;
  border: 1px solid #2d4e7e; white-space: nowrap;
}
.delivery-table tbody td { padding: .625rem .5rem; border: 1px solid #e2e8f0; text-align: center; }
.delivery-table tfoot td { padding: .625rem .5rem; border: 1px solid #e2e8f0; }

.data-row:hover td { background: #f8fafc; }

.date-group-cell {
  background: #f0f9ff !important; font-weight: 700; color: #0369a1;
  font-size: .9rem; border-right: 3px solid #0ea5e9 !important;
}
.vehicle-cell { font-weight: 700; font-size: 1rem; color: #1e293b; background: #d6e4f0 !important; }
.group-num   { font-weight: 700; font-size: 1.1rem; color: #1f4e79; background: #d6e4f0 !important; }
.material-label { text-align: left; padding-left: 1rem; color: #334155; }
.date-col { font-size: .82rem; color: #334155; white-space: nowrap; background: #f0f9ff !important; }

.number-cell { text-align: right; padding-right: .75rem; font-weight: 500; }
.highlight   { color: #92400e; font-weight: 700; }
.center-cell { text-align: center; }
.text-dim    { color: #cbd5e1; }

.trip-val { font-size: .8rem; color: #1e40af; font-weight: 700; display: block; }
.qty-val  { font-size: .8rem; color: #334155; display: block; }

.subtotal-row td { background: #dbeafe; font-weight: 700; border-top: 2px solid #93c5fd; border-bottom: 2px solid #93c5fd; }
.subtotal-label  { text-align: center; color: #1e40af; }
.subtotal-val    { text-align: right; padding-right: .75rem; color: #1e40af; }
.date-subtotal td { background: #eff6ff; }

.car-total-row td { background: #bfdbfe; font-weight: 700; border-top: 2px solid #3b82f6; border-bottom: 2px solid #3b82f6; }

.total-row td  { background: linear-gradient(135deg, #fef3c7, #fde68a); font-weight: 700; border-top: 3px solid #f59e0b; }
.total-label   { text-align: center; color: #92400e; font-size: 1rem; }
.total-value   { text-align: right; padding-right: .75rem; color: #dc2626; font-size: 1.05rem; }

.loading-state { text-align: center; padding: 3rem; color: #64748b; }
.empty-state   { text-align: center; padding: 3rem; color: #94a3b8; }
.spinner {
  width: 40px; height: 40px; margin: 0 auto 1rem;
  border: 4px solid #f1f5f9; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn-custom {
  padding: .625rem 1.5rem; font-size: .9375rem; font-weight: 600;
  border: none; border-radius: .5rem; cursor: pointer; transition: all .2s;
}
.btn-primary  { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; }
.btn-primary:hover  { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,.4); }
.btn-export   { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-export:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,.4); }
.btn-success  { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-secondary { background: #e2e8f0; color: #64748b; }
.btn-danger   { background: #ef4444; color: white; }
.btn-disabled { background: #e2e8f0 !important; color: #94a3b8 !important; cursor: not-allowed !important; }
.btn-icon {
  background: none; border: none; cursor: pointer; padding: .25rem; font-size: .9rem; transition: all .2s;
}
.btn-icon:hover { transform: scale(1.2); }

/* 모달 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-content {
  background: white; border-radius: 1rem; width: 95%; max-width: 640px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1);
}
.modal-header {
  padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.125rem; }
.close-btn { background: none; border: none; cursor: pointer; padding: .5rem; border-radius: .5rem; color: #64748b; font-size: 1.25rem; }
.close-btn:hover { background: #f1f5f9; }
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; border-top: 1px solid #e2e8f0; }

.form-row-two { display: flex; gap: 1rem; }
.form-row-two > div { flex: 1; }
.mb-3 { margin-bottom: 1rem; }

.date-input-large {
  font-size: 1.1rem; font-weight: 700; color: #0369a1;
  border: 2px solid #0ea5e9 !important; text-align: center; padding: .6rem !important;
}
.date-input-large:disabled { background: #f0f9ff; cursor: not-allowed; }

.carnum-input {
  font-size: 1.25rem !important; font-weight: 700; letter-spacing: 3px;
  border: 2px solid #3b82f6 !important; text-align: center; padding: .75rem !important; color: #1e40af;
}
.carnum-input:disabled { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0 !important; cursor: not-allowed; }
.input-hint { font-size: .75rem; color: #94a3b8; margin-top: .375rem; }
.edit-hint  { color: #f59e0b !important; }

.trip-notice {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: .5rem;
  padding: .5rem .75rem; margin-bottom: .75rem; font-size: .875rem; color: #1e40af;
}

.modal-material-table { width: 100%; border-collapse: collapse; font-size: .9rem; margin-top: 1rem; }
.modal-material-table thead th {
  background: #1e3a5f; color: white; padding: .625rem .5rem; text-align: center; border: 1px solid #2d4e7e;
}
.modal-material-table tbody td { padding: .5rem; border: 1px solid #e2e8f0; }
.mat-label-cell  { font-weight: 600; color: #334155; }
.mat-price-cell  { text-align: right; color: #64748b; }
.mat-trip-cell   { display: flex; align-items: center; gap: .35rem; justify-content: center; }
.trip-unit       { font-size: .85rem; color: #64748b; font-weight: 600; }
.mat-qty-cell    { text-align: center; padding: .4rem .5rem; background: #f0fdf4; }
.qty-formula     { font-size: .72rem; color: #94a3b8; display: block; line-height: 1.4; }
.qty-result      { font-size: .95rem; font-weight: 700; color: #059669; display: block; }
.qty-empty       { color: #cbd5e1; }
.mat-supply-cell { text-align: right; font-weight: 600; color: #92400e; }
.mat-input { width: 80px; padding: .375rem .5rem; border: 1px solid #e2e8f0; border-radius: .375rem; text-align: right; font-size: .9rem; }
.mat-input:focus { outline: none; border-color: #f59e0b; }

.auto-badge { background: #10b981; color: white; font-size: .65rem; padding: .1rem .35rem; border-radius: .25rem; margin-left: .25rem; font-weight: 600; }

.modal-total-row td { background: #dbeafe; font-weight: 600; text-align: center; padding: .5rem; border: 1px solid #93c5fd; }
.modal-grand-row td { background: #fef3c7; font-weight: 700; text-align: center; padding: .625rem; border: 1px solid #f59e0b; color: #92400e; font-size: 1rem; }
</style>
