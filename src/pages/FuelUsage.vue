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
          <label class="form-label">차량 타입</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedCarType" @change="onCarTypeChange" class="custom-select">
              <option value="">전체 차량</option>
              <option value="지입레미콘">지입레미콘</option>
              <option value="자차레미콘">자차레미콘</option>
              <option value="용차">용차</option>
              <option value="지원차">지원차</option>
              <option value="일반차량">일반차량</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <label class="form-label">이용자</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedUserId" @change="loadData" class="custom-select" :disabled="!!selectedCarType">
              <option value="">전체 이용자</option>
              <option v-for="u in users" :key="u.userId" :value="u.userId">{{ u.name }}</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
          <div class="input-hint" v-if="selectedCarType">
            차량 타입 선택 시 이용자 필터는 사용할 수 없습니다
          </div>
        </div>

        <div class="filter-item">
          <button @click="openAddModal" class="btn-custom btn-primary">
            ➕ 사용량 입력
          </button>
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
      <!-- 총 주유량 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #e0e7ff;">
          <span style="font-size: 1.5rem;">📊</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 주유량</div>
          <div class="stat-value">{{ totalFuelLiters }}</div>
          <div class="stat-sub">{{ fuelUsageCount }}회 주유</div>
        </div>
      </div>

      <!-- 일일 평균 주유량 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">
          <span style="font-size: 1.5rem;">📈</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">일일 평균</div>
          <div class="stat-value">{{ dailyAverageFuel }}</div>
          <div class="stat-sub">{{ daysInMonth.length }}일 기준</div>
        </div>
      </div>

      <!-- 운반비 (레미콘 타입 선택 시만) -->
      <div v-if="isRemiconType" class="stat-card stat-card-clickable" @click="openTransportCostSummary">
        <div class="stat-icon" style="background: #fef3c7;">
          <span style="font-size: 1.5rem;">🚚</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 운반비</div>
          <div class="stat-value">{{ totalTransportCost }}</div>
          <div class="stat-hint">클릭하여 관리</div>
        </div>
      </div>

      <!-- 최다 주유 직원 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #fce7f3;">
          <span style="font-size: 1.5rem;">👤</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">최다 주유 직원</div>
          <div class="stat-value">{{ topDriver.name }}</div>
          <div class="stat-sub">{{ formatNumber(topDriver.amount) }}L</div>
        </div>
      </div>

      <!-- 누적 사용량 -->
      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e8ff;">
          <span style="font-size: 1.5rem;">📊</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">누적 사용량</div>
          <div class="stat-value">{{ cumulativeUsed }}</div>
          <div class="stat-sub">주유기 전체 누적</div>
        </div>
      </div>

      <!-- 경유 잔량 -->
      <div class="stat-card stat-card-clickable" @click="openStockModal">
        <div class="stat-icon" :style="stockIconStyle">
          <span style="font-size: 1.5rem;">🛢️</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 경유 잔량</div>
          <div class="stat-value" :class="stockValueClass">
            {{ formatNumber(currentStock) }}L
          </div>
          <div class="stat-hint">클릭하여 수정</div>
        </div>
      </div>
    </div>

    <!-- 일반차량 주행거리 관리 섹션 -->
    <div v-if="selectedCarType === '일반차량'" class="mileage-management-section">
      <div class="section-header">
        <div class="header-content">
          <span class="type-icon">🚗</span>
          <h3 class="section-title">법인차량 주행거리 관리</h3>
        </div>
        <button @click="openMileageModal()" class="btn-custom btn-primary btn-sm">
          ➕ 주행거리 입력
        </button>
      </div>

      <div class="mileage-table-wrapper">
        <table class="mileage-table">
          <thead>
            <tr>
              <th>차량번호</th>
              <th>담당자</th>
              <th>시작 km</th>
              <th>종료 km</th>
              <th>월간 주행</th>
              <th>출퇴근일</th>
              <th>업무주행</th>
              <th>연비</th>
              <th>보험기간</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in mileageData" :key="m.mileageId">
              <td>{{ getVehicleCarNum(m.vehicleId) }}</td>
              <td>{{ getUserName(m.userId) }}</td>
              <td>{{ formatNumber(m.startKm) }}</td>
              <td>{{ formatNumber(m.endKm) }}</td>
              <td><strong>{{ formatNumber(m.monthlyKm) }} km</strong></td>
              <td>{{ m.commuteDays }}일</td>
              <td>{{ formatNumber(m.workKm) }} km</td>
              <td>{{ m.avgFuelConsumption ? m.avgFuelConsumption.toFixed(1) : '-' }} km/L</td>
              <td class="insurance-cell">{{ formatInsurance(m.vehicleId) }}</td>
              <td>
                <button @click="openMileageModal(m)" class="btn-icon btn-edit">✏️</button>
                <button @click="deleteMileage(m.mileageId)" class="btn-icon btn-delete">🗑️</button>
              </td>
            </tr>
            <tr v-if="mileageData.length === 0">
              <td colspan="10" class="empty-cell">주행거리 데이터가 없습니다</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 레미콘 운반비 관리 섹션 -->
    <div v-if="isRemiconType" class="transport-cost-section">
      <div class="section-header">
        <div class="header-content">
          <span class="type-icon">{{ getCarTypeIcon(selectedCarType) }}</span>
          <h3 class="section-title">{{ selectedCarType }} 운반비 관리</h3>
        </div>
        <button @click="openTransportCostModal()" class="btn-custom btn-primary btn-sm">
          ➕ 운반비 입력
        </button>
      </div>

      <div class="transport-cost-grid">
        <div v-for="cost in transportCosts" :key="cost.costId" class="transport-cost-card">
          <div class="cost-card-header">
            <div class="vehicle-info">
              <div class="vehicle-name">{{ getVehicleCarNum(cost.vehicleId) }}</div>
              <div class="driver-name">{{ getUserName(cost.userId) }}</div>
            </div>
            <div class="cost-actions">
              <button @click="openTransportCostModal(cost)" class="btn-icon btn-edit">✏️</button>
              <button @click="deleteTransportCost(cost.costId)" class="btn-icon btn-delete">🗑️</button>
            </div>
          </div>
          <div class="cost-card-body">
            <div class="cost-item">
              <span class="cost-label">운반비</span>
              <span class="cost-value">{{ formatNumber(cost.transportCost) }}원</span>
            </div>
            <div class="cost-item">
              <span class="cost-label">유류비</span>
              <span class="cost-value">{{ formatNumber(cost.fuelCost) }}원</span>
            </div>
            <div class="cost-item total">
              <span class="cost-label">합계</span>
              <span class="cost-value">{{ formatNumber(cost.totalCost) }}원</span>
            </div>
          </div>
        </div>
        <div v-if="transportCosts.length === 0" class="empty-cost-card">
          운반비 데이터가 없습니다
        </div>
      </div>
    </div>

    <!-- 차량 타입별 일일 통계 -->
    <div v-if="selectedCarType && dailyStatsForSelectedType.length > 0" class="daily-stats-section">
      <div class="section-header">
        <div class="header-content">
          <span class="type-icon">{{ getCarTypeIcon(selectedCarType) }}</span>
          <h3 class="section-title">{{ selectedCarType }} 일일 주유 현황</h3>
        </div>
        <div class="summary-stats">
          <span class="summary-item">
            <strong>총 주유량:</strong> {{ formatNumber(selectedTypeTotal) }}L
          </span>
          <span class="summary-item">
            <strong>평균:</strong> {{ formatNumber(selectedTypeAverage) }}L/일
          </span>
        </div>
      </div>

      <div class="daily-stats-chart">
        <div class="chart-wrapper">
          <div v-for="stat in dailyStatsForSelectedType" :key="stat.day" class="chart-bar-container">
            <div class="chart-bar-wrapper">
              <div class="chart-bar"
                :style="{ height: stat.amount > 0 ? (stat.amount / maxDailyAmount * 100) + '%' : '4px' }"
                :data-empty="stat.amount === 0"
                :title="`${stat.day}일: ${formatNumber(stat.amount)}L (${getDayName(stat.day)})`">
                <div v-if="stat.amount > 0" class="bar-value">
                  {{ formatNumber(stat.amount) }}
                </div>
              </div>
            </div>
            <div class="chart-label">
              <span class="day-num">{{ stat.day }}</span>
              <span :class="['day-name-small', getDayClass(stat.day)]">
                {{ getDayName(stat.day) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 차량 타입별 통계 섹션 -->
    <div v-if="!selectedCarType && carTypeStats.length > 0" class="car-type-stats-section">
      <div class="section-header">
        <h3 class="section-title">차량 타입별 주유 통계</h3>
      </div>
      <div class="car-type-stats-grid">
        <div v-for="stat in carTypeStats" :key="stat.carType" class="car-type-stat-card">
          <div class="car-type-header">
            <span class="car-type-icon">{{ getCarTypeIcon(stat.carType) }}</span>
            <span class="car-type-name">{{ stat.carType }}</span>
          </div>
          <div class="car-type-stats">
            <div class="car-type-stat-item">
              <div class="car-type-stat-label">총 주유량</div>
              <div class="car-type-stat-value">{{ formatNumber(stat.totalLiter) }}L</div>
            </div>
            <div class="car-type-stat-item">
              <div class="car-type-stat-label">주유 횟수</div>
              <div class="car-type-stat-value">{{ stat.fuelCount }}회</div>
            </div>
            <div class="car-type-stat-item">
              <div class="car-type-stat-label">평균 주유량</div>
              <div class="car-type-stat-value">{{ formatNumber(stat.avgLiter) }}L</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 선택된 이용자 정보 섹션 -->
    <div v-if="selectedUserInfo" class="selected-user-info">
      <div class="user-info-header">
        <div class="user-name-badge">
          <span class="badge-icon">👤</span>
          <span class="badge-text">{{ selectedUserInfo.userName }}</span>
        </div>
        <div class="user-stats-grid">
          <div class="user-stat-item">
            <div class="user-stat-label">총 주유량</div>
            <div class="user-stat-value">{{ formatNumber(selectedUserInfo.totalLiter) }}L</div>
          </div>
          <div class="user-stat-item">
            <div class="user-stat-label">주유 횟수</div>
            <div class="user-stat-value">{{ selectedUserInfo.count }}회</div>
          </div>
          <div class="user-stat-item">
            <div class="user-stat-label">평균 주유량</div>
            <div class="user-stat-value">{{ formatNumber(selectedUserInfo.average) }}L</div>
          </div>
        </div>
      </div>

      <div class="user-vehicles-section">
        <div class="vehicles-label">할당된 차량 주유 현황</div>
        <div class="vehicles-list">
          <div v-for="(vehicle, idx) in selectedUserInfo.vehicleDetails" :key="idx" class="vehicle-item">
            <div class="vehicle-name">{{ vehicle.carNum }}</div>
            <div class="vehicle-bar">
              <div class="vehicle-bar-fill"
                :style="{ width: (vehicle.amount / selectedUserInfo.totalLiter * 100) + '%' }"></div>
            </div>
            <div class="vehicle-amount">{{ formatNumber(vehicle.amount) }}L</div>
          </div>
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
              <th :class="['fixed-col', 'date-col', { compact: selectedUserId }]">일자</th>
              <th v-for="v in filteredVehiclesForTable" :key="v.vehicleId" class="vehicle-header">
                <div class="vehicle-header-content">
                  <div class="driver-name">{{ getVehicleDriverName(v) }}</div>
                  <div class="car-number">{{ v.carNum }}</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in daysInMonth" :key="day" :class="getRowClass(day)">
              <td class="fixed-col date-col">
                <div class="date-cell-wrapper">
                  <div class="date-content">
                    <span class="day-number">{{ day }}</span>
                    <span :class="['day-name', getDayClass(day)]">{{ getDayName(day) }}</span>
                  </div>
                </div>
              </td>
              <td v-for="v in filteredVehiclesForTable" :key="v.vehicleId">
                <div class="simple-cell" @click="openEditModal(day, v.vehicleId)">
                  <div v-html="displaySimpleCell(day, v.vehicleId)"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 사용량 입력/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>
            <span style="margin-right: 0.5rem;">⛽</span>
            {{ modal.fuelId ? '사용량 수정' : '사용량 입력' }}
          </h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">날짜 *</label>
            <input type="date" v-model="modal.usageDate" class="custom-input" />
          </div>

          <div class="mb-3">
            <label class="form-label">차량 선택 *</label>
            <div class="custom-select-wrapper">
              <select v-model="modal.vehicleId" @change="onVehicleChange" class="custom-select">
                <option value="">선택하세요</option>
                <optgroup label="레미콘">
                  <option v-for="v in vehiclesByType['지입레미콘']" :key="v.vehicleId" :value="v.vehicleId">
                    {{ v.carNum }} ({{ v.modelName }})
                  </option>
                  <option v-for="v in vehiclesByType['자차레미콘']" :key="v.vehicleId" :value="v.vehicleId">
                    {{ v.carNum }} ({{ v.modelName }})
                  </option>
                </optgroup>
                <optgroup label="용차/지원차">
                  <option v-for="v in vehiclesByType['용차']" :key="v.vehicleId" :value="v.vehicleId">
                    {{ v.carNum }} ({{ v.modelName }})
                  </option>
                  <option v-for="v in vehiclesByType['지원차']" :key="v.vehicleId" :value="v.vehicleId">
                    {{ v.carNum }} ({{ v.modelName }})
                  </option>
                </optgroup>
                <optgroup label="일반차량">
                  <option v-for="v in vehiclesByType['일반차량']" :key="v.vehicleId" :value="v.vehicleId">
                    {{ v.carNum }} ({{ v.modelName }})
                  </option>
                </optgroup>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">담당자 선택 *</label>
            <div class="custom-select-wrapper">
              <select v-model="modal.userId" class="custom-select" :disabled="!modal.vehicleId || isVehicleAssigned">
                <option value="">{{ getDriverPlaceholder() }}</option>
                <option v-for="u in users" :key="u.userId" :value="u.userId">{{ u.name }}</option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
            <div class="input-hint" v-if="isVehicleAssigned">
              이 차량은 {{ getAssignedDriverName() }}에게 배정되어 있습니다.
            </div>
            <div class="input-hint" v-else-if="modal.vehicleId && !isVehicleAssigned">
              용차/지원차는 담당자를 선택해주세요.
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">주유량 (L) *</label>
            <input type="number" v-model.number="modal.fuelLiter" placeholder="예: 80.5" class="custom-input" step="0.1"
              min="0" />
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

    <!-- 주행거리 입력 모달 -->
    <div v-if="showMileageModal" class="modal-overlay" @click.self="closeMileageModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>
            <span style="margin-right: 0.5rem;">📍</span>
            {{ mileageModal.mileageId ? '주행거리 수정' : '주행거리 입력' }}
          </h5>
          <button @click="closeMileageModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">차량 선택 *</label>
            <div class="custom-select-wrapper">
              <select v-model="mileageModal.vehicleId" class="custom-select">
                <option value="">선택하세요</option>
                <option v-for="v in vehiclesByType['일반차량']" :key="v.vehicleId" :value="v.vehicleId">
                  {{ v.carNum }} ({{ v.modelName }})
                </option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">시작 km *</label>
            <input type="number" v-model.number="mileageModal.startKm" placeholder="예: 10000" class="custom-input"
              step="1" min="0" @input="calculateMonthlyKm" />
          </div>

          <div class="mb-3">
            <label class="form-label">종료 km *</label>
            <input type="number" v-model.number="mileageModal.endKm" placeholder="예: 11500" class="custom-input"
              step="1" min="0" @input="calculateMonthlyKm" />
          </div>

          <div class="mb-3">
            <label class="form-label">월간 주행 (자동계산)</label>
            <input type="number" v-model.number="mileageModal.monthlyKm" class="custom-input" readonly
              style="background: #f1f5f9;" />
          </div>

          <div class="mb-3">
            <label class="form-label">출퇴근일수</label>
            <input type="number" v-model.number="mileageModal.commuteDays" placeholder="예: 20" class="custom-input"
              step="1" min="0" />
          </div>

          <div class="mb-3">
            <label class="form-label">업무 주행거리 (km)</label>
            <input type="number" v-model.number="mileageModal.workKm" placeholder="예: 500" class="custom-input"
              step="1" min="0" />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="deleteMileageFromModal" v-if="mileageModal.mileageId" class="btn-custom btn-danger">
            🗑️ 삭제
          </button>
          <button @click="closeMileageModal" class="btn-custom btn-secondary">
            취소
          </button>
          <button @click="saveMileageModal" class="btn-custom btn-success">
            💾 저장
          </button>
        </div>
      </div>
    </div>

    <!-- 운반비 입력 모달 -->
    <div v-if="showTransportCostModal" class="modal-overlay" @click.self="closeTransportCostModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>
            <span style="margin-right: 0.5rem;">🚚</span>
            {{ transportCostModal.costId ? '운반비 수정' : '운반비 입력' }}
          </h5>
          <button @click="closeTransportCostModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">차량 선택 *</label>
            <div class="custom-select-wrapper">
              <select v-model="transportCostModal.vehicleId" @change="onTransportVehicleChange" class="custom-select">
                <option value="">선택하세요</option>
                <option v-for="v in remiconVehicles" :key="v.vehicleId" :value="v.vehicleId">
                  {{ v.carNum }} ({{ v.modelName }})
                </option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">운반비 (원) *</label>
            <input type="number" v-model.number="transportCostModal.transportCost" placeholder="예: 1500000"
              class="custom-input" step="1000" min="0" @input="calculateTotalCost" />
          </div>

          <div class="mb-3">
            <label class="form-label">유류비 (원) *</label>
            <input type="number" v-model.number="transportCostModal.fuelCost" placeholder="예: 800000"
              class="custom-input" step="1000" min="0" @input="calculateTotalCost" />
          </div>

          <div class="mb-3">
            <label class="form-label">합계 (자동계산)</label>
            <input type="number" v-model.number="transportCostModal.totalCost" class="custom-input" readonly
              style="background: #f1f5f9;" />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="deleteTransportCostFromModal" v-if="transportCostModal.costId" class="btn-custom btn-danger">
            🗑️ 삭제
          </button>
          <button @click="closeTransportCostModal" class="btn-custom btn-secondary">
            취소
          </button>
          <button @click="saveTransportCostModal" class="btn-custom btn-success">
            💾 저장
          </button>
        </div>
      </div>
    </div>

    <!-- 재고 수정 모달 -->
    <div v-if="showStockModal" class="modal-overlay" @click.self="closeStockModal">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h5>
            <span style="margin-right: 0.5rem;">🛢️</span>
            경유 재고 관리
          </h5>
          <button @click="closeStockModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">현재 재고</label>
            <div class="current-stock-display" :class="currentStock < 4000 ? 'warning' : ''">
              {{ formatNumber(currentStock) }} L
              <span v-if="currentStock < 4000" class="warning-badge">⚠️ 4천L 미만</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">새로운 재고량 (L)</label>
            <input type="number" v-model.number="stockModalValue" placeholder="예: 5000" class="custom-input" step="0.01"
              min="0" />
            <div class="input-hint">직접 입력하여 재고량을 설정합니다</div>
          </div>

          <div class="mb-3">
            <label class="form-label">메모</label>
            <input type="text" v-model="stockModalMemo" placeholder="예: 경유 5000L 구매" class="custom-input" />
          </div>

          <div class="change-preview" v-if="stockModalValue !== currentStock && stockModalValue >= 0">
            <div class="preview-row">
              <span>변경 전:</span>
              <strong>{{ formatNumber(currentStock) }} L</strong>
            </div>
            <div class="preview-arrow">→</div>
            <div class="preview-row">
              <span>변경 후:</span>
              <strong :class="stockModalValue > currentStock ? 'text-success' : 'text-danger'">
                {{ formatNumber(stockModalValue) }} L
              </strong>
            </div>
            <div class="preview-diff">
              <span v-if="stockModalValue > currentStock" class="diff-add">
                +{{ formatNumber(stockModalValue - currentStock) }} L
              </span>
              <span v-else class="diff-sub">
                -{{ formatNumber(currentStock - stockModalValue) }} L
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeStockModal" class="btn-custom btn-secondary">
            취소
          </button>
          <button @click="saveStockModal" class="btn-custom btn-success">
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
import * as XLSX from 'xlsx'

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedCarType = ref('')
const selectedUserId = ref('')

const cumulativeUsedLiters = ref(0)
const cumulativeUsed = computed(() => {
  return formatNumber(cumulativeUsedLiters.value || 0) + 'L'
})

const users = ref([])
const vehicles = ref([])
const usageData = ref([])
const carTypeStats = ref([])
const mileageData = ref([])
const transportCosts = ref([])
const loading = ref(false)

const showModal = ref(false)
const modal = ref({})

const showMileageModal = ref(false)
const mileageModal = ref({})

const showTransportCostModal = ref(false)
const transportCostModal = ref({})

const currentStock = ref(0)
const showStockModal = ref(false)
const stockModalValue = ref(0)
const stockModalMemo = ref('')

const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

const daysInMonth = computed(() => {
  const days = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
})

const isRemiconType = computed(() => {
  return selectedCarType.value === '지입레미콘' || selectedCarType.value === '자차레미콘'
})

const remiconVehicles = computed(() => {
  return vehicles.value.filter(v => v.carType === '지입레미콘' || v.carType === '자차레미콘')
})

const totalTransportCost = computed(() => {
  if (transportCosts.value.length === 0) return '-'
  const total = transportCosts.value.reduce((sum, c) => sum + (c.totalCost || 0), 0)
  return formatNumber(total) + '원'
})

const onCarTypeChange = () => {
  if (selectedCarType.value) {
    selectedUserId.value = ''
  }
  loadData()
}

const vehiclesByType = computed(() => {
  const grouped = {
    '지입레미콘': [],
    '자차레미콘': [],
    '용차': [],
    '지원차': [],
    '일반차량': []
  }
  vehicles.value.forEach(v => {
    if (grouped[v.carType]) {
      grouped[v.carType].push(v)
    }
  })
  return grouped
})

const dailyStatsForSelectedType = computed(() => {
  if (!selectedCarType.value) return []

  const typeVehicleIds = vehicles.value
    .filter(v => v.carType === selectedCarType.value)
    .map(v => v.vehicleId)

  const dailyMap = {}
  daysInMonth.value.forEach(day => {
    dailyMap[day] = 0
  })

  usageData.value
    .filter(u => u.usageType === 'LITER' && typeVehicleIds.includes(u.vehicleId))
    .forEach(u => {
      const date = new Date(u.usageDate)
      const day = date.getDate()
      if (dailyMap[day] !== undefined) {
        dailyMap[day] += u.fuelLiter || 0
      }
    })

  return Object.entries(dailyMap)
    .map(([day, amount]) => ({
      day: parseInt(day),
      amount: amount
    }))
    .sort((a, b) => a.day - b.day)
})

const selectedTypeTotal = computed(() => {
  return dailyStatsForSelectedType.value.reduce((sum, stat) => sum + stat.amount, 0)
})

const selectedTypeAverage = computed(() => {
  const total = selectedTypeTotal.value
  const days = daysInMonth.value.length
  return days > 0 ? total / days : 0
})

const maxDailyAmount = computed(() => {
  if (dailyStatsForSelectedType.value.length === 0) return 1
  return Math.max(...dailyStatsForSelectedType.value.map(s => s.amount), 1)
})

const getCarTypeIcon = (carType) => {
  const icons = {
    '지입레미콘': '🚚',
    '자차레미콘': '🚛',
    '용차': '🚜',
    '지원차': '🚐',
    '일반차량': '🚗'
  }
  return icons[carType] || '🚗'
}

const totalFuelLiters = computed(() => {
  const totalLiter = usageData.value
    .filter(u => u.usageType === 'LITER')
    .reduce((sum, u) => sum + (u.fuelLiter || 0), 0)

  if (totalLiter === 0) return '-'
  return formatNumber(totalLiter) + 'L'
})

const dailyAverageFuel = computed(() => {
  const totalLiter = usageData.value
    .filter(u => u.usageType === 'LITER')
    .reduce((sum, u) => sum + (u.fuelLiter || 0), 0)

  if (totalLiter === 0) return '-'
  const days = daysInMonth.value.length
  const average = totalLiter / days
  return formatNumber(average) + 'L'
})

const fuelUsageCount = computed(() => {
  return usageData.value.filter(u => u.usageType === 'LITER').length
})

const topDriver = computed(() => {
  if (usageData.value.length === 0) return { name: '-', amount: 0 }

  const driverMap = {}
  usageData.value
    .filter(u => u.usageType === 'LITER')
    .forEach(u => {
      if (!driverMap[u.userId]) {
        driverMap[u.userId] = 0
      }
      driverMap[u.userId] += u.fuelLiter || 0
    })

  const topUserId = Object.keys(driverMap).reduce((a, b) =>
    driverMap[a] > driverMap[b] ? a : b, Object.keys(driverMap)[0] || null)

  if (!topUserId) return { name: '-', amount: 0 }
  return {
    name: getUserName(topUserId),
    amount: driverMap[topUserId]
  }
})

const selectedUserInfo = computed(() => {
  if (!selectedUserId.value) {
    return null
  }

  const userRecords = usageData.value.filter(u => u.userId === selectedUserId.value && u.usageType === 'LITER')
  const totalLiter = userRecords.reduce((sum, u) => sum + (u.fuelLiter || 0), 0)
  const count = userRecords.length
  const average = count > 0 ? totalLiter / count : 0

  const vehicleMap = {}
  userRecords.forEach(u => {
    if (!vehicleMap[u.vehicleId]) {
      vehicleMap[u.vehicleId] = 0
    }
    vehicleMap[u.vehicleId] += u.fuelLiter || 0
  })

  const vehicleDetails = Object.entries(vehicleMap)
    .map(([vehicleId, amount]) => {
      const vehicle = vehicles.value.find(v => v.vehicleId === vehicleId)
      return {
        carNum: vehicle ? vehicle.carNum : '-',
        amount: amount
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const userName = getUserName(selectedUserId.value)

  return {
    userName,
    totalLiter,
    count,
    average,
    vehicleDetails
  }
})

const stockIconStyle = computed(() => {
  if (currentStock.value < 4000) {
    return 'background: #fee2e2;'
  }
  return 'background: #d1fae5;'
})

const stockValueClass = computed(() => {
  if (currentStock.value < 4000) {
    return 'text-warning'
  }
  return ''
})

const filteredVehiclesForTable = computed(() => {
  let filtered = vehicles.value

  if (selectedCarType.value) {
    filtered = filtered.filter(v => v.carType === selectedCarType.value)
  }

  if (!selectedCarType.value && selectedUserId.value) {
    filtered = filtered.filter(v => v.userId === selectedUserId.value)
  }

  return filtered
})

const isVehicleAssigned = computed(() => {
  if (modal.value.vehicleId === '' || modal.value.vehicleId == null) return false
  const vehicle = vehicles.value.find(v => v.vehicleId === modal.value.vehicleId)
  return vehicle && vehicle.userId != null
})

const onVehicleChange = () => {
  const vehicle = vehicles.value.find(v => v.vehicleId === modal.value.vehicleId)
  if (vehicle) {
    if (vehicle.userId != null) {
      modal.value.userId = vehicle.userId
    } else {
      modal.value.userId = ''
    }
  }
}

const getDriverPlaceholder = () => {
  if (modal.value.vehicleId === '' || modal.value.vehicleId == null) return '먼저 차량을 선택하세요'
  if (isVehicleAssigned.value) return '자동 설정됨'
  return '담당자를 선택하세요'
}

const getAssignedDriverName = () => {
  if (modal.value.vehicleId === '' || modal.value.vehicleId == null) return ''
  const vehicle = vehicles.value.find(v => v.vehicleId === modal.value.vehicleId)
  if (!vehicle || vehicle.userId == null) return ''
  return getUserName(vehicle.userId)
}

const getVehicleDriverName = (vehicle) => {
  if (vehicle.userId === 0) {
    return vehicle.modelName || vehicle.carNum
  }
  return getUserName(vehicle.userId)
}

const getVehicleCarNum = (vehicleId) => {
  const vehicle = vehicles.value.find(v => v.vehicleId === vehicleId)
  return vehicle ? vehicle.carNum : '-'
}

const getUserName = (userId) => {
  const user = users.value.find(u => u.userId === userId)
  return user ? user.name : ''
}

const formatInsurance = (vehicleId) => {
  const vehicle = vehicles.value.find(v => v.vehicleId === vehicleId)
  if (!vehicle || !vehicle.insuranceStartDate || !vehicle.insuranceEndDate) return '-'
  return `${vehicle.insuranceStartDate} ~ ${vehicle.insuranceEndDate}`
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

const displaySimpleCell = (day, vehicleId) => {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const record = usageData.value.find(r => {
    const recordDate = r.usageDate.split('T')[0]
    return recordDate === dateStr && r.vehicleId === vehicleId
  })

  if (!record) {
    return '<span style="color: #cbd5e1; font-size: 0.75rem;">-</span>'
  }

  const userName = getUserName(record.userId)
  const liter = record.fuelLiter || 0

  return `
    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
      <div style="color: #6366f1; font-weight: 600; font-size: 0.875rem;">${userName}</div>
      <div style="color: #10b981; font-weight: 700; font-size: 1rem;">${liter}L</div>
    </div>
  `
}

const openAddModal = () => {
  const today = new Date()
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  modal.value = {
    fuelId: null,
    userId: '',
    vehicleId: '',
    usageDate: dateStr,
    usageType: 'LITER',
    fuelLiter: null
  }

  showModal.value = true
}

const openEditModal = (day, vehicleId) => {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const record = usageData.value.find(r => {
    const recordDate = r.usageDate.split('T')[0]
    return recordDate === dateStr && r.vehicleId === vehicleId
  })

  if (record) {
    modal.value = { ...record }
    showModal.value = true
  }
}

const closeModal = () => {
  showModal.value = false
  modal.value = {}
}

const saveModal = async () => {
  if (modal.value.vehicleId === '' || modal.value.vehicleId == null) {
    alert('차량을 선택해주세요')
    return
  }

  if (modal.value.userId === '' || modal.value.userId == null) {
    alert('담당자를 선택해주세요')
    return
  }

  if (!modal.value.fuelLiter) {
    alert('주유량을 입력해주세요')
    return
  }

  try {
    await api.post('/fuel/usage/save', modal.value)
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

const openMileageModal = (mileage = null) => {
  if (mileage) {
    mileageModal.value = { ...mileage }
  } else {
    mileageModal.value = {
      mileageId: null,
      vehicleId: '',
      userId: '',
      year: selectedYear.value,
      month: selectedMonth.value,
      startKm: 0,
      endKm: 0,
      monthlyKm: 0,
      commuteDays: 0,
      workKm: 0
    }
  }
  showMileageModal.value = true
}

const closeMileageModal = () => {
  showMileageModal.value = false
  mileageModal.value = {}
}

const calculateMonthlyKm = () => {
  const start = mileageModal.value.startKm || 0
  const end = mileageModal.value.endKm || 0
  mileageModal.value.monthlyKm = Math.max(0, end - start)
}

const saveMileageModal = async () => {
  if (mileageModal.value.vehicleId === '' || mileageModal.value.vehicleId == null) {
    alert('차량을 선택해주세요')
    return
  }

  const vehicle = vehicles.value.find(v => v.vehicleId === mileageModal.value.vehicleId)
  if (vehicle && vehicle.userId) {
    mileageModal.value.userId = vehicle.userId
  }

  try {
    await api.post('/fuel/vehicle/mileage/save', mileageModal.value)
    await loadMileageData()
    closeMileageModal()
  } catch (error) {
    alert('저장 중 오류가 발생했습니다: ' + error.message)
  }
}

const deleteMileageFromModal = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  await deleteMileage(mileageModal.value.mileageId)
  closeMileageModal()
}

const deleteMileage = async (mileageId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await api.post('/fuel/vehicle/mileage/delete', { mileageId })
    await loadMileageData()
  } catch (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

const openTransportCostModal = (cost = null) => {
  if (cost) {
    transportCostModal.value = { ...cost }
  } else {
    transportCostModal.value = {
      costId: null,
      vehicleId: '',
      userId: '',
      year: selectedYear.value,
      month: selectedMonth.value,
      transportCost: 0,
      fuelCost: 0,
      totalCost: 0
    }
  }
  showTransportCostModal.value = true
}

const closeTransportCostModal = () => {
  showTransportCostModal.value = false
  transportCostModal.value = {}
}

const onTransportVehicleChange = () => {
  const vehicle = vehicles.value.find(v => v.vehicleId === transportCostModal.value.vehicleId)
  if (vehicle && vehicle.userId) {
    transportCostModal.value.userId = vehicle.userId
  }
}

const calculateTotalCost = () => {
  const transport = transportCostModal.value.transportCost || 0
  const fuel = transportCostModal.value.fuelCost || 0
  transportCostModal.value.totalCost = transport + fuel
}

const saveTransportCostModal = async () => {
  if (transportCostModal.value.vehicleId === '' || transportCostModal.value.vehicleId == null) {
    alert('차량을 선택해주세요')
    return
  }

  const vehicle = vehicles.value.find(v => v.vehicleId === transportCostModal.value.vehicleId)
  if (vehicle && vehicle.userId) {
    transportCostModal.value.userId = vehicle.userId
  }

  try {
    await api.post('/fuel/transport/cost/save', transportCostModal.value)
    await loadTransportCosts()
    closeTransportCostModal()
  } catch (error) {
    alert('저장 중 오류가 발생했습니다: ' + error.message)
  }
}

const deleteTransportCostFromModal = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  await deleteTransportCost(transportCostModal.value.costId)
  closeTransportCostModal()
}

const deleteTransportCost = async (costId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await api.post('/fuel/transport/cost/delete', { costId })
    await loadTransportCosts()
  } catch (error) {
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

const openTransportCostSummary = () => {
  openTransportCostModal()
}

const openStockModal = () => {
  stockModalValue.value = currentStock.value
  stockModalMemo.value = ''
  showStockModal.value = true
}

const closeStockModal = () => {
  showStockModal.value = false
}

const saveStockModal = async () => {
  if (stockModalValue.value < 0) {
    alert('재고량은 0 이상이어야 합니다')
    return
  }

  if (stockModalValue.value === currentStock.value) {
    alert('변경사항이 없습니다')
    return
  }

  try {
    const changeType = stockModalValue.value > currentStock.value ? 'ADD' : 'USE'
    const changeAmount = Math.abs(stockModalValue.value - currentStock.value)

    await api.post('/fuel/stock/adjust', {
      changeType: changeType,
      changeAmount: changeAmount,
      userId: selectedUserId.value || null,
      memo: stockModalMemo.value || `재고 ${changeType === 'ADD' ? '추가' : '차감'}`
    })

    await loadStock()
    closeStockModal()
  } catch (error) {
    alert('저장 중 오류가 발생했습니다: ' + error.message)
  }
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('ko-KR')
}

const loadStock = async () => {
  try {
    const response = await api.post('/fuel/stock/current')
    const data = response.data || response
    currentStock.value = parseFloat(data.totalLiters || 0)
    cumulativeUsedLiters.value = parseFloat(data.cumulativeUsedLiters || 0)
  } catch (error) {
    console.error('재고 조회 실패:', error)
    cumulativeUsedLiters.value = 0
    currentStock.value = 0
  }
}

const loadCarTypeStats = async () => {
  try {
    const response = await api.post('/fuel/stats/by-car-type', {
      year: selectedYear.value,
      month: selectedMonth.value
    })
    const data = response.data || response

    carTypeStats.value = data.map(stat => ({
      carType: stat.car_type || stat.carType,
      fuelCount: parseInt(stat.fuel_count || stat.fuelCount || 0),
      totalLiter: parseFloat(stat.total_liter || stat.totalLiter || 0),
      avgLiter: parseFloat(stat.avg_liter || stat.avgLiter || 0)
    })).filter(stat => stat.totalLiter > 0)
  } catch (error) {
    console.error('차량 타입별 통계 조회 실패:', error)
    carTypeStats.value = []
  }
}

const loadMileageData = async () => {
  try {
    const response = await api.post('/fuel/vehicle/mileage/list', {
      year: selectedYear.value,
      month: selectedMonth.value
    })
    mileageData.value = response.data || response
  } catch (error) {
    console.error('주행거리 조회 실패:', error)
    mileageData.value = []
  }
}

const loadTransportCosts = async () => {
  try {
    const response = await api.post('/fuel/transport/cost/list', {
      year: selectedYear.value,
      month: selectedMonth.value
    })
    transportCosts.value = response.data || response
  } catch (error) {
    console.error('운반비 조회 실패:', error)
    transportCosts.value = []
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [u, v, f] = await Promise.all([
      api.post('/users/list'),
      api.post('/vehicles', { userId: 0 }),
      api.post('/fuel/usage/query', {
        year: selectedYear.value,
        month: selectedMonth.value,
        userId: selectedUserId.value || 0
      })
    ])
    users.value = u.data || u
    vehicles.value = v.data || v
    usageData.value = f.data || f

    await loadStock()
    await loadCarTypeStats()
    await loadMileageData()
    await loadTransportCosts()
  } catch (error) {
    alert('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 엑셀 다운로드 함수 (프론트엔드에서 생성)
const exportToExcel = async () => {
  try {
    console.log('📊 엑셀 다운로드 시작...')
    
    // API 호출
    const response = await api.post('/fuel/export/excel', 
      {
        year: selectedYear.value,
        month: selectedMonth.value
      },
      {
        responseType: 'blob'
      }
    )

    console.log('✅ 서버 응답 받음')

    // 안전하게 Blob 추출
    const blobData = response?.data || response
    
    if (!blobData) {
      throw new Error('응답 데이터가 없습니다')
    }

    console.log('파일 크기:', blobData.size || 0, 'bytes')
    
    if (!blobData.size || blobData.size === 0) {
      throw new Error('파일이 비어있습니다')
    }

    // 파일 다운로드
    const filename = `유류사용현황_${selectedYear.value}년_${selectedMonth.value}월.xlsx`
    const url = window.URL.createObjectURL(blobData)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('✅ 다운로드 완료!')
    alert('엑셀 파일 다운로드 완료!')

  } catch (error) {
    console.error('❌ 오류:', error)
    alert('엑셀 다운로드 실패: ' + (error?.message || '알 수 없는 오류'))
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
  opacity: 0.6;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
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

.btn-edit:hover {
  filter: brightness(1.2);
}

.btn-delete:hover {
  filter: brightness(1.2);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.stat-card-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card-clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
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

.stat-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.stat-sub {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  font-weight: 500;
}

.text-warning {
  color: #f59e0b !important;
}

.mileage-management-section,
.transport-cost-section,
.daily-stats-section,
.car-type-stats-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-icon {
  font-size: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.mileage-table-wrapper {
  overflow-x: auto;
}

.mileage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.mileage-table thead th {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #1e40af;
  font-weight: 700;
  padding: 0.75rem 0.5rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.mileage-table tbody td {
  padding: 0.75rem 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.insurance-cell {
  font-size: 0.75rem;
  color: #64748b;
}

.empty-cell {
  padding: 2rem !important;
  text-align: center;
  color: #94a3b8;
}

.transport-cost-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.transport-cost-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.transport-cost-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cost-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(146, 64, 14, 0.2);
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.vehicle-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;
}

.driver-name {
  font-size: 0.875rem;
  color: #78350f;
}

.cost-actions {
  display: flex;
  gap: 0.5rem;
}

.cost-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost-item.total {
  padding-top: 0.75rem;
  border-top: 2px solid rgba(146, 64, 14, 0.2);
  margin-top: 0.25rem;
}

.cost-label {
  font-size: 0.875rem;
  color: #78350f;
  font-weight: 600;
}

.cost-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;
}

.cost-item.total .cost-value {
  font-size: 1.375rem;
}

.empty-cost-card {
  padding: 3rem;
  text-align: center;
  color: #94a3b8;
  grid-column: 1 / -1;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.summary-item {
  font-size: 0.9375rem;
  color: #64748b;
}

.summary-item strong {
  color: #1e293b;
  margin-right: 0.25rem;
}

.daily-stats-chart {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 0.75rem;
  padding: 1.5rem;
  overflow-x: auto;
}

.chart-wrapper {
  display: flex;
  gap: 0.5rem;
  min-width: 100%;
  align-items: flex-end;
  height: 250px;
}

.chart-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 30px;
}

.chart-bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 0.375rem 0.375rem 0 0;
  position: relative;
  min-height: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.25rem;
}

.chart-bar:hover {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 -4px 12px rgba(59, 130, 246, 0.3);
}

.bar-value {
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
}

.chart-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.day-num {
  font-size: 0.875rem;
  font-weight: 700;
  color: #92400e;
}

.day-name-small {
  font-size: 0.625rem;
  color: #78350f;
  font-weight: 600;
}

.day-name-small.sunday {
  color: #ef4444;
}

.day-name-small.saturday {
  color: #3b82f6;
}

.car-type-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.car-type-stat-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.car-type-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.car-type-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(146, 64, 14, 0.2);
}

.car-type-icon {
  font-size: 1.75rem;
}

.car-type-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;
}

.car-type-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.car-type-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.car-type-stat-label {
  font-size: 0.875rem;
  color: #78350f;
  font-weight: 600;
}

.car-type-stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;
}

.selected-user-info {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.user-name-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 150px;
}

.badge-icon {
  font-size: 1.5rem;
}

.badge-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.user-stats-grid {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.user-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.user-stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.user-stat-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: #3b82f6;
}

.user-vehicles-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.vehicles-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.vehicles-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.vehicle-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.vehicle-bar {
  flex: 1;
  height: 24px;
  background: #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
}

.vehicle-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  transition: width 0.3s ease;
}

.vehicle-amount {
  min-width: 90px;
  text-align: right;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #3b82f6;
}

.table-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 500px);
  overflow: auto;
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
  overflow: visible;
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
  z-index: 15;
}

.vehicle-header {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e !important;
  font-size: 0.9375rem;
  padding: 0.75rem 0.5rem !important;
}

.vehicle-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.car-number {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #92400e;
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

.fuel-table thead .fixed-col {
  z-index: 20;
}

.date-col {
  min-width: 120px;
}

.date-col.compact {
  min-width: 80px;
}

.date-cell-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.simple-cell {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.75rem 0.5rem;
  border-radius: 0.375rem;
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-cell:hover {
  background: #fef3c7;
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

.modal-small {
  max-width: 450px;
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
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.mb-3 {
  margin-bottom: 1rem;
}

.current-stock-display {
  padding: 1.5rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-radius: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: #065f46;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.current-stock-display.warning {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.warning-badge {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  font-weight: 600;
}

.change-preview {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 1.125rem;
}

.preview-row span {
  color: #64748b;
}

.preview-row strong {
  font-size: 1.5rem;
}

.preview-arrow {
  font-size: 1.5rem;
  color: #cbd5e1;
}

.preview-diff {
  width: 100%;
  text-align: center;
  padding-top: 1rem;
  border-top: 2px solid #e2e8f0;
  font-size: 1.25rem;
  font-weight: 700;
}

.diff-add {
  color: #10b981;
}

.diff-sub {
  color: #ef4444;
}

.text-success {
  color: #10b981;
}

.text-danger {
  color: #ef4444;
}
</style>