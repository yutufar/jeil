<template>
  <div class="sidebar" :data="backgroundColor">
    <div class="sidebar-wrapper" id="style-3">
      <div class="logo">
        <router-link to="/dashboard" class="simple-text logo-mini">
          <div class="logo-img" :class="{ 'logo-img-rtl': $rtl && $rtl.isRTL }">
            <img src="/img/logo.png" alt="logo" />
          </div>
        </router-link>

        <router-link to="/dashboard" class="simple-text logo-normal">
          {{ title }}
        </router-link>
      </div>
      
      <slot> </slot>
      
      <ul class="nav">
        <slot name="links">
          <sidebar-link
            v-for="(link, index) in sidebarLinks"
            :key="index"
            :to="link.path"
            :name="link.name"
            :icon="link.icon"
          >
          </sidebar-link>
        </slot>
      </ul>
    </div>
  </div>
</template>

<script>
import SidebarLink from "./SidebarLink";

export default {
  name: "side-bar",
  props: {
    title: {
      type: String,
      default: "제일개발 관리", // 기본 타이틀 변경
    },
    backgroundColor: {
      type: String,
      default: "blue", // 템플릿 기본 테마에 맞춤
    },
    activeColor: {
      type: String,
      default: "primary", 
      validator: (value) => {
        let acceptedValues = ["primary", "info", "success", "warning", "danger"];
        return acceptedValues.indexOf(value) !== -1;
      },
    },
    sidebarLinks: {
      type: Array,
      default: () => [],
    },
    autoClose: {
      type: Boolean,
      default: true,
    },
  },
  provide() {
    return {
      autoClose: this.autoClose,
      addLink: this.addLink,
      removeLink: this.removeLink,
    };
  },
  components: {
    SidebarLink,
  },
  data() {
    return {
      linkHeight: 65,
      activeLinkIndex: 0,
      links: [],
    };
  },
  methods: {
    findActiveLink() {
      this.links.forEach((link, index) => {
        if (link.isActive()) {
          this.activeLinkIndex = index;
        }
      });
    },
    addLink(link) {
      const index = this.$slots.links ? this.$slots.links.indexOf(link.$vnode) : -1;
      if (index > -1) {
        this.links.splice(index, 0, link);
      } else {
        this.links.push(link);
      }
    },
    removeLink(link) {
      const index = this.links.indexOf(link);
      if (index > -1) {
        this.links.splice(index, 1);
      }
    },
  },
  mounted() {
    this.$watch("$route", this.findActiveLink, {
      immediate: true,
    });
  },
};
</script>