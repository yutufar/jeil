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
          <button @click="exportToExcel" class="btn-custom btn-export"
            :disabled="deliveryGroups.length === 0"
            :class="{ 'btn-disabled': deliveryGroups.length === 0 }">
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

    <!-- ✅ 일별 수불 현황 -->
    <div class="table-section" style="margin-bottom:.75rem">
      <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
        <h3>📅 {{ selectedYear }}년 {{ selectedMonth }}월 일별 수불 현황</h3>
        <span class="sub-note">날짜별 입고 루베 합계</span>
      </div>
      <div class="table-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>입고일</th>
              <th v-for="mat in MATERIALS" :key="mat.code">{{ mat.label }}<br/><small>(루베)</small></th>
              <th>합계(루베)</th>
              <th>합계(대수)</th>
              <th>공급가액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in dailySummary" :key="row.date">
              <td class="center-cell date-col">{{ row.date }}</td>
              <td v-for="mat in MATERIALS" :key="mat.code" class="number-cell">
                {{ row.matQty[mat.code] > 0 ? formatNumber(row.matQty[mat.code]) : '-' }}
              </td>
              <td class="number-cell highlight">{{ formatNumber(row.totalQty) }}</td>
              <td class="number-cell">{{ formatNumber(row.totalTrip) }}차</td>
              <td class="number-cell">{{ formatNumber(row.totalSupply) }}원</td>
            </tr>
            <tr v-if="dailySummary.length === 0">
              <td :colspan="MATERIALS.length + 4" class="empty-state" style="padding:1.5rem">데이터 없음</td>
            </tr>
          </tbody>
          <tfoot v-if="dailySummary.length > 0">
            <tr class="total-row">
              <td class="total-label">합계</td>
              <td v-for="mat in MATERIALS" :key="mat.code" class="total-value">
                {{ formatNumber(dailySummary.reduce((s,r)=>s+(r.matQty[mat.code]||0),0)) }}
              </td>
              <td class="total-value">{{ formatNumber(grandQuantity) }}</td>
              <td class="total-value">{{ formatNumber(grandTrip) }}차</td>
              <td class="total-value">{{ formatNumber(grandSupply) }}원</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- 차량별 운반비 테이블 -->
    <div class="table-section">
      <div class="section-title">
        <h3>🪨 {{ selectedYear }}년 {{ selectedMonth }}월 골재 운반비 내역</h3>
      </div>
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
      <div v-else-if="deliveryGroups.length === 0" class="empty-state">
        등록된 골재 운반비 데이터가 없습니다
      </div>
      <div v-else class="table-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>차량</th>
              <th>구분</th>
              <th>입고일</th>
              <th>대수</th>
              <th>수량(루베)</th>
              <th>단가</th>
              <th>공급가액</th>
              <th>부가세</th>
              <th>합계</th>
              <th>입력일</th>
              <th>수정일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, gi) in deliveryGroups">
              <tr v-for="(mat, mi) in MATERIALS" :key="group.carNum + '_' + mat.code">
                <td v-if="mi === 0" :rowspan="MATERIALS.length + 1" class="center-cell group-num">
                  {{ gi + 1 }}
                </td>
                <td v-if="mi === 0" :rowspan="MATERIALS.length + 1" class="center-cell vehicle-cell">
                  {{ group.carNum }}
                </td>
                <td class="material-label">{{ mat.label }}</td>
                <td class="center-cell date-col">
                  {{ getMatWorkDate(group, mat.code) || '-' }}
                </td>
                <td class="number-cell">
                  {{ getMatTrip(group, mat.code) > 0 ? getMatTrip(group, mat.code) + '차' : '-' }}
                </td>
                <td class="number-cell">
                  {{ getMatQty(group, mat.code) > 0 ? formatNumber(getMatQty(group, mat.code)) : '-' }}
                </td>
                <td class="number-cell">{{ formatNumber(mat.unitPrice) }}</td>
                <td class="number-cell">
                  {{ getMatSupply(group, mat.code) > 0 ? formatNumber(getMatSupply(group, mat.code)) : '-' }}
                </td>
                <td class="number-cell">
                  {{ getMatVat(group, mat.code) > 0 ? formatNumber(getMatVat(group, mat.code)) : '-' }}
                </td>
                <td class="number-cell highlight">
                  {{ getMatTotal(group, mat.code) > 0 ? formatNumber(getMatTotal(group, mat.code)) : '-' }}
                </td>
                <td v-if="mi === 0" :rowspan="MATERIALS.length + 1" class="center-cell date-cell">
                  {{ group.createdAt || '-' }}
                </td>
                <td v-if="mi === 0" :rowspan="MATERIALS.length + 1" class="center-cell date-cell updated">
                  {{ group.updatedAt || '-' }}
                </td>
                <td v-if="mi === 0" :rowspan="MATERIALS.length + 1" class="center-cell">
                  <button @click="openEditModal(group)" class="btn-icon">✏️</button>
                  <button @click="deleteGroup(group.carNum)" class="btn-icon">🗑️</button>
                </td>
              </tr>
              <!-- 소계 -->
              <tr class="subtotal-row">
                <td class="subtotal-label">소계</td>
                <td class="center-cell">-</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalTrip) }}차</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalQty) }}</td>
                <td class="center-cell">-</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalSupply) }}</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalVat) }}</td>
                <td class="number-cell subtotal-val">{{ formatNumber(group.totalAmount) }}</td>
                <td colspan="3"></td>
              </tr>
            </template>
            <!-- 합계 -->
            <tr class="total-row">
              <td colspan="4" class="total-label">합계</td>
              <td class="total-value">{{ formatNumber(grandTrip) }}차</td>
              <td class="total-value">{{ formatNumber(grandQuantity) }}</td>
              <td class="center-cell">-</td>
              <td class="total-value">{{ formatNumber(grandSupply) }}</td>
              <td class="total-value">{{ formatNumber(grandVat) }}</td>
              <td class="total-value">{{ formatNumber(grandTotal) }}</td>
              <td colspan="3"></td>
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
          <div class="mb-3">
            <label class="form-label">차량번호 *</label>
            <input type="text" v-model="modal.carNum" class="custom-input carnum-input"
              placeholder="차량번호를 입력하세요 (예: 7211)" :disabled="modal.isEdit" />
            <div v-if="!modal.isEdit" class="input-hint">숫자 4자리를 직접 입력하세요</div>
            <div v-else class="input-hint edit-hint">차량번호는 수정할 수 없습니다</div>
          </div>

          <div class="trip-notice">
            <span>📌 대수 입력 시 수량이 자동 계산됩니다 <strong>(1대 = 17루베)</strong></span>
          </div>

          <!-- 재료별 입력 -->
          <table class="modal-material-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>입고일 *</th>
                <th>단가</th>
                <th>대수 입력</th>
                <th>수량(루베) <span class="auto-badge">자동</span></th>
                <th>공급가액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mat in MATERIALS" :key="mat.code">
                <td class="mat-label-cell">{{ mat.label }}</td>
                <td>
                  <input type="date" v-model="modal.items[mat.code].workDate"
                    class="mat-date-input" />
                </td>
                <td class="mat-price-cell">{{ formatNumber(mat.unitPrice) }}원</td>
                <td class="mat-trip-cell">
                  <input type="number" v-model.number="modal.items[mat.code].tripCount"
                    @input="calcItem(mat.code)" min="0" class="mat-input" placeholder="0" />
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
                <td colspan="3">합계</td>
                <td>{{ formatNumber(modalTotalTrip) }}대</td>
                <td>{{ formatNumber(modalTotalQty) }}루베</td>
                <td>{{ formatNumber(modalTotalSupply) }}원</td>
              </tr>
              <tr class="modal-total-row">
                <td colspan="3">부가세 (10%)</td>
                <td colspan="2">-</td>
                <td>{{ formatNumber(modalTotalVat) }}원</td>
              </tr>
              <tr class="modal-grand-row">
                <td colspan="3">최종 합계</td>
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
  { code: '자갈25MM',     label: '자갈25MM',      unitPrice: 5000 },
  { code: '해광샌드밀',   label: '해광 샌드밀',   unitPrice: 5000 },
  { code: '보창샌드밀',   label: '보창 샌드밀',   unitPrice: 6000 },
  { code: '보창자갈20MM', label: '보창 자갈20MM', unitPrice: 6000 },
]

