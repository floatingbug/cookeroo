<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import type { MealPlanDay, MealPlanMeal, RecipeSummary } from '@/shared/api/types'
import { Button, Select } from '@/shared/components'
import type { SelectOption } from '@/shared/components'
import { useMealPlanStore } from '../../store/mealPlanStore'
import { MEAL_SLOTS, WEEK_DAYS, formatWeekRange, getMonday } from '../../services/mealPlanService'
import type { MealDayView } from '../../types'
import MealDayCard from '../components/MealDayCard.vue'
import MealPlanShareDialog from '../components/MealPlanShareDialog.vue'
import RecipePickerDialog from '../components/RecipePickerDialog.vue'

interface ActiveSlot {
  day: MealPlanDay
  meal: MealPlanMeal
}

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMealPlanStore()
const {
  entries,
  loading,
  saving,
  errorKey,
  saveErrorKey,
  dirty,
  saved,
  canEdit,
  sharedPlanners,
  sharedPlannersLoading,
  sharedPlannersErrorKey,
  members,
  membersLoading,
  membersErrorKey,
  invite,
  inviteLoading,
  inviteErrorKey,
  updatingMemberId,
  removingMemberId,
} = storeToRefs(store)

const activeSlot = shallowRef<ActiveSlot | null>(null)
const shareOpen = shallowRef(false)
const pickerOpen = computed(() => activeSlot.value !== null)

const pickerTitle = computed(() => {
  if (!activeSlot.value) {
    return ''
  }

  return t('mealPlan.picker.title', {
    day: t(`mealPlan.days.${activeSlot.value.day}`),
    meal: t(`mealPlan.meals.${activeSlot.value.meal}`),
  })
})

const entryBySlot = computed(
  () => new Map(entries.value.map((entry) => [`${entry.day}:${entry.meal}`, entry])),
)

const dayCards = computed<MealDayView[]>(() =>
  WEEK_DAYS.map((day) => ({
    day,
    dayLabel: t(`mealPlan.days.${day}`),
    slots: MEAL_SLOTS.map((meal) => {
      const entry = entryBySlot.value.get(`${day}:${meal}`)

      return {
        meal,
        label: t(`mealPlan.meals.${meal}`),
        recipeId: entry?.recipeId ?? null,
        recipeTitle: entry ? (entry.recipe?.title ?? t('mealPlan.recipeUnavailable')) : null,
        recipeAvailable: entry?.recipe != null,
      }
    }),
  })),
)

const weekRange = computed(() => formatWeekRange(store.weekStart, locale.value))
const isCurrentWeek = computed(() => store.weekStart === getMonday())
const isOwner = computed(() => store.selectedOwnerId === null)
const sharedOwnerName = computed(() =>
  !isOwner.value && store.planOwner ? store.planOwner.name : '',
)
const readOnly = computed(() => !loading.value && !errorKey.value && !canEdit.value)
const plannerValue = computed(() => store.selectedOwnerId ?? '')
const showPlannerSwitcher = computed(
  () => sharedPlanners.value.length > 0 || sharedPlannersLoading.value,
)
const plannerOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('mealPlan.planner.own') },
  ...sharedPlanners.value.map((planner) => ({
    value: planner.owner.id,
    label: planner.canEdit
      ? planner.owner.name
      : t('mealPlan.planner.sharedReadOnly', { name: planner.owner.name }),
  })),
])

onMounted(() => {
  void initialize()
})

watch(
  () => route.query.owner,
  (value) => {
    const ownerId = typeof value === 'string' ? value : null

    if (ownerId === store.selectedOwnerId) {
      return
    }

    void store.loadWeek(store.weekStart, ownerId)
  },
)

onBeforeRouteLeave(() => {
  if (!store.dirty) {
    return true
  }

  return window.confirm(t('mealPlan.unsavedConfirm'))
})

async function initialize(): Promise<void> {
  const ownerId = typeof route.query.owner === 'string' ? route.query.owner : null

  await Promise.all([store.loadSharedPlanners(), store.loadWeek(store.weekStart, ownerId)])
}

function openPicker(day: MealPlanDay, meal: MealPlanMeal): void {
  if (!canEdit.value) {
    return
  }

  activeSlot.value = { day, meal }
}

function closePicker(): void {
  activeSlot.value = null
}

function onSelectRecipe(recipe: RecipeSummary): void {
  if (!activeSlot.value) {
    return
  }

  store.setRecipe(activeSlot.value.day, activeSlot.value.meal, recipe)
  activeSlot.value = null
}

function onRemove(day: MealDayView['day'], meal: MealDayView['slots'][number]['meal']): void {
  store.removeRecipe(day, meal)
}

function previousWeek(): void {
  void store.goToWeek(-1)
}

function nextWeek(): void {
  void store.goToWeek(1)
}

function currentWeek(): void {
  void store.goToCurrentWeek()
}

function retryLoad(): void {
  void store.loadWeek(store.weekStart, store.selectedOwnerId)
}

function backToOwnPlan(): void {
  void onPlannerChange('')
}

async function onPlannerChange(value: string): Promise<void> {
  const ownerId = value || null

  await store.selectPlanner(ownerId)

  const query = { ...route.query }

  if (ownerId) {
    query.owner = ownerId
  } else {
    delete query.owner
  }

  await router.replace({ query })
}

function onSave(): void {
  void store.save()
}

function openShare(): void {
  shareOpen.value = true
  store.clearInvite()
  void store.loadMembers()
}

function closeShare(): void {
  shareOpen.value = false
  store.clearInvite()
}

function onCreateInvite(): void {
  void store.createInvite()
}

function onTogglePermission(memberId: string, edit: boolean): void {
  void store.setMemberPermission(memberId, edit)
}

