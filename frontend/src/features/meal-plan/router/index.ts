import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/meal-plan/join/:token',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'meal-plan-join',
        component: () => import('../ui/views/MealPlanJoinView.vue'),
      },
    ],
  },
  {
    path: '/meal-plan',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'meal-plan',
        component: () => import('../ui/views/MealPlanView.vue'),
      },
    ],
  },
]

export default routes
