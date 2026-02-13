<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">휴가 관리</h1>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tabs-section">
      <button 
        class="tab-btn" 
        :class="{ active: currentView === 'form' }"
        @click="changeView('form')"
      >
        ➕ 휴가 신청
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: currentView === 'list' }"
        @click="changeView('list')"
      >
        📋 전체 현황
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: currentView === 'calendar' }"
        @click="changeView('calendar')"
      >
        📅 달력 보기
      </button>
    </div>

    <!-- 휴가 신청 뷰 -->
    <div v-show="currentView === 'form'">
      <!-- 휴가 신청 카드 -->
      <div class="card-section">
        <div class="card-header">
          <h4 class="card-title">휴가 신청</h4>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <label class="form-label required">신청자</label>
              <div class="custom-select-wrapper">
                <select v-model="selectedUserId" class="form-control" @change="onFormUserChange">
                  <option value="">선택하세요</option>
                  <option v-for="user in users" :key="user.userId" :value="user.userId">
                    {{ user.name }} - {{ user.department }}
                  </option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
            <div class="col-md-2">
              <label class="form-label required">휴가 종류</label>
              <div class="custom-select-wrapper">
                <select v-model="newVacation.vacationType" class="form-control" @change="onVacationTypeChange">
                  <option value="">선택</option>
                  <option value="V">연차</option>
                  <option value="AM">오전 반차</option>
                  <option value="PM">오후 반차</option>
                  <option value="S">병가</option>
                  <option value="E">경조사</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
            <div class="col-md-2">
              <label class="form-label required">시작일</label>
              <input 
                v-model="newVacation.startDate" 
                type="date" 
                class="form-control"
                @change="onDateChange"
              />
            </div>
            <div class="col-md-2">
              <label class="form-label required">종료일</label>
              <input 
                v-model="newVacation.endDate" 
                type="date" 
                class="form-control"
                :disabled="isHalfDay"
                @change="onDateChange"
              />
            </div>
            <div class="col-md-1">
              <label class="form-label">일수</label>
              <input 
                v-model="calculatedDays" 
                type="text" 
                class="form-control calculated-field" 
                readonly
              />
            </div>
            <div class="col-md-2">
              <label class="form-label">사유</label>
              <input 
                v-model="newVacation.reason" 
                type="text" 
                class="form-control" 
                placeholder="사유 (선택)"
              />
            </div>
          </div>
          <div class="button-group mt-3">
            <button @click="addVacation" class="btn-custom btn-primary">
              휴가 신청
            </button>
          </div>
        </div>
      </div>

      <!-- 선택한 사용자의 요약 정보 -->
      <div v-if="selectedUserSummary" class="card-section mt-4">
        <div class="card-header">
          <h4 class="card-title">{{ selectedUserSummary.name }}님의 연차 현황</h4>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <div class="summary-card total">
                <div class="summary-icon">📊</div>
                <div class="summary-info">
                  <div class="summary-label">총 연차</div>
                  <div class="summary-value">{{ selectedUserSummary.totalVacation }}일</div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="summary-card used">
                <div class="summary-icon">✅</div>
                <div class="summary-info">
                  <div class="summary-label">사용 연차</div>
                  <div class="summary-value">{{ (selectedUserSummary.totalVacation - selectedUserSummary.remainingVacation).toFixed(1) }}일</div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="summary-card remaining">
                <div class="summary-icon">⏰</div>
                <div class="summary-info">
                  <div class="summary-label">잔여 연차</div>
                  <div class="summary-value">{{ selectedUserSummary.remainingVacation.toFixed(1) }}일</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 전체 현황 뷰 -->
    <div v-show="currentView === 'list'">
      <div class="card-section">
        <div class="card-header">
          <h4 class="card-title">전체 휴가 현황 ({{ allVacations.length }}건)</h4>
        </div>
        <div class="card-body">
          <!-- 검색 필터 -->
          <div class="filter-group">
            <div class="filter-item">
              <label class="form-label">검색 유형</label>
              <select v-model="searchType" class="form-control">
                <option value="all">전체</option>
                <option value="name">이름</option>
                <option value="department">부서</option>
              </select>
            </div>
            <div class="filter-item" v-if="searchType !== 'all'">
              <label class="form-label">검색어</label>
              <input 
                v-model="searchKeyword" 
                type="text" 
                class="form-control" 
                placeholder="검색어 입력"
                @keyup.enter="filterAllVacations"
              />
            </div>
            <div class="filter-item">
              <label class="form-label">상태</label>
              <select v-model="searchStatus" class="form-control">
                <option value="">전체 상태</option>
                <option value="W">대기</option>
                <option value="A">승인</option>
                <option value="R">반려</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="form-label">&nbsp;</label>
              <button @click="filterAllVacations" class="btn-custom btn-primary btn-block">
                검색
              </button>
            </div>
          </div>

          <div class="table-responsive mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>사번</th>
                  <th>이름</th>
                  <th>부서</th>
                  <th>직급</th>
                  <th>휴가 종류</th>
                  <th>시작일</th>
                  <th>종료일</th>
                  <th>일수</th>
                  <th>상태</th>
                  <th>사유</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredAllVacations.length === 0">
                  <td colspan="11" class="empty-cell">
                    <p class="empty-message">등록된 휴가가 없습니다</p>
                  </td>
                </tr>
                <tr v-for="v in filteredAllVacations" :key="v.vacationId" class="data-row">
                  <td>{{ v.employeeId }}</td>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ v.name.charAt(0) }}</div>
                      <span>{{ v.name }}</span>
                    </div>
                  </td>
                  <td>{{ v.department }}</td>
                  <td>{{ v.position }}</td>
                  <td>
                    <span class="type-badge" :class="`type-${v.vacationType}`">
                      {{ getVacationTypeName(v.vacationType) }}
                    </span>
                  </td>
                  <td>{{ formatDate(v.startDate) }}</td>
                  <td>{{ formatDate(v.endDate) }}</td>
                  <td class="text-center font-weight-bold">{{ v.usedDays }}일</td>
                  <td>
                    <span class="status-badge" :class="`status-${getStatusClass(v.status)}`">
                      {{ getStatusName(v.status) }}
                    </span>
                  </td>
                  <td>{{ v.reason || '-' }}</td>
                  <td>
                    <div class="action-buttons">
                      <template v-if="v.status === 'W'">
                        <button 
                          @click="approveVacation(v.vacationId)" 
                          class="btn-icon btn-approve"
                          title="승인">
                          ✓
                        </button>
                        <button 
                          @click="rejectVacation(v.vacationId)" 
                          class="btn-icon btn-reject"
                          title="반려">
                          ✕
                        </button>
                        <button 
                          @click="deleteVacation(v.vacationId)" 
                          class="btn-icon btn-delete"
                          title="삭제">
                          🗑️
                        </button>
                      </template>
                      <template v-else>
                        <span class="text-muted">-</span>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 달력 뷰 -->
    <div v-show="currentView === 'calendar'">
      <div class="card-section">
        <div class="card-header">
          <h4 class="card-title">전체 휴가 달력 ({{ allVacations.length }}건)</h4>
        </div>
        <div class="card-body">
          <div class="calendar-controls">
            <button @click="previousMonth" class="btn-nav">◀</button>
            <h4 class="calendar-title">{{ currentYear }}년 {{ currentMonth }}월</h4>
            <button @click="nextMonth" class="btn-nav">▶</button>
          </div>

          <div class="calendar-grid mt-3">
            <div class="calendar-header" v-for="day in ['일', '월', '화', '수', '목', '금', '토']" :key="day">
              {{ day }}
            </div>
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index"
              class="calendar-day"
              :class="{
                'empty': !day.date,
                'today': isToday(day.date),
                'has-vacation': day.vacations && day.vacations.length > 0
              }"
            >
              <div class="day-number">{{ day.date ? day.date.getDate() : '' }}</div>
              <div class="day-vacations" v-if="day.vacations && day.vacations.length > 0">
                <div 
                  v-for="vacation in day.vacations" 
                  :key="vacation.vacationId"
                  class="vacation-item"
                  :class="`vacation-${vacation.vacationType.toLowerCase()}`"
                  :title="`${vacation.name} - ${getVacationTypeName(vacation.vacationType)}`"
                >
                  <span class="vacation-name">{{ vacation.name }}</span>
                  <span class="vacation-type">{{ getVacationTypeShort(vacation.vacationType) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

const currentView = ref('form');
const users = ref([]);
const allVacations = ref([]);
const filteredAllVacations = ref([]);
const selectedUserId = ref('');
const selectedUserSummary = ref(null);

const searchType = ref('all');
const searchKeyword = ref('');
const searchStatus = ref('');

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

const newVacation = ref({
  vacationType: '',
  startDate: '',
  endDate: '',
  reason: ''
});

const isHalfDay = computed(() => {
  return newVacation.value.vacationType === 'AM' || newVacation.value.vacationType === 'PM';
});

const calculatedDays = computed(() => {
  if (!newVacation.value.vacationType || !newVacation.value.startDate) return '0';
  if (isHalfDay.value) return '0.5';
  if (!newVacation.value.endDate) return '0';
  
  const start = new Date(newVacation.value.startDate);
  const end = new Date(newVacation.value.endDate);
  const diff = (end - start) / (1000 * 60 * 60 * 24) + 1;
  return diff > 0 ? diff.toString() : '0';
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, vacations: [] });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    const dateStr = formatDate(date);
    const dayVacations = allVacations.value.filter(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      return date >= start && date <= end && v.status === 'A';
    });
    
    days.push({ date, vacations: dayVacations });
  }
  
  const remainingDays = 42 - days.length;
  for (let i = 0; i < remainingDays; i++) {
    days.push({ date: null, vacations: [] });
  }
  
  return days;
});

