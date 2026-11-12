import { defineStore } from 'pinia'

import type {
  MealPlanDay,
  MealPlanEntry,
  MealPlanInvite,
  MealPlanInvitePreview,
  MealPlanMeal,
  MealPlanMember,
  MealPlanUser,
  RecipeSummary,
  SharedMealPlan,
} from '@/shared/api/types'
import {
  getMealPlanErrorKey,
  getMonday,
  loadMealPlan,
  saveMealPlan,
  shiftWeek,
} from '../services/mealPlanService'
import {
  acceptInvite,
  createInvite,
  getInviteErrorKey,
  getSharedMealPlanErrorKey,
  loadMembers,
  loadSharedMealPlans,
  previewInvite,
  removeMember,
  updateMemberPermission,
} from '../services/mealPlanSharingService'

interface MealPlanState {
  weekStart: string
  selectedOwnerId: string | null
  planOwner: MealPlanUser | null
  canEdit: boolean
  entries: MealPlanEntry[]
  updatedAt: string | null
  loading: boolean
  saving: boolean
  errorKey: string | null
  saveErrorKey: string | null
  dirty: boolean
  saved: boolean
  sharedPlanners: SharedMealPlan[]
  sharedPlannersLoading: boolean
  sharedPlannersErrorKey: string | null
  members: MealPlanMember[]
  membersLoading: boolean
  membersErrorKey: string | null
  invite: MealPlanInvite | null
  inviteLoading: boolean
  inviteErrorKey: string | null
  updatingMemberId: string | null
  removingMemberId: string | null
  invitePreview: MealPlanInvitePreview | null
  joinLoading: boolean
  joinErrorKey: string | null
}