const selectedYear  = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const filterCarNum  = ref('')
const rawDeliveries = ref([])
const loading       = ref(false)
const showModal     = ref(false)
const modal         = ref({})

const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

// ✅ 일별 수불 현황 - 날짜별 루베 집계
const dailySummary = computed(() => {
  const map = {}
  rawDeliveries.value.forEach(r => {
    if (!r.workDate) return
    const date = r.workDate
    if (!map[date]) {
      map[date] = { date, matQty: {}, totalQty: 0, totalTrip: 0, totalSupply: 0 }
      MATERIALS.forEach(m => { map[date].matQty[m.code] = 0 })
    }
    const d = map[date]
    d.matQty[r.materialType] = (d.matQty[r.materialType] || 0) + (Number(r.quantity) || 0)
    d.totalQty     += Number(r.quantity)     || 0
    d.totalTrip    += Number(r.tripCount)    || 0
    d.totalSupply  += Number(r.supplyAmount) || 0
  })
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
})

// 차량별 그룹핑
const allDeliveryGroups = computed(() => {
  const map = {}
  rawDeliveries.value.forEach(r => {
    const key = r.carNum
    if (!map[key]) {
      map[key] = { carNum: r.carNum, items: {}, totalTrip: 0, totalQty: 0, totalSupply: 0, totalVat: 0, totalAmount: 0, createdAt: r.createdAt, updatedAt: r.updatedAt }
    }
    const g = map[key]
    g.items[r.materialType] = r
    g.totalTrip   += Number(r.tripCount)    || 0
    g.totalQty    += Number(r.quantity)     || 0
    g.totalSupply += Number(r.supplyAmount) || 0
    g.totalVat    += Number(r.vat)          || 0
    g.totalAmount += Number(r.totalAmount)  || 0
    if (r.createdAt && (!g.createdAt || r.createdAt < g.createdAt)) g.createdAt = r.createdAt
    if (r.updatedAt && (!g.updatedAt || r.updatedAt > g.updatedAt)) g.updatedAt = r.updatedAt
  })
  return Object.values(map).sort((a, b) => a.carNum.localeCompare(b.carNum, 'ko-KR'))
})