const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const previousMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const changeView = async (view) => {
  currentView.value = view;
  
  switch(view) {
    case 'form':
      await Promise.all([
        loadUsers(),
        loadAllVacations()
      ]);
      if (selectedUserId.value) {
        await loadUserSummary();
      }
      break;
    case 'list':
      await loadAllVacations();
      break;
    case 'calendar':
      await loadAllVacations();
      break;
  }
};

const onFormUserChange = async () => {
  if (selectedUserId.value) {
    await loadUserSummary();
  } else {
    selectedUserSummary.value = null;
  }
};

const onVacationTypeChange = () => {
  if (isHalfDay.value) {
    newVacation.value.endDate = newVacation.value.startDate;
  }
};

const onDateChange = () => {
  if (isHalfDay.value) {
    newVacation.value.endDate = newVacation.value.startDate;
  }
};

const getVacationTypeName = (type) => {
  const types = { 'V': '연차', 'AM': '오전반차', 'PM': '오후반차', 'E': '경조사', 'S': '병가' };
  return types[type] || type;
};

const getVacationTypeShort = (type) => {
  const types = { 'V': '연', 'AM': '오전', 'PM': '오후', 'E': '경조', 'S': '병' };
  return types[type] || type;
};

const getStatusName = (status) => {
  const statuses = { 'W': '대기', 'A': '승인', 'R': '반려' };
  return statuses[status] || status;
};