export const useMealPlanStore = defineStore('mealPlan', {
  state: (): MealPlanState => ({
    weekStart: getMonday(),
    selectedOwnerId: null,
    planOwner: null,
    canEdit: false,
    entries: [],
    updatedAt: null,
    loading: false,
    saving: false,
    errorKey: null,
    saveErrorKey: null,
    dirty: false,
    saved: false,
    sharedPlanners: [],
    sharedPlannersLoading: false,
    sharedPlannersErrorKey: null,
    members: [],
    membersLoading: false,
    membersErrorKey: null,
    invite: null,
    inviteLoading: false,
    inviteErrorKey: null,
    updatingMemberId: null,
    removingMemberId: null,
    invitePreview: null,
    joinLoading: false,
    joinErrorKey: null,
  }),

  getters: {
    isOwner: (state): boolean => state.selectedOwnerId === null,
    isReadOnly: (state): boolean => !state.canEdit,
  },

  actions: {
    markDirty(): void {
      this.dirty = true
      this.saved = false
    },

    async loadWeek(weekStart: string, ownerId?: string | null): Promise<boolean> {
      const targetOwnerId = ownerId === undefined ? this.selectedOwnerId : ownerId

      this.weekStart = weekStart
      this.selectedOwnerId = targetOwnerId
      this.loading = true
      this.errorKey = null
      this.saveErrorKey = null
      this.dirty = false
      this.saved = false

      try {
        const plan = await loadMealPlan(weekStart, targetOwnerId ?? undefined)

        this.entries = plan.entries
        this.updatedAt = plan.updatedAt
        this.planOwner = plan.owner
        this.canEdit = plan.canEdit
        return true
      } catch (error) {
        this.entries = []
        this.updatedAt = null
        this.planOwner = null
        this.canEdit = false
        this.errorKey = getMealPlanErrorKey(error, 'mealPlan.errors.load')
        return false
      } finally {
        this.loading = false
      }
    },

    async goToWeek(weeks: number): Promise<boolean> {
      return this.loadWeek(shiftWeek(this.weekStart, weeks), this.selectedOwnerId)
    },

    async goToCurrentWeek(): Promise<boolean> {
      return this.loadWeek(getMonday(), this.selectedOwnerId)
    },

    async selectPlanner(ownerId: string | null): Promise<boolean> {
      return this.loadWeek(this.weekStart, ownerId)
    },

    setRecipe(day: MealPlanDay, meal: MealPlanMeal, recipe: RecipeSummary): void {
      if (!this.canEdit) {
        return
      }

      this.entries = this.entries.filter((entry) => !(entry.day === day && entry.meal === meal))
      this.entries.push({ day, meal, recipeId: recipe.id, recipe })
      this.markDirty()
    },

    removeRecipe(day: MealPlanDay, meal: MealPlanMeal): void {
      if (!this.canEdit) {
        return
      }

      this.entries = this.entries.filter((entry) => !(entry.day === day && entry.meal === meal))
      this.markDirty()
    },

    async save(): Promise<boolean> {
      if (!this.canEdit) {
        return false
      }

      this.saving = true
      this.saveErrorKey = null
      this.saved = false

      try {
        const plan = await saveMealPlan(
          this.weekStart,
          this.entries,
          this.selectedOwnerId ?? undefined,
        )

        this.entries = plan.entries
        this.updatedAt = plan.updatedAt
        this.planOwner = plan.owner
        this.canEdit = plan.canEdit
        this.dirty = false
        this.saved = true
        return true
      } catch (error) {
        this.saveErrorKey = getMealPlanErrorKey(error, 'mealPlan.errors.save')
        return false
      } finally {
        this.saving = false
      }
    },

    async loadSharedPlanners(): Promise<boolean> {
      this.sharedPlannersLoading = true
      this.sharedPlannersErrorKey = null

      try {
        this.sharedPlanners = await loadSharedMealPlans()
        return true
      } catch (error) {
        this.sharedPlannersErrorKey = getSharedMealPlanErrorKey(
          error,
          'mealPlan.sharing.errors.loadPlanners',
        )
        return false
      } finally {
        this.sharedPlannersLoading = false
      }
    },

    async createInvite(): Promise<boolean> {
      this.inviteLoading = true
      this.inviteErrorKey = null

      try {
        this.invite = await createInvite()
        return true
      } catch (error) {
        this.inviteErrorKey = getSharedMealPlanErrorKey(
          error,
          'mealPlan.sharing.errors.createInvite',
        )
        return false
      } finally {
        this.inviteLoading = false
      }
    },

    clearInvite(): void {
      this.invite = null
      this.inviteErrorKey = null
    },

    async loadMembers(): Promise<boolean> {
      this.membersLoading = true
      this.membersErrorKey = null

      try {
        this.members = await loadMembers()
        return true
      } catch (error) {
        this.membersErrorKey = getSharedMealPlanErrorKey(
          error,
          'mealPlan.sharing.errors.loadMembers',
        )
        return false
      } finally {
        this.membersLoading = false
      }
    },

    async setMemberPermission(memberId: string, canEdit: boolean): Promise<boolean> {
      this.updatingMemberId = memberId
      this.membersErrorKey = null

      try {
        const updated = await updateMemberPermission(memberId, canEdit)

        this.members = this.members.map((member) =>
          member.user.id === memberId ? updated : member,
        )
        return true
      } catch (error) {
        this.membersErrorKey = getSharedMealPlanErrorKey(
          error,
          'mealPlan.sharing.errors.updateMember',
        )
        return false
      } finally {
        this.updatingMemberId = null
      }
    },

    async removeMember(memberId: string): Promise<boolean> {
      this.removingMemberId = memberId
      this.membersErrorKey = null

      try {
        await removeMember(memberId)
        this.members = this.members.filter((member) => member.user.id !== memberId)
        return true
      } catch (error) {
        this.membersErrorKey = getSharedMealPlanErrorKey(
          error,
          'mealPlan.sharing.errors.removeMember',
        )
        return false
      } finally {
        this.removingMemberId = null
      }
    },

    async previewInvite(token: string): Promise<boolean> {
      this.joinLoading = true
      this.joinErrorKey = null
      this.invitePreview = null

      try {
        this.invitePreview = await previewInvite(token)
        return true
      } catch (error) {
        this.joinErrorKey = getInviteErrorKey(error)
        return false
      } finally {
        this.joinLoading = false
      }
    },

    async acceptInvite(token: string): Promise<SharedMealPlan | null> {
      this.joinLoading = true
      this.joinErrorKey = null

      try {
        const planner = await acceptInvite(token)

        this.sharedPlanners = [
          ...this.sharedPlanners.filter((item) => item.owner.id !== planner.owner.id),
          planner,
        ]
        return planner
      } catch (error) {
        this.joinErrorKey = getInviteErrorKey(error)
        return null
      } finally {
        this.joinLoading = false
      }
    },

    resetJoinState(): void {
      this.invitePreview = null
      this.joinErrorKey = null
      this.joinLoading = false
    },
  },
})
