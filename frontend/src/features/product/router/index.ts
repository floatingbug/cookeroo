import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'

export default {
  path: '/products',
  component: AppLayout,
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      name: 'product-search',
      component: () => import('../ui/views/ProductSearchView.vue'),
    },
  ],
} satisfies RouteRecordRaw
