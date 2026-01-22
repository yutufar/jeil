<template>
  <div class="content">
    <card>
      <h4 slot="header" class="title">레미콘 운반비 입력</h4>
      <div class="row">
        <div class="col-md-4">
          <base-input label="작업 일자" type="date" v-model="form.work_date"></base-input>
        </div>
        <div class="col-md-4">
          <label>운전자 선택</label>
          <select class="form-control" v-model="form.user_id">
            <option v-for="user in users" :key="user.user_id" :value="user.user_id">{{ user.name }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <base-input label="원산지" v-model="form.origin_place" placeholder="원산도"></base-input>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <base-input label="운반 거리(km)" type="number" v-model="form.distance_km"></base-input>
        </div>
        <div class="col-md-4">
          <base-input label="단가" type="number" v-model="form.delivery_fee"></base-input>
        </div>
      </div>
      <base-button type="primary" @click="submitLog">저장하기</base-button>
    </card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api/axios';

const users = ref([]);
const form = ref({ work_date: '', user_id: '', origin_place: '', distance_km: 0, delivery_fee: 0 });

const submitLog = async () => {
  await api.post('/remicon', form.value);
  alert('저장 완료!');
};

onMounted(async () => {
  users.value = await api.get('/users');
});
</script>