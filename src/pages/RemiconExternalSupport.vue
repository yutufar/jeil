<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">🚛 외부 지원 운행 기록</h1>
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
          <button @click="openAddModal" class="btn-custom btn-primary">
            ➕ 지원 입력
          </button>
        </div>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7;"><span style="font-size:1.5rem;">💰</span></div>
        <div class="stat-content">
          <div class="stat-label">총 지원비</div>
          <div class="stat-value">{{ formatNumber(totalFee) }}원</div>
          <div class="stat-sub">{{ supportData.length }}건</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;"><span style="font-size:1.5rem;">🔄</span></div>
        <div class="stat-content">
          <div class="stat-label">총 회전수</div>
          <div class="stat-value">{{ formatNumber(totalTrips) }}회</div>
          <div class="stat-sub">누적</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #d1fae5;"><span style="font-size:1.5rem;">⛽</span></div>
        <div class="stat-content">
          <div class="stat-label">총 유류사용량</div>
          <div class="stat-value">{{ formatNumber(totalFuel) }}ℓ</div>
          <div class="stat-sub">누적</div>
        </div>
      </div>
    </div>

    <!-- 날짜별 그룹 테이블 -->
    <div class="table-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>

      <div v-else-if="groupedData.length === 0" class="empty-state">
        등록된 외부 지원 데이터가 없습니다
      </div>

      <div v-else class="table-wrapper">
        <table class="support-table">
          <thead>
            <tr>
              <th>순</th>
              <th>차량번호</th>
              <th>총 회전수</th>
              <th>유류사용량 (ℓ)</th>
              <th>금액</th>
              <th>날짜</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in flatRows"
              :key="row.key"
              :class="{
                'subtotal-row': row.type === 'subtotal',
                'total-row':    row.type === 'total'
              }"
            >
              <!-- 데이터 행 -->
              <template v-if="row.type === 'data'">
                <td>{{ row.idx + 1 }}</td>
                <td class="car-cell">{{ getVehicleCarNum(row.item.vehicleId) }}</td>
                <td class="number-cell">{{ row.item.tripCount }}</td>
                <td class="number-cell">{{ row.item.fuelUsage }}</td>
                <td class="number-cell highlight">{{ formatNumber(row.item.supportFee) }}</td>
                <td v-if="row.idx === 0" :rowspan="row.groupSize" class="date-cell">
                  {{ formatGroupDate(row.item.workDate) }}
                </td>
                <td class="memo-cell">{{ row.item.memo || '-' }}</td>
                <td>
                  <button @click="openEditModal(row.item)" class="btn-icon">✏️</button>
                  <button @click="deleteSupport(row.item.supportId)" class="btn-icon">🗑️</button>
                </td>
              </template>

              <!-- 일계 행 -->
              <template v-else-if="row.type === 'subtotal'">
                <td colspan="2" class="subtotal-label">일계</td>
                <td class="number-cell"><strong>{{ row.totalTrips }}</strong></td>
                <td class="number-cell"><strong>{{ row.totalFuel }}</strong></td>
                <td class="number-cell"><strong>{{ formatNumber(row.totalFee) }}</strong></td>
                <td></td>
                <td colspan="2"></td>
              </template>

              <!-- 총계 행 -->
              <template v-else-if="row.type === 'total'">
                <td colspan="2" class="total-label">총계</td>
                <td class="total-value">{{ formatNumber(totalTrips) }}</td>
                <td class="total-value">{{ formatNumber(totalFuel) }}</td>
                <td class="total-value">{{ formatNumber(totalFee) }}</td>
                <td colspan="3"></td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 입력/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>🚛 {{ modal.supportId ? '외부 지원 수정' : '외부 지원 입력' }}</h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">작업 일자 *</label>
            <input type="date" v-model="modal.workDate" class="custom-input" />
          </div>

          <div class="mb-3">
            <label class="form-label">차량 선택 *</label>
            <div class="custom-select-wrapper">
              <select v-model="modal.vehicleId" class="custom-select">
                <option value="">선택하세요</option>
                <option v-for="v in remiconVehicles" :key="v.vehicleId" :value="v.vehicleId">
                  {{ v.carNum }} ({{ v.modelName }})
                </option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">총 회전수 *</label>
            <input
              type="number" v-model.number="modal.tripCount" @input="calcFee"
              placeholder="예: 5" class="custom-input" step="1" min="0"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">단가 *</label>
            <input
              type="number" v-model.number="modal.unitPrice" @input="calcFee"
              placeholder="예: 75000" class="custom-input" step="500" min="0"
            />
            <div class="input-hint">기본 단가: 75,000원</div>
          </div>

          <div class="mb-3">
            <label class="form-label">지원비 (자동 계산)</label>
            <input
              type="number" v-model.number="modal.supportFee"
              class="custom-input calculated-input" readonly
            />
            <div class="input-hint">= 회전수 × 단가</div>
          </div>

          <div class="mb-3">
            <label class="form-label">유류사용량 (ℓ) *</label>
            <input
              type="number" v-model.number="modal.fuelUsage"
              placeholder="예: 80" class="custom-input" step="0.1" min="0"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">비고</label>
            <input
              type="text" v-model="modal.memo"
              placeholder="메모를 입력하세요" class="custom-input"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="modal.supportId" @click="deleteFromModal" class="btn-custom btn-danger">
            🗑️ 삭제
          </button>
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

