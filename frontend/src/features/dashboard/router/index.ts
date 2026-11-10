import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'

export default {
  path: '/dashboard',
  component: AppLayout,
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      name: 'dashboard',
      component: () => import('../ui/views/DashboardView.vue'),
    },
  ],
} satisfies RouteRecordRaw
