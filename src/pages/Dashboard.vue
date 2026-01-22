<template>
  <div class="content">
    <div class="row">
      <div class="col-lg-4">
        <card type="chart">
          <template slot="header">
            <h5 class="card-category">Vacation Management</h5>
            <h3 class="card-title">
              <i class="tim-icons icon-calendar-60 text-primary"></i> 연차 현황
            </h3>
          </template>
          <div class="table-responsive">
            <table class="table tablesorter">
              <thead class="text-primary">
                <tr>
                  <th>성함</th>
                  <th>총 연차</th>
                  <th>잔여</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.user_id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.total_vacation }}</td>
                  <td class="text-danger">{{ user.total_vacation - (user.used_days || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </card>
      </div>

      <div class="col-lg-4">
        <card type="chart">
          <template slot="header">
            <h5 class="card-category">Remicon Delivery</h5>
            <h3 class="card-title">
              <i class="tim-icons icon-delivery-fast text-info"></i> 레미콘 운반비 (월합계)
            </h3>
          </template>
          <div class="text-center">
            <h2 class="mt-4">{{ formatPrice(totalRemiconFee) }}원</h2>
            <p>이번 달 총 운송 횟수: {{ remiconLogs.length }}회</p>
          </div>
        </card>
      </div>

      <div class="col-lg-4">
        <card type="chart">
          <template slot="header">
            <h5 class="card-category">Aggregate Delivery</h5>
            <h3 class="card-title">
              <i class="tim-icons icon-coins text-success"></i> 골재 운반 합계
            </h3>
          </template>
          <div class="text-center">
            <h2 class="mt-4">{{ formatPrice(totalAggregateFee) }}원</h2>
            <p>자갈/해광샌드 등 실적 포함</p>
          </div>
        </card>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <card>
          <template slot="header">
            <h4 class="card-title">최근 운반 기록 (일보)</h4>
          </template>
          <div class="table-responsive">
            <table class="table tablesorter">
              <thead class="text-primary">
                <tr>
                  <th>날짜</th>
                  <th>이름</th>
                  <th>차량(뒷번호)</th>
                  <th>원산지/품목</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in recentLogs" :key="log.id">
                  <td>{{ log.work_date }}</td>
                  <td>{{ log.userName }}</td>
                  <td>{{ log.carNum }}</td>
                  <td>{{ log.description }}</td>
                  <td>{{ formatPrice(log.fee) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from 'axios';

// --- 데이터 상태 관리 ---
const users = ref([]);
const remiconLogs = ref([]);
const aggregateLogs = ref([]);

// --- API 서버에서 데이터 가져오기 ---
const fetchData = async () => {
  try {
    // 백엔드 주소 (node server/index.js 실행 주소)
    const [userRes, remiconRes, aggRes] = await Promise.all([
      api.get('http://localhost:3000/api/users'),
      api.get('http://localhost:3000/api/remicon/summary'),
      api.get('http://localhost:3000/api/aggregate/summary')
    ]);

    users.value = userRes.data;
    remiconLogs.value = remiconRes.data;
    aggregateLogs.value = aggRes.data;
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
  }
};

// --- 계산된 속성 (Computed) ---
const totalRemiconFee = computed(() => {
  return remiconLogs.value.reduce((acc, cur) => acc + cur.delivery_fee, 0);
});

const totalAggregateFee = computed(() => {
  return aggregateLogs.value.reduce((acc, cur) => acc + cur.delivery_total_fee, 0);
});

const recentLogs = computed(() => {
  // 실제로는 레미콘/골재 로그를 합쳐서 최신순 정렬하는 로직이 들어갑니다.
  return []; 
});

// --- 유틸리티 함수 ---
const formatPrice = (value) => {
  if (!value) return 0;
  return value.toLocaleString();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.card-title i {
  margin-right: 10px;
}
</style>