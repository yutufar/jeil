<template>
  <div class="content">
    <div class="row">
      <div class="col-md-12">
        <card>
          <h4 slot="header" class="title">직원 정보 등록</h4>
          <form @submit.prevent="saveUser">
            <div class="row">
              <div class="col-md-3">
                <base-input label="성함" v-model="form.name" placeholder="이형기"></base-input>
              </div>
              <div class="col-md-3">
                <label class="control-label">소속 공장</label>
                <select class="form-control" v-model="form.location_code">
                  <option value="LOC_OC">오천</option>
                  <option value="LOC_HS">홍성</option>
                  <option value="LOC_CB">천북</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="control-label">관리자 여부</label>
                <select class="form-control" v-model="form.is_admin">
                  <option value="N">일반 사용자</option>
                  <option value="Y">관리자</option>
                </select>
              </div>
              <div class="col-md-3">
                <base-input label="총 연차" type="number" v-model="form.total_vacation"></base-input>
              </div>
            </div>
            <base-button native-type="submit" type="primary" class="btn-fill">직원 추가</base-button>
          </form>
        </card>
      </div>
    </div>
    
    <div class="row mt-4">
      <div class="col-12">
        <card title="등록된 직원 명단">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>공장</th>
                  <th>권한</th>
                  <th>총 연차</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.user_id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.location_code }}</td>
                  <td>{{ user.is_admin === 'Y' ? '관리자' : '일반' }}</td>
                  <td>{{ user.total_vacation }}</td>
                  <td><base-button type="danger" size="sm" icon><i class="tim-icons icon-simple-remove"></i></base-button></td>
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
import { ref, onMounted } from 'vue';
import api from 'axios';

const users = ref([]);
const form = ref({ name: '', location_code: 'LOC_OC', is_admin: 'N', total_vacation: 15 });

const saveUser = async () => {
  await api.post('http://localhost:3000/api/users', form.value);
  alert('저장되었습니다.');
  fetchUsers(); // 리스트 새로고침
};

const fetchUsers = async () => {
  const res = await api.get('http://localhost:3000/api/users');
  users.value = res.data;
};

onMounted(fetchUsers);
</script>