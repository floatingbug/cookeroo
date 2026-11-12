<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { Button } from '@/shared/components'
import { clearPendingRedirect, savePendingRedirect } from '@/shared/router/pendingRedirect'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useMealPlanStore } from '../../store/mealPlanStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useMealPlanStore()
const { invitePreview, joinLoading, joinErrorKey } = storeToRefs(store)

const token = computed(() => (typeof route.params.token === 'string' ? route.params.token : ''))
const ownerName = computed(() => invitePreview.value?.owner.name ?? '')
const isOwner = computed(() => invitePreview.value?.owner.id === authStore.user?.id)
const canRetry = computed(() => joinErrorKey.value === 'mealPlan.join.errors.network')

onMounted(async () => {
  store.resetJoinState()

  if (!token.value) {
    return
  }

  if (!authStore.isAuthenticated) {
    savePendingRedirect(route.fullPath)
  }

  await store.previewInvite(token.value)
})

function goToSignUp(): void {
  savePendingRedirect(route.fullPath)
  void router.push({ name: 'sign-up', query: { redirect: route.fullPath } })
}

function goToSignIn(): void {
  savePendingRedirect(route.fullPath)
  void router.push({ name: 'sign-in', query: { redirect: route.fullPath } })
}

function goToHome(): void {
  clearPendingRedirect()
  void router.push({ name: 'home' })
}

function goToMealPlan(): void {
  clearPendingRedirect()
  void router.push({ name: 'meal-plan' })
}

async function retry(): Promise<void> {
  if (token.value) {
    await store.previewInvite(token.value)
  }
}

async function join(): Promise<void> {
  const planner = await store.acceptInvite(token.value)

  if (!planner) {
    return
  }

  clearPendingRedirect()
  await router.replace({
    name: 'meal-plan',
    query: { owner: planner.owner.id },
  })
}
</script>

<template>
  <section class="join-card">
    <h1 class="join-title">{{ t('mealPlan.join.title') }}</h1>

    <p v-if="joinLoading && !invitePreview" class="join-status" role="status">
      {{ t('mealPlan.join.loading') }}
    </p>

    <template v-else-if="joinErrorKey">
      <p class="join-alert" role="alert">{{ t(joinErrorKey) }}</p>
      <div class="join-actions">
        <Button v-if="canRetry" :label="t('mealPlan.join.retry')" @click="retry" />
        <Button severity="secondary" :label="t('mealPlan.join.toHome')" @click="goToHome" />
      </div>
    </template>

    <template v-else-if="invitePreview">
      <p class="join-description">
        {{ t('mealPlan.join.invitedBy', { name: ownerName }) }}
      </p>

      <template v-if="!authStore.isAuthenticated">
        <p class="join-text">{{ t('mealPlan.join.registerHint') }}</p>
        <div class="join-actions">
          <Button :label="t('mealPlan.join.register')" @click="goToSignUp" />
          <Button severity="secondary" :label="t('mealPlan.join.signIn')" @click="goToSignIn" />
        </div>
      </template>

      <template v-else-if="isOwner">
        <p class="join-text">{{ t('mealPlan.join.ownPlanner') }}</p>
        <Button :label="t('mealPlan.join.toMealPlan')" @click="goToMealPlan" />
      </template>

      <template v-else>
        <p class="join-text">{{ t('mealPlan.join.readOnlyHint') }}</p>
        <Button
          :label="joinLoading ? t('mealPlan.join.joining') : t('mealPlan.join.accept')"
          :disabled="joinLoading"
          @click="join"
        />
      </template>
    </template>
  </section>
</template>

<style scoped>
.join-card {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.join-title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.join-description,
.join-text,
.join-status {
  margin: 0;
}

.join-description {
  font-weight: var(--font-weight-medium);
}

.join-text,
.join-status {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.join-alert {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background-color: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.join-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

@media (max-width: 480px) {
  .join-card {
    padding: var(--space-md);
  }
}
</style>
