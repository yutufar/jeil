<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">🚛 레미콘 운반비 입력</h1>
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
          <label class="form-label">일</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedDay" @change="loadData" class="custom-select">
              <option value="">전체</option>
              <option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}일</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <label class="form-label">기사 선택</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedUserId" @change="loadData" class="custom-select">
              <option value="">전체</option>
              <option v-for="driver in remiconDrivers" :key="driver.userId" :value="driver.userId">
                {{ driver.displayName }}
              </option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <button @click="openAddModal" class="btn-custom btn-primary">
            ➕운반비 입력
          </button>
        </div>

        <!-- 기존 세금계산서용 엑셀 다운로드 -->
        <div class="filter-item">
          <button 
            @click="exportToExcel" 
            class="btn-custom btn-export"
            :disabled="selectedUserId !== ''"
            :class="{ 'btn-disabled': selectedUserId !== '' }"
          >
            📄 세금계산서
          </button>
        </div>

        <!-- 신규 월간 현황 엑셀 다운로드 -->
        <div class="filter-item">
          <button 
            @click="exportMonthlyReport" 
            class="btn-custom btn-monthly"
            :disabled="selectedUserId !== ''"
            :class="{ 'btn-disabled': selectedUserId !== '' }"
          >
            📊 월간현황
          </button>
        </div>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-section">
      <!-- 총 운반비 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7;">
          <span style="font-size: 1.5rem;">💰</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 운반비</div>
          <div class="stat-value">{{ formatNumber(totalDeliveryFee) }}원</div>
          <div class="stat-sub">{{ deliveryCount }}건</div>
        </div>
      </div>

      <!-- 총 회수 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">
          <span style="font-size: 1.5rem;">🔄</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 회수</div>
          <div class="stat-value">{{ formatNumber(totalTrips) }}회</div>
          <div class="stat-sub">누적</div>
        </div>
      </div>

      <!-- 평균 단가 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #d1fae5;">
          <span style="font-size: 1.5rem;">📊</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">평균 단가</div>
          <div class="stat-value">{{ formatNumber(averageUnitPrice) }}원</div>
          <div class="stat-sub">회당</div>
        </div>
      </div>

      <!-- 총 거리 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #fce7f3;">
          <span style="font-size: 1.5rem;">🛣️</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 거리</div>
          <div class="stat-value">{{ formatNumber(totalDistance) }}km</div>
          <div class="stat-sub">누적</div>
        </div>
      </div>
    </div>

    <!-- 차량별 운반비 집계 (전체 선택 시) -->
    <div v-if="!selectedUserId && vehicleSummary.length > 0" class="summary-section">
      <div class="summary-header">
        <h3 class="summary-title">🚛 레미콘 운반비 합계</h3>
      </div>

      <div class="summary-table-wrapper">
        <table class="summary-table">
          <thead>
            <tr>
              <th>일반<br>(차번)</th>
              <th>회전도</th>
              <th>운반비</th>
              <th>km</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vehicle in vehicleSummary" :key="vehicle.vehicleId">
              <td class="vehicle-cell">{{ vehicle.carNum }}</td>
              <td class="number-cell"><strong>{{ vehicle.tripCount }}</strong></td>
              <td class="number-cell">{{ formatNumber(vehicle.deliveryFee) }}</td>
              <td class="number-cell">{{ formatNumber(Math.round(vehicle.distanceKm)) }}</td>
            </tr>
            <tr class="total-row">
              <td class="total-label">합계</td>
              <td class="total-value">{{ formatNumber(totalTrips) }}</td>
              <td class="total-value">{{ formatNumber(totalDeliveryFee) }}</td>
              <td class="total-value">{{ formatNumber(Math.round(totalDistance)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 기사 상세 정보 (기사 선택 시) -->
    <div v-if="selectedDriverDetail" class="driver-info-section">
      <div class="driver-info-card">
        <div class="driver-info-header">
          <span class="info-icon">👤</span>
          <h4 class="info-title">기사 정보</h4>
        </div>
        <div class="driver-info-body">
          <div class="info-row">
            <span class="info-label">차량번호:</span>
            <span class="info-value">{{ selectedDriverDetail.carNum }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">기사명:</span>
            <span class="info-value">{{ selectedDriverDetail.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">업체명:</span>
            <span class="info-value highlight-text">{{ selectedDriverDetail.company }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">은행:</span>
            <span class="info-value">{{ selectedDriverDetail.bank }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">계좌번호:</span>
            <span class="info-value account-number">{{ selectedDriverDetail.account }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 날짜별 운반비 (기사 선택 시 + 일 전체 선택 시) -->
    <div v-if="selectedUserId && !selectedDay && dailyData.length > 0" class="summary-section">
      <div class="summary-header">
        <h3 class="summary-title">📅 {{ selectedUserName }} - 날짜별 운반비</h3>
      </div>

      <div class="two-column-layout">
        <!-- 왼쪽 테이블 (1-16일) -->
        <div class="column-wrapper">
          <table class="summary-table daily-table">
            <thead>
              <tr>
                <th>일자</th>
                <th>차량</th>
                <th>회전수</th>
                <th>운반비</th>
                <th>km</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="daily in dailyDataLeft" :key="daily.day">
                <td class="date-cell">{{ String(selectedMonth).padStart(2, '0') }}월 {{ String(daily.day).padStart(2, '0') }}일</td>
                <template v-if="daily.data.length > 0">
                  <td class="vehicle-cell">{{ getVehicleCarNum(daily.data[0].vehicleId) }}</td>
                  <td class="number-cell">{{ daily.data[0].tripCount || '-' }}</td>
                  <td class="number-cell">{{ formatNumber(daily.data[0].deliveryFee) }}</td>
                  <td class="number-cell">{{ formatNumber(Math.round(daily.data[0].distanceKm)) }}</td>
                  <td class="memo-cell">{{ daily.data[0].memo || '-' }}</td>
                </template>
                <template v-else>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 오른쪽 테이블 (17-말일) -->
        <div class="column-wrapper">
          <table class="summary-table daily-table">
            <thead>
              <tr>
                <th>일자</th>
                <th>차량</th>
                <th>회전수</th>
                <th>운반비</th>
                <th>km</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="daily in dailyDataRight" :key="daily.day">
                <td class="date-cell">{{ String(selectedMonth).padStart(2, '0') }}월 {{ String(daily.day).padStart(2, '0') }}일</td>
                <template v-if="daily.data.length > 0">
                  <td class="vehicle-cell">{{ getVehicleCarNum(daily.data[0].vehicleId) }}</td>
                  <td class="number-cell">{{ daily.data[0].tripCount || '-' }}</td>
                  <td class="number-cell">{{ formatNumber(daily.data[0].deliveryFee) }}</td>
                  <td class="number-cell">{{ formatNumber(Math.round(daily.data[0].distanceKm)) }}</td>
                  <td class="memo-cell">{{ daily.data[0].memo || '-' }}</td>
                </template>
                <template v-else>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 합계 (하단에 별도 표시) -->
      <div class="total-summary">
        <table class="summary-table total-only-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>차량</th>
              <th>일반</th>
              <th>금산도</th>
              <th>운반비</th>
              <th>km</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            <tr class="total-row">
              <td class="total-label">합계</td>
              <td>-</td>
              <td class="total-value">{{ formatNumber(totalTrips) }}</td>
              <td>-</td>
              <td class="total-value">{{ formatNumber(totalDeliveryFee) }}</td>
              <td class="total-value">{{ formatNumber(Math.round(totalDistance)) }}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>일자</th>
              <th>운전자</th>
              <th>차량번호</th>
              <th>회수</th>
              <th>단가</th>
              <th>운반비</th>
              <th>거리(km)</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in deliveryData" :key="item.deliveryId">
              <td>{{ formatDate(item.workDate) }}</td>
              <td>{{ getUserName(item.userId) }}</td>
              <td>{{ getVehicleCarNum(item.vehicleId) }}</td>
              <td class="number-cell"><strong>{{ item.tripCount }}회</strong></td>
              <td class="number-cell">{{ formatNumber(item.unitPrice) }}원</td>
              <td class="number-cell highlight">{{ formatNumber(item.deliveryFee) }}원</td>
              <td class="number-cell">{{ formatNumber(item.distanceKm) }}</td>
              <td class="memo-cell">{{ item.memo || '-' }}</td>
              <td>
                <button @click="openEditModal(item)" class="btn-icon btn-edit">✏️</button>
                <button @click="deleteDelivery(item.deliveryId)" class="btn-icon btn-delete">🗑️</button>
              </td>
            </tr>
            <tr v-if="deliveryData.length === 0">
              <td colspan="9" class="empty-cell">등록된 운반비 데이터가 없습니다</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 입력/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>
            <span style="margin-right: 0.5rem;">🚛</span>
            {{ modal.deliveryId ? '운반비 수정' : '운반비 입력' }}
          </h5>
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
              <select v-model="modal.vehicleId" @change="onVehicleChange" class="custom-select">
                <option value="">선택하세요</option>
                <option v-for="v in remiconVehicles" :key="v.vehicleId" :value="v.vehicleId">
                  {{ v.carNum }} ({{ v.modelName }})
                </option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">운전자</label>
            <div class="custom-select-wrapper">
              <select v-model="modal.userId" class="custom-select" :disabled="isVehicleAssigned">
                <option value="">{{ getDriverPlaceholder() }}</option>
                <option v-for="u in users" :key="u.userId" :value="u.userId">{{ u.name }}</option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
            <div class="input-hint" v-if="isVehicleAssigned">
              이 차량은 {{ getAssignedDriverName() }}에게 배정되어 있습니다.
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">회수 *</label>
            <input type="number" v-model.number="modal.tripCount" @input="calculateDeliveryFee" 
              placeholder="예: 10" class="custom-input" step="1" min="0" />
          </div>

          <div class="mb-3">
            <label class="form-label">단가 *</label>
            <input type="number" v-model.number="modal.unitPrice" @input="calculateDeliveryFee"
              placeholder="예: 71500" class="custom-input" step="100" min="0" />
            <div class="input-hint">기본 단가: 71,500원</div>
          </div>

          <div class="mb-3">
            <label class="form-label">운반비 (자동 계산)</label>
            <input type="number" v-model.number="modal.deliveryFee" 
              class="custom-input calculated-input" readonly />
            <div class="input-hint">= 회수 × 단가</div>
          </div>

          <div class="mb-3">
            <label class="form-label">거리 (km)</label>
            <input type="number" v-model.number="modal.distanceKm" 
              placeholder="예: 15.5" class="custom-input" step="0.1" min="0" />
          </div>

          <div class="mb-3">
            <label class="form-label">비고</label>
            <input type="text" v-model="modal.memo" 
              placeholder="메모를 입력하세요" class="custom-input" />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="deleteFromModal" v-if="modal.deliveryId" class="btn-custom btn-danger">
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
import ExcelJS from 'exceljs'

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedDay = ref('')
const selectedUserId = ref('')

const users = ref([])
const vehicles = ref([])
const deliveryData = ref([])
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

const remiconVehicles = computed(() => {
  return vehicles.value.filter(v => 
    v.carType === '지입레미콘' || v.carType === '자차레미콘'
  )
})

const remiconDrivers = computed(() => {
  const driversMap = new Map()
  
  const remiconVehicleList = vehicles.value.filter(v => 
    v.carType === '지입레미콘' || v.carType === '자차레미콘'
  )
  
  remiconVehicleList.forEach(vehicle => {
    if (vehicle.userId && vehicle.userId > 0) {
      const user = users.value.find(u => u.userId === vehicle.userId)
      if (user) {
        if (!driversMap.has(vehicle.userId)) {
          driversMap.set(vehicle.userId, {
            userId: vehicle.userId,
            name: user.name,
            carNum: vehicle.carNum,
            displayName: `${vehicle.carNum} - ${user.name}`
          })
        }
      }
    }
  })
  
  return Array.from(driversMap.values()).sort((a, b) => 
    a.carNum.localeCompare(b.carNum, 'ko-KR')
  )
})

const isVehicleAssigned = computed(() => {
  if (!modal.value.vehicleId) return false
  const vehicle = vehicles.value.find(v => v.vehicleId === modal.value.vehicleId)
  return vehicle && vehicle.userId > 0
})

const totalDeliveryFee = computed(() => {
  return deliveryData.value.reduce((sum, item) => sum + (item.deliveryFee || 0), 0)
})

const deliveryCount = computed(() => {
  return deliveryData.value.length
})

const totalTrips = computed(() => {
  return deliveryData.value.reduce((sum, item) => sum + (item.tripCount || 0), 0)
})

const totalDistance = computed(() => {
  return deliveryData.value.reduce((sum, item) => sum + (item.distanceKm || 0), 0)
})

const averageUnitPrice = computed(() => {
  if (deliveryData.value.length === 0) return 0
  const total = deliveryData.value.reduce((sum, item) => sum + (item.unitPrice || 0), 0)
  return Math.round(total / deliveryData.value.length)
})

const vehicleSummary = computed(() => {
  const summary = {}
  
  deliveryData.value.forEach(item => {
    const vehicleId = item.vehicleId
    
    if (!summary[vehicleId]) {
      summary[vehicleId] = {
        vehicleId: vehicleId,
        carNum: getVehicleCarNum(vehicleId),
        tripCount: 0,
        deliveryFee: 0,
        distanceKm: 0
      }
    }
    
    summary[vehicleId].tripCount += item.tripCount || 0
    summary[vehicleId].deliveryFee += item.deliveryFee || 0
    summary[vehicleId].distanceKm += item.distanceKm || 0
  })
  
  return Object.values(summary).sort((a, b) => 
    a.carNum.localeCompare(b.carNum, 'ko-KR')
  )
})

const dailyData = computed(() => {
  if (!selectedUserId.value) return []
  
  const days = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  const result = []
  
  for (let day = 1; day <= days; day++) {
    const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    const dayData = deliveryData.value.filter(item => {
      const itemDate = new Date(item.workDate).toISOString().split('T')[0]
      return itemDate === dateStr
    })
    
    result.push({
      day: day,
      date: dateStr,
      data: dayData
    })
  }
  
  return result
})

const dailyDataLeft = computed(() => {
  return dailyData.value.filter(d => d.day <= 16)
})

const dailyDataRight = computed(() => {
  return dailyData.value.filter(d => d.day > 16)
})

const selectedUserName = computed(() => {
  if (!selectedUserId.value) return ''
  const user = users.value.find(u => u.userId === selectedUserId.value)
  return user ? user.name : ''
})

const driverInfo = {
  '6123': { company: '백승건기', bank: '농협', account: '351-1171-4363-33', fax: 'F634-0219' },
  '6268': { company: '보령건설중기', bank: '농협', account: '467054-52-063559', fax: 'F 936-6548' },
  '6269': { company: '보령건설중기', bank: '농협', account: '352-0777-4414-53', fax: 'F 936-6548' },
  '6645': { company: '보령건설중기', bank: '농협', account: '441-12-286090', fax: 'F 936-6548' },
  '6793': { company: '수암중기', bank: '농협', account: '467065-56-017080', fax: 'F 0504-018-4940' },
  '6847': { company: '보령건설중기', bank: '농협', account: '467021-52-052178', fax: 'F 936-6548' },
  '7932': { company: '보령건설중기', bank: '농협', account: '352-5404-1812-13', fax: 'F 936-6548' },
  '7934': { company: '보령건설중기', bank: '우리은행', account: '1002-846-311029', fax: 'F 936-6548' },
  '7936': { company: '보령건설중기', bank: '농협', account: '467021-52-053743', fax: 'F 936-6548' },
  '8273': { company: '대흥중기', bank: '농협', account: '352-0521-2398-13', fax: 'F 0504-018-4940' }
}

const companyVehicles = {
  '백승건기': ['6123'],
  '보령건설중기': ['6268', '6269', '6645', '6847', '7932', '7934', '7936'],
  '수암중기': ['6793'],
  '대흥중기': ['8273']
}

const selectedDriverDetail = computed(() => {
  if (!selectedUserId.value) return null
  
  const driver = remiconDrivers.value.find(d => d.userId === selectedUserId.value)
  if (!driver) return null
  
  const info = driverInfo[driver.carNum]
  if (!info) return null
  
  return {
    carNum: driver.carNum,
    name: driver.name,
    company: info.company,
    bank: info.bank,
    account: info.account
  }
})

const getUserName = (userId) => {
  const user = users.value.find(u => u.userId === userId)
  return user ? user.name : '-'
}

const getVehicleCarNum = (vehicleId) => {
  const vehicle = vehicles.value.find(v => v.vehicleId === vehicleId)
  return vehicle ? vehicle.carNum : '-'
}

const getVehicleDriverName = (vehicleId) => {
  const vehicle = vehicles.value.find(v => v.vehicleId === vehicleId)
  if (!vehicle || !vehicle.userId) return '-'
  return getUserName(vehicle.userId)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} (${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})`
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('ko-KR')
}

const onVehicleChange = () => {
  const vehicle = vehicles.value.find(v => v.vehicleId === modal.value.vehicleId)
  if (vehicle && vehicle.userId > 0) {
    modal.value.userId = vehicle.userId
  } else {
    modal.value.userId = ''
  }
}

const getDriverPlaceholder = () => {
  if (!modal.value.vehicleId) return '먼저 차량을 선택하세요'
  if (isVehicleAssigned.value) return '자동 설정됨'
  return '운전자를 선택하세요'
}

const getAssignedDriverName = () => {
  if (!modal.value.vehicleId) return ''
  const vehicle = vehicles.value.find(v => v.vehicleId === modal.value.vehicleId)
  if (!vehicle || vehicle.userId === 0) return ''
  return getUserName(vehicle.userId)
}

const calculateDeliveryFee = () => {
  const trips = modal.value.tripCount || 0
  const unitPrice = modal.value.unitPrice || 0
  modal.value.deliveryFee = trips * unitPrice
}

const openAddModal = () => {
  const today = new Date()
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  modal.value = {
    deliveryId: null,
    workDate: dateStr,
    vehicleId: '',
    userId: '',
    tripCount: 0,
    unitPrice: 71500,
    deliveryFee: 0,
    distanceKm: 0,
    memo: ''
  }

  showModal.value = true
}

const openEditModal = (item) => {
  modal.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modal.value = {}
}

const saveModal = async () => {
  if (!modal.value.vehicleId) {
    alert('차량을 선택해주세요')
    return
  }

  if (!modal.value.tripCount || modal.value.tripCount <= 0) {
    alert('회수를 입력해주세요')
    return
  }

  if (!modal.value.unitPrice || modal.value.unitPrice <= 0) {
    alert('단가를 입력해주세요')
    return
  }

  try {
    await api.post('/remicon/delivery/save', modal.value)
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
  await deleteDelivery(modal.value.deliveryId)
  closeModal()
}

const deleteDelivery = async (deliveryId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await api.post('/remicon/delivery/delete', { deliveryId })
    await loadData()
  } catch (error) {
    console.error('삭제 오류:', error)
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [u, v, d] = await Promise.all([
      api.post('/users/list'),
      api.post('/vehicles', { userId: 0 }),
      api.post('/remicon/delivery/list', {
        year: selectedYear.value,
        month: selectedMonth.value,
        day: selectedDay.value || null,
        userId: selectedUserId.value || null
      })
    ])

    users.value = u.data || u
    vehicles.value = v.data || v
    deliveryData.value = d.data || d
  } catch (error) {
    console.error('데이터 조회 오류:', error)
    alert('데이터를 불러오는 중 오류가 발생했습니다')
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
//  기존 세금계산서용 엑셀 다운로드 (변경 없음)
// ─────────────────────────────────────────────────────────────
const exportToExcel = async () => {
  if (selectedUserId.value) {
    alert('전체 기사 선택 시에만 엑셀 다운로드가 가능합니다')
    return
  }

  if (deliveryData.value.length === 0) {
    alert('다운로드할 데이터가 없습니다')
    return
  }

  try {
    const workbook = new ExcelJS.Workbook()

    const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    for (const [companyName, carNums] of Object.entries(companyVehicles)) {
      let hasData = false
      const worksheet = workbook.addWorksheet(companyName)

      worksheet.columns = [
        { width: 35 },
        { width: 20 }
      ]

      let currentRow = 1

      for (let idx = 0; idx < carNums.length; idx++) {
        const carNum = carNums[idx]

        const vehicleData = deliveryData.value.filter(d => {
          const vCarNum = getVehicleCarNum(d.vehicleId)
          return vCarNum === carNum
        })

        if (vehicleData.length === 0) continue

        hasData = true

        const totalTripCount = vehicleData.reduce((sum, d) => sum + (d.tripCount || 0), 0)
        const totalDelivery = vehicleData.reduce((sum, d) => sum + (d.deliveryFee || 0), 0)

        const driverName = getVehicleDriverName(vehicleData[0].vehicleId)
        const info = driverInfo[carNum]
        const fax = info ? info.fax : ''

        const supplyAmount = Math.round(totalDelivery / 1.1)
        const taxAmount = totalDelivery - supplyAmount

        if (currentRow > 1) {
          currentRow += 2
        }

        const headerRow = worksheet.getRow(currentRow)
        headerRow.getCell(1).value = `${carNum}(${driverName})-${fax}`
        headerRow.getCell(1).font = { bold: true, size: 12 }
        headerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFB4C7E7' }
        }
        headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
        headerRow.getCell(1).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        worksheet.mergeCells(currentRow, 1, currentRow, 2)
        currentRow++

        const supplierInfo = [
          ['공급받는자', '제일개발㈜'],
          ['대표자', '박인경'],
          ['사업자번호', '316-81-16371'],
          ['업태/종목', '제조/레미콘'],
          ['주      소', '충남 보령시 오천면 충청수영로 467'],
          ['메일주소', 'corp_jeil@naver.com']
        ]

        supplierInfo.forEach(([label, value]) => {
          const row = worksheet.getRow(currentRow)
          row.getCell(1).value = label
          row.getCell(2).value = value
          
          row.getCell(1).font = { bold: true, size: 10 }
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          }
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
          row.getCell(1).border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
          
          row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
          row.getCell(2).border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
          
          currentRow++
        })

        const dateRow = worksheet.getRow(currentRow)
        dateRow.getCell(1).value = `${dateStr}일자 레미콘운반비`
        dateRow.getCell(1).font = { bold: true, size: 11 }
        dateRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' }
        }
        dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
        dateRow.getCell(1).border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
        worksheet.mergeCells(currentRow, 1, currentRow, 2)
        currentRow++

        const resultData = [
          { label: '탕수', value: totalTripCount, isTotal: false },
          { label: '공급가액', value: supplyAmount, isTotal: false },
          { label: '세액', value: taxAmount, isTotal: false },
          { label: '합계', value: totalDelivery, isTotal: true }
        ]

        resultData.forEach(({ label, value, isTotal }) => {
          const row = worksheet.getRow(currentRow)
          row.getCell(1).value = label
          row.getCell(2).value = value
          
          row.getCell(1).font = { bold: true, size: 11 }
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isTotal ? 'FFFFD966' : 'FFE7E6E6' }
          }
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
          row.getCell(1).border = {
            top: { style: 'thin' },
            bottom: { style: isTotal ? 'medium' : 'thin' },
            left: { style: 'medium' },
            right: { style: 'thin' }
          }
          
          row.getCell(2).font = { bold: isTotal, size: 11 }
          row.getCell(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isTotal ? 'FFFFD966' : 'FFFFFFFF' }
          }
          row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
          row.getCell(2).numFmt = '#,##0'
          row.getCell(2).border = {
            top: { style: 'thin' },
            bottom: { style: isTotal ? 'medium' : 'thin' },
            left: { style: 'thin' },
            right: { style: 'medium' }
          }
          
          currentRow++
        })
      }

      if (!hasData) {
        workbook.removeWorksheet(worksheet.id)
      }
    }

    if (workbook.worksheets.length === 0) {
      alert('다운로드할 데이터가 없습니다')
      return
    }

    const fileName = `레미콘운반비_세금계산서_${selectedYear.value}년${selectedMonth.value}월.xlsx`

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    alert('세금계산서 엑셀 파일이 다운로드되었습니다')
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error)
    alert('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message)
  }
}

// ─────────────────────────────────────────────────────────────
//  신규 월간 현황 엑셀 다운로드
// ─────────────────────────────────────────────────────────────
const exportMonthlyReport = async () => {
  if (selectedUserId.value) {
    alert('전체 기사 선택 시에만 월간 현황 다운로드가 가능합니다')
    return
  }

  if (deliveryData.value.length === 0) {
    alert('다운로드할 데이터가 없습니다')
    return
  }

  try {
    const workbook = new ExcelJS.Workbook()
    const year = selectedYear.value
    const month = selectedMonth.value
    const monthStr = `${year}년 ${month}월`

    // ── 헬퍼: 셀 기본 스타일 적용 ──────────────────────────
    const applyBorder = (cell, style = 'thin') => {
      cell.border = {
        top: { style },
        bottom: { style },
        left: { style },
        right: { style }
      }
    }

    const headerFill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
    const subHeaderFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } }
    const totalFill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }
    const evenRowFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F9FF' } }
    const memoHighlightFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0CC' } }
    const specialMemoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }

    const SPECIAL_MEMO_KEYWORDS = ['물차', '폐수', '특수', '불출', '반납', '슬럼프']

    const isSpecialMemo = (memo) => {
      if (!memo) return false
      return SPECIAL_MEMO_KEYWORDS.some(kw => memo.includes(kw))
    }

    // ════════════════════════════════════════════════════════
    //  시트 0: 기사별 × 날짜별 피벗 현황 (메인 시트)
    // ════════════════════════════════════════════════════════
    const wsPivot = workbook.addWorksheet('📅 기사별 날짜 현황')
    const totalDaysPivot = new Date(year, month, 0).getDate()
    const dayNamesPivot = ['일', '월', '화', '수', '목', '금', '토']

    const DATE_COL_START = 4
    const TOTAL_TRIPS_COL = DATE_COL_START + totalDaysPivot
    const TOTAL_FEE_COL = TOTAL_TRIPS_COL + 1

    const pivotCols = [
      { width: 10 },
      { width: 8 },
      { width: 12 },
    ]
    for (let d = 1; d <= totalDaysPivot; d++) {
      pivotCols.push({ width: 5.5 })
    }
    pivotCols.push({ width: 8 })
    pivotCols.push({ width: 13 })
    wsPivot.columns = pivotCols

    // ── 제목 행 (1행) ──────────────────────────────────────
    wsPivot.mergeCells(1, 1, 1, TOTAL_FEE_COL)
    const pivotTitle = wsPivot.getCell('A1')
    pivotTitle.value = `🚛 레미콘 운반비  기사별 × 날짜별 현황  [${monthStr}]`
    pivotTitle.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } }
    pivotTitle.fill = headerFill
    pivotTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    wsPivot.getRow(1).height = 34

    // ── 요일 보조 행 (2행) ───────────────────────────────
    const dayOfWeekRow = wsPivot.getRow(2)
    ;['차량번호', '기사명', '업체명'].forEach((h, i) => {
      const cell = dayOfWeekRow.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
      cell.fill = subHeaderFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell, 'medium')
    })
    for (let d = 1; d <= totalDaysPivot; d++) {
      const col = DATE_COL_START + d - 1
      const dateObj = new Date(year, month - 1, d)
      const dow = dateObj.getDay()
      const dayName = dayNamesPivot[dow]
      const cell = dayOfWeekRow.getCell(col)
      cell.value = dayName
      cell.font = {
        bold: true, size: 9,
        color: { argb: dow === 0 ? 'FFCC0000' : (dow === 6 ? 'FF0066CC' : 'FFFFFFFF') }
      }
      cell.fill = dow === 0
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9999' } }
        : dow === 6
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9999FF' } }
          : subHeaderFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell)
    }
    ;[['총\n회수', TOTAL_TRIPS_COL], ['총 운반비', TOTAL_FEE_COL]].forEach(([label, col]) => {
      const cell = dayOfWeekRow.getCell(col)
      cell.value = label
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF833C00' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyBorder(cell, 'medium')
    })
    dayOfWeekRow.height = 22

    // ── 날짜 헤더 행 (3행) ──────────────────────────────────
    const dateHeaderRow = wsPivot.getRow(3)
    ;['차량번호', '기사명', '업체명'].forEach((_, i) => {
      const cell = dateHeaderRow.getCell(i + 1)
      cell.value = ''
      cell.fill = subHeaderFill
      applyBorder(cell, 'medium')
    })
    for (let d = 1; d <= totalDaysPivot; d++) {
      const col = DATE_COL_START + d - 1
      const dateObj = new Date(year, month - 1, d)
      const dow = dateObj.getDay()
      const cell = dateHeaderRow.getCell(col)
      cell.value = d
      cell.font = {
        bold: true, size: 10,
        color: { argb: dow === 0 ? 'FFCC0000' : (dow === 6 ? 'FF1F5E9E' : 'FF1F4E79') }
      }
      cell.fill = dow === 0
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEEE' } }
        : dow === 6
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEFF' } }
          : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell)
    }
    ;[1, 2, 3].forEach(col => {
      wsPivot.mergeCells(2, col, 3, col)
    })
    ;[TOTAL_TRIPS_COL, TOTAL_FEE_COL].forEach(col => {
      wsPivot.mergeCells(2, col, 3, col)
    })
    dateHeaderRow.height = 20

    // ── 기사별 데이터 행 생성 ─────────────────────────────
    const pivotDrivers = [...new Set(deliveryData.value.map(d => getVehicleCarNum(d.vehicleId)))]
      .sort((a, b) => a.localeCompare(b, 'ko-KR'))

    let pivotRowIdx = 4
    const SPECIAL_MEMO_KEYWORDS_P = ['물차', '폐수', '특수', '불출', '반납', '슬럼프']

    pivotDrivers.forEach((carNum, driverIdx) => {
      const carItems = deliveryData.value.filter(d => getVehicleCarNum(d.vehicleId) === carNum)
      if (carItems.length === 0) return

      const driverName = getUserName(carItems[0].userId)
      const company = driverInfo[carNum]?.company || '-'
      const isEvenDriver = driverIdx % 2 === 0
      const rowBg = isEvenDriver
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F9FF' } }
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      const memoBg = isEvenDriver
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF5FF' } }
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } }

      const hasMemo = carItems.some(d => d.memo && d.memo.trim() !== '')
      const dataRowNum = pivotRowIdx
      const memoRowNum = hasMemo ? pivotRowIdx + 1 : null

      const leftData = [carNum, driverName, company]
      leftData.forEach((val, ci) => {
        const cell = wsPivot.getRow(dataRowNum).getCell(ci + 1)
        cell.value = val
        cell.font = { bold: ci === 0, size: 10 }
        cell.fill = rowBg
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        applyBorder(cell, ci === 0 ? 'medium' : 'thin')

        if (hasMemo) {
          const mCell = wsPivot.getRow(memoRowNum).getCell(ci + 1)
          mCell.fill = memoBg
          applyBorder(mCell)
          if (ci === 0) {
            mCell.value = '비고'
            mCell.font = { size: 8, italic: true, color: { argb: 'FF808080' } }
            mCell.alignment = { horizontal: 'center', vertical: 'middle' }
          }
        }
      })

      let totalTripsRow = 0
      let totalFeeRow = 0

      for (let d = 1; d <= totalDaysPivot; d++) {
        const col = DATE_COL_START + d - 1
        const dateStr3 = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dateObj = new Date(year, month - 1, d)
        const dow = dateObj.getDay()
        const isSun = dow === 0
        const isSat = dow === 6

        const dayItems = carItems.filter(item => {
          const iDate = new Date(item.workDate).toISOString().split('T')[0]
          return iDate === dateStr3
        })

        const dataCell = wsPivot.getRow(dataRowNum).getCell(col)
        if (dayItems.length > 0) {
          const trips = dayItems.reduce((s, x) => s + (x.tripCount || 0), 0)
          const fee = dayItems.reduce((s, x) => s + (x.deliveryFee || 0), 0)
          const memoText = dayItems.map(x => x.memo || '').filter(Boolean).join(', ')
          const hasSpecial = SPECIAL_MEMO_KEYWORDS_P.some(kw => memoText.includes(kw))

          totalTripsRow += trips
          totalFeeRow += fee

          dataCell.value = trips
          dataCell.font = { bold: true, size: 10, color: { argb: hasSpecial ? 'FFC00000' : 'FF000000' } }
          dataCell.fill = hasSpecial
            ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }
            : isSun
              ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEEE' } }
              : isSat
                ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEFF' } }
                : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
          dataCell.alignment = { horizontal: 'center', vertical: 'middle' }
          applyBorder(dataCell)

          if (hasMemo) {
            const memoCell = wsPivot.getRow(memoRowNum).getCell(col)
            if (memoText) {
              const shortMemo = memoText.length > 4 ? memoText.substring(0, 4) : memoText
              memoCell.value = shortMemo
              memoCell.font = {
                size: 7,
                bold: hasSpecial,
                color: { argb: hasSpecial ? 'FFC00000' : 'FF555555' }
              }
              memoCell.fill = hasSpecial
                ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEEE' } }
                : memoBg
              memoCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            } else {
              memoCell.fill = memoBg
            }
            applyBorder(memoCell)
          }
        } else {
          dataCell.fill = isSun
            ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } }
            : isSat
              ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } }
              : rowBg
          dataCell.alignment = { horizontal: 'center' }
          applyBorder(dataCell)

          if (hasMemo) {
            const memoCell = wsPivot.getRow(memoRowNum).getCell(col)
            memoCell.fill = isSun
              ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } }
              : isSat
                ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } }
                : memoBg
            applyBorder(memoCell)
          }
        }
      }

      const totTripsCell = wsPivot.getRow(dataRowNum).getCell(TOTAL_TRIPS_COL)
      totTripsCell.value = totalTripsRow
      totTripsCell.font = { bold: true, size: 11 }
      totTripsCell.fill = totalFill
      totTripsCell.alignment = { horizontal: 'center', vertical: 'middle' }
      totTripsCell.numFmt = '#,##0'
      applyBorder(totTripsCell, 'medium')

      const totFeeCell = wsPivot.getRow(dataRowNum).getCell(TOTAL_FEE_COL)
      totFeeCell.value = totalFeeRow
      totFeeCell.font = { bold: true, size: 11, color: { argb: 'FFC00000' } }
      totFeeCell.fill = totalFill
      totFeeCell.alignment = { horizontal: 'right', vertical: 'middle' }
      totFeeCell.numFmt = '#,##0'
      applyBorder(totFeeCell, 'medium')

      wsPivot.getRow(dataRowNum).height = 20
      if (hasMemo) {
        wsPivot.getRow(memoRowNum).height = 14
        ;[TOTAL_TRIPS_COL, TOTAL_FEE_COL].forEach(col => {
          const c = wsPivot.getRow(memoRowNum).getCell(col)
          c.fill = totalFill
          applyBorder(c)
        })
        pivotRowIdx += 2
      } else {
        pivotRowIdx += 1
      }
    })

    // ── 피벗 합계 행 ─────────────────────────────────────
    const pivotTotRow = wsPivot.getRow(pivotRowIdx)
    wsPivot.mergeCells(pivotRowIdx, 1, pivotRowIdx, 3)
    const pivotTotLabel = pivotTotRow.getCell(1)
    pivotTotLabel.value = '일별 합계 (회수)'
    pivotTotLabel.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    pivotTotLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF833C00' } }
    pivotTotLabel.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(pivotTotLabel, 'medium')

    let grandTotalTrips = 0
    let grandTotalFee = 0

    for (let d = 1; d <= totalDaysPivot; d++) {
      const col = DATE_COL_START + d - 1
      const dateStr4 = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayTotal = deliveryData.value
        .filter(item => new Date(item.workDate).toISOString().split('T')[0] === dateStr4)
        .reduce((s, x) => s + (x.tripCount || 0), 0)

      const cell = pivotTotRow.getCell(col)
      if (dayTotal > 0) {
        cell.value = dayTotal
        cell.numFmt = '#,##0'
        grandTotalTrips += dayTotal
      }
      cell.font = { bold: true, size: 10 }
      cell.fill = totalFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell, 'medium')
    }

    grandTotalFee = deliveryData.value.reduce((s, x) => s + (x.deliveryFee || 0), 0)

    const pivotGrandTripsCell = pivotTotRow.getCell(TOTAL_TRIPS_COL)
    pivotGrandTripsCell.value = grandTotalTrips
    pivotGrandTripsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6600' } }
    pivotGrandTripsCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    pivotGrandTripsCell.alignment = { horizontal: 'center', vertical: 'middle' }
    pivotGrandTripsCell.numFmt = '#,##0'
    applyBorder(pivotGrandTripsCell, 'medium')

    const pivotGrandFeeCell = pivotTotRow.getCell(TOTAL_FEE_COL)
    pivotGrandFeeCell.value = grandTotalFee
    pivotGrandFeeCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    pivotGrandFeeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6600' } }
    pivotGrandFeeCell.alignment = { horizontal: 'right', vertical: 'middle' }
    pivotGrandFeeCell.numFmt = '#,##0'
    applyBorder(pivotGrandFeeCell, 'medium')
    pivotTotRow.height = 24

    // ── 피벗 시트 틀 고정 ─────────────────────────────────
    wsPivot.views = [{
      state: 'frozen',
      xSplit: 3,
      ySplit: 3,
      activeCell: 'D4'
    }]

    // ════════════════════════════════════════════════════════
    //  시트 1: 전체 현황
    // ════════════════════════════════════════════════════════
    const ws1 = workbook.addWorksheet('전체 현황')

    ws1.columns = [
      { width: 14 },
      { width: 12 },
      { width: 10 },
      { width: 8  },
      { width: 12 },
      { width: 16 },
      { width: 10 },
      { width: 30 },
    ]

    ws1.mergeCells('A1:H1')
    const titleCell = ws1.getCell('A1')
    titleCell.value = `🚛 레미콘 운반비 월간 현황  [${monthStr}]`
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = headerFill
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws1.getRow(1).height = 36

    const headers1 = ['일자', '차량번호', '기사명', '회수', '단가', '운반비', '거리(km)', '비고']
    const headerRow1 = ws1.getRow(2)
    headers1.forEach((h, i) => {
      const cell = headerRow1.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
      cell.fill = subHeaderFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell, 'medium')
    })
    headerRow1.height = 24

    const sorted = [...deliveryData.value].sort((a, b) => {
      const da = new Date(a.workDate)
      const db = new Date(b.workDate)
      if (da - db !== 0) return da - db
      return getVehicleCarNum(a.vehicleId).localeCompare(getVehicleCarNum(b.vehicleId), 'ko-KR')
    })

    let dataRowIdx = 3
    sorted.forEach((item, idx) => {
      const row = ws1.getRow(dataRowIdx)
      const isEven = idx % 2 === 0
      const memo = item.memo || ''
      const hasSpecialMemo = isSpecialMemo(memo)

      const dateObj = new Date(item.workDate)
      const dayNames = ['일', '월', '화', '수', '목', '금', '토']
      const dateLabel = `${dateObj.getMonth() + 1}/${String(dateObj.getDate()).padStart(2, '0')} (${dayNames[dateObj.getDay()]})`

      const values = [
        dateLabel,
        getVehicleCarNum(item.vehicleId),
        getUserName(item.userId),
        item.tripCount,
        Math.round(item.unitPrice / 1.1),
        item.deliveryFee,
        item.distanceKm ? Math.round(item.distanceKm * 10) / 10 : 0,
        memo || '-'
      ]

      values.forEach((v, ci) => {
        const cell = row.getCell(ci + 1)
        cell.value = v

        if (ci === 7) {
          cell.font = hasSpecialMemo
            ? { bold: true, size: 10, color: { argb: 'FFC00000' } }
            : { size: 10 }
          cell.fill = hasSpecialMemo
            ? specialMemoFill
            : (memo && memo !== '-' ? memoHighlightFill : (isEven ? evenRowFill : {}))
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        } else {
          cell.font = { size: 10 }
          cell.fill = isEven ? evenRowFill : {}
          cell.alignment = {
            horizontal: [3, 4, 5, 6].includes(ci) ? 'right' : 'center',
            vertical: 'middle'
          }
        }

        if (ci === 4 || ci === 5) cell.numFmt = '#,##0'
        if (ci === 6) cell.numFmt = '#,##0.0'

        applyBorder(cell)
      })

      row.height = hasSpecialMemo ? 22 : 18
      dataRowIdx++
    })

    const totalRow1 = ws1.getRow(dataRowIdx)
    ws1.mergeCells(dataRowIdx, 1, dataRowIdx, 3)
    const totalLabelCell1 = totalRow1.getCell(1)
    totalLabelCell1.value = '합  계'
    totalLabelCell1.font = { bold: true, size: 12 }
    totalLabelCell1.fill = totalFill
    totalLabelCell1.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(totalLabelCell1, 'medium')

    const totals1 = [
      { col: 4, val: sorted.reduce((s, d) => s + (d.tripCount || 0), 0),    fmt: '#,##0'   },
      { col: 5, val: '',                                                       fmt: ''        },
      { col: 6, val: sorted.reduce((s, d) => s + (d.deliveryFee || 0), 0),  fmt: '#,##0'   },
      { col: 7, val: Math.round(sorted.reduce((s, d) => s + (d.distanceKm || 0), 0) * 10) / 10, fmt: '#,##0.0' },
      { col: 8, val: `총 ${sorted.length}건`,                                fmt: ''        }
    ]
    totals1.forEach(({ col, val, fmt }) => {
      const cell = totalRow1.getCell(col)
      cell.value = val
      cell.font = { bold: true, size: 12 }
      cell.fill = totalFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      if (fmt) cell.numFmt = fmt
      applyBorder(cell, 'medium')
    })
    totalRow1.height = 26

    const legendRow = dataRowIdx + 2
    ws1.mergeCells(legendRow, 1, legendRow, 8)
    const legendCell = ws1.getCell(`A${legendRow}`)
    legendCell.value = `※ 비고 범례:  빨간 배경(굵게) = 특수 항목 (물차, 폐수, 특수, 불출, 반납, 슬럼프)   |   노란 배경 = 일반 메모`
    legendCell.font = { size: 9, italic: true, color: { argb: 'FF595959' } }
    legendCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    legendCell.alignment = { horizontal: 'left', vertical: 'middle' }
    ws1.getRow(legendRow).height = 18

    // ════════════════════════════════════════════════════════
    //  시트 2: 차량별 집계 요약
    // ════════════════════════════════════════════════════════
    const ws2 = workbook.addWorksheet('차량별 집계')

    ws2.columns = [
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 10 },
      { width: 16 },
      { width: 12 },
      { width: 10 },
      { width: 12 },
      { width: 8  },
    ]

    ws2.mergeCells('A1:I1')
    const title2 = ws2.getCell('A1')
    title2.value = `🚛 차량별 운반비 집계  [${monthStr}]`
    title2.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    title2.fill = headerFill
    title2.alignment = { horizontal: 'center', vertical: 'middle' }
    ws2.getRow(1).height = 36

    const headers2 = ['차량번호', '기사명', '업체명', '총 회수', '총 운반비', '공급가액', '세 액', '총 거리(km)', '건수']
    const hRow2 = ws2.getRow(2)
    headers2.forEach((h, i) => {
      const cell = hRow2.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
      cell.fill = subHeaderFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell, 'medium')
    })
    hRow2.height = 24

    const carSummaryMap = {}
    deliveryData.value.forEach(item => {
      const carNum = getVehicleCarNum(item.vehicleId)
      if (!carSummaryMap[carNum]) {
        carSummaryMap[carNum] = {
          carNum,
          driverName: getUserName(item.userId),
          company: driverInfo[carNum]?.company || '-',
          tripCount: 0,
          deliveryFee: 0,
          distanceKm: 0,
          count: 0
        }
      }
      carSummaryMap[carNum].tripCount  += item.tripCount  || 0
      carSummaryMap[carNum].deliveryFee += item.deliveryFee || 0
      carSummaryMap[carNum].distanceKm  += item.distanceKm  || 0
      carSummaryMap[carNum].count++
    })

    const carSummaries = Object.values(carSummaryMap).sort((a, b) =>
      a.carNum.localeCompare(b.carNum, 'ko-KR')
    )

    let rowIdx2 = 3
    carSummaries.forEach((s, idx) => {
      const row = ws2.getRow(rowIdx2)
      const isEven = idx % 2 === 0
      const supply = Math.round(s.deliveryFee / 1.1)
      const tax = s.deliveryFee - supply

      const vals = [
        s.carNum, s.driverName, s.company,
        s.tripCount, s.deliveryFee, supply, tax,
        Math.round(s.distanceKm * 10) / 10, s.count
      ]
      vals.forEach((v, ci) => {
        const cell = row.getCell(ci + 1)
        cell.value = v
        cell.font = { size: 10, bold: ci === 4 }
        cell.fill = isEven ? evenRowFill : {}
        cell.alignment = { horizontal: ci >= 3 ? 'right' : 'center', vertical: 'middle' }
        if ([4, 5, 6].includes(ci)) cell.numFmt = '#,##0'
        if (ci === 7) cell.numFmt = '#,##0.0'
        applyBorder(cell)
      })
      row.height = 20
      rowIdx2++
    })

    const totRow2 = ws2.getRow(rowIdx2)
    ws2.mergeCells(rowIdx2, 1, rowIdx2, 3)
    const tl2 = totRow2.getCell(1)
    tl2.value = '합  계'
    tl2.font = { bold: true, size: 12 }
    tl2.fill = totalFill
    tl2.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(tl2, 'medium')

    const grandTrips  = carSummaries.reduce((s, d) => s + d.tripCount, 0)
    const grandFee    = carSummaries.reduce((s, d) => s + d.deliveryFee, 0)
    const grandSupply = Math.round(grandFee / 1.1)
    const grandTax    = grandFee - grandSupply
    const grandDist   = Math.round(carSummaries.reduce((s, d) => s + d.distanceKm, 0) * 10) / 10
    const grandCount  = carSummaries.reduce((s, d) => s + d.count, 0)

    const grandVals = [
      { col: 4, val: grandTrips,  fmt: '#,##0'   },
      { col: 5, val: grandFee,    fmt: '#,##0'   },
      { col: 6, val: grandSupply, fmt: '#,##0'   },
      { col: 7, val: grandTax,    fmt: '#,##0'   },
      { col: 8, val: grandDist,   fmt: '#,##0.0' },
      { col: 9, val: grandCount,  fmt: '#,##0'   },
    ]
    grandVals.forEach(({ col, val, fmt }) => {
      const cell = totRow2.getCell(col)
      cell.value = val
      cell.font = { bold: true, size: 12 }
      cell.fill = totalFill
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      if (fmt) cell.numFmt = fmt
      applyBorder(cell, 'medium')
    })
    totRow2.height = 26

    // ════════════════════════════════════════════════════════
    //  시트 3: 지급공제내역 (세무사 자료)
    // ════════════════════════════════════════════════════════
    const SANJAE      = 48660
    const GOYONG      = 22500
    const SANGJO_BASE = 50000
    const SANGJO_7932 = 350000
    const GOYONG_CARS = ['6269', '6793', '6645', '7932']

    const wsAcc = workbook.addWorksheet('📋 지급공제내역')

    wsAcc.columns = [
      { width: 10 },  // A: 차량번호
      { width: 10 },  // B: 기사명
      { width: 14 },  // C: 업체명
      { width: 16 },  // D: 운반비
      { width: 10 },  // E: 산재보험
      { width: 10 },  // F: 고용보험
      { width: 10 },  // G: 상조회비
      { width: 14 },  // H: 공제합계
      { width: 16 },  // I: 실지급액
      { width: 8  },  // J: 은행
      { width: 22 },  // K: 계좌번호
    ]

    // ── 제목 ──────────────────────────────────────────────
    wsAcc.mergeCells('A1:K1')
    const accTitle = wsAcc.getCell('A1')
    accTitle.value = `🚛 레미콘 운반비 지급공제내역  [${monthStr}]`
    accTitle.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } }
    accTitle.fill = headerFill
    accTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    wsAcc.getRow(1).height = 34

    // ── 컬럼 헤더 ─────────────────────────────────────────
    const accHeaders = ['차량번호', '기사명', '업체명', '운반비', '산재보험', '고용보험', '상조회비', '공제합계', '실지급액', '은행', '계좌번호']
    const accHRow = wsAcc.getRow(2)
    accHeaders.forEach((h, i) => {
      const cell = accHRow.getCell(i + 1)
      cell.value = h
      cell.font  = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
      cell.fill  = subHeaderFill
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell, 'medium')
    })
    wsAcc.getRow(2).height = 22

    // ── 기사별 데이터 행 ──────────────────────────────────
    let accRowIdx   = 3
    let totalSangjo = 0

    carSummaries.forEach((s, idx) => {
      const row    = wsAcc.getRow(accRowIdx)
      const isEven = idx % 2 === 0

      const sanjae         = SANJAE
      const goyong         = GOYONG_CARS.includes(s.carNum) ? GOYONG : 0
      const sangjo         = s.carNum === '7932' ? SANGJO_7932 : SANGJO_BASE
      totalSangjo         += sangjo
      const totalDeduction = sanjae + goyong + sangjo
      const netPay         = s.deliveryFee - totalDeduction
      const info           = driverInfo[s.carNum]

      const bgFill = isEven
        ? evenRowFill
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }

      const vals = [
        s.carNum, s.driverName, s.company,
        s.deliveryFee,
        sanjae,
        goyong > 0 ? goyong : '',
        sangjo,
        totalDeduction,
        netPay,
        info?.bank    || '-',
        info?.account || '-'
      ]

      vals.forEach((v, ci) => {
        const cell = row.getCell(ci + 1)
        cell.value = v

        if (ci === 8) {
          // 실지급액 강조
          cell.font = { bold: true, size: 11, color: { argb: 'FFC00000' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFF2CC' : 'FFFFD966' } }
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
          cell.numFmt = '#,##0'
        } else if (ci === 5 && !goyong) {
          // 고용보험 해당없음
          cell.value = '-'
          cell.font  = { size: 9, color: { argb: 'FFCCCCCC' } }
          cell.fill  = bgFill
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          cell.font = { size: 10 }
          cell.fill = bgFill
          if (ci >= 3 && ci <= 8 && typeof v === 'number') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
            cell.numFmt = '#,##0'
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
          }
        }

        applyBorder(cell)
      })

      row.height = 21
      accRowIdx++
    })

    // ── 합계 행 ───────────────────────────────────────────
    const accTotRow = wsAcc.getRow(accRowIdx)
    wsAcc.mergeCells(accRowIdx, 1, accRowIdx, 3)
    const accTotLabel = accTotRow.getCell(1)
    accTotLabel.value = '합  계'
    accTotLabel.font  = { bold: true, size: 12 }
    accTotLabel.fill  = totalFill
    accTotLabel.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(accTotLabel, 'medium')

    const gDelivery  = carSummaries.reduce((s, d) => s + d.deliveryFee, 0)
    const gSanjae    = carSummaries.length * SANJAE
    const gGoyong    = carSummaries.filter(s => GOYONG_CARS.includes(s.carNum)).length * GOYONG
    const gSangjo    = totalSangjo
    const gDeduction = gSanjae + gGoyong + gSangjo
    const gNet       = gDelivery - gDeduction

    ;[
      { col: 4, val: gDelivery  },
      { col: 5, val: gSanjae    },
      { col: 6, val: gGoyong    },
      { col: 7, val: gSangjo    },
      { col: 8, val: gDeduction },
      { col: 9, val: gNet       },
    ].forEach(({ col, val }) => {
      const cell = accTotRow.getCell(col)
      cell.value = val
      cell.font  = { bold: true, size: 12, ...(col === 9 ? { color: { argb: 'FFC00000' } } : {}) }
      cell.fill  = totalFill
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      cell.numFmt = '#,##0'
      applyBorder(cell, 'medium')
    })
    ;[10, 11].forEach(col => {
      const cell = accTotRow.getCell(col)
      cell.fill = totalFill
      applyBorder(cell, 'medium')
    })
    accTotRow.height = 26
    accRowIdx += 2  // 빈 줄 한 칸

    // ── 이종규 – 상조회비 수금 행 ─────────────────────────
    const jInfo = driverInfo['6645']
    const jRow  = wsAcc.getRow(accRowIdx)

    wsAcc.mergeCells(accRowIdx, 1, accRowIdx, 3)
    const jLabel = jRow.getCell(1)
    jLabel.value = '이종규  (상조회비 수금)'
    jLabel.font  = { bold: true, size: 10, color: { argb: 'FF1F4E79' } }
    jLabel.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
    jLabel.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(jLabel, 'medium')

    for (let c = 4; c <= 8; c++) {
      const cell = jRow.getCell(c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
      applyBorder(cell)
    }

    const jAmt = jRow.getCell(9)
    jAmt.value     = totalSangjo
    jAmt.font      = { bold: true, size: 11, color: { argb: 'FFC00000' } }
    jAmt.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }
    jAmt.alignment = { horizontal: 'right', vertical: 'middle' }
    jAmt.numFmt    = '#,##0'
    applyBorder(jAmt, 'medium')

    ;[10, 11].forEach((c, i) => {
      const cell = jRow.getCell(c)
      cell.value     = i === 0 ? (jInfo?.bank || '-') : (jInfo?.account || '-')
      cell.font      = { size: 10 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell)
    })
    jRow.height = 22
    accRowIdx++

    // ── 폐수 – 수기 입력 행 (이종규 계좌) ────────────────
    const pRow = wsAcc.getRow(accRowIdx)

    wsAcc.mergeCells(accRowIdx, 1, accRowIdx, 3)
    const pLabel = pRow.getCell(1)
    pLabel.value = '폐수  (수기 입력)'
    pLabel.font  = { bold: true, size: 10, color: { argb: 'FF7B3F00' } }
    pLabel.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0CC' } }
    pLabel.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(pLabel, 'medium')

    for (let c = 4; c <= 8; c++) {
      const cell = pRow.getCell(c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0CC' } }
      applyBorder(cell)
    }

    const pAmt = pRow.getCell(9)
    pAmt.value     = ''   // 수기 입력 공란
    pAmt.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
    pAmt.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(pAmt, 'medium')

    ;[10, 11].forEach((c, i) => {
      const cell = pRow.getCell(c)
      cell.value     = i === 0 ? (jInfo?.bank || '-') : (jInfo?.account || '-')
      cell.font      = { size: 10 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell)
    })
    pRow.height = 22

    // ════════════════════════════════════════════════════════
    //  시트 4~N: 차량별 일일 상세
    // ════════════════════════════════════════════════════════
    const allCarNums = [...new Set(deliveryData.value.map(d => getVehicleCarNum(d.vehicleId)))].sort((a, b) =>
      a.localeCompare(b, 'ko-KR')
    )

    for (const carNum of allCarNums) {
      const carItems = deliveryData.value
        .filter(d => getVehicleCarNum(d.vehicleId) === carNum)
        .sort((a, b) => new Date(a.workDate) - new Date(b.workDate))

      if (carItems.length === 0) continue

      const driverName = getUserName(carItems[0].userId)
      const sheetName  = `${carNum}(${driverName})`.substring(0, 31)
      const wsC        = workbook.addWorksheet(sheetName)

      wsC.columns = [
        { width: 14 },
        { width: 8  },
        { width: 8  },
        { width: 12 },
        { width: 16 },
        { width: 10 },
        { width: 30 },
      ]

      const info = driverInfo[carNum]
      wsC.mergeCells('A1:G1')
      const cTitle = wsC.getCell('A1')
      cTitle.value = `${carNum} (${driverName})  |  ${info?.company || '-'}  |  ${monthStr}`
      cTitle.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
      cTitle.fill  = headerFill
      cTitle.alignment = { horizontal: 'center', vertical: 'middle' }
      wsC.getRow(1).height = 32

      wsC.mergeCells('A2:G2')
      const infoCell = wsC.getCell('A2')
      infoCell.value = `은행: ${info?.bank || '-'}   |   계좌번호: ${info?.account || '-'}   |   FAX: ${info?.fax || '-'}`
      infoCell.font  = { size: 10, color: { argb: 'FF1F4E79' } }
      infoCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
      infoCell.alignment = { horizontal: 'center', vertical: 'middle' }
      wsC.getRow(2).height = 20

      const headersC = ['일자', '요일', '회수', '단가', '운반비', '거리(km)', '비고']
      const hRowC = wsC.getRow(3)
      headersC.forEach((h, i) => {
        const cell = hRowC.getCell(i + 1)
        cell.value = h
        cell.font  = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
        cell.fill  = subHeaderFill
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        applyBorder(cell, 'medium')
      })
      hRowC.height = 22

      const totalDays = new Date(year, month, 0).getDate()
      const dayNames  = ['일', '월', '화', '수', '목', '금', '토']
      let rowIdxC = 4

      for (let day = 1; day <= totalDays; day++) {
        const dateStr2 = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData  = carItems.filter(d => {
          const dDate = new Date(d.workDate).toISOString().split('T')[0]
          return dDate === dateStr2
        })

        const dateObj2  = new Date(dateStr2)
        const dayName   = dayNames[dateObj2.getDay()]
        const isSunday  = dateObj2.getDay() === 0
        const isSaturday = dateObj2.getDay() === 6

        if (dayData.length === 0) {
          const row = wsC.getRow(rowIdxC)
          const dateCell = row.getCell(1)
          dateCell.value = `${month}/${String(day).padStart(2, '0')}`
          dateCell.font  = { size: 9, color: { argb: isSunday ? 'FFCC0000' : (isSaturday ? 'FF0066CC' : 'FFB0B0B0') } }
          dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
          applyBorder(dateCell)

          const dayCell = row.getCell(2)
          dayCell.value = dayName
          dayCell.font  = { size: 9, color: { argb: isSunday ? 'FFCC0000' : (isSaturday ? 'FF0066CC' : 'FFB0B0B0') } }
          dayCell.alignment = { horizontal: 'center' }
          applyBorder(dayCell)

          for (let ci = 3; ci <= 7; ci++) {
            const cell = row.getCell(ci)
            cell.value = '-'
            cell.font  = { size: 9, color: { argb: 'FFD0D0D0' } }
            cell.alignment = { horizontal: 'center' }
            applyBorder(cell)
          }
          row.height = 16
        } else {
          dayData.forEach((item, di) => {
            const row      = wsC.getRow(rowIdxC)
            const memo     = item.memo || ''
            const hasSpecial = isSpecialMemo(memo)

            const dVals = [
              di === 0 ? `${month}/${String(day).padStart(2, '0')}` : '',
              di === 0 ? dayName : '',
              item.tripCount,
              Math.round(item.unitPrice / 1.1),
              item.deliveryFee,
              item.distanceKm ? Math.round(item.distanceKm * 10) / 10 : 0,
              memo || '-'
            ]

            dVals.forEach((v, ci) => {
              const cell = row.getCell(ci + 1)
              cell.value = v

              if (ci === 6) {
                cell.font = hasSpecial
                  ? { bold: true, size: 10, color: { argb: 'FFC00000' } }
                  : { size: 10 }
                cell.fill = hasSpecial ? specialMemoFill : (memo ? memoHighlightFill : {})
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
              } else {
                cell.font = { size: 10, color: { argb: isSunday ? 'FFCC0000' : (isSaturday ? 'FF0066CC' : 'FF000000') } }
                cell.alignment = { horizontal: ci >= 2 ? 'right' : 'center', vertical: 'middle' }
                if (ci === 3 || ci === 4) cell.numFmt = '#,##0'
                if (ci === 5) cell.numFmt = '#,##0.0'
              }
              applyBorder(cell)
            })
            row.height = hasSpecial ? 22 : 18
            rowIdxC++
          })
          continue
        }
        rowIdxC++
      }

      const cTotRow = wsC.getRow(rowIdxC)
      wsC.mergeCells(rowIdxC, 1, rowIdxC, 2)
      const cTotLabel = cTotRow.getCell(1)
      cTotLabel.value = '합  계'
      cTotLabel.font  = { bold: true, size: 12 }
      cTotLabel.fill  = totalFill
      cTotLabel.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cTotLabel, 'medium')

      const cTotalTrips = carItems.reduce((s, d) => s + (d.tripCount || 0), 0)
      const cTotalFee   = carItems.reduce((s, d) => s + (d.deliveryFee || 0), 0)
      const cTotalDist  = Math.round(carItems.reduce((s, d) => s + (d.distanceKm || 0), 0) * 10) / 10
      const cSupply     = Math.round(cTotalFee / 1.1)
      const cTax        = cTotalFee - cSupply

      const cTotVals = [
        { col: 3, val: cTotalTrips, fmt: '#,##0'   },
        { col: 4, val: '',          fmt: ''         },
        { col: 5, val: cTotalFee,   fmt: '#,##0'   },
        { col: 6, val: cTotalDist,  fmt: '#,##0.0' },
        { col: 7, val: `${carItems.length}건`, fmt: '' },
      ]
      cTotVals.forEach(({ col, val, fmt }) => {
        const cell = cTotRow.getCell(col)
        cell.value = val
        cell.font  = { bold: true, size: 12 }
        cell.fill  = totalFill
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
        if (fmt) cell.numFmt = fmt
        applyBorder(cell, 'medium')
      })
      cTotRow.height = 26

      const taxRowStart = rowIdxC + 2
      wsC.mergeCells(taxRowStart, 1, taxRowStart, 7)
      const taxTitle = wsC.getCell(`A${taxRowStart}`)
      taxTitle.value = '[ 세금계산서 요약 ]'
      taxTitle.font  = { bold: true, size: 11, color: { argb: 'FF1F4E79' } }
      taxTitle.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
      taxTitle.alignment = { horizontal: 'center', vertical: 'middle' }
      wsC.getRow(taxRowStart).height = 22

      const taxData = [
        ['탕수(회)', cTotalTrips, '#,##0'],
        ['공급가액', cSupply,     '#,##0'],
        ['세액(10%)', cTax,       '#,##0'],
        ['합계금액', cTotalFee,   '#,##0'],
      ]
      taxData.forEach(([label, val, fmt], ti) => {
        const tr = taxRowStart + 1 + ti
        wsC.mergeCells(tr, 1, tr, 3)
        const lc = wsC.getCell(`A${tr}`)
        lc.value = label
        lc.font  = { bold: true, size: 11 }
        lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: ti === 3 ? 'FFFFD966' : 'FFE7E6E6' } }
        lc.alignment = { horizontal: 'center', vertical: 'middle' }
        applyBorder(lc, 'medium')

        wsC.mergeCells(tr, 4, tr, 7)
        const vc = wsC.getCell(tr, 4)
        vc.value  = val
        vc.font   = { bold: ti === 3, size: 12, color: { argb: ti === 3 ? 'FFC00000' : 'FF000000' } }
        vc.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: ti === 3 ? 'FFFFD966' : 'FFFFFFFF' } }
        vc.alignment = { horizontal: 'right', vertical: 'middle' }
        vc.numFmt = fmt
        applyBorder(vc, 'medium')
        wsC.getRow(tr).height = 22
      })
    }

    // ── 파일 다운로드 ─────────────────────────────────────
    const fileName = `레미콘운반비_월간현황_${year}년${month}월.xlsx`
    const buffer   = await workbook.xlsx.writeBuffer()
    const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url      = window.URL.createObjectURL(blob)
    const link     = document.createElement('a')
    link.href     = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    alert(`월간 현황 엑셀 파일이 다운로드되었습니다.\n\n시트 구성:\n• 기사별 날짜 현황 (피벗)\n• 전체 현황\n• 차량별 집계\n• 지급공제내역 (세무사 자료)\n• 차량별 상세 시트 (차량 수만큼)`)
  } catch (error) {
    console.error('월간 현황 다운로드 오류:', error)
    alert('월간 현황 다운로드 중 오류가 발생했습니다: ' + error.message)
  }
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
  margin-bottom: 0.75rem;
}

.page-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.control-section {
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
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
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-select:hover:not(:disabled) {
  border-color: #cbd5e1;
}

.custom-select:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.custom-select:disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
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
  font-size: 0.9375rem;
  border: 1px solid #e2e8f0;
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

.calculated-input {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  font-weight: 700;
  color: #92400e;
}

.input-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-export {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-export:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-monthly {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-monthly:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-disabled {
  background: #e2e8f0 !important;
  color: #94a3b8 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #64748b;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
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
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-sub {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.summary-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
}

.driver-info-section {
  margin-bottom: 0.75rem;
}

.driver-info-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  border: 2px solid #bae6fd;
}

.driver-info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #bae6fd;
}

.info-icon {
  font-size: 1.75rem;
}

.info-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0c4a6e;
  margin: 0;
}

.driver-info-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  min-width: 80px;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.highlight-text {
  color: #0369a1;
  font-weight: 700;
}

.account-number {
  font-family: 'Courier New', monospace;
  color: #dc2626;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.summary-header {
  margin-bottom: 1rem;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-table-wrapper {
  overflow-x: auto;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.column-wrapper {
  overflow-x: auto;
}

.total-summary {
  margin-top: 1rem;
}

.total-only-table {
  max-width: 800px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.summary-table thead th {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-weight: 700;
  padding: 0.5rem 0.375rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
  line-height: 1.2;
  font-size: 0.8125rem;
}

.summary-table tbody td {
  padding: 0.5rem 0.375rem;
  border: 1px solid #e2e8f0;
  text-align: center;
  font-size: 0.8125rem;
}

.summary-table .vehicle-cell {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.9375rem;
}

.summary-table .number-cell {
  font-weight: 600;
  color: #1e293b;
}

.summary-table .total-row {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  font-weight: 700;
}

.summary-table .total-label {
  color: #92400e;
  font-weight: 700;
  font-size: 0.9375rem;
}

.summary-table .total-value {
  color: #dc2626;
  font-weight: 700;
  font-size: 1rem;
}

.summary-table .date-cell {
  font-weight: 600;
  color: #64748b;
  font-size: 0.8125rem;
}

@media (max-width: 1200px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }
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
  to {
    transform: rotate(360deg);
  }
}

.table-wrapper {
  overflow-x: auto;
}

.delivery-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.delivery-table thead th {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-weight: 700;
  padding: 0.75rem 0.5rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.delivery-table tbody td {
  padding: 0.75rem 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.number-cell {
  font-weight: 600;
  color: #1e293b;
}

.highlight {
  color: #92400e;
  font-size: 1rem;
}

.memo-cell {
  max-width: 200px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.empty-cell {
  padding: 3rem !important;
  color: #94a3b8;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
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
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.mb-3 {
  margin-bottom: 1rem;
}
</style>