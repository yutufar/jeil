<template>
  <div class="content">
    <card title="휴가 신청 및 현황">
      <!-- 검색 필터 -->
      <div class="search-section mb-4">
        <div class="row align-items-end g-3">
          <div class="col-md-3">
            <label class="form-label">검색 조건</label>
            <div class="custom-select-wrapper">
              <select v-model="searchType" class="custom-select">
                <option value="all">전체</option>
                <option value="name">이름</option>
              </select>
              <span class="select-arrow">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
          <div class="col-md-4" v-if="searchType === 'name'">
            <label class="form-label">이름</label>
            <input 
              v-model="searchKeyword" 
              type="text" 
              class="custom-input" 
              placeholder="이름을 입력하세요"
              @input="filterVacations"
            />
          </div>
          <div class="col-md-2">
            <button @click="filterVacations" class="btn-custom btn-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 0.25rem;">
                <path d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 15L11.5 11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              검색
            </button>
          </div>
        </div>
      </div>

      <!-- 달력 섹션 -->
      <div class="calendar-section mb-4">
        <div class="calendar-header">
          <button @click="previousMonth" class="btn-calendar-nav">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 16L6 10L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h5>{{ currentYear }}년 {{ currentMonth }}월</h5>
          <button @click="nextMonth" class="btn-calendar-nav">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4L14 10L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="calendar-body">
          <div class="calendar-weekdays">
            <div class="weekday sunday">일</div>
            <div class="weekday">월</div>
            <div class="weekday">화</div>
            <div class="weekday">수</div>
            <div class="weekday">목</div>
            <div class="weekday">금</div>
            <div class="weekday saturday">토</div>
          </div>
          <div class="calendar-days">
            <div 
              v-for="day in calendarDays" 
              :key="day.date"
              class="calendar-day"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'has-vacation': day.vacations.length > 0
              }"
            >
              <div class="day-number">{{ day.day }}</div>
              <div class="day-vacations">
                <div 
                  v-for="vacation in day.vacations.slice(0, 2)" 
                  :key="vacation.id"
                  class="vacation-item"
                  :class="`status-${vacation.status}`"
                  :title="`${vacation.name} - ${vacation.type}`"
                >
                  {{ vacation.name }}
                </div>
                <div v-if="day.vacations.length > 2" class="more-vacations">
                  +{{ day.vacations.length - 2 }}개 더보기
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 연차 추가 폼 -->
      <div class="add-vacation-section mb-4">
        <h5 class="mb-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="margin-right: 0.5rem; vertical-align: middle;">
            <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          연차 신청
        </h5>
        <div class="vacation-form-card">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">이름</label>
              <input 
                v-model="newVacation.name" 
                type="text" 
                class="custom-input" 
                placeholder="이름을 입력하세요"
              />
            </div>
            <div class="col-md-3">
              <label class="form-label">종류</label>
              <div class="custom-select-wrapper">
                <select v-model="newVacation.type" class="custom-select">
                  <option value="">선택하세요</option>
                  <option value="연차">연차</option>
                  <option value="반차">반차</option>
                  <option value="병가">병가</option>
                  <option value="경조사">경조사</option>
                </select>
                <span class="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
            <div class="col-md-2">
              <label class="form-label">시작일</label>
              <input 
                v-model="newVacation.start_date" 
                type="date" 
                class="custom-input"
              />
            </div>
            <div class="col-md-2">
              <label class="form-label">종료일</label>
              <input 
                v-model="newVacation.end_date" 
                type="date" 
                class="custom-input"
              />
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button @click="addVacation" class="btn-custom btn-success w-100">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 0.25rem;">
                  <path d="M13 5L6 12L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                신청하기
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 리스트 섹션 -->
      <div class="list-section">
        <h5 class="mb-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="margin-right: 0.5rem; vertical-align: middle;">
            <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          휴가 목록
        </h5>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>종류</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in filteredVacations" :key="v.id">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ v.name.charAt(0) }}</div>
                    <span>{{ v.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="type-badge">{{ v.type }}</span>
                </td>
                <td>{{ v.start_date }}</td>
                <td>{{ v.end_date }}</td>
                <td>
                  <span 
                    class="status-badge" 
                    :class="`status-${v.status}`"
                  >
                    {{ v.status }}
                  </span>
                </td>
                <td>
                  <button 
                    @click="deleteVacation(v.id)" 
                    class="btn-delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4H14M6 4V2.5C6 2.22386 6.22386 2 6.5 2H9.5C9.77614 2 10 2.22386 10 2.5V4M12.5 4V13C12.5 13.8284 11.8284 14.5 11 14.5H5C4.17157 14.5 3.5 13.8284 3.5 13V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    삭제
                  </button>
                </td>
              </tr>
              <tr v-if="filteredVacations.length === 0">
                <td colspan="6" class="text-center py-5">
                  <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="#CBD5E1" stroke-width="2"/>
                      <path d="M16 20H16.02M32 20H32.02M18 30C18 30 20 33 24 33C28 33 30 30 30 30" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>등록된 휴가가 없습니다</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/api/axios';

const vacations = ref([]);
const filteredVacations = ref([]);
const searchType = ref('all');
const searchKeyword = ref('');
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

const newVacation = ref({
  name: '',
  type: '',
  start_date: '',
  end_date: '',
  status: '대기'
});

// 달력 날짜 생성
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const prevLastDay = new Date(year, month - 1, 0);
  
  const firstDayWeek = firstDay.getDay();
  const lastDate = lastDay.getDate();
  const prevLastDate = prevLastDay.getDate();
  
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 이전 달 날짜
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 2, prevLastDate - i);
    days.push({
      day: prevLastDate - i,
      date: formatDate(date),
      isCurrentMonth: false,
      isToday: false,
      vacations: getVacationsForDate(date)
    });
  }
  
  // 현재 달 날짜
  for (let i = 1; i <= lastDate; i++) {
    const date = new Date(year, month - 1, i);
    days.push({
      day: i,
      date: formatDate(date),
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      vacations: getVacationsForDate(date)
    });
  }
  
  // 다음 달 날짜
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month, i);
    days.push({
      day: i,
      date: formatDate(date),
      isCurrentMonth: false,
      isToday: false,
      vacations: getVacationsForDate(date)
    });
  }
  
  return days;
});