const deliveryGroups = computed(() => {
  if (!filterCarNum.value.trim()) return allDeliveryGroups.value
  return allDeliveryGroups.value.filter(g => g.carNum.includes(filterCarNum.value.trim()))
})

const grandTrip     = computed(() => deliveryGroups.value.reduce((s, g) => s + g.totalTrip, 0))
const grandQuantity = computed(() => deliveryGroups.value.reduce((s, g) => s + g.totalQty, 0))
const grandSupply   = computed(() => deliveryGroups.value.reduce((s, g) => s + g.totalSupply, 0))
const grandVat      = computed(() => deliveryGroups.value.reduce((s, g) => s + g.totalVat, 0))
const grandTotal    = computed(() => deliveryGroups.value.reduce((s, g) => s + g.totalAmount, 0))

const getMatItem     = (group, code) => group.items[code] || {}
const getMatQty      = (group, code) => Number(getMatItem(group, code).quantity)     || 0
const getMatTrip     = (group, code) => Number(getMatItem(group, code).tripCount)    || 0
const getMatSupply   = (group, code) => Number(getMatItem(group, code).supplyAmount) || 0
const getMatVat      = (group, code) => Number(getMatItem(group, code).vat)          || 0
const getMatTotal    = (group, code) => Number(getMatItem(group, code).totalAmount)  || 0
const getMatWorkDate = (group, code) => getMatItem(group, code).workDate || ''

