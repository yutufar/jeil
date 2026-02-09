import DashboardLayout from "@/layout/dashboard/DashboardLayout.vue";
import NotFound from "@/pages/NotFoundPage.vue";

// 페이지 컴포넌트 지연 로딩
const Dashboard = () => import("@/pages/Dashboard.vue");
const UserSetting = () => import("@/pages/UserSetting.vue");
const VehicleSetting = () => import("@/pages/VehicleSetting.vue");
const RemiconLog = () => import("@/pages/RemiconLog.vue");
const AggregateLog = () => import("@/pages/AggregateLog.vue");
const VacationList = () => import("@/pages/VacationList.vue");
const FuelUsage = () => import("@/pages/FuelUsage.vue");

const routes = [
  {
    path: "/",
    component: DashboardLayout, // 부모가 레이아웃이 됨
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "대시보드",
        component: Dashboard,
      },
      {
        path: "setting/users",
        name: "직원 관리",
        component: UserSetting,
      },
      {
        path: "setting/vehicles",
        name: "차량 관리",
        component: VehicleSetting,
      },
      {
        path: "log/remicon",
        name: "레미콘 운반비",
        component: RemiconLog,
      },
      {
        path: "log/aggregate",
        name: "골재 일보",
        component: AggregateLog,
      },
      {
        path: "vacation",
        name: "휴가 관리",
        component: VacationList,
      },
      {
        path: "fuel-usage",
        name: "유류비 관리",
        component: FuelUsage,
      }
    ],
  },
  { path: "*", component: NotFound },
];

export default routes;