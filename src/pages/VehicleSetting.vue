<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">차량 관리</h1>
      <button @click="openAddModal" class="btn-add">차량 추가</button>
    </div>

    <div class="table-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>불러오는 중...</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>차번호</th>
              <th>차종</th>
              <th>차명</th>
              <th>연료</th>
              <th>년식</th>
              <th>등록번호</th>
              <th>담당 직원</th>
              <th>보험기간</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="displayVehicles.length === 0">
              <td colspan="9" class="empty-cell">등록된 차량이 없습니다</td>
            </tr>
            <tr v-for="v in displayVehicles" :key="v.vehicleId" class="table-row">
              <td class="td-center">{{ v.carNum || '-' }}</td>
              <td class="td-center">
                <span :class="carTypeClass(v.carType)">{{ v.carType || '-' }}</span>
              </td>
              <td>{{ v.modelName || '-' }}</td>
              <td class="td-center">{{ v.fuelType || '-' }}</td>
              <td class="td-center">{{ v.manufactureYear || '-' }}</td>
              <td class="td-center">{{ v.registrationNumber || '-' }}</td>
              <td class="td-center">
                <span v-if="v.carType === '지원차'" class="text-muted">-</span>
                <span v-else-if="v.userName" class="user-link">{{ v.userName }}</span>
                <span v-else class="badge-unlinked">미배정</span>
              </td>
              <td class="td-center">
                <span v-if="v.insuranceStartDate || v.insuranceEndDate">
                  {{ v.insuranceStartDate || '?' }} ~ {{ v.insuranceEndDate || '?' }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="td-actions">
                <button @click="openEditModal(v)" class="btn-edit">수정</button>
                <button @click="confirmDelete(v)" class="btn-delete">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 차량 추가/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>{{ modal.isEdit ? '차량 수정' : '차량 추가' }}</h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">차번호 뒷 4자리 *</label>
              <input v-model="modal.carNum" class="custom-input" placeholder="예) 1234" maxlength="4" />
            </div>
            <div class="form-group">
              <label class="form-label">차종 *</label>
              <select v-model="modal.carType" class="custom-select" @change="onCarTypeChange">
                <option value="일반차량">일반차량</option>
                <option value="자차레미콘">자차레미콘</option>
                <option value="지입레미콘">지입레미콘</option>
                <option value="용차">용차</option>
                <option value="지원차">지원차</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">차명</label>
              <input v-model="modal.modelName" class="custom-input" placeholder="예) 현대 에어로시티" />
            </div>
            <div class="form-group">
              <label class="form-label">연료 타입</label>
              <select v-model="modal.fuelType" class="custom-select">
                <option value="경유">경유</option>
                <option value="휘발유">휘발유</option>
                <option value="LPG">LPG</option>
                <option value="전기">전기</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">제조년도</label>
              <input v-model.number="modal.manufactureYear" class="custom-input" type="number" placeholder="예) 2020" />
            </div>
            <div class="form-group">
              <label class="form-label">등록번호</label>
              <input v-model="modal.registrationNumber" class="custom-input" placeholder="차량 등록번호" />
            </div>
          </div>

          <!-- 담당 직원 — 지원차가 아닌 경우 필수 -->
          <div class="form-group">
            <label class="form-label">
              담당 직원
              <span v-if="modal.carType !== '지원차'" class="required-mark">*</span>
            </label>
            <div v-if="modal.carType === '지원차'" class="info-box">
              지원차는 담당 직원 없이 등록할 수 있습니다.
            </div>
            <select v-else v-model.number="modal.userId" class="custom-select"
                    :class="{ 'input-error': userIdError }">
              <option :value="null">-- 직원 선택 --</option>
              <option v-for="u in availableUsers" :key="u.userId" :value="u.userId">
                {{ u.name }}{{ u.department ? ' (' + u.department + ')' : '' }}{{ u.position ? ' / ' + u.position : '' }}
              </option>
            </select>
            <span v-if="userIdError" class="error-text">담당 직원을 선택해주세요</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">출퇴근 거리 (km)</label>
              <input v-model.number="modal.commuteDistance" class="custom-input" type="number" step="0.1" placeholder="0.0" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">보험 시작일</label>
              <input v-model="modal.insuranceStartDate" class="custom-input" type="date" />
            </div>
            <div class="form-group">
              <label class="form-label">보험 종료일</label>
              <input v-model="modal.insuranceEndDate" class="custom-input" type="date" />
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-custom btn-secondary">취소</button>
          <button @click="saveModal" class="btn-custom btn-success">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api/axios'

export default {
  name: 'VehicleSetting',
  data() {
    return {
      vehicles: [],
      userList: [],
      loading: false,
      showModal: false,
      modal: {},
      userIdError: false,
    }
  },
  computed: {
    displayVehicles() {
      return this.vehicles.filter(v => v.vehicleId !== 0)
    },
    availableUsers() {
      // 이미 다른 차량에 배정된 직원 제외 (수정 중인 차량의 현재 담당자는 포함)
      const assignedUserIds = new Set(
        this.vehicles
          .filter(v => v.userId != null && v.carType !== '지원차' && v.vehicleId !== this.modal.vehicleId)
          .map(v => v.userId)
      )
      return this.userList.filter(u => !assignedUserIds.has(u.userId))
    },
  },
  methods: {
    carTypeClass(carType) {
      const map = {
        '자차레미콘': 'badge-remicon-own',
        '지입레미콘': 'badge-remicon-sub',
        '용차':       'badge-charter',
        '지원차':     'badge-support',
        '일반차량':   'badge-general',
      }
      return map[carType] || 'badge-general'
    },
    onCarTypeChange() {
      if (this.modal.carType === '지원차') {
        this.modal.userId = null
        this.userIdError = false
      }
    },
    openAddModal() {
      this.userIdError = false
      this.modal = {
        isEdit: false,
        vehicleId: null,
        carNum: '',
        carType: '일반차량',
        modelName: '',
        fuelType: '경유',
        manufactureYear: null,
        registrationNumber: '',
        userId: null,
        commuteDistance: null,
        insuranceStartDate: '',
        insuranceEndDate: '',
      }
      this.showModal = true
    },
    openEditModal(vehicle) {
      this.userIdError = false
      this.modal = {
        isEdit: true,
        vehicleId: vehicle.vehicleId,
        carNum: vehicle.carNum || '',
        carType: vehicle.carType || '일반차량',
        modelName: vehicle.modelName || '',
        fuelType: vehicle.fuelType || '경유',
        manufactureYear: vehicle.manufactureYear || null,
        registrationNumber: vehicle.registrationNumber || '',
        userId: vehicle.userId || null,
        commuteDistance: vehicle.commuteDistance != null ? vehicle.commuteDistance : null,
        insuranceStartDate: vehicle.insuranceStartDate || '',
        insuranceEndDate: vehicle.insuranceEndDate || '',
      }
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.modal = {}
      this.userIdError = false
    },
    async saveModal() {
      if (!this.modal.carNum || !this.modal.carNum.trim()) {
        alert('차번호를 입력해주세요')
        return
      }
      if (!this.modal.carType) {
        alert('차종을 선택해주세요')
        return
      }
      // 지원차 외에는 담당 직원 필수
      if (this.modal.carType !== '지원차' && !this.modal.userId) {
        this.userIdError = true
        return
      }
      this.userIdError = false
      try {
        const payload = {
          vehicleId: this.modal.isEdit ? this.modal.vehicleId : null,
          carNum: this.modal.carNum.trim(),
          carType: this.modal.carType,
          modelName: this.modal.modelName || null,
          fuelType: this.modal.fuelType || '경유',
          manufactureYear: this.modal.manufactureYear || null,
          registrationNumber: this.modal.registrationNumber || null,
          userId: this.modal.carType === '지원차' ? null : (this.modal.userId || null),
          commuteDistance: this.modal.commuteDistance != null ? this.modal.commuteDistance : null,
          insuranceStartDate: this.modal.insuranceStartDate || null,
          insuranceEndDate: this.modal.insuranceEndDate || null,
        }
        await api.post('/fuel/vehicle/save', payload)
        alert('저장되었습니다')
        this.closeModal()
        await this.fetchVehicles()
      } catch (e) {
        const msg = e.response?.data?.message || e.message || '알 수 없는 오류'
        alert('저장 오류: ' + msg)
      }
    },
    async confirmDelete(vehicle) {
      if (!confirm(`[${vehicle.carNum} / ${vehicle.modelName || vehicle.carType}] 차량을 삭제하시겠습니까?`)) return
      try {
        await api.post('/fuel/vehicle/delete', { vehicleId: vehicle.vehicleId })
        await this.fetchVehicles()
      } catch (e) {
        alert('삭제 오류: ' + (e.response?.data?.message || e.message || '알 수 없는 오류'))
      }
    },
    async fetchVehicles() {
      this.loading = true
      try {
        const res = await api.post('/vehicles', {})
        this.vehicles = res.data || res
      } catch (e) {
        console.error('차량 조회 오류:', e)
      } finally {
        this.loading = false
      }
    },
    async fetchUsers() {
      try {
        const res = await api.post('/users/list')
        const all = res.data || res
        this.userList = all.filter(u => u.userId !== 0)
      } catch (e) {
        console.error('직원 조회 오류:', e)
      }
    },
  },
  mounted() {
    this.fetchVehicles()
    this.fetchUsers()
  },
}
</script>

<style scoped>
.page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.page-title { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0; }

.btn-add {
  padding: .5rem 1.25rem;
  font-size: .875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: .5rem;
  cursor: pointer;
  transition: all .2s;
}
.btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(59,130,246,.4); }

