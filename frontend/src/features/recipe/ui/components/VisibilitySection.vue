<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Checkbox } from '@/shared/components'

const props = defineProps<{
  loading: boolean
}>()

const isPublic = defineModel<boolean>('isPublic', { required: true })

const { t } = useI18n()
</script>

<template>
  <section class="section">
    <h2 class="section-title">{{ t('recipe.create.sections.visibility') }}</h2>
    <Checkbox
      id="recipe-public"
      v-model="isPublic"
      :label="t('recipe.fields.isPublic')"
      :disabled="props.loading"
    />
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.section-title {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-primary);
}
</style>
