<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">직원 관리</h1>
      <button @click="openAddModal" class="btn-add">직원 추가</button>
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
              <th>사번</th>
              <th>이름</th>
              <th>부서</th>
              <th>직급</th>
              <th>연락처</th>
              <th>입사일</th>
              <th>연차</th>
              <th>담당 차량</th>
              <th>관리자</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="displayUsers.length === 0">
              <td colspan="10" class="empty-cell">등록된 직원이 없습니다</td>
            </tr>
            <tr v-for="user in displayUsers" :key="user.userId" class="table-row">
              <td class="td-center">{{ user.employeeId || '-' }}</td>
              <td class="td-name">{{ user.name }}</td>
              <td class="td-center">{{ user.department || '-' }}</td>
              <td class="td-center">{{ user.position || '-' }}</td>
              <td class="td-center">{{ user.phone || '-' }}</td>
              <td class="td-center">{{ user.joinDate || '-' }}</td>
              <td class="td-center">{{ user.totalVacation != null ? user.totalVacation : '-' }}</td>
              <td class="td-center">
                <span v-if="getUserVehicle(user.userId)" class="vehicle-tag">
                  {{ getUserVehicle(user.userId).carNum }}
                  <span class="vehicle-type">{{ getUserVehicle(user.userId).carType }}</span>
                </span>
                <span v-else class="text-muted">미배정</span>
              </td>
              <td class="td-center">
                <span :class="user.isAdmin === 'Y' ? 'badge-admin' : 'badge-normal'">
                  {{ user.isAdmin === 'Y' ? '관리자' : '일반' }}
                </span>
              </td>
              <td class="td-actions">
                <button @click="openEditModal(user)" class="btn-edit">수정</button>
                <button @click="confirmDelete(user)" class="btn-delete">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 직원 추가/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>{{ modal.isEdit ? '직원 수정' : '직원 추가' }}</h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">

          <div class="form-row">
            <div v-if="modal.isEdit" class="form-group">
              <label class="form-label">사번</label>
              <input v-model="modal.employeeId" class="custom-input readonly-input" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">이름 *</label>
              <input v-model="modal.name" class="custom-input" placeholder="이름" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">부서</label>
              <select v-model="modal.department" class="custom-select">
                <option value="">-- 선택 --</option>
                <option value="운전부">운전부</option>
                <option value="생산과">생산과</option>
                <option value="품질관리부">품질관리부</option>
                <option value="관리부">관리부</option>
                <option value="영업부">영업부</option>
                <option value="식당">식당</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">직급</label>
              <input v-model="modal.position" class="custom-input" placeholder="직급" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">연락처</label>
              <input v-model="modal.phone" class="custom-input" placeholder="010-0000-0000" />
            </div>
            <div class="form-group">
              <label class="form-label">입사일</label>
              <input v-model="modal.joinDate" class="custom-input" type="date" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">연차</label>
              <input v-model.number="modal.totalVacation" class="custom-input" type="number" placeholder="15" />
            </div>
            <div class="form-group">
              <label class="form-label">관리자 여부</label>
              <select v-model="modal.isAdmin" class="custom-select">
                <option value="N">일반</option>
                <option value="Y">관리자</option>
              </select>
            </div>
          </div>

          <!-- 수정 시: 현재 담당 차량 안내 -->
          <div v-if="modal.isEdit && getUserVehicle(modal.userId)" class="linked-vehicle-info">
            <span class="linked-label">담당 차량</span>
            <span class="linked-value">
              {{ getUserVehicle(modal.userId).carNum }} / {{ getUserVehicle(modal.userId).modelName || getUserVehicle(modal.userId).carType }}
            </span>
            <span class="linked-note">차량 변경은 차량 관리 페이지에서 해주세요</span>
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
  name: 'UserSetting',
  data() {
    return {
      users: [],
      vehicles: [],
      loading: false,
      showModal: false,
      modal: {},
    }
  },
  computed: {
    displayUsers() {
      return this.users.filter(u => u.userId !== 0)
    },
  },
  methods: {
    getUserVehicle(userId) {
      if (!userId) return null
      return this.vehicles.find(v => v.userId === userId && v.carType !== '지원차') || null
    },
    openAddModal() {
      this.modal = {
        isEdit: false,
        userId: null,
        name: '',
        department: '',
        position: '',
        phone: '',
        joinDate: '',
        totalVacation: 15,
        isAdmin: 'N',
      }
      this.showModal = true
    },
    openEditModal(user) {
      this.modal = {
        isEdit: true,
        userId: user.userId,
        employeeId: user.employeeId || '',
        name: user.name || '',
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        joinDate: user.joinDate || '',
        totalVacation: user.totalVacation != null ? user.totalVacation : 15,
        isAdmin: user.isAdmin || 'N',
      }
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.modal = {}
    },
    async saveModal() {
      if (!this.modal.name || !this.modal.name.trim()) {
        alert('이름을 입력해주세요')
        return
      }
      try {
        const payload = {
          userId: this.modal.isEdit ? this.modal.userId : null,
          employeeId: this.modal.employeeId || null,
          name: this.modal.name.trim(),
          department: this.modal.department || null,
          position: this.modal.position || null,
          phone: this.modal.phone || null,
          joinDate: this.modal.joinDate || null,
          totalVacation: this.modal.totalVacation != null ? this.modal.totalVacation : 15,
          isAdmin: this.modal.isAdmin || 'N',
        }
        await api.post('/users/save', payload)
        alert('저장되었습니다')
        this.closeModal()
        await this.fetchUsers()
      } catch (e) {
        const msg = e.response?.data?.message || e.message || '알 수 없는 오류'
        alert('저장 오류: ' + msg)
      }
    },
    async confirmDelete(user) {
      const linked = this.getUserVehicle(user.userId)
      if (linked) {
        const ok = confirm(
          `[${user.name}] 직원은 [${linked.carNum}] 차량과 연동되어 있습니다.\n` +
          `직원을 삭제하면 해당 차량의 담당자가 해제됩니다.\n계속하시겠습니까?`
        )
        if (!ok) return
      } else {
        if (!confirm(`[${user.name}] 직원을 삭제하시겠습니까?`)) return
      }
      try {
        await api.post('/users/delete', { userId: user.userId })
        await this.fetchUsers()
        await this.fetchVehicles()
      } catch (e) {
        alert('삭제 오류: ' + (e.response?.data?.message || e.message || '알 수 없는 오류'))
      }
    },
    async fetchUsers() {
      this.loading = true
      try {
        const res = await api.post('/users/list')
        this.users = res.data || res
      } catch (e) {
        console.error('직원 조회 오류:', e)
      } finally {
        this.loading = false
      }
    },
    async fetchVehicles() {
      try {
        const res = await api.post('/vehicles', {})
        this.vehicles = res.data || res
      } catch (e) {
        console.error('차량 조회 오류:', e)
      }
    },
  },
  mounted() {
    this.fetchUsers()
    this.fetchVehicles()
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

.td-center { text-align: center; }
.td-name   { font-weight: 600; }
.td-actions { text-align: center; white-space: nowrap; }

.vehicle-tag {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-weight: 600;
  color: #60a5fa;
}
.vehicle-type {
  font-size: .72rem;
  font-weight: 400;
  color: #94a3b8;
  background: rgba(255,255,255,.06);
  padding: .1rem .4rem;
  border-radius: .25rem;
}
.text-muted { color: #64748b; font-size: .85rem; }

.badge-admin {
  display: inline-block;
  padding: .2rem .6rem;
  background: rgba(245,158,11,.2);
  color: #fbbf24;
  border: 1px solid rgba(245,158,11,.4);
  border-radius: .375rem;
  font-size: .78rem;
  font-weight: 700;
}
.badge-normal {
  display: inline-block;
  padding: .2rem .6rem;
  background: rgba(148,163,184,.1);
  color: #94a3b8;
  border: 1px solid rgba(148,163,184,.2);
  border-radius: .375rem;
  font-size: .78rem;
}

.btn-edit {
  padding: .3rem .7rem;
  font-size: .8rem;
  font-weight: 600;
  background: rgba(59,130,246,.2);
  color: #60a5fa;
  border: 1px solid rgba(59,130,246,.4);
  border-radius: .375rem;
  cursor: pointer;
  margin-right: .35rem;
  transition: all .15s;
}
.btn-edit:hover { background: rgba(59,130,246,.4); }

.btn-delete {
  padding: .3rem .7rem;
  font-size: .8rem;
  font-weight: 600;
  background: rgba(239,68,68,.15);
  color: #f87171;
  border: 1px solid rgba(239,68,68,.3);
  border-radius: .375rem;
  cursor: pointer;
  transition: all .15s;
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
  max-width: 520px;
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

.linked-vehicle-info {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .6rem .9rem;
  background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.2);
  border-radius: .5rem;
  flex-wrap: wrap;
}
.linked-label { font-size: .8rem; font-weight: 600; color: #94a3b8; }
.linked-value { font-size: .9rem; font-weight: 700; color: #60a5fa; }
.linked-note { font-size: .78rem; color: #64748b; margin-left: auto; }

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
.readonly-input { opacity: .6; cursor: default; }

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
.custom-select option { background: #1e2a3a; color: #e2e8f0; }

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