const getStatusClass = (status) => {
  const classes = { 'W': 'waiting', 'A': 'approved', 'R': 'rejected' };
  return classes[status] || status;
};

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadUsers = async () => {
  try {
    const response = await api.post('/users/list');
    const allUsers = response.data || response;
    users.value = allUsers.filter(user => user.department !== '운전부');
  } catch (error) {
    console.error('사용자 목록 로드 실패:', error);
  }
};

const loadUserSummary = async () => {
  if (!selectedUserId.value) return;
  try {
    const response = await api.post('/vacations/summary', { userId: parseInt(selectedUserId.value) });
    selectedUserSummary.value = response;
  } catch (error) {
    console.error('휴가 요약 정보 로드 실패:', error);
  }
};

const loadAllVacations = async () => {
  try {
    const response = await api.post('/vacations/list', {});
    allVacations.value = response || [];
    filteredAllVacations.value = allVacations.value;
  } catch (error) {
    console.error('전체 휴가 데이터 로드 실패:', error);
    allVacations.value = [];
  }
};

const filterAllVacations = () => {
  let filtered = [...allVacations.value];
  
  if (searchType.value !== 'all' && searchKeyword.value) {
    filtered = filtered.filter(v => {
      if (searchType.value === 'name') {
        return v.name.includes(searchKeyword.value);
      } else if (searchType.value === 'department') {
        return v.department.includes(searchKeyword.value);
      }
      return true;
    });
  }
  
  if (searchStatus.value) {
    filtered = filtered.filter(v => v.status === searchStatus.value);
  }
  
  filteredAllVacations.value = filtered;
};

