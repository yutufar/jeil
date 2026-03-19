import DashboardLayout from "@/layout/dashboard/DashboardLayout.vue";
import NotFound from "@/pages/NotFoundPage.vue";

const Dashboard        = () => import("@/pages/Dashboard.vue");
const UserSetting      = () => import("@/pages/UserSetting.vue");
const VehicleSetting   = () => import("@/pages/VehicleSetting.vue");
const RemiconLog       = () => import("@/pages/RemiconLog.vue");
const AggregateLog     = () => import("@/pages/AggregateLog.vue");
const GoljaeDelivery   = () => import("@/pages/GoljaeDelivery.vue");
const MaterialStock    = () => import("@/pages/MaterialStock.vue");
const VacationList     = () => import("@/pages/VacationList.vue");
const FuelUsage        = () => import("@/pages/FuelUsage.vue");
const BankAccount      = () => import("@/pages/BankAccount.vue");
const RemiconCalculator = () => import("@/pages/RemiconCalculator.vue"); // ← 추가

const routes = [
  {
    path: "/",
    component: DashboardLayout,
    redirect: "/dashboard",
    children: [
      { path: "dashboard",          name: "대시보드",         component: Dashboard        },
      { path: "setting/users",      name: "직원 관리",        component: UserSetting      },
      { path: "setting/vehicles",   name: "차량 관리",        component: VehicleSetting   },
      { path: "setting/accounts",   name: "계좌번호 관리",    component: BankAccount      },
      { path: "log/remicon",        name: "레미콘 운반비",    component: RemiconLog       },
      { path: "log/aggregate",      name: "골재 일보",        component: AggregateLog     },
      { path: "log/goljae",         name: "골재 운반비",      component: GoljaeDelivery   },
      { path: "material/stock",     name: "원자재 재고 관리", component: MaterialStock    },
      { path: "remicon/calculator", name: "레미콘 단가 계산", component: RemiconCalculator }, // ← 추가
      { path: "vacation",           name: "휴가 관리",        component: VacationList     },
      { path: "fuel-usage",         name: "유류비 관리",      component: FuelUsage        },
    ],
  },
  { path: "*", component: NotFound },
];

export default routes;