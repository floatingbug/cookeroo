import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'

export default {
  path: '/recipes',
  component: AppLayout,
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      name: 'recipe-list',
      component: () => import('../ui/views/RecipeListView.vue'),
    },
    {
      path: 'new',
      name: 'recipe-create',
      component: () => import('../ui/views/RecipeCreateView.vue'),
    },
    {
      path: 'public',
      name: 'recipe-public-list',
      component: () => import('../ui/views/PublicRecipeListView.vue'),
    },
    {
      path: ':id',
      name: 'recipe-detail',
      component: () => import('../ui/views/RecipeDetailView.vue'),
    },
  ],
} satisfies RouteRecordRaw