async function onRemoveMember(memberId: string): Promise<void> {
  const member = members.value.find((entry) => entry.user.id === memberId)

  if (!member) {
    return
  }

  if (!window.confirm(t('mealPlan.sharing.removeConfirm', { name: member.user.name }))) {
    return
  }

  await store.removeMember(memberId)
}

function retryMembers(): void {
  void store.loadMembers()
}
</script>

<template>
  <main class="meal-plan-view">
    <div class="page-header">
      <div class="header-copy">
        <h1 class="title">{{ t('mealPlan.title') }}</h1>
        <p class="description">{{ t('mealPlan.description') }}</p>
        <p v-if="sharedOwnerName" class="shared-owner">
          {{ t('mealPlan.planner.sharedPlanFrom', { name: sharedOwnerName }) }}
        </p>
      </div>

      <div class="save-area">
        <p v-if="readOnly" class="read-only-hint" role="status">
          {{ t('mealPlan.planner.readOnlyHint') }}
        </p>
        <template v-else>
          <p v-if="dirty" class="dirty" role="status">{{ t('mealPlan.status.unsaved') }}</p>
          <p v-else-if="saved" class="saved" role="status">{{ t('mealPlan.status.saved') }}</p>
          <Button
            :label="saving ? t('mealPlan.actions.saving') : t('mealPlan.actions.save')"
            :disabled="saving || loading || !dirty || !canEdit"
            @click="onSave"
          />
        </template>
        <div v-if="isOwner" class="share-area">
          <Button severity="secondary" :label="t('mealPlan.sharing.action')" @click="openShare" />
          <p class="share-hint">{{ t('mealPlan.sharing.hint') }}</p>
        </div>
      </div>
    </div>

    <div v-if="showPlannerSwitcher" class="planner-bar">
      <Select
        id="meal-plan-planner"
        :label="t('mealPlan.planner.label')"
        :options="plannerOptions"
        :model-value="plannerValue"
        :disabled="loading || saving"
        @update:model-value="onPlannerChange"
      />
    </div>

    <p v-if="sharedPlannersErrorKey" class="alert" role="alert">
      {{ t(sharedPlannersErrorKey) }}
    </p>
    <Button
      v-if="sharedPlannersErrorKey"
      severity="secondary"
      :label="t('mealPlan.planner.retryShared')"
      @click="store.loadSharedPlanners()"
    />

    <div class="week-toolbar">
      <Button
        class="week-nav"
        severity="secondary"
        label="←"
        :aria-label="t('mealPlan.week.previous')"
        @click="previousWeek"
      />

      <div class="week-center">
        <p class="week-range">{{ weekRange }}</p>
        <Button
          v-if="!isCurrentWeek"
          severity="secondary"
          :label="t('mealPlan.week.current')"
          @click="currentWeek"
        />
      </div>

      <Button
        class="week-nav"
        severity="secondary"
        label="→"
        :aria-label="t('mealPlan.week.next')"
        @click="nextWeek"
      />
    </div>

    <p v-if="errorKey" class="alert" role="alert">{{ t(errorKey) }}</p>
    <div v-if="errorKey" class="error-actions">
      <Button severity="secondary" :label="t('mealPlan.retry')" @click="retryLoad" />
      <Button
        v-if="store.selectedOwnerId"
        severity="secondary"
        :label="t('mealPlan.planner.backToOwn')"
        @click="backToOwnPlan"
      />
    </div>
    <p v-if="saveErrorKey" class="alert" role="alert">{{ t(saveErrorKey) }}</p>

    <p v-if="loading" class="status" role="status">{{ t('mealPlan.status.loading') }}</p>

    <template v-else-if="!errorKey">
      <div class="week-grid">
        <MealDayCard
          v-for="dayCard in dayCards"
          :key="dayCard.day"
          :day="dayCard.day"
          :day-label="dayCard.dayLabel"
          :slots="dayCard.slots"
          :disabled="saving || !canEdit"
          @open="openPicker(dayCard.day, $event)"
          @remove="onRemove(dayCard.day, $event)"
        />
      </div>
    </template>

    <RecipePickerDialog
      :open="pickerOpen"
      :title="pickerTitle"
      @close="closePicker"
      @select="onSelectRecipe"
    />

    <MealPlanShareDialog
      :open="shareOpen"
      :members="members"
      :members-loading="membersLoading"
      :members-error-key="membersErrorKey"
      :invite="invite"
      :invite-loading="inviteLoading"
      :invite-error-key="inviteErrorKey"
      :updating-member-id="updatingMemberId"
      :removing-member-id="removingMemberId"
      @close="closeShare"
      @create-invite="onCreateInvite"
      @toggle-permission="onTogglePermission"
      @remove-member="onRemoveMember"
      @retry-members="retryMembers"
    />
  </main>
</template>

<style scoped>
.meal-plan-view {
  width: 100%;
  max-width: var(--content-max-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.title {
  margin: 0;
}

.description,
.shared-owner {
  margin: 0;
  max-width: 60ch;
  color: var(--color-text-muted);
}

.shared-owner {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.save-area {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.share-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
}

.share-hint {
  margin: 0;
  max-width: 28ch;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: right;
}

.dirty,
.saved,
.read-only-hint {
  margin: 0;
  font-size: var(--font-size-sm);
}

.dirty,
.read-only-hint {
  color: var(--color-text-muted);
}

.saved {
  color: var(--color-primary);
}

.planner-bar {
  max-width: 26rem;
}

.week-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-muted);
}

.week-center {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.week-nav {
  min-width: 2.5rem;
  padding-inline: var(--space-md);
  font-size: var(--font-size-lg);
  line-height: 1;
}

.week-range {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.status {
  margin: 0;
  color: var(--color-text-muted);
}

.alert {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background-color: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-md);
}
</style>
