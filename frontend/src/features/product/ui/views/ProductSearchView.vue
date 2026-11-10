<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

import { Button, Input } from '@/shared/components'
import { useProductStore } from '../../store/productStore'
import ProductList from '../components/ProductList.vue'

const QUERY_TOO_SHORT_KEY = 'product.errors.queryTooShort'

const { t } = useI18n()
const store = useProductStore()
const { query, products, count, page, loading, searched, errorKey } = storeToRefs(store)

const totalPages = computed(() => store.totalPages)

const inputError = computed(() =>
  errorKey.value === QUERY_TOO_SHORT_KEY ? t(QUERY_TOO_SHORT_KEY) : '',
)

const alertErrorKey = computed(() =>
  errorKey.value !== null && errorKey.value !== QUERY_TOO_SHORT_KEY ? errorKey.value : null,
)

const showResults = computed(() => !loading.value && searched.value && count.value > 0)
const showEmptyState = computed(() => !loading.value && searched.value && count.value === 0)

function onSubmit() {
  store.search(1)
}

function onPreviousPage() {
  store.search(page.value - 1)
}

function onNextPage() {
  store.search(page.value + 1)
}
</script>

<template>
  <main class="product-search-view">
    <h1 class="title">{{ t('product.title') }}</h1>
    <p class="description">{{ t('product.description') }}</p>

    <form class="search-form" @submit.prevent="onSubmit">
      <Input
        id="product-search-query"
        v-model="query"
        class="search-input"
        type="search"
        :label="t('product.searchLabel')"
        :error="inputError"
        :disabled="loading"
      />
      <Button type="submit" :label="t('product.submit')" :disabled="loading" />
    </form>

    <p v-if="alertErrorKey" class="alert" role="alert">{{ t(alertErrorKey) }}</p>
    <p v-if="loading" class="status" role="status">{{ t('product.loading') }}</p>

    <template v-if="showResults">
      <p class="result-count">{{ t('product.resultCount', count) }}</p>
      <ProductList :products="products" />

      <nav v-if="totalPages > 1" class="pagination" :aria-label="t('product.pagination.label')">
        <Button
          severity="secondary"
          :label="t('product.pagination.prev')"
          :disabled="page <= 1 || loading"
          @click="onPreviousPage"
        />
        <span class="pagination-info">
          {{ t('product.pagination.pageInfo', { page, total: totalPages }) }}
        </span>
        <Button
          severity="secondary"
          :label="t('product.pagination.next')"
          :disabled="page >= totalPages || loading"
          @click="onNextPage"
        />
      </nav>
    </template>

    <p v-else-if="showEmptyState" class="empty">{{ t('product.emptyText') }}</p>

    <p class="attribution">{{ t('product.attribution') }}</p>
  </main>
</template>

<style scoped>
.product-search-view {
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.title {
  margin: 0;
}

.description {
  margin: 0;
  max-width: 60ch;
  color: var(--color-text-muted);
}

.search-form {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.search-input {
  flex: 1;
  max-width: 480px;
}

.alert {
  margin: 0;
  color: var(--color-danger);
}

.status,
.empty,
.result-count {
  margin: 0;
  color: var(--color-text-muted);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.attribution {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
  }
}
</style>
