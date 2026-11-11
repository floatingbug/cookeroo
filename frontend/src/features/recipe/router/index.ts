import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'

export default {
  path: '/recipes',
  component: AppLayout,
  meta: { requiresAuth: true },
  children: [
    {
      path: 'new',
      name: 'recipe-create',
      component: () => import('../ui/views/RecipeCreateView.vue'),
    },
    {
      path: ':id',
      name: 'recipe-detail',
      component: () => import('../ui/views/RecipeDetailView.vue'),
    },
  ],
} satisfies RouteRecordRaw