const selectedYear  = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

const vehicles    = ref([])
const supportData = ref([])
const loading     = ref(false)

const showModal = ref(false)
const modal     = ref({})

// ── computed ─────────────────────────────────────────────────
const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

const remiconVehicles = computed(() =>
  vehicles.value.filter(v => v.carType === '지입레미콘' || v.carType === '자차레미콘')
)

const totalFee = computed(() =>
  supportData.value.reduce((s, i) => s + (i.supportFee || 0), 0)
)
const totalTrips = computed(() =>
  supportData.value.reduce((s, i) => s + (i.tripCount || 0), 0)
)
const totalFuel = computed(() => {
  const v = supportData.value.reduce((s, i) => s + parseFloat(i.fuelUsage || 0), 0)
  return Math.round(v * 10) / 10
})

// 날짜별 그룹핑
const groupedData = computed(() => {
  const map = {}
  supportData.value.forEach(item => {
    const d = String(item.workDate).split('T')[0]
    if (!map[d]) map[d] = { date: d, items: [], totalTrips: 0, totalFuel: 0, totalFee: 0 }
    map[d].items.push(item)
    map[d].totalTrips += item.tripCount || 0
    map[d].totalFuel   = Math.round((map[d].totalFuel + parseFloat(item.fuelUsage || 0)) * 10) / 10
    map[d].totalFee   += item.supportFee || 0
  })
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
})

// 테이블 렌더용 flat 배열 (template v-for 중첩 제거)
const flatRows = computed(() => {
  const rows = []
  groupedData.value.forEach(group => {
    group.items.forEach((item, idx) => {
      rows.push({
        key:       `data-${item.supportId}`,
        type:      'data',
        idx,
        groupSize: group.items.length,
        item
      })
    })
    rows.push({
      key:        `sub-${group.date}`,
      type:       'subtotal',
      totalTrips: group.totalTrips,
      totalFuel:  group.totalFuel,
      totalFee:   group.totalFee
    })
  })
  rows.push({ key: 'total', type: 'total' })
  return rows
})

// ── helpers ──────────────────────────────────────────────────
const getVehicleCarNum = (vehicleId) => {
  const v = vehicles.value.find(v => v.vehicleId === vehicleId)
  return v ? v.carNum : '-'
}

const formatNumber = (num) => (num || 0).toLocaleString('ko-KR')

const formatGroupDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(String(dateStr).split('T')[0])
  return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`
}

const calcFee = () => {
  modal.value.supportFee = (modal.value.tripCount || 0) * (modal.value.unitPrice || 0)
}

// ── modal ────────────────────────────────────────────────────
const openAddModal = () => {
  const today = new Date()
  modal.value = {
    supportId:  null,
    workDate:   `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    vehicleId:  '',
    tripCount:  0,
    unitPrice:  75000,
    supportFee: 0,
    fuelUsage:  0,
    memo:       ''
  }
  showModal.value = true
}

const openEditModal = (item) => {
  modal.value = {
    ...item,
    workDate: String(item.workDate).split('T')[0]
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modal.value = {}
}

const saveModal = async () => {
  if (!modal.value.vehicleId)                                   { alert('차량을 선택해주세요');      return }
  if (!modal.value.tripCount  || modal.value.tripCount  <= 0)   { alert('회전수를 입력해주세요');    return }
  if (!modal.value.fuelUsage  || modal.value.fuelUsage  <= 0)   { alert('유류사용량을 입력해주세요'); return }
  try {
    await api.post('/remicon/external/save', modal.value)
    await loadData()
    closeModal()
    alert('저장되었습니다')
  } catch (error) {
    console.error('저장 오류:', error)
    alert('저장 중 오류가 발생했습니다: ' + error.message)
  }
}

const deleteFromModal = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  await deleteSupport(modal.value.supportId)
  closeModal()
}

