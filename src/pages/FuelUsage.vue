<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">레미콘 유류비 관리</h1>
    </div>

    <!-- 필터 섹션 -->
    <div class="control-section">
      <div class="filter-group">
        <div class="filter-item">
          <label class="form-label">연도</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedYear" @change="loadData" class="custom-select">
              <option v-for="y in years" :key="y" :value="y">{{y}}년</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <label class="form-label">월</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedMonth" @change="loadData" class="custom-select">
              <option v-for="m in 12" :key="m" :value="m">{{m}}월</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <label class="form-label">이용자</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedUserId" @change="loadData" class="custom-select">
              <option value="">전체 이용자</option>
              <option v-for="u in users" :key="u.userId" :value="u.userId">{{u.name}}</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <button @click="exportToExcel" class="btn-custom btn-export">
            📊 엑셀 다운로드
          </button>
        </div>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7;">
          <span style="font-size: 1.5rem;">⛽</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 주유금액</div>
          <div class="stat-value">{{formatNumber(totalAmount)}}원</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">
          <span style="font-size: 1.5rem;">🚛</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 주행거리</div>
          <div class="stat-value">{{formatNumber(totalDistance)}}km</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e0e7ff;">
          <span style="font-size: 1.5rem;">📈</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 주유량</div>
          <div class="stat-value">{{totalFuelLiters}}</div>
        </div>
      </div>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="fuel-table">
          <thead>
            <tr>
              <th class="fixed-col date-col">일자</th>
              <th v-for="v in vehicles" :key="v.vehicleId" class="vehicle-header">
                {{v.carNum}}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in daysInMonth" :key="day" :class="getRowClass(day)">
              <td class="fixed-col date-col">
                <div class="date-cell-wrapper">
                  <div class="date-content">
                    <span class="day-number">{{day}}</span>
                    <span :class="['day-name', getDayClass(day)]">{{getDayName(day)}}</span>
                  </div>
                  <div class="daily-info" v-html="getDailyInfo(day)"></div>
                </div>
              </td>
              <td v-for="v in vehicles" :key="v.vehicleId">
                <div class="editable-cell" @click="openModal(day, v.vehicleId)">
                  <div class="cell-content" v-html="displayCell(day, v.vehicleId)"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>
            <span style="margin-right: 0.5rem;">⛽</span>
            주유/주행 정보 입력
          </h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">기사 선택 *</label>
            <div class="custom-select-wrapper">
              <select v-model="modal.userId" class="custom-select">
                <option value="">선택하세요</option>
                <option v-for="u in users" :key="u.userId" :value="u.userId">{{u.name}}</option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">주행거리 (km)</label>
            <input 
              type="number" 
              v-model.number="modal.distanceKm" 
              placeholder="예: 150" 
              class="custom-input"
              min="0"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">입력 방식</label>
            <div class="custom-select-wrapper">
              <select v-model="modal.usageType" class="custom-select">
                <option value="AMOUNT">금액으로 입력</option>
                <option value="LITER">리터로 입력</option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3" v-if="modal.usageType === 'AMOUNT'">
            <label class="form-label">주유 금액 (원)</label>
            <input 
              type="number" 
              v-model.number="modal.fuelAmount" 
              placeholder="예: 150000" 
              class="custom-input"
              min="0"
            />
          </div>

          <div class="mb-3" v-if="modal.usageType === 'LITER'">
            <label class="form-label">주유량 (L)</label>
            <input 
              type="number" 
              v-model.number="modal.fuelLiter" 
              placeholder="예: 80.5" 
              class="custom-input"
              step="0.1"
              min="0"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">메모</label>
            <textarea 
              v-model="modal.memo" 
              placeholder="특이사항을 입력하세요"
              class="custom-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="deleteRecord" v-if="modal.fuelId" class="btn-custom btn-danger">
            🗑️ 삭제
          </button>
          <button @click="closeModal" class="btn-custom btn-secondary">
            취소
          </button>
          <button @click="saveModal" class="btn-custom btn-success">
            💾 저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedUserId = ref('')

const users = ref([])
const vehicles = ref([])
const usageData = ref([])
const loading = ref(false)

const showModal = ref(false)
const modal = ref({})

const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

