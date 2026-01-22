<template>
  <div class="content">
    <card>
      <h4 slot="header" class="title">차량 등록 관리</h4>
      <div class="row">
        <div class="col-md-4">
          <label>차량 분류</label>
          <select class="form-control" v-model="vehicleForm.category_code">
            <option value="REMICON">레미콘</option>
            <option value="CARGO">골재운반차</option>
            <option value="GENERAL">일반차량</option>
          </select>
        </div>
        <div class="col-md-4">
          <base-input label="번호 뒷자리(4자리)" v-model="vehicleForm.car_num" placeholder="1234"></base-input>
        </div>
        <div class="col-md-4">
          <base-input label="모델명" v-model="vehicleForm.model_name" placeholder="현대 파워텍"></base-input>
        </div>
      </div>
      <base-button type="info" @click="saveVehicle">차량 등록</base-button>
    </card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from 'axios';

const vehicleForm = ref({ category_code: 'REMICON', car_num: '', model_name: '' });

const saveVehicle = async () => {
  if (vehicleForm.value.car_num.length !== 4) return alert('번호 4자리를 입력하세요.');
  await api.post('http://localhost:3000/api/vehicles', vehicleForm.value);
  alert('차량이 등록되었습니다.');
};
</script>