const deleteSupport = async (supportId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await api.post('/remicon/external/delete', { supportId })
    await loadData()
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

// ── data load ────────────────────────────────────────────────
const loadData = async () => {
  loading.value = true
  try {
    const [v, s] = await Promise.all([
      api.post('/vehicles', { userId: 0 }),
      api.post('/remicon/external/list', {
        year:  selectedYear.value,
        month: selectedMonth.value
      })
    ])
    vehicles.value    = v.data || v
    supportData.value = s.data || s
  } catch (error) {
    console.error('데이터 조회 오류:', error)
    alert('데이터를 불러오는 중 오류가 발생했습니다')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
.page-header    { margin-bottom: 0.75rem; }
.page-title     { font-size: 1.3rem; font-weight: 700; color: #ffffff; margin: 0; }

.control-section {
  padding: 1.5rem; background: white; border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-bottom: 0.75rem;
}
.filter-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
.filter-item  { flex: 1; min-width: 140px; }

.form-label { font-size: .875rem; font-weight: 600; color: #64748b; margin-bottom: .5rem; display: block; }

.custom-select-wrapper { position: relative; }
.custom-select {
  width: 100%; font-size: .9375rem; border: 1px solid #e2e8f0;
  border-radius: .5rem; background: white; color: #334155;
  appearance: none; cursor: pointer; padding: .5rem 2rem .5rem .75rem;
}
.custom-select:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.select-arrow { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #64748b; font-size: .75rem; }

.custom-input {
  width: 100%; padding: .5rem .75rem; font-size: .9375rem;
  border: 1px solid #e2e8f0; border-radius: .5rem;
  background: white; color: #334155; box-sizing: border-box;
}
.custom-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.calculated-input { background: linear-gradient(135deg,#fef3c7,#fde68a); font-weight: 700; color: #92400e; }
.input-hint { font-size: .75rem; color: #94a3b8; margin-top: .25rem; }

.btn-custom    { padding: .625rem 1.5rem; font-size: .9375rem; font-weight: 600; border: none; border-radius: .5rem; cursor: pointer; transition: all .2s; }
.btn-primary   { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,.4); }
.btn-success   { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-secondary { background: #e2e8f0; color: #64748b; }
.btn-danger    { background: #ef4444; color: white; }
.btn-icon      { background: none; border: none; cursor: pointer; padding: .25rem; font-size: 1rem; transition: transform .2s; }
.btn-icon:hover { transform: scale(1.2); }

.stats-section {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  gap: .75rem; margin-bottom: .75rem;
}
.stat-card     { background: white; border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); display: flex; align-items: center; gap: .75rem; }
.stat-icon     { width: 50px; height: 50px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-content  { flex: 1; }
.stat-label    { font-size: .75rem; color: #64748b; margin-bottom: .25rem; }
.stat-value    { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.stat-sub      { font-size: .8rem; color: #94a3b8; margin-top: .25rem; }

.table-section { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.loading-state, .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
.spinner { width: 40px; height: 40px; margin: 0 auto 1rem; border: 4px solid #f1f5f9; border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrapper { overflow-x: auto; }
.support-table { width: 100%; border-collapse: collapse; font-size: .9rem; }

.support-table thead th { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #92400e; font-weight: 700; padding: .75rem .5rem; text-align: center; border: 1px solid #e2e8f0; white-space: nowrap; }
.support-table tbody td { padding: .6rem .5rem; border: 1px solid #e2e8f0; text-align: center; font-size: .875rem; }

.car-cell    { font-weight: 700; color: #1e293b; }
.number-cell { font-weight: 600; color: #1e293b; }
.highlight   { color: #92400e; font-size: 1rem; }
.date-cell   { font-weight: 700; color: #1e293b; vertical-align: middle; background: #f8fafc; white-space: nowrap; }
.memo-cell   { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.subtotal-row td { background: #f1f5f9; }
.subtotal-label  { font-weight: 700; color: #475569; }

.total-row td  { background: linear-gradient(135deg,#fef3c7,#fde68a); }
.total-label   { font-weight: 700; color: #92400e; font-size: 1rem; }
.total-value   { font-weight: 700; color: #dc2626; font-size: 1.05rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: white; border-radius: 1rem; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); }
.modal-header  { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.modal-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.125rem; }
.close-btn     { background: none; border: none; cursor: pointer; padding: .5rem; border-radius: .5rem; color: #64748b; font-size: 1.25rem; }
.close-btn:hover { background: #f1f5f9; }
.modal-body    { padding: 1.5rem; }
.modal-footer  { padding: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; border-top: 1px solid #e2e8f0; }
.mb-3 { margin-bottom: 1rem; }
</style>