const modalTotalTrip   = computed(() => MATERIALS.reduce((s, m) => s + (modal.value.items?.[m.code]?.tripCount || 0), 0))
const modalTotalQty    = computed(() => MATERIALS.reduce((s, m) => s + (modal.value.items?.[m.code]?.quantity || 0), 0))
const modalTotalSupply = computed(() => MATERIALS.reduce((s, m) => s + (modal.value.items?.[m.code]?.supplyAmount || 0), 0))
const modalTotalVat    = computed(() => Math.round(modalTotalSupply.value * 0.1))
const modalGrandTotal  = computed(() => modalTotalSupply.value + modalTotalVat.value)

const formatNumber = n => (n ? Number(n).toLocaleString('ko-KR') : '0')

// 오늘 날짜 yyyy-MM-dd
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const makeEmptyItems = () => {
  const items = {}
  const today = todayStr()
  MATERIALS.forEach(m => {
    items[m.code] = { workDate: today, quantity: 0, tripCount: 0, supplyAmount: 0, unitPrice: m.unitPrice }
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
  modal.value = { isEdit: false, carNum: '', items: makeEmptyItems() }
  showModal.value = true
}

const openEditModal = (group) => {
  const items = makeEmptyItems()
  MATERIALS.forEach(m => {
    const r = group.items[m.code]
    if (r) {
      items[m.code] = {
        workDate:     r.workDate     || todayStr(),
        quantity:     Number(r.quantity)     || 0,
        tripCount:    Number(r.tripCount)    || 0,
        supplyAmount: Number(r.supplyAmount) || 0,
        unitPrice:    m.unitPrice,
      }
    }
  })
  modal.value = { isEdit: true, carNum: group.carNum, items }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; modal.value = {} }

const saveModal = async () => {
  const carNum = (modal.value.carNum || '').trim()
  if (!carNum) { alert('차량번호를 입력해주세요'); return }

  if (!modal.value.isEdit) {
    const exists = allDeliveryGroups.value.some(g => g.carNum === carNum)
    if (exists) {
      alert(`차량번호 ${carNum}은 이미 등록되어 있습니다.\n수정하려면 목록에서 ✏️ 버튼을 눌러주세요.`)
      return
    }
  }

  if (!MATERIALS.some(m => (modal.value.items[m.code].tripCount || 0) > 0)) {
    alert('최소 1개 재료의 대수를 입력해주세요'); return
  }

  // 차수 입력된 항목은 입고일 필수
  for (const m of MATERIALS) {
    if ((modal.value.items[m.code].tripCount || 0) > 0 && !modal.value.items[m.code].workDate) {
      alert(`${m.label}의 입고일을 선택해주세요`); return
    }
  }

  try {
    await api.post('/goljae/delivery/save', {
      workYear:  selectedYear.value,
      workMonth: selectedMonth.value,
      carNum,
      items: MATERIALS.map(m => ({
        materialType: m.code,
        workDate:     modal.value.items[m.code].workDate     || null,
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
    alert('저장 오류: ' + error.message)
  }
}

const deleteFromModal = async () => {
  if (!confirm('이 차량의 골재 운반비를 모두 삭제하시겠습니까?')) return
  await deleteGroup(modal.value.carNum)
  closeModal()
}

const deleteGroup = async (carNum) => {
  if (!confirm(`차량번호 ${carNum}의 데이터를 삭제하시겠습니까?`)) return
  try {
    await api.post('/goljae/delivery/delete', {
      workYear: selectedYear.value, workMonth: selectedMonth.value, carNum
    })
    await loadData()
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 오류: ' + error.message)
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

const exportToExcel = async () => {
  if (deliveryGroups.value.length === 0) { alert('다운로드할 데이터가 없습니다'); return }
  try {
    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('골재운반비')
    const year = selectedYear.value, month = selectedMonth.value

    ws.columns = [
      { width: 8 }, { width: 12 }, { width: 14 }, { width: 12 },
      { width: 10 }, { width: 12 }, { width: 10 }, { width: 16 }, { width: 14 }, { width: 16 }
    ]

    const bd  = (s = 'thin') => ({ top:{style:s}, bottom:{style:s}, left:{style:s}, right:{style:s} })
    const nf  = '#,##0'
    const ctr = { horizontal: 'center', vertical: 'middle' }
    const rgt = { horizontal: 'right',  vertical: 'middle' }
    const lft = { horizontal: 'left',   vertical: 'middle' }
    const ab  = (cell, s = 'thin') => { cell.border = bd(s) }

    const H_BG  = 'FF203864'
    const S_BG  = 'FFD9E1F2'
    const T_BG  = 'FFFFD966'
    const TL_BG = 'FF1F4E79'
    const E_BG  = 'FFF5F9FF'

    // ── 제목 ──────────────────────────────────────────
    ws.mergeCells('A1:J1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `${year}년 ${month}월 골재 운반비`
    titleCell.font      = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TL_BG } }
    titleCell.alignment = ctr
    ws.getRow(1).height = 36

    // ── 헤더 ──────────────────────────────────────────
    const hr = ws.getRow(2)
    ;['번호','차량','구분','입고일','대수','수량(루베)','단가','공급가액','부가세','합계'].forEach((h, i) => {
      const c = hr.getCell(i + 1)
      c.value     = h
      c.font      = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: H_BG } }
      c.alignment = ctr
      ab(c, 'medium')
    })
    hr.height = 24

    // ── 차량별 데이터 ─────────────────────────────────
    let cr = 3
    deliveryGroups.value.forEach((group, gi) => {
      const gsr    = cr
      const isEven = gi % 2 === 0
      const bg     = isEven ? E_BG : 'FFFFFFFF'

      MATERIALS.forEach(mat => {
        const row  = ws.getRow(cr)
        const trip = getMatTrip(group, mat.code)
        const qty  = getMatQty(group, mat.code)
        const sup  = getMatSupply(group, mat.code)
        const vat  = getMatVat(group, mat.code)
        const tot  = getMatTotal(group, mat.code)
        const wdt  = getMatWorkDate(group, mat.code)

        const sc = (col, val, fmt, align) => {
          const c = row.getCell(col)
          c.value     = val
          c.font      = { size: 10 }
          c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
          c.alignment = align || rgt
          if (fmt && val) c.numFmt = fmt
          ab(c)
        }

        sc(3,  mat.label,        null, lft)
        sc(4,  wdt || '-',       null, ctr)
        sc(5,  trip > 0 ? trip : null, nf)
        sc(6,  qty  > 0 ? qty  : null, nf)
        sc(7,  mat.unitPrice,    nf)
        sc(8,  sup  > 0 ? sup  : null, nf)
        sc(9,  vat  > 0 ? vat  : null, nf)
        sc(10, tot  > 0 ? tot  : null, nf)
        row.height = 18
        cr++
      })

      // 소계 행
      const sr = ws.getRow(cr)
      ;[
        [3, '소계',             null, ctr],
        [4, null,               null, ctr],
        [5, group.totalTrip,    nf,   rgt],
        [6, group.totalQty,     nf,   rgt],
        [7, null,               null, ctr],
        [8, group.totalSupply,  nf,   rgt],
        [9, group.totalVat,     nf,   rgt],
        [10, group.totalAmount, nf,   rgt],
      ].forEach(([col, val, fmt, align]) => {
        const c = sr.getCell(col)
        c.value     = val
        c.font      = { bold: true, size: 10 }
        c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: S_BG } }
        c.alignment = align
        if (fmt && val) c.numFmt = fmt
        ab(c, 'medium')
      })
      sr.height = 20

      // 번호 병합
      ws.mergeCells(gsr, 1, cr, 1)
      const nc    = ws.getCell(gsr, 1)
      nc.value    = gi + 1
      nc.font     = { bold: true, size: 13, color: { argb: 'FF1F4E79' } }
      nc.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
      nc.alignment = ctr
      ab(nc, 'medium')

      // 차량 병합
      ws.mergeCells(gsr, 2, cr, 2)
      const cc    = ws.getCell(gsr, 2)
      cc.value    = group.carNum
      cc.font     = { bold: true, size: 12 }
      cc.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
      cc.alignment = ctr
      ab(cc, 'medium')

      cr++
    })

    // ── 차량별 합계 행 ────────────────────────────────
    ws.mergeCells(cr, 1, cr, 4)
    const totalLabelCell    = ws.getCell(cr, 1)
    totalLabelCell.value    = '합계'
    totalLabelCell.font     = { bold: true, size: 12, color: { argb: 'FF92400E' } }
    totalLabelCell.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: T_BG } }
    totalLabelCell.alignment = ctr
    ab(totalLabelCell, 'medium')

    ;[
      [5,  grandTrip.value],
      [6,  grandQuantity.value],
      [7,  null],
      [8,  grandSupply.value],
      [9,  grandVat.value],
      [10, grandTotal.value],
    ].forEach(([col, val]) => {
      const c     = ws.getCell(cr, col)
      c.value     = val
      c.font      = { bold: true, size: 12, color: { argb: val ? 'FFC00000' : 'FF000000' } }
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: T_BG } }
      c.alignment = rgt
      if (val) c.numFmt = nf
      ab(c, 'medium')
    })
    ws.getRow(cr).height = 26
    cr++

    // ── 월 총계 섹션 ──────────────────────────────────
    cr += 2

    // 월 총계 타이틀
    ws.mergeCells(cr, 1, cr, 7)
    const monthTitleCell      = ws.getCell(cr, 1)
    monthTitleCell.value      = `${String(month).padStart(2, '0')}월 총계`
    monthTitleCell.font       = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    monthTitleCell.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: TL_BG } }
    monthTitleCell.alignment  = ctr
    ws.getRow(cr).height = 30
    cr++

    // 월 총계 헤더
    ;['구분', '차수', '수량', '단가', '공급가액', '부가세', '합계'].forEach((h, i) => {
      const c     = ws.getCell(cr, i + 1)
      c.value     = h
      c.font      = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: H_BG } }
      c.alignment = ctr
      ab(c, 'medium')
    })
    ws.getRow(cr).height = 22
    cr++

    // 재료별 집계 행 (수량 0이면 행 생략)
    MATERIALS.forEach((mat, mi) => {
      const all  = rawDeliveries.value.filter(r => r.materialType === mat.code)
      const matT = all.reduce((s, r) => s + (Number(r.tripCount)    || 0), 0)
      const matQ = all.reduce((s, r) => s + (Number(r.quantity)     || 0), 0)
      const matS = all.reduce((s, r) => s + (Number(r.supplyAmount) || 0), 0)
      const matV = all.reduce((s, r) => s + (Number(r.vat)          || 0), 0)
      const matA = all.reduce((s, r) => s + (Number(r.totalAmount)  || 0), 0)

      if (matQ === 0) return  // ✅ 수량 없으면 행 생략

      const bg  = mi % 2 === 0 ? E_BG : 'FFFFFFFF'
      const row = ws.getRow(cr)
      ;[
        [1, mat.label,    null, lft],
        [2, matT,         nf,   rgt],
        [3, matQ,         nf,   rgt],
        [4, mat.unitPrice, nf,  rgt],
        [5, matS,         nf,   rgt],
        [6, matV,         nf,   rgt],
        [7, matA,         nf,   rgt],
      ].forEach(([col, val, fmt, align]) => {
        const c     = row.getCell(col)
        c.value     = val
        c.font      = { size: 10 }
        c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
        c.alignment = align
        if (fmt) c.numFmt = fmt
        ab(c)
      })
      row.height = 20
      cr++
    })

    // 월 총계 합계 행
    const sumT = rawDeliveries.value.reduce((s, r) => s + (Number(r.tripCount)    || 0), 0)
    const sumQ = rawDeliveries.value.reduce((s, r) => s + (Number(r.quantity)     || 0), 0)
    const sumS = rawDeliveries.value.reduce((s, r) => s + (Number(r.supplyAmount) || 0), 0)
    const sumV = rawDeliveries.value.reduce((s, r) => s + (Number(r.vat)          || 0), 0)
    const sumA = rawDeliveries.value.reduce((s, r) => s + (Number(r.totalAmount)  || 0), 0)

    ;[
      [1, '합계', null, ctr],
      [2, sumT,   nf,   rgt],
      [3, sumQ,   nf,   rgt],
      [4, null,   null, ctr],
      [5, sumS,   nf,   rgt],
      [6, sumV,   nf,   rgt],
      [7, sumA,   nf,   rgt],
    ].forEach(([col, val, fmt, align]) => {
      const c     = ws.getCell(cr, col)
      c.value     = val
      c.font      = { bold: true, size: 11, color: { argb: val === '합계' ? 'FF92400E' : 'FFC00000' } }
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: T_BG } }
      c.alignment = align
      if (fmt && val) c.numFmt = fmt
      ab(c, 'medium')
    })
    ws.getRow(cr).height = 26
    cr++

    // ── 비고 ──────────────────────────────────────────
    cr++
    ws.mergeCells(cr, 1, cr, 7)
    const noteCell      = ws.getCell(cr, 1)
    noteCell.value      = '*  비고란에 덤프번호와 계좌번호 꼭 기입해주세요. (팩스 041-931-4357)'
    noteCell.font       = { bold: true, size: 10, color: { argb: 'FFC00000' } }
    noteCell.alignment  = { horizontal: 'left', vertical: 'middle' }
    ws.getRow(cr).height = 22

    // ── 파일 다운로드 ─────────────────────────────────
    const buf  = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `골재운반비_${year}년${month}월.xlsx`
    link.click()
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
.page-header { margin-bottom: 0.75rem; }
.page-title { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0; }