.table-section {
  background: rgba(255,255,255,.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,.08);
}

.table-wrapper { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.data-table thead th {
  background: linear-gradient(135deg, #1e3a5f, #203864);
  color: #fff;
  font-weight: 700;
  padding: .75rem;
  text-align: center;
  border: 1px solid rgba(255,255,255,.1);
  white-space: nowrap;
}
.data-table tbody td {
  padding: .625rem .75rem;
  border: 1px solid rgba(255,255,255,.07);
  vertical-align: middle;
  color: #e2e8f0;
}
.table-row:hover td { background: rgba(255,255,255,.04); }

.td-center  { text-align: center; }
.td-actions { text-align: center; white-space: nowrap; }

.user-link { font-weight: 600; color: #60a5fa; }
.text-muted { color: #64748b; }

.badge-unlinked {
  display: inline-block; padding: .15rem .5rem;
  background: rgba(239,68,68,.12); color: #f87171;
  border: 1px solid rgba(239,68,68,.25);
  border-radius: .3rem; font-size: .75rem;
}

/* 차종 배지 */
.badge-remicon-own {
  display: inline-block; padding: .2rem .6rem;
  background: rgba(59,130,246,.2); color: #60a5fa;
  border: 1px solid rgba(59,130,246,.4);
  border-radius: .375rem; font-size: .78rem; font-weight: 700;
}
.badge-remicon-sub {
  display: inline-block; padding: .2rem .6rem;
  background: rgba(139,92,246,.2); color: #a78bfa;
  border: 1px solid rgba(139,92,246,.4);
  border-radius: .375rem; font-size: .78rem; font-weight: 700;
}
.badge-charter {
  display: inline-block; padding: .2rem .6rem;
  background: rgba(245,158,11,.15); color: #fbbf24;
  border: 1px solid rgba(245,158,11,.35);
  border-radius: .375rem; font-size: .78rem; font-weight: 700;
}
.badge-support {
  display: inline-block; padding: .2rem .6rem;
  background: rgba(16,185,129,.15); color: #34d399;
  border: 1px solid rgba(16,185,129,.35);
  border-radius: .375rem; font-size: .78rem; font-weight: 700;
}
.badge-general {
  display: inline-block; padding: .2rem .6rem;
  background: rgba(148,163,184,.1); color: #94a3b8;
  border: 1px solid rgba(148,163,184,.2);
  border-radius: .375rem; font-size: .78rem;
}

.btn-edit {
  padding: .3rem .7rem;
  font-size: .8rem; font-weight: 600;
  background: rgba(59,130,246,.2); color: #60a5fa;
  border: 1px solid rgba(59,130,246,.4);
  border-radius: .375rem; cursor: pointer;
  margin-right: .35rem; transition: all .15s;
}
.btn-edit:hover { background: rgba(59,130,246,.4); }

.btn-delete {
  padding: .3rem .7rem;
  font-size: .8rem; font-weight: 600;
  background: rgba(239,68,68,.15); color: #f87171;
  border: 1px solid rgba(239,68,68,.3);
  border-radius: .375rem; cursor: pointer; transition: all .15s;
}
.btn-delete:hover { background: rgba(239,68,68,.3); }

.empty-cell { text-align: center; padding: 3rem; color: #64748b; }

.loading-state { text-align: center; padding: 3rem; color: #64748b; }
.spinner {
  width: 40px; height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid rgba(255,255,255,.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 모달 */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: #1e2a3a;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 1rem;
  width: 95%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.5);
}
.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.modal-header h5 { margin: 0; font-weight: 700; color: #e2e8f0; font-size: 1.1rem; }
.close-btn {
  background: none; border: none;
  cursor: pointer; font-size: 1.1rem;
  color: #64748b; padding: .35rem;
  border-radius: .375rem; line-height: 1;
}
.close-btn:hover { background: rgba(255,255,255,.07); color: #e2e8f0; }

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: .875rem;
}
.modal-footer {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  border-top: 1px solid rgba(255,255,255,.08);
}

.form-row { display: flex; gap: .75rem; }
.form-row .form-group { flex: 1; }

.form-group { display: flex; flex-direction: column; gap: .35rem; }
.form-label { font-size: .825rem; font-weight: 600; color: #94a3b8; }
.required-mark { color: #f87171; margin-left: .2rem; }

.info-box {
  padding: .6rem .9rem;
  background: rgba(16,185,129,.1);
  border: 1px solid rgba(16,185,129,.25);
  border-radius: .5rem;
  font-size: .85rem;
  color: #34d399;
}

.custom-input {
  padding: .5rem .75rem;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: .5rem;
  font-size: .9rem;
  color: #e2e8f0;
  width: 100%;
  box-sizing: border-box;
}
.custom-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.15);
}
.custom-input::placeholder { color: #64748b; }

.custom-select {
  padding: .5rem .75rem;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: .5rem;
  font-size: .9rem;
  color: #e2e8f0;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}
.custom-select:focus { outline: none; border-color: #3b82f6; }
.custom-select.input-error { border-color: #f87171; box-shadow: 0 0 0 3px rgba(239,68,68,.15); }
.custom-select option { background: #1e2a3a; color: #e2e8f0; }

.error-text { font-size: .8rem; color: #f87171; }

.btn-custom {
  padding: .55rem 1.25rem;
  font-size: .9rem;
  font-weight: 600;
  border: none;
  border-radius: .5rem;
  cursor: pointer;
  transition: all .2s;
}
.btn-success  { background: linear-gradient(135deg, #10b981, #059669); color: white; }
.btn-success:hover  { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(16,185,129,.4); }
.btn-secondary { background: rgba(255,255,255,.08); color: #94a3b8; border: 1px solid rgba(255,255,255,.1); }
.btn-secondary:hover { background: rgba(255,255,255,.12); color: #e2e8f0; }
</style>
