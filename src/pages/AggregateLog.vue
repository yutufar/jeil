<template>
  <div class="content">
    <card>
      <h4 slot="header" class="title">골재 운반비 입력</h4>
      <div class="row">
        <div class="col-md-3"><base-input label="자갈" type="number" v-model="form.gravel_qty"></base-input></div>
        <div class="col-md-3"><base-input label="해광샌드" type="number" v-model="form.hg_sand_qty"></base-input></div>
        <div class="col-md-3"><base-input label="자갈19MM" type="number" v-model="form.gravel_19mm_qty"></base-input></div>
        <div class="col-md-3"><base-input label="합계 금액" type="number" v-model="form.delivery_total_fee"></base-input></div>
      </div>
      <base-button type="success" @click="submitLog">골재 기록 저장</base-button>
    </card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '@/api/axios';

const form = ref({ gravel_qty: 0, hg_sand_qty: 0, gravel_19mm_qty: 0, delivery_total_fee: 0 });

const submitLog = async () => {
  await api.post('/aggregate', form.value);
  alert('골재 기록 저장 완료!');
};
</script>