const daysInMonth = computed(() => {
  const days = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
})

// 통계 계산
const totalAmount = computed(() => {
  return usageData.value
    .filter(u => u.usageType === 'AMOUNT')
    .reduce((sum, u) => sum + (u.fuelAmount || 0), 0)
})

const totalDistance = computed(() => {
  return usageData.value.reduce((sum, u) => sum + (u.distanceKm || 0), 0)
})

// 총 주유량 계산 (LITER 타입만)
const totalFuelLiters = computed(() => {
  const totalLiter = usageData.value
    .filter(u => u.usageType === 'LITER')
    .reduce((sum, u) => sum + (u.fuelLiter || 0), 0)
  
  if (totalLiter === 0) return '-'
  return formatNumber(totalLiter) + 'L'
})

// userId로 사용자 이름 찾기
const getUserName = (userId) => {
  const user = users.value.find(u => u.userId === userId)
  return user ? user.name : ''
}

// 일자별 주유 정보
const getDailyInfo = (day) => {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  const dayRecords = usageData.value.filter(r => {
    const recordDate = r.usageDate.split('T')[0]
    return recordDate === dateStr
  })
  
  if (dayRecords.length === 0) return ''
  
  let html = '<div class="daily-info-content">'
  
  // 총 주유금액
  const totalAmount = dayRecords
    .filter(r => r.usageType === 'AMOUNT')
    .reduce((sum, r) => sum + (r.fuelAmount || 0), 0)
  
  // 총 주유량
  const totalLiter = dayRecords
    .filter(r => r.usageType === 'LITER')
    .reduce((sum, r) => sum + (r.fuelLiter || 0), 0)
  
  if (totalAmount > 0) {
    html += `<div class="info-amount">💰 ${formatNumber(totalAmount)}원</div>`
  }
  
  if (totalLiter > 0) {
    html += `<div class="info-liter">⛽ ${totalLiter}L</div>`
  }
  
  // 누가 주유했는지 (이용자가 "전체"일 때만)
  if (!selectedUserId.value && dayRecords.length > 0) {
    const userNames = [...new Set(dayRecords.map(r => getUserName(r.userId)))].filter(Boolean)
    if (userNames.length > 0) {
      html += `<div class="info-users">👤 ${userNames.join(', ')}</div>`
    }
  }
  
  html += '</div>'
  return html
}

const getDayName = (day) => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, day)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[date.getDay()]
}

const getDayClass = (day) => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, day)
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0) return 'sunday'
  if (dayOfWeek === 6) return 'saturday'
  return ''
}

const getRowClass = (day) => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, day)
  const today = new Date()
  const dayOfWeek = date.getDay()
  
  const classes = []
  if (dayOfWeek === 0 || dayOfWeek === 6) classes.push('weekend')
  if (date.toDateString() === today.toDateString()) classes.push('today')
  
  return classes.join(' ')
}

