<template>
  <div class="content">
    <div class="row">
      <div class="col-md-6">
        <card title="휴가 종류 설정">
          <ul class="list-group">
            <li class="list-group-item bg-transparent border-secondary d-flex justify-content-between">
              V: 연차 (차감 1.0) <i class="tim-icons icon-settings text-primary"></i>
            </li>
            <li class="list-group-item bg-transparent border-secondary d-flex justify-content-between">
              AM: 오전반차 (차감 0.5) <i class="tim-icons icon-settings text-primary"></i>
            </li>
          </ul>
        </card>
      </div>
      <div class="col-md-6">
        <card title="결재 상태 코드">
          <p>W: 대기(Wait)</p>
          <p>A: 승인(Approve)</p>
          <p>R: 반려(Reject)</p>
        </card>
      </div>
    </div>
  </div>
</template>