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

        <div class="filter-item">
          <button 
            @click="exportToExcel" 
            class="btn-custom btn-export"
            :disabled="selectedUserId !== ''"
            :class="{ 'btn-disabled': selectedUserId !== '' }"
          >
            📊 엑셀 다운로드
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
  '6123': { company: '백송건기', bank: '농협', account: '351-1171-4363-33', fax: 'F634-0219' },
  '6268': { company: '보평건설중기', bank: '농협', account: '467054-52-063559', fax: 'F 936-6548' },
  '6269': { company: '보평건설중기', bank: '농협', account: '352-0777-4414-53', fax: 'F 936-6548' },
  '6645': { company: '보평건설중기', bank: '농협', account: '441-12-286090', fax: 'F 936-6548' },
  '6793': { company: '수압중기', bank: '농협', account: '467065-56-017080', fax: 'F 0504-018-4940' },
  '6847': { company: '보평건설중기', bank: '농협', account: '467021-52-052178', fax: 'F 936-6548' },
  '7932': { company: '보평건설중기', bank: '농협', account: '352-5404-1812-13', fax: 'F 936-6548' },
  '7934': { company: '보평건설중기', bank: '우리은행', account: '1002-846-311029', fax: 'F 936-6548' },
  '7936': { company: '보평건설중기', bank: '농협', account: '467021-52-053743', fax: 'F 936-6548' },
  '8273': { company: '대동중기', bank: '농협', account: '352-0521-2398-13', fax: 'F 0504-018-4940' }
}

const companyVehicles = {
  '백승건기': ['6123'],
  '보평건설중기': ['6268', '6269', '6645', '6847', '7932', '7934', '7936'],
  '수암중기 대흥중기': ['6793', '8273']
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

// ExcelJS를 사용한 엑셀 다운로드 함수
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

    // 날짜 포맷
    const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // 회사별로 시트 생성
    for (const [companyName, carNums] of Object.entries(companyVehicles)) {
      let hasData = false
      const worksheet = workbook.addWorksheet(companyName)

      // 열 너비 설정
      worksheet.columns = [
        { width: 35 },
        { width: 20 }
      ]

      let currentRow = 1

      // 각 차량번호별로 데이터 생성
      for (let idx = 0; idx < carNums.length; idx++) {
        const carNum = carNums[idx]

        // 해당 차량의 운반비 데이터 찾기
        const vehicleData = deliveryData.value.filter(d => {
          const vCarNum = getVehicleCarNum(d.vehicleId)
          return vCarNum === carNum
        })

        // 데이터가 없으면 건너뛰기
        if (vehicleData.length === 0) continue

        hasData = true

        // 총 회전수와 운반비 계산
        const totalTripCount = vehicleData.reduce((sum, d) => sum + (d.tripCount || 0), 0)
        const totalDelivery = vehicleData.reduce((sum, d) => sum + (d.deliveryFee || 0), 0)

        // 기사 정보
        const driverName = getVehicleDriverName(vehicleData[0].vehicleId)
        const info = driverInfo[carNum]
        const fax = info ? info.fax : ''

        // 공급가액과 세액 계산
        const supplyAmount = Math.round(totalDelivery / 1.1)
        const taxAmount = totalDelivery - supplyAmount

        // 이전 기사와의 간격
        if (currentRow > 1) {
          currentRow += 2
        }

        // === 헤더 (차량번호, 기사명) ===
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

        // === 공급받는자 정보 ===
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

        // === 날짜 ===
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

        // === 탕수/공급가액/세액/합계 ===
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

      // 데이터가 없는 시트는 삭제
      if (!hasData) {
        workbook.removeWorksheet(worksheet.id)
      }
    }

    // 시트가 하나도 없으면 알림
    if (workbook.worksheets.length === 0) {
      alert('다운로드할 데이터가 없습니다')
      return
    }

    // 파일명 생성
    const fileName = `레미콘운반비_${selectedYear.value}년${selectedMonth.value}월.xlsx`

    // 엑셀 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    alert('엑셀 파일이 다운로드되었습니다')
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error)
    alert('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message)
  }
}

onMounted(loadData)
</script>

<style scoped>
/* 이전과 동일한 스타일 */
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

.btn-disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-disabled:hover {
  transform: none;
  box-shadow: none;
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

.summary-table.daily-table {
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