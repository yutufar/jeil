<template>
  <div class="wrapper">
    <side-bar>
      <template slot="links">
        <sidebar-link to="/dashboard" name="대시보드" icon="tim-icons icon-chart-pie-36"/>
        <sidebar-link to="/setting/users" name="직원 관리" icon="tim-icons icon-single-02"/>
        <sidebar-link to="/setting/vehicles" name="차량 관리" icon="tim-icons icon-bus-front-12"/>
        <sidebar-link to="/log/aggregate" name="골재 일보" icon="tim-icons icon-coins"/>
        <sidebar-link to="/vacation" name="휴가 관리" icon="tim-icons icon-calendar-60"/>
        <sidebar-link to="/log/remicon" name="레미콘 운반비" icon="tim-icons icon-delivery-fast"/>
        <sidebar-link to="/fuel-usage" name="유류비 관리" icon="tim-icons icon-coins"/>
      </template>
    </side-bar>

    <div class="main-panel">
      <div class="content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>