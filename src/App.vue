<template>
  <div :class="{ 'nav-open': $sidebar.showSidebar }">
    <notifications></notifications>
    <router-view :key="$route.fullPath"></router-view>
  </div>
</template>

<script>
export default {
  methods: {
    // 템플릿 고유의 RTL 기능을 비활성화 (한국어 환경용)
    disableRTL() {
      if (!this.$rtl.isRTL) {
        this.$rtl.disableRTL();
      }
    },
    // 사이드바 열림/닫힘에 따라 html 클래스를 토글
    toggleNavOpen() {
      let root = document.getElementsByTagName("html")[0];
      root.classList.toggle("nav-open");
    },
  },
  mounted() {
    // 경로가 바뀔 때마다 RTL 설정을 체크
    this.$watch("$route", this.disableRTL, { immediate: true });
    // 사이드바 상태가 변하면 화면 클래스 업데이트
    this.$watch("$sidebar.showSidebar", this.toggleNavOpen);
  },
};
</script>

<style lang="scss">
/* 추가 스타일 없이 템플릿 scss에 의존합니다. */
</style>