const openModal = (day, vehicleId) => {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  const record = usageData.value.find(r => {
    const recordDate = r.usageDate.split('T')[0]
    return recordDate === dateStr && r.vehicleId === vehicleId
  })
  
  modal.value = record ? { ...record } : {
    fuelId: null,
    userId: selectedUserId.value || '',
    vehicleId,
    usageDate: dateStr,
    distanceKm: null,
    usageType: 'AMOUNT',
    fuelAmount: null,
    fuelLiter: null,
    memo: ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modal.value = {}
}

const saveModal = async () => {
  if (!modal.value.userId) {
    alert('기사를 선택해주세요')
    return
  }
  
  try {
    await api.post('/fuel/usage/save', modal.value)
    selectedUserId.value = modal.value.userId
    await loadData()
    closeModal()
  } catch (error) {
    alert('저장 중 오류가 발생했습니다: ' + error.message)
  }
}

const deleteRecord = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    await api.post('/fuel/usage/delete', { fuelId: modal.value.fuelId })
    await loadData()
    closeModal()
  } catch (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

const displayCell = (day, vehicleId) => {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  const record = usageData.value.find(r => {
    const recordDate = r.usageDate.split('T')[0]
    return recordDate === dateStr && r.vehicleId === vehicleId
  })
  
  if (!record) {
    return '<span style="color: #94a3b8; font-size: 0.75rem;">클릭하여 입력</span>'
  }
  
  let html = ''
  
  // 기사 이름 표시
  const userName = getUserName(record.userId)
  if (userName) {
    html += `<div class="driver-name">👤 ${userName}</div>`
  }
  
  // 주행거리
  if (record.distanceKm) {
    html += `<div style="color: #3b82f6; font-weight: 600; margin-bottom: 0.25rem;">🚛 ${formatNumber(record.distanceKm)}km</div>`
  }
  
  // 주유 정보
  if (record.usageType === 'AMOUNT' && record.fuelAmount) {
    html += `<div class="price-cell">💰 ${formatNumber(record.fuelAmount)}원</div>`
  } else if (record.usageType === 'LITER' && record.fuelLiter) {
    html += `<div style="color: #10b981; font-weight: 600;">⛽ ${record.fuelLiter}L</div>`
  }
  
  // 메모
  if (record.memo) {
    html += `<div style="color: #64748b; font-size: 0.7rem; margin-top: 0.25rem;">📝 ${record.memo}</div>`
  }
  
  return html || '<span style="color: #94a3b8;">-</span>'
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('ko-KR')
}

const loadData = async () => {
  loading.value = true
  try {
    const [u, v, f] = await Promise.all([
      api.post('/users/list'),
      api.post('/vehicles', { userId: selectedUserId.value || 0 }),
      api.post('/fuel/usage/query', {
        year: selectedYear.value,
        month: selectedMonth.value,
        userId: selectedUserId.value || 0
      })
    ])
    users.value = u.data || u
    vehicles.value = v.data || v
    usageData.value = f.data || f
  } catch (error) {
    alert('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message)
  } finally {
    loading.value = false
  }
}

const exportToExcel = () => {
  alert('엑셀 다운로드 기능은 추후 구현 예정입니다')
}

onMounted(loadData)
</script>

<style scoped>
.page-container {
  padding: 1.5rem;
  max-width: 1920px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.control-section {
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  min-width: 150px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
  display: block;
}

.custom-select-wrapper {
  position: relative;
}

.custom-select {
  width: 100%;
  font-size: 0.9375rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-select:hover {
  border-color: #cbd5e1;
}

.custom-select:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
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

.custom-input {
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  transition: all 0.2s ease;
}

.custom-input:hover {
  border-color: #cbd5e1;
}

.custom-input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

textarea.custom-input {
  resize: vertical;
  font-family: inherit;
}

.btn-custom {
  padding: 0.625rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-export {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-secondary {
  background: #e2e8f0;
  color: #64748b;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.table-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid #f1f5f9;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-wrapper {
  overflow-x: auto;
}

.fuel-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
  font-size: 0.875rem;
}

.fuel-table thead th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  padding: 1rem 0.75rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 5;
}

.vehicle-header {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e !important;
  font-size: 0.9375rem;
}

.fuel-table tbody td {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;
  vertical-align: middle;
}

.fixed-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 10;
  font-weight: 600;
}

.date-col {
  min-width: 180px;
}

.date-cell-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.date-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.day-number {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.day-name {
  font-size: 0.75rem;
  color: #64748b;
}

.day-name.sunday {
  color: #ef4444;
  font-weight: 600;
}

.day-name.saturday {
  color: #3b82f6;
  font-weight: 600;
}

.daily-summary {
  width: 100%;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

.summary-amount {
  color: #f59e0b;
  font-weight: 600;
}

.summary-liter {
  color: #10b981;
  font-weight: 600;
}

.summary-users {
  color: #6366f1;
  font-weight: 600;
  font-size: 0.7rem;
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid #e2e8f0;
}

.editable-cell {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 0.375rem;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editable-cell:hover {
  background: #fef3c7;
}

.cell-content {
  width: 100%;
}

.driver-name {
  color: #6366f1;
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 0.375rem;
  background: #eef2ff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.price-cell {
  color: #f59e0b;
  font-weight: 600;
}

.weekend {
  background: #f8fafc;
}

.today {
  background: #fef3c7;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h5 {
  margin: 0;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  font-size: 1.125rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  color: #64748b;
  font-size: 1.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.mb-3 {
  margin-bottom: 1rem;
}
</style>