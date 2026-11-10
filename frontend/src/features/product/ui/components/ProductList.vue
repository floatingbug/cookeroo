<script setup lang="ts">
import type { Product } from '@/shared/api/types'
import ProductCard from './ProductCard.vue'

const { products } = defineProps<{ products: Product[] }>()
</script>

<template>
  <ul class="product-list">
    <li v-for="product in products" :key="product.code" class="product-list-item">
      <ProductCard :product="product" />
    </li>
  </ul>
</template>

<style scoped>
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