.control-section { padding: 1.5rem; background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-bottom: 0.75rem; }
.filter-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
.filter-item { flex: 1; min-width: 150px; }
.form-label { font-size: .875rem; font-weight: 600; color: #64748b; margin-bottom: .5rem; display: block; }

.custom-select-wrapper { position: relative; }
.custom-select { width: 100%; font-size: .9375rem; border: 1px solid #e2e8f0; border-radius: .5rem; background: white; color: #334155; appearance: none; cursor: pointer; padding: .5rem 2rem .5rem .75rem; }
.custom-select:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.select-arrow { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #64748b; font-size: .75rem; }

.custom-input { width: 100%; font-size: .9375rem; border: 1px solid #e2e8f0; border-radius: .5rem; background: white; color: #334155; padding: .5rem .75rem; box-sizing: border-box; }
.custom-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }

.carnum-input { font-size: 1.25rem !important; font-weight: 700; letter-spacing: 3px; border: 2px solid #3b82f6 !important; text-align: center; padding: .75rem !important; color: #1e40af; }
.carnum-input:focus { border-color: #1d4ed8 !important; box-shadow: 0 0 0 3px rgba(59,130,246,.2) !important; }
.carnum-input:disabled { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0 !important; cursor: not-allowed; }

.input-hint { font-size: .75rem; color: #94a3b8; margin-top: .375rem; }
.edit-hint  { color: #f59e0b !important; }

.trip-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: .5rem; padding: .5rem .75rem; margin-bottom: .75rem; font-size: .875rem; color: #1e40af; }

.btn-custom   { padding: .625rem 1.5rem; font-size: .9375rem; font-weight: 600; border: none; border-radius: .5rem; cursor: pointer; transition: all .2s; }
.btn-primary  { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,.4); }
.btn-export   { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-export:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,.4); }
.btn-success  { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-secondary { background: #e2e8f0; color: #64748b; }
.btn-danger   { background: #ef4444; color: white; }
.btn-disabled { background: #e2e8f0 !important; color: #94a3b8 !important; cursor: not-allowed !important; }

.stats-section { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: .75rem; margin-bottom: .75rem; }
.stat-card { background: white; border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); display: flex; align-items: center; gap: .75rem; }
.stat-icon { width: 50px; height: 50px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-content { flex: 1; }
.stat-label { font-size: .75rem; color: #64748b; }
.stat-value { font-size: 1.3rem; font-weight: 700; color: #1e293b; }
.stat-sub   { font-size: .75rem; color: #94a3b8; margin-top: .25rem; }

.table-section { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.section-title h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; }
.sub-note { font-size: .8rem; color: #94a3b8; }
.table-wrapper { overflow-x: auto; }

.delivery-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.delivery-table thead th { background: linear-gradient(135deg,#1e3a5f,#203864); color: white; font-weight: 700; padding: .75rem .5rem; text-align: center; border: 1px solid #2d4e7e; white-space: nowrap; }
.delivery-table tbody td { padding: .625rem .5rem; border: 1px solid #e2e8f0; text-align: center; }
.delivery-table tfoot td { padding: .625rem .5rem; border: 1px solid #e2e8f0; }

.center-cell  { text-align: center; }
.date-col     { font-size: .82rem; color: #334155; white-space: nowrap; }
.group-num    { font-weight: 700; font-size: 1.1rem; color: #1f4e79; background: #d6e4f0 !important; }
.vehicle-cell { font-weight: 700; font-size: 1rem; color: #1e293b; background: #d6e4f0 !important; }
.material-label { text-align: left; padding-left: 1rem; color: #334155; }
.number-cell  { text-align: right; padding-right: .75rem; font-weight: 500; }
.highlight    { color: #92400e; font-weight: 700; }

.subtotal-row td { background: #dbeafe; font-weight: 700; border-top: 2px solid #93c5fd; border-bottom: 2px solid #93c5fd; }
.subtotal-label  { text-align: center; color: #1e40af; }
.subtotal-val    { text-align: right; padding-right: .75rem; color: #1e40af; }

.total-row td  { background: linear-gradient(135deg,#fef3c7,#fde68a); font-weight: 700; border-top: 3px solid #f59e0b; }
.total-label   { text-align: center; color: #92400e; font-size: 1rem; }
.total-value   { text-align: right; padding-right: .75rem; color: #dc2626; font-size: 1.05rem; }

.loading-state { text-align: center; padding: 3rem; color: #64748b; }
.spinner { width: 40px; height: 40px; margin: 0 auto 1rem; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 3rem; color: #94a3b8; }

.date-cell         { font-size: .78rem; color: #64748b; white-space: nowrap; background: #f8fafc !important; }
.date-cell.updated { color: #2563eb; }

.btn-icon { background: none; border: none; cursor: pointer; padding: .25rem; font-size: 1rem; transition: all .2s; }
.btn-icon:hover { transform: scale(1.2); }

.modal-overlay { position: fixed; top:0;left:0;right:0;bottom:0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: white; border-radius: 1rem; width: 95%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); }
.modal-header  { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.modal-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.125rem; }
.close-btn { background: none; border: none; cursor: pointer; padding: .5rem; border-radius: .5rem; color: #64748b; font-size: 1.25rem; }
.close-btn:hover { background: #f1f5f9; }
.modal-body   { padding: 1.5rem; }
.modal-footer { padding: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; border-top: 1px solid #e2e8f0; }
.mb-3 { margin-bottom: 1rem; }

.modal-material-table { width: 100%; border-collapse: collapse; font-size: .9rem; margin-top: 1rem; }
.modal-material-table thead th { background: #1e3a5f; color: white; padding: .625rem .5rem; text-align: center; border: 1px solid #2d4e7e; }
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
.mat-input       { width: 80px; padding: .375rem .5rem; border: 1px solid #e2e8f0; border-radius: .375rem; text-align: right; font-size: .9rem; }
.mat-input:focus { outline: none; border-color: #f59e0b; }
.mat-date-input  { width: 130px; padding: .375rem .5rem; border: 1px solid #3b82f6; border-radius: .375rem; font-size: .85rem; color: #1e40af; }
.mat-date-input:focus { outline: none; border-color: #1d4ed8; }
.auto-badge { background: #10b981; color: white; font-size: .65rem; padding: .1rem .35rem; border-radius: .25rem; margin-left: .25rem; font-weight: 600; }
.modal-total-row td { background: #dbeafe; font-weight: 600; text-align: center; padding: .5rem; border: 1px solid #93c5fd; }
.modal-grand-row td { background: #fef3c7; font-weight: 700; text-align: center; padding: .625rem; border: 1px solid #f59e0b; color: #92400e; font-size: 1rem; }
</style>