// 날짜 포맷
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 특정 날짜의 휴가 가져오기
const getVacationsForDate = (date) => {
  const dateStr = formatDate(date);
  return vacations.value.filter(v => {
    return dateStr >= v.start_date && dateStr <= v.end_date;
  });
};

// 이전 달
const previousMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

// 다음 달
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// 휴가 데이터 로드
const loadVacations = async () => {
  try {
    const response = await api.get('/vacations');
    vacations.value = response.data;
    filteredVacations.value = vacations.value;
  } catch (error) {
    console.error('휴가 데이터 로드 실패:', error);
  }
};

// 검색 필터링
const filterVacations = () => {
  if (searchType.value === 'all') {
    filteredVacations.value = vacations.value;
  } else if (searchType.value === 'name') {
    filteredVacations.value = vacations.value.filter(v => 
      v.name.includes(searchKeyword.value)
    );
  }
};

// 연차 추가
const addVacation = async () => {
  if (!newVacation.value.name || !newVacation.value.type || 
      !newVacation.value.start_date || !newVacation.value.end_date) {
    alert('모든 항목을 입력해주세요.');
    return;
  }

  try {
    await api.post('/vacations', newVacation.value);
    
    newVacation.value = {
      name: '',
      type: '',
      start_date: '',
      end_date: '',
      status: '대기'
    };
    
    await loadVacations();
    filterVacations();
    alert('휴가 신청이 완료되었습니다.');
  } catch (error) {
    console.error('휴가 추가 실패:', error);
    alert('휴가 신청에 실패했습니다.');
  }
};

// 연차 삭제
const deleteVacation = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  try {
    await api.delete(`/vacations/${id}`);
    await loadVacations();
    filterVacations();
    alert('삭제되었습니다.');
  } catch (error) {
    console.error('휴가 삭제 실패:', error);
    alert('삭제에 실패했습니다.');
  }
};

watch(searchType, () => {
  searchKeyword.value = '';
  filterVacations();
});

onMounted(async () => {
  await loadVacations();
});
</script>

<style scoped>
/* 검색 섹션 */
.search-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
  display: block;
}

/* 커스텀 Select */
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
  transition: transform 0.2s ease;
}

.custom-select:focus + .select-arrow {
  transform: translateY(-50%) rotate(180deg);
}

/* 커스텀 Input */
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.custom-input::placeholder {
  color: #94a3b8;
}

/* 커스텀 버튼 */
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
}

.btn-primary {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* 달력 섹션 */
.calendar-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.calendar-header h5 {
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
  color: #1e293b;
}

.btn-calendar-nav {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 0.5rem;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-calendar-nav:hover {
  background: #e2e8f0;
  color: #475569;
  transform: scale(1.05);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-weight: 700;
  padding: 0.75rem;
  color: #64748b;
  font-size: 0.875rem;
}

.weekday.sunday {
  color: #ef4444;
}

.weekday.saturday {
  color: #3b82f6;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.calendar-day {
  min-height: 90px;
  padding: 0.75rem;
  border: 2px solid #f1f5f9;
  border-radius: 0.75rem;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
}

.calendar-day:hover {
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-day.other-month {
  background: #f8fafc;
  color: #cbd5e1;
}

.calendar-day.today {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.calendar-day.has-vacation {
  background: #fef3c7;
  border-color: #fbbf24;
}

.day-number {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.day-vacations {
  font-size: 0.75rem;
}

.vacation-item {
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.vacation-item.status-대기 {
  background: #fbbf24;
  color: #78350f;
}

.vacation-item.status-승인 {
  background: #10b981;
  color: white;
}

.vacation-item.status-반려 {
  background: #ef4444;
  color: white;
}

.more-vacations {
  color: #64748b;
  font-size: 0.7rem;
  margin-top: 0.25rem;
  font-weight: 600;
}

/* 연차 추가 폼 */
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
  transition: all 0.2s ease;
}

.vacation-form-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.vacation-form-card .form-label {
  color: #64748b;
}

/* 테이블 */
.list-section h5 {
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
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
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.custom-table tbody td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 0.9375rem;
}

.custom-table tbody tr {
  transition: all 0.2s ease;
}

.custom-table tbody tr:hover {
  background: #f8fafc;
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
}

.type-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #64748b;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.status-대기 {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-승인 {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-반려 {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete {
  padding: 0.5rem 1rem;
  border: 1px solid #fee2e2;
  border-radius: 0.5rem;
  background: white;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
  transform: translateY(-1px);
}

.empty-state {
  padding: 2rem;
  color: #94a3b8;
}

.empty-state svg {
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
}
</style>