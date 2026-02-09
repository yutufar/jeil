<template>
  <div class="content">
    <card title="휴가 신청 및 현황">
      <!-- 뷰 전환 버튼 -->
      <div class="view-toggle-section mb-4">
        <div class="btn-group">
          <button 
            @click="changeView('form')" 
            class="btn-toggle"
            :class="{ active: currentView === 'form' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="margin-right: 0.5rem;">
              <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            휴가 신청
          </button>
          <button 
            @click="changeView('list')" 
            class="btn-toggle"
            :class="{ active: currentView === 'list' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="margin-right: 0.5rem;">
              <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            전체 현황
          </button>
          <button 
            @click="changeView('calendar')" 
            class="btn-toggle"
            :class="{ active: currentView === 'calendar' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="margin-right: 0.5rem;">
              <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M3 8H17M7 2V6M13 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            달력 보기
          </button>
        </div>
      </div>

      <!-- 휴가 신청 뷰 -->
      <div v-if="currentView === 'form'">
        <!-- 휴가 신청 폼 -->
        <div class="add-vacation-section mb-4">
          <h5 class="section-title mb-3" style="color: rgb(255 255 255) !important;">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" style="margin-right: 0.5rem; vertical-align: middle;" stroke="#1e293b">
              <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            휴가 신청
          </h5>
          <div class="vacation-form-card">
            <div class="row g-3">
              <!-- 사용자 선택을 폼 안에 -->
              <div class="col-md-3">
                <label class="form-label required">신청자</label>
                <div class="custom-select-wrapper">
                  <select v-model="selectedUserId" class="custom-select" @change="onFormUserChange">
                    <option value="">선택하세요</option>
                    <option v-for="user in users" :key="user.userId" :value="user.userId">
                      {{ user.name }} - {{ user.department }}
                    </option>
                  </select>
                  <span class="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div class="col-md-2">
                <label class="form-label required">휴가 종류</label>
                <div class="custom-select-wrapper">
                  <select v-model="newVacation.vacationType" class="custom-select" @change="onVacationTypeChange">
                    <option value="">선택</option>
                    <option value="V">연차</option>
                    <option value="AM">오전 반차</option>
                    <option value="PM">오후 반차</option>
                    <option value="S">병가</option>
                    <option value="E">경조사</option>
                  </select>
                  <span class="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div class="col-md-2">
                <label class="form-label required">시작일</label>
                <input 
                  v-model="newVacation.startDate" 
                  type="date" 
                  class="custom-input"
                  @change="onDateChange"
                />
              </div>
              <div class="col-md-2">
                <label class="form-label required">종료일</label>
                <input 
                  v-model="newVacation.endDate" 
                  type="date" 
                  class="custom-input"
                  :disabled="isHalfDay"
                  @change="onDateChange"
                />
              </div>
              <div class="col-md-1">
                <label class="form-label">일수</label>
                <input 
                  v-model="calculatedDays" 
                  type="text" 
                  class="custom-input" 
                  readonly
                  style="text-align: center; font-weight: 700; background: #f8fafc;"
                />
              </div>
              <div class="col-md-2">
                <label class="form-label">사유</label>
                <input 
                  v-model="newVacation.reason" 
                  type="text" 
                  class="custom-input" 
                  placeholder="사유 (선택)"
                />
              </div>
            </div>
            <div class="row g-3 mt-2">
              <div class="col-12 text-end">
                <button @click="addVacation" class="btn-custom btn-success">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 0.5rem;">
                    <path d="M13 5L6 12L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  휴가 신청
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 선택한 사용자의 요약 정보 -->
        <div v-if="selectedUserSummary" class="summary-section mb-4">
          <h5 class="section-title mb-3" style="color: #1e293b !important;">{{ selectedUserSummary.name }}님의 연차 현황</h5>
          <div class="row g-3">
            <div class="col-md-4">
              <div class="summary-card total">
                <div class="summary-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <div class="summary-label">총 연차</div>
                  <div class="summary-value">{{ selectedUserSummary.totalVacation }}일</div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="summary-card used">
                <div class="summary-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <div class="summary-label">사용 연차</div>
                  <div class="summary-value">{{ (selectedUserSummary.totalVacation - selectedUserSummary.remainingVacation).toFixed(1) }}일</div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="summary-card remaining">
                <div class="summary-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <div class="summary-label">잔여 연차</div>
                  <div class="summary-value">{{ selectedUserSummary.remainingVacation.toFixed(1) }}일</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 전체 현황 뷰 -->
      <div v-if="currentView === 'list'">
        <div class="list-section">
          <h5 class="section-title mb-3" style="color: rgb(255 255 255) !important;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem; vertical-align: middle;" stroke="#1e293b">
              <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            전체 휴가 현황
            <span class="badge-count">{{ allVacations.length }}</span>
          </h5>
          
          <!-- 검색 필터 -->
          <div class="search-filters mb-3">
            <div class="row g-3">
              <div class="col-md-2">
                <select v-model="searchType" class="custom-select">
                  <option value="all">전체</option>
                  <option value="name">이름</option>
                  <option value="department">부서</option>
                </select>
              </div>
              <div class="col-md-3" v-if="searchType !== 'all'">
                <input 
                  v-model="searchKeyword" 
                  type="text" 
                  class="custom-input" 
                  placeholder="검색어 입력"
                  @keyup.enter="filterAllVacations"
                />
              </div>
              <div class="col-md-2">
                <select v-model="searchStatus" class="custom-select">
                  <option value="">전체 상태</option>
                  <option value="W">대기</option>
                  <option value="A">승인</option>
                  <option value="R">반려</option>
                </select>
              </div>
              <div class="col-md-2">
                <button @click="filterAllVacations" class="btn-custom btn-primary w-100">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 0.5rem;">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="2"/>
                    <path d="M11 11L14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  검색
                </button>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
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
                  <th style="width: 180px;">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in filteredAllVacations" :key="v.vacationId">
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
                  <td class="text-center"><strong>{{ v.usedDays }}일</strong></td>
                  <td>
                    <span class="status-badge" :class="`status-${getStatusClass(v.status)}`">
                      {{ getStatusName(v.status) }}
                    </span>
                  </td>
                  <td>{{ v.reason || '-' }}</td>
                  <td>
                    <div class="action-buttons">
                      <!-- 대기 상태일 때 승인/반려 버튼 표시 -->
                      <template v-if="v.status === 'W'">
                        <button 
                          @click="approveVacation(v.vacationId)" 
                          class="btn-action btn-approve"
                          title="승인">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M11 4L5.5 9.5L3 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          승인
                        </button>
                        <button 
                          @click="rejectVacation(v.vacationId)" 
                          class="btn-action btn-reject"
                          title="반려">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10 4L4 10M4 4L10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                          반려
                        </button>
                        <button 
                          @click="deleteVacation(v.vacationId)" 
                          class="btn-action btn-delete"
                          title="삭제">
                          삭제
                        </button>
                      </template>
                      <!-- 승인/반려 완료된 경우 -->
                      <template v-else>
                        <span class="text-muted">-</span>
                      </template>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredAllVacations.length === 0">
                  <td colspan="11" class="text-center py-5">
                    <div class="empty-state">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin-bottom: 1rem; opacity: 0.3;">
                        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 20H32M16 28H24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <p>등록된 휴가가 없습니다</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 달력 뷰 -->
      <div v-if="currentView === 'calendar'">
        <div class="calendar-section">
          <h5 class="section-title mb-3" style="color: rgb(255 255 255) !important;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem; vertical-align: middle;" stroke="#1e293b">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M3 10H21M8 2V6M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            전체 휴가 달력
            <span class="badge-count">{{ allVacations.length }}</span>
          </h5>
          <div class="calendar-controls mb-3">
            <button @click="previousMonth" class="btn-nav">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 15L7 10L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <h4 class="calendar-title">{{ currentYear }}년 {{ currentMonth }}월</h4>
            <button @click="nextMonth" class="btn-nav">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 5L13 10L8 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="calendar-grid">
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
                <!-- 모든 휴가 표시 (slice 제거) -->
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
    </card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

