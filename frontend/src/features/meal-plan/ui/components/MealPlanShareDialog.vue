<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { MealPlanInvite, MealPlanMember } from '@/shared/api/types'
import { Button, Checkbox } from '@/shared/components'

const props = defineProps<{
  open: boolean
  members: MealPlanMember[]
  membersLoading: boolean
  membersErrorKey: string | null
  invite: MealPlanInvite | null
  inviteLoading: boolean
  inviteErrorKey: string | null
  updatingMemberId: string | null
  removingMemberId: string | null
}>()

const emit = defineEmits<{
  close: []
  createInvite: []
  togglePermission: [memberId: string, canEdit: boolean]
  removeMember: [memberId: string]
  retryMembers: []
}>()

const { t } = useI18n()
const dialogRef = useTemplateRef<HTMLDialogElement>('dialog')
const copyState = shallowRef<'idle' | 'copied' | 'error'>('idle')

watch(
  () => props.invite,
  () => {
    copyState.value = 'idle'
  },
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      openDialog()
    } else {
      closeDialog()
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  if (props.open) {
    openDialog()
  }
})

function openDialog(): void {
  if (!dialogRef.value || dialogRef.value.open) {
    return
  }

  if (typeof dialogRef.value.showModal === 'function') {
    dialogRef.value.showModal()
  } else {
    dialogRef.value.setAttribute('open', '')
  }
}

function closeDialog(): void {
  if (!dialogRef.value?.open) {
    return
  }

  if (typeof dialogRef.value.close === 'function') {
    dialogRef.value.close()
  } else {
    dialogRef.value.removeAttribute('open')
    emit('close')
  }
}

function close(): void {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
    return
  }

  emit('close')
}

function onNativeClose(): void {
  emit('close')
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) {
    close()
  }
}

async function copyLink(): Promise<void> {
  if (!props.invite) {
    return
  }

  try {
    await navigator.clipboard.writeText(props.invite.url)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
}

function onTogglePermission(member: MealPlanMember, value: boolean): void {
  emit('togglePermission', member.user.id, value)
}

function selectLink(event: FocusEvent): void {
  ;(event.target as HTMLInputElement).select()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="share-dialog"
    aria-labelledby="meal-plan-share-title"
    @cancel.prevent="close"
    @close="onNativeClose"
    @click="onBackdropClick"
  >
    <div class="share-panel">
      <header class="share-header">
        <div class="share-heading">
          <h2 id="meal-plan-share-title" class="share-title">
            {{ t('mealPlan.sharing.title') }}
          </h2>
          <p class="share-description">{{ t('mealPlan.sharing.description') }}</p>
        </div>
        <button
          type="button"
          class="close-button"
          :aria-label="t('mealPlan.sharing.close')"
          @click="close"
        >
          ×
        </button>
      </header>

      <section class="share-section">
        <Button
          :label="
            inviteLoading ? t('mealPlan.sharing.creating') : t('mealPlan.sharing.createInvite')
          "
          :disabled="inviteLoading"
          @click="emit('createInvite')"
        />

        <p v-if="inviteErrorKey" class="alert" role="alert">{{ t(inviteErrorKey) }}</p>

        <template v-if="invite">
          <label class="link-label" for="meal-plan-invite-link">
            {{ t('mealPlan.sharing.linkLabel') }}
          </label>
          <div class="link-row">
            <input
              id="meal-plan-invite-link"
              class="link-input"
              type="text"
              readonly
              :value="invite.url"
              @focus="selectLink"
            />
            <Button severity="secondary" :label="t('mealPlan.sharing.copy')" @click="copyLink" />
          </div>
          <p class="hint">{{ t('mealPlan.sharing.linkHint') }}</p>
          <p v-if="copyState === 'copied'" class="success" role="status">
            {{ t('mealPlan.sharing.copied') }}
          </p>
          <p v-else-if="copyState === 'error'" class="alert" role="alert">
            {{ t('mealPlan.sharing.copyError') }}
          </p>
        </template>
      </section>

      <section class="share-section">
        <h3 class="section-title">{{ t('mealPlan.sharing.membersTitle') }}</h3>

        <p v-if="membersLoading" class="status" role="status">
          {{ t('mealPlan.sharing.loadingMembers') }}
        </p>
        <p v-else-if="membersErrorKey" class="alert" role="alert">
          {{ t(membersErrorKey) }}
        </p>
        <Button
          v-if="membersErrorKey"
          severity="secondary"
          :label="t('mealPlan.sharing.retryMembers')"
          @click="emit('retryMembers')"
        />

        <p v-if="!membersLoading && !membersErrorKey && members.length === 0" class="status">
          {{ t('mealPlan.sharing.membersEmpty') }}
        </p>

        <ul v-if="members.length > 0" class="member-list">
          <li v-for="member in members" :key="member.user.id" class="member-item">
            <div class="member-main">
              <span class="member-name">{{ member.user.name }}</span>
              <Checkbox
                :id="`member-edit-${member.user.id}`"
                :label="t('mealPlan.sharing.editPermission')"
                :model-value="member.canEdit"
                :disabled="
                  updatingMemberId === member.user.id || removingMemberId === member.user.id
                "
                @update:model-value="onTogglePermission(member, $event)"
              />
            </div>
            <Button
              severity="secondary"
              :label="
                removingMemberId === member.user.id
                  ? t('mealPlan.sharing.removing')
                  : t('mealPlan.sharing.remove')
              "
              :disabled="updatingMemberId === member.user.id || removingMemberId === member.user.id"
              @click="emit('removeMember', member.user.id)"
            />
          </li>
        </ul>
      </section>
    </div>
  </dialog>
</template>

<style scoped>
.share-dialog {
  width: min(40rem, calc(100vw - 2rem));
  max-height: min(85vh, 52rem);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-lg);
}

.share-dialog::backdrop {
  background-color: rgb(0 0 0 / 45%);
}

.share-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-height: min(85vh, 52rem);
  padding: var(--space-lg);
  overflow-y: auto;
}

.share-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.share-heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.share-title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.share-description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.close-button {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
}

.close-button:hover {
  background-color: var(--color-bg-muted);
  color: var(--color-text);
}

.share-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.section-title {
  margin: 0;
  font-size: var(--font-size-md);
}

.link-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.link-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.link-input {
  flex: 1 1 16rem;
  min-width: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-muted);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-sm);
}

.hint,
.status,
.success {
  margin: 0;
  font-size: var(--font-size-sm);
}

.hint,
.status {
  color: var(--color-text-muted);
}

.success {
  color: var(--color-primary);
}

.alert {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background-color: color-mix(in srgb, var(--color-danger) 8%, transparent);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.member-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.member-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
</style>
