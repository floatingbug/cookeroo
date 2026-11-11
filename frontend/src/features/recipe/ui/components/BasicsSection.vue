<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Input, Select, Textarea } from '@/shared/components'
import type { SelectOption } from '@/shared/components'
import { RECIPE_DIFFICULTIES } from '../../constants'
import type { RecipeForm } from '../../types'
import ImageUploadField from './ImageUploadField.vue'

const props = defineProps<{
  form: RecipeForm
  loading: boolean
  uploading: boolean
}>()

const emit = defineEmits<{
  upload: [file: File]
}>()

const { t } = useI18n()

const difficultyOptions = computed<SelectOption[]>(() =>
  RECIPE_DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: t(`recipe.difficulty.${difficulty}`),
  })),
)
</script>

<template>
  <section class="section">
    <h2 class="section-title">{{ t('recipe.create.sections.basics') }}</h2>

    <div class="grid">
      <Input
        id="recipe-title"
        v-model="props.form.title"
        :label="t('recipe.fields.title')"
        required
        :disabled="props.loading"
      />
      <Textarea
        id="recipe-description"
        v-model="props.form.description"
        :label="t('recipe.fields.description')"
        :rows="3"
        :disabled="props.loading"
      />
      <Input
        id="recipe-category"
        v-model="props.form.category"
        :label="t('recipe.fields.category')"
        :disabled="props.loading"
      />
      <Input
        id="recipe-cuisine"
        v-model="props.form.cuisine"
        :label="t('recipe.fields.cuisine')"
        :disabled="props.loading"
      />
      <Select
        id="recipe-difficulty"
        v-model="props.form.difficulty"
        :label="t('recipe.fields.difficulty')"
        :options="difficultyOptions"
        :placeholder="t('recipe.fields.difficultyPlaceholder')"
        :disabled="props.loading"
      />
    </div>

    <div class="grid">
      <Input
        id="recipe-prep-time"
        v-model="props.form.prepTime"
        type="number"
        :label="t('recipe.fields.prepTime')"
        required
        :disabled="props.loading"
      />
      <Input
        id="recipe-cook-time"
        v-model="props.form.cookTime"
        type="number"
        :label="t('recipe.fields.cookTime')"
        required
        :disabled="props.loading"
      />
      <Input
        id="recipe-rest-time"
        v-model="props.form.restTime"
        type="number"
        :label="t('recipe.fields.restTime')"
        :disabled="props.loading"
      />
      <Input
        id="recipe-servings"
        v-model="props.form.servings"
        type="number"
        :label="t('recipe.fields.servings')"
        required
        :disabled="props.loading"
      />
      <Input
        id="recipe-serving-unit"
        v-model="props.form.servingUnit"
        :label="t('recipe.fields.servingUnit')"
        :disabled="props.loading"
      />
      <Input
        id="recipe-tags"
        v-model="props.form.tags"
        :label="t('recipe.fields.tags')"
        :hint="t('recipe.fields.tagsHint')"
        :disabled="props.loading"
      />
    </div>

    <ImageUploadField
      id="recipe-image"
      v-model="props.form.imageUrl"
      :label="t('recipe.fields.image')"
      :uploading="props.uploading"
      @upload="(file) => emit('upload', file)"
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}
</style>
