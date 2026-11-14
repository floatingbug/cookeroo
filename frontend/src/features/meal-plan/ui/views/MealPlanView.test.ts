import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { onBeforeRouteLeaveMock, routeMock, routerReplaceMock, routerPushMock } = vi.hoisted(() => ({
  onBeforeRouteLeaveMock: vi.fn(),
  routeMock: { query: {} as Record<string, string>, fullPath: '/meal-plan' },
  routerReplaceMock: vi.fn(),
  routerPushMock: vi.fn(),
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()

  return {
    ...actual,
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
    useRoute: () => routeMock,
    useRouter: () => ({ replace: routerReplaceMock, push: routerPushMock }),
  }
})

vi.mock('../../services/mealPlanService', async () => {
  const actual = await vi.importActual<typeof import('../../services/mealPlanService')>(
    '../../services/mealPlanService',
  )

  return {
    ...actual,
    loadMealPlan: vi.fn(),
    saveMealPlan: vi.fn(),
  }
})

vi.mock('../../services/mealPlanSharingService', async () => {
  const actual = await vi.importActual<typeof import('../../services/mealPlanSharingService')>(
    '../../services/mealPlanSharingService',
  )

  return {
    ...actual,
    loadSharedMealPlans: vi.fn(),
    loadMembers: vi.fn(),
    createInvite: vi.fn(),
    updateMemberPermission: vi.fn(),
    removeMember: vi.fn(),
  }
})

vi.mock('@/features/recipe/services/recipeService', async () => {
  const actual = await vi.importActual<typeof import('@/features/recipe/services/recipeService')>(
    '@/features/recipe/services/recipeService',
  )

  return {
    ...actual,
    loadRecipeTags: vi.fn(),
    searchRecipes: vi.fn(),
  }
})

import type { MealPlan, MealPlanEntry, RecipeSummary, SharedMealPlan } from '@/shared/api/types'
import i18n from '@/app/i18n'
import * as recipeService from '@/features/recipe/services/recipeService'
import * as mealPlanService from '../../services/mealPlanService'
import * as mealPlanSharingService from '../../services/mealPlanSharingService'
import { useMealPlanStore } from '../../store/mealPlanStore'
import MealPlanView from './MealPlanView.vue'

const mockedLoadMealPlan = vi.mocked(mealPlanService.loadMealPlan)
const mockedSaveMealPlan = vi.mocked(mealPlanService.saveMealPlan)
const mockedLoadSharedMealPlans = vi.mocked(mealPlanSharingService.loadSharedMealPlans)
const mockedLoadMembers = vi.mocked(mealPlanSharingService.loadMembers)
const mockedLoadRecipeTags = vi.mocked(recipeService.loadRecipeTags)
const mockedSearchRecipes = vi.mocked(recipeService.searchRecipes)

const RECIPE: RecipeSummary = {
  id: '0123456789abcdef01234567',
  title: 'Lasagne',
  imageUrl: null,
  category: 'Hauptgericht',
  cuisine: 'Italienisch',
  difficulty: 'medium',
  prepTime: 20,
  cookTime: 40,
  restTime: 10,
  tags: ['Vegetarisch', 'Schnell'],
  status: 'public',
}

const ENTRY: MealPlanEntry = {
  day: 'monday',
  meal: 'breakfast',
  recipeId: RECIPE.id,
  recipe: RECIPE,
}

const PLAN: MealPlan = {
  weekStart: '2026-11-09',
  entries: [],
  updatedAt: null,
  owner: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Testnutzer' },
  canEdit: true,
}

const SHARED: SharedMealPlan = {
  owner: { id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Familie' },
  canEdit: false,
}

const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
}

function mountView() {
  const pinia = createPinia()

  setActivePinia(pinia)

  return mount(MealPlanView, {
    global: {
      plugins: [pinia, i18n],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

function saveButtonOf(wrapper: ReturnType<typeof mountView>) {
  return wrapper
    .findAll('button')
    .find((button) => button.text() === i18n.global.t('mealPlan.actions.save'))
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

describe('MealPlanView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeMock.query = {}
    mockedLoadSharedMealPlans.mockResolvedValue([])
    mockedLoadMembers.mockResolvedValue([])
    mockedLoadMealPlan.mockImplementation(async (weekStart) => ({ ...PLAN, weekStart }))
    mockedSaveMealPlan.mockImplementation(async (weekStart, entries) => ({
      weekStart,
      entries,
      updatedAt: '2026-11-12T10:00:00.000Z',
      owner: PLAN.owner,
      canEdit: true,
    }))
    mockedSearchRecipes.mockResolvedValue({ items: [RECIPE], nextOffset: null })
    mockedLoadRecipeTags.mockResolvedValue(['Vegetarisch', 'Schnell'])
  })

  it('zeigt sieben Tage mit je drei Mahlzeiten', async () => {
    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.findAll('.meal-day-card')).toHaveLength(7)
    expect(wrapper.findAll('.recipe-slot')).toHaveLength(21)
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.days.monday'))
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.meals.breakfast'))
  })

  it('verlinkt gespeicherte Rezepte zur Detailseite', async () => {
    mockedLoadMealPlan.mockResolvedValue({ ...PLAN, entries: [ENTRY] })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.findAll('.recipe-slot')[0]!.text()).toContain(RECIPE.title)

    const link = wrapper.findComponent({ name: 'RouterLink' })

    expect(link.exists()).toBe(true)
    expect(link.props('to')).toEqual({
      name: 'recipe-detail',
      params: { id: RECIPE.id },
    })
  })

  it('rendert bei einem nicht verfügbaren Rezept keinen Detail-Link', async () => {
    mockedLoadMealPlan.mockResolvedValue({
      ...PLAN,
      entries: [{ ...ENTRY, recipe: null }],
    })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(false)
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.recipeUnavailable'))
  })

  it('öffnet die Suche über "Ändern"', async () => {
    mockedLoadMealPlan.mockResolvedValue({ ...PLAN, entries: [ENTRY] })

    const wrapper = mountView()

    await flushPromises()

    const changeButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('mealPlan.actions.change'))

    expect(changeButton).toBeDefined()

    await changeButton!.trigger('click')
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenCalled()
  })

  it('entfernt ein Rezept über den X-Button', async () => {
    mockedLoadMealPlan.mockResolvedValue({ ...PLAN, entries: [ENTRY] })

    const wrapper = mountView()

    await flushPromises()

    const removeButton = wrapper.find(
      `button[aria-label="${i18n.global.t('mealPlan.actions.remove')}"]`,
    )

    expect(removeButton.exists()).toBe(true)

    await removeButton.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.recipe-slot')[0]!.text()).toContain(
      i18n.global.t('mealPlan.selectRecipe'),
    )
  })

  it('warnt beim Verlassen mit ungespeicherten Änderungen', async () => {
    mountView()
    await flushPromises()

    const guard = onBeforeRouteLeaveMock.mock.calls[0]![0] as () => boolean
    const store = useMealPlanStore()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    expect(guard()).toBe(true)
    expect(confirmSpy).not.toHaveBeenCalled()

    store.markDirty()

    expect(guard()).toBe(false)
    expect(confirmSpy).toHaveBeenCalledWith(i18n.global.t('mealPlan.unsavedConfirm'))

    confirmSpy.mockReturnValue(true)

    expect(guard()).toBe(true)

    confirmSpy.mockRestore()
  })

  it('sucht im Dialog und speichert die Auswahl', async () => {
    const wrapper = mountView()

    await flushPromises()

    await wrapper.findAll('.recipe-slot')[0]!.trigger('click')
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenCalledWith(
      { query: '', tags: [], offset: 0 },
      expect.any(AbortSignal),
    )
    expect(wrapper.findAll('.result-button')).toHaveLength(1)

    await wrapper.find('.result-button').trigger('click')
    await nextTick()

    expect(wrapper.findAll('.recipe-slot')[0]!.text()).toContain(RECIPE.title)

    const saveButton = saveButtonOf(wrapper)

    expect(saveButton).toBeDefined()

    await saveButton!.trigger('click')
    await flushPromises()

    expect(mockedSaveMealPlan).toHaveBeenCalledWith(
      expect.any(String),
      [{ day: 'monday', meal: 'breakfast', recipeId: RECIPE.id, recipe: RECIPE }],
      undefined,
    )
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.status.saved'))
  })

  it('filtert die Suche nach Tags', async () => {
    const wrapper = mountView()

    await flushPromises()

    await wrapper.findAll('.recipe-slot')[0]!.trigger('click')
    await flushPromises()

    const veganChip = wrapper.findAll('.tag-chip').find((chip) => chip.text() === 'Vegetarisch')

    expect(veganChip).toBeDefined()

    await veganChip!.trigger('click')
    await flushPromises()

    expect(mockedSearchRecipes).toHaveBeenLastCalledWith(
      { query: '', tags: ['Vegetarisch'], offset: 0 },
      expect.any(AbortSignal),
    )
  })

  it('zeigt einen Fehler beim Laden', async () => {
    mockedLoadMealPlan.mockRejectedValue({ status: 500 })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.errors.load'))
  })

  it('wechselt mit den Pfeil-Buttons zwischen Wochen', async () => {
    const wrapper = mountView()

    await flushPromises()

    const firstWeek = mockedLoadMealPlan.mock.calls.at(-1)?.[0]

    expect(firstWeek).toBeDefined()

    const previousButton = wrapper.find(
      `button[aria-label="${i18n.global.t('mealPlan.week.previous')}"]`,
    )

    expect(previousButton.find('svg').exists()).toBe(true)

    await previousButton.trigger('click')
    await flushPromises()

    expect(mockedLoadMealPlan).toHaveBeenLastCalledWith(
      mealPlanService.shiftWeek(firstWeek!, -1),
      undefined,
    )

    await wrapper
      .find(`button[aria-label="${i18n.global.t('mealPlan.week.next')}"]`)
      .trigger('click')
    await flushPromises()

    expect(mockedLoadMealPlan).toHaveBeenLastCalledWith(firstWeek, undefined)
  })

  it('zeigt einen freigegebenen Plan nur lesend an', async () => {
    routeMock.query = { owner: SHARED.owner.id }
    mockedLoadSharedMealPlans.mockResolvedValue([SHARED])
    mockedLoadMealPlan.mockResolvedValue({
      ...PLAN,
      owner: SHARED.owner,
      canEdit: false,
    })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(
      i18n.global.t('mealPlan.planner.sharedPlanFrom', { name: SHARED.owner.name }),
    )
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.planner.readOnlyHint'))
    expect(wrapper.text()).not.toContain(i18n.global.t('mealPlan.sharing.hint'))
    expect(saveButtonOf(wrapper)).toBeUndefined()

    const slots = wrapper.findAll('.recipe-slot')

    expect(slots.length).toBe(21)
    expect(slots.every((slot) => slot.attributes('disabled') !== undefined)).toBe(true)
  })

  it('wechselt über die Auswahl zum freigegebenen Plan', async () => {
    mockedLoadSharedMealPlans.mockResolvedValue([SHARED])

    const wrapper = mountView()

    await flushPromises()

    await wrapper.find('#meal-plan-planner').setValue(SHARED.owner.id)
    await flushPromises()

    expect(mockedLoadMealPlan).toHaveBeenLastCalledWith(expect.any(String), SHARED.owner.id)
    expect(routerReplaceMock).toHaveBeenCalledWith({
      query: { owner: SHARED.owner.id },
    })
  })

  it('öffnet den Teilen-Dialog für den Besitzer', async () => {
    const wrapper = mountView()

    await flushPromises()

    const shareButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('mealPlan.sharing.action'))

    expect(shareButton).toBeDefined()
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.sharing.hint'))

    await shareButton!.trigger('click')
    await flushPromises()

    expect(mockedLoadMembers).toHaveBeenCalled()
    expect(wrapper.find('.share-dialog').attributes('open')).toBeDefined()
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.sharing.title'))
  })
})