const addVacation = async () => {
  if (!selectedUserId.value) {
    alert('신청자를 선택해주세요.');
    return;
  }
  if (!newVacation.value.vacationType || !newVacation.value.startDate) {
    alert('휴가 종류와 시작일은 필수입니다.');
    return;
  }
  if (!isHalfDay.value && !newVacation.value.endDate) {
    alert('종료일을 선택해주세요.');
    return;
  }

  try {
    const requestData = {
      userId: parseInt(selectedUserId.value),
      vacationType: newVacation.value.vacationType,
      startDate: newVacation.value.startDate,
      endDate: isHalfDay.value ? newVacation.value.startDate : newVacation.value.endDate,
      reason: newVacation.value.reason || null
    };
    
    const response = await api.post('/vacations/create', requestData);
    
    if (response.success) {
      alert(response.message);
      newVacation.value = { vacationType: '', startDate: '', endDate: '', reason: '' };
      await Promise.all([
        loadUserSummary(),
        loadAllVacations()
      ]);
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    console.error('휴가 신청 실패:', error);
    alert(error.response?.data?.message || '휴가 신청에 실패했습니다.');
  }
};

const approveVacation = async (id) => {
  if (!confirm('이 휴가를 승인하시겠습니까?')) return;
  try {
    const response = await api.post('/vacations/approve', { id });
    if (response.success || response.data?.success) {
      alert('휴가가 승인되었습니다.');
      await Promise.all([
        loadUserSummary(),
        loadAllVacations()
      ]);
    } else {
      alert(response.data?.message || '승인에 실패했습니다.');
    }
  } catch (error) {
    console.error('휴가 승인 실패:', error);
    alert(error.response?.data?.message || '승인에 실패했습니다.');
  }
};

const rejectVacation = async (id) => {
  if (!confirm('이 휴가를 반려하시겠습니까?')) return;
  try {
    const response = await api.post('/vacations/reject', { id });
    if (response.success || response.data?.success) {
      alert('휴가가 반려되었습니다.');
      await Promise.all([
        loadUserSummary(),
        loadAllVacations()
      ]);
    } else {
      alert(response.data?.message || '반려에 실패했습니다.');
    }
  } catch (error) {
    console.error('휴가 반려 실패:', error);
    alert(error.response?.data?.message || '반려에 실패했습니다.');
  }
};

const deleteVacation = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  try {
    const response = await api.post('/vacations/delete', { id });
    if (response.data.success) {
      alert(response.data.message);
      await Promise.all([
        loadUserSummary(),
        loadAllVacations()
      ]);
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    console.error('휴가 삭제 실패:', error);
    alert('삭제에 실패했습니다.');
  }
};

onMounted(async () => {
  await loadUsers();
  await loadAllVacations();
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
  color: #1e293b;
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

.card-body {
  /* padding는 card-section에서 처리 */
}

.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.col-md-1 { flex: 0 0 8.333333%; min-width: 100px; }
.col-md-2 { flex: 0 0 16.666667%; min-width: 150px; }
.col-md-3 { flex: 1; min-width: 200px; }
.col-md-4 { flex: 1; min-width: 250px; }

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-control {
  width: 100%;
  font-size: 0.9375rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  transition: all 0.2s ease;
}

.form-control:hover {
  border-color: #cbd5e1;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
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
  text-align: center;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
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

.btn-block {
  width: 100%;
}

.summary-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  height: 100%;
}

.summary-card.total { border-left: 4px solid #3b82f6; }
.summary-card.used { border-left: 4px solid #f59e0b; }
.summary-card.remaining { border-left: 4px solid #10b981; }

.summary-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.summary-card.total .summary-icon {
  background: #dbeafe;
}

.summary-card.used .summary-icon {
  background: #fef3c7;
}

.summary-card.remaining .summary-icon {
  background: #d1fae5;
}

.summary-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.filter-item {
  flex: 0 0 auto;
  min-width: 150px;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.type-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-badge.type-V { background: #dbeafe; color: #1e40af; }
.type-badge.type-AM, .type-badge.type-PM { background: #fef3c7; color: #92400e; }
.type-badge.type-E { background: #fce7f3; color: #be185d; }
.type-badge.type-S { background: #fee2e2; color: #991b1b; }

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.status-waiting { 
  background: #fef3c7; 
  color: #92400e; 
  border: 1px solid #fde68a;
}
.status-badge.status-approved { 
  background: #d1fae5; 
  color: #065f46; 
  border: 1px solid #a7f3d0;
}
.status-badge.status-rejected { 
  background: #fee2e2; 
  color: #991b1b; 
  border: 1px solid #fecaca;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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

.btn-approve {
  color: #10b981;
}

.btn-reject {
  color: #ef4444;
}

.btn-delete {
  color: #94a3b8;
}

.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
}

.calendar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-nav {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.btn-nav:hover {
  background: #e2e8f0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.calendar-header {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: center;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.875rem;
}

.calendar-day {
  background: white;
  min-height: 120px;
  max-height: 200px;
  padding: 0.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.calendar-day.empty {
  background: #f8fafc;
}

.calendar-day.today {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.calendar-day.has-vacation {
  background: #f0f9ff;
}

.day-number {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.day-vacations {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow-y: auto;
}

.vacation-item {
  padding: 3px 5px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  flex-shrink: 0;
}

.vacation-name {
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vacation-type {
  font-size: 0.7rem;
  flex-shrink: 0;
}

.vacation-item.vacation-v { background: #dbeafe; color: #1e40af; }
.vacation-item.vacation-am, .vacation-item.vacation-pm { background: #fef3c7; color: #92400e; }
.vacation-item.vacation-s { background: #fee2e2; color: #991b1b; }
.vacation-item.vacation-e { background: #e0e7ff; color: #4338ca; }

.text-center {
  text-align: center;
}

.text-muted {
  color: #94a3b8;
}

.font-weight-bold {
  font-weight: 700;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>