const currentView = ref('form'); // 'form', 'list', 'calendar'
const users = ref([]);
const allVacations = ref([]);
const filteredAllVacations = ref([]);
const selectedUserId = ref('');
const selectedUserSummary = ref(null);

// 검색 필터
const searchType = ref('all');
const searchKeyword = ref('');
const searchStatus = ref('');

// 달력 관련
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

// 달력 날짜 계산
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // 이전 달의 빈 칸
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, vacations: [] });
  }
  
  // 현재 달의 날짜
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    const dateStr = formatDate(date);
    const dayVacations = allVacations.value.filter(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      return date >= start && date <= end && v.status === 'A'; // 승인된 휴가만
    });
    
    days.push({ date, vacations: dayVacations });
  }
  
  // 다음 달의 빈 칸
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
  
  // 탭 전환 시 데이터 새로고침
  switch(view) {
    case 'form':
      // 휴가 신청 탭: 사용자 목록과 휴가 목록 새로고침
      await Promise.all([
        loadUsers(),
        loadAllVacations()
      ]);
      // 선택된 사용자가 있으면 요약 정보도 새로고침
      if (selectedUserId.value) {
        await loadUserSummary();
      }
      break;
    case 'list':
      // 전체 현황 탭: 휴가 목록 새로고침
      await loadAllVacations();
      break;
    case 'calendar':
      // 달력 보기 탭: 휴가 목록 새로고침
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
    // 운전부 제외
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
  
  // 검색 필터
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
  
  // 상태 필터
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
/* 전역 스타일 리셋 */
* {
  box-sizing: border-box;
}

/* 뷰 전환 버튼 */
.view-toggle-section {
  display: flex;
  justify-content: center;
}

.btn-group {
  display: inline-flex;
  background: white;
  border-radius: 0.75rem;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 0.5rem;
}

.btn-toggle {
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.btn-toggle:hover {
  background: #f8fafc;
}

.btn-toggle.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-color: transparent;
}

/* 섹션 타이틀 - 더 강한 우선순위 */
h5.section-title {
  font-weight: 700 !important;
  color: #1e293b !important;
  display: flex !important;
  align-items: center !important;
  font-size: 1.25rem !important;
  margin-bottom: 1rem !important;
}

.section-title svg {
  stroke: #1e293b !important;
}

/* 모든 섹션의 h5 타이틀 색상 강제 적용 */
.add-vacation-section h5,
.summary-section h5,
.list-section h5,
.calendar-section h5 {
  color: #1e293b !important;
}

.add-vacation-section h5 svg,
.summary-section h5 svg,
.list-section h5 svg,
.calendar-section h5 svg {
  stroke: #1e293b !important;
}

/* 신청 폼 */
.add-vacation-section h5 {
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.vacation-form-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
  display: block;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
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
  transition: border-color 0.2s;
}

.custom-select:focus {
  outline: none;
  border-color: #6366f1;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
}

.custom-input {
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #334155;
  transition: border-color 0.2s;
}

.custom-input:focus {
  outline: none;
  border-color: #6366f1;
}

.custom-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.btn-custom {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* 요약 카드 */
.summary-section h5 {
  font-weight: 700;
  color: #1e293b;
}

.summary-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.summary-card.total { border-left: 4px solid #667eea; }
.summary-card.used { border-left: 4px solid #f59e0b; }
.summary-card.remaining { border-left: 4px solid #10b981; }

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-card.total .summary-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-card.used .summary-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.summary-card.remaining .summary-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
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

/* 목록 테이블 */
.list-section h5 {
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.badge-count {
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white !important;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
}

.search-filters {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid #e2e8f0;
}

.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-table thead th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #1e293b;
  font-weight: 700;
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.custom-table tbody td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 0.9375rem;
}

.custom-table tbody tr:hover {
  background: #f8fafc;
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.type-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-badge.type-V { background: #dbeafe; color: #1e40af; }
.type-badge.type-AM, .type-badge.type-PM { background: #fef3c7; color: #92400e; }
.type-badge.type-E { background: #fce7f3; color: #be185d; }
.type-badge.type-S { background: #fee2e2; color: #991b1b; }

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.875rem;
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

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-action {
  padding: 0.5rem 0.75rem;
  border: 1px solid;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.btn-approve {
  border-color: #d1fae5;
  color: #059669;
  background: #ecfdf5;
}

.btn-approve:hover {
  background: #d1fae5;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
}

.btn-reject {
  border-color: #fee2e2;
  color: #dc2626;
  background: #fef2f2;
}

.btn-reject:hover {
  background: #fee2e2;
  border-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.btn-delete {
  border-color: #fecaca;
  color: #b91c1c;
  background: white;
}

.btn-delete:hover {
  background: #fef2f2;
  border-color: #b91c1c;
  transform: translateY(-1px);
}

.text-muted {
  color: #94a3b8;
  font-size: 0.875rem;
}

.empty-state {
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
}

/* 달력 */
.calendar-section h5 {
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-nav {
  padding: 0.5rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-nav:hover {
  background: #e2e8f0;
  transform: scale(1.05);
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1rem;
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
  overflow: hidden;
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

/* 달력 셀 스크롤바 스타일 */
.calendar-day::-webkit-scrollbar,
.day-vacations::-webkit-scrollbar {
  width: 4px;
}

.calendar-day::-webkit-scrollbar-track,
.day-vacations::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.calendar-day::-webkit-scrollbar-thumb,
.day-vacations::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.calendar-day::-webkit-scrollbar-thumb:hover,
.day-vacations::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.text-center {
  text-align: center;
}

.text-end {
  text-align: right;
}

.w-100 {
  width: 100%;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.g-3 {
  gap: 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -0.5rem;
  margin-left: -0.5rem;
}

.row > * {
  padding-right: 0.5rem;
  padding-left: 0.5rem;
}

.col-12 { flex: 0 0 100%; max-width: 100%; }
.col-md-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
.col-md-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
.col-md-3 { flex: 0 0 25%; max-width: 25%; }
.col-md-4 { flex: 0 0 33.333333%; max-width: 33.333333%; }

.table-responsive {
  overflow-x: auto;
}
</style>