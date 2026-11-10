<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Product } from '@/shared/api/types'

const { product } = defineProps<{ product: Product }>()

const { t } = useI18n()

const displayName = computed(() => product.productName?.trim() || product.code)

const brands = computed(() =>
  (product.brands ?? '')
    .split(',')
    .map((brand) => brand.trim())
    .filter(Boolean)
    .join(', '),
)

const nutriscoreGrade = computed(() => {
  const grade = product.nutriscoreGrade?.trim().toLowerCase() ?? ''

  return ['a', 'b', 'c', 'd', 'e'].includes(grade) ? grade : null
})
</script>

<template>
  <article class="product-card">
    <img
      v-if="product.imageUrl"
      class="product-image"
      :src="product.imageUrl"
      :alt="displayName"
      loading="lazy"
    />
    <div v-else class="product-image product-image--placeholder" aria-hidden="true"></div>

    <div class="product-info">
      <h2 class="product-name">{{ displayName }}</h2>
      <p v-if="brands" class="product-brands">{{ brands }}</p>
      <p class="product-code">{{ t('product.codeLabel', { code: product.code }) }}</p>
      <p
        v-if="nutriscoreGrade"
        class="product-nutriscore"
        :class="`product-nutriscore--${nutriscoreGrade}`"
      >
        {{ t('product.nutriscore') }}: {{ nutriscoreGrade.toUpperCase() }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.product-image {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  object-fit: contain;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-muted);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.product-name {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.product-brands,
.product-code {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Offizielle Nutri-Score-Farben (festes Schema, keine Theme-Tokens). */
.product-nutriscore {
  align-self: flex-start;
  margin: 0;
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #ffffff;
}

.product-nutriscore--a {
  background-color: #038141;
}

.product-nutriscore--b {
  background-color: #85bb2f;
}

.product-nutriscore--c {
  background-color: #fecb02;
  color: #1a1a1a;
}

.product-nutriscore--d {
  background-color: #ee8100;
}

.product-nutriscore--e {
  background-color: #e63e11;
}
</style>
