import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import type { SharedMealPlan, User } from '@/shared/api/types'

const { routeMock, routerReplaceMock, routerPushMock } = vi.hoisted(() => ({
  routeMock: {
    params: { token: 'a'.repeat(64) },
    fullPath: `/meal-plan/join/${'a'.repeat(64)}`,
    query: {},
  },
  routerReplaceMock: vi.fn(),
  routerPushMock: vi.fn(),
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()

  return {
    ...actual,
    useRoute: () => routeMock,
    useRouter: () => ({ replace: routerReplaceMock, push: routerPushMock }),
  }
})

vi.mock('../../services/mealPlanSharingService', async () => {
  const actual = await vi.importActual<typeof import('../../services/mealPlanSharingService')>(
    '../../services/mealPlanSharingService',
  )

  return {
    ...actual,
    previewInvite: vi.fn(),
    acceptInvite: vi.fn(),
  }
})

import i18n from '@/app/i18n'
import { useAuthStore } from '@/features/auth/store/authStore'
import * as sharingService from '../../services/mealPlanSharingService'
import MealPlanJoinView from './MealPlanJoinView.vue'

const mockedPreviewInvite = vi.mocked(sharingService.previewInvite)
const mockedAcceptInvite = vi.mocked(sharingService.acceptInvite)

const OWNER = { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Anna' }
const MEMBER_USER = {
  id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  name: 'Ben',
  email: 'ben@example.com',
}

const SHARED: SharedMealPlan = {
  owner: OWNER,
  canEdit: false,
}

interface ViewAuth {
  status: 'guest' | 'authenticated'
  user?: User | null
}

function mountView(auth: ViewAuth = { status: 'guest' }) {
  const pinia = createPinia()

  setActivePinia(pinia)

  const authStore = useAuthStore()

  authStore.status = auth.status
  authStore.user = auth.user ?? null

  return mount(MealPlanJoinView, {
    global: { plugins: [pinia, i18n] },
  })
}

describe('MealPlanJoinView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockedPreviewInvite.mockResolvedValue({ owner: OWNER })
  })

  it('fordert Gäste zuerst zur Registrierung auf', async () => {
    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.join.invitedBy', { name: OWNER.name }))
    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.join.registerHint'))

    const registerButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('mealPlan.join.register'))

    expect(registerButton).toBeDefined()

    await registerButton!.trigger('click')

    expect(routerPushMock).toHaveBeenCalledWith({
      name: 'sign-up',
      query: { redirect: routeMock.fullPath },
    })
  })

  it('lässt angemeldete Nutzer den Plan beitreten', async () => {
    mockedAcceptInvite.mockResolvedValue(SHARED)

    const wrapper = mountView({ status: 'authenticated', user: MEMBER_USER })

    await flushPromises()

    const joinButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('mealPlan.join.accept'))

    expect(joinButton).toBeDefined()

    await joinButton!.trigger('click')
    await flushPromises()

    expect(mockedAcceptInvite).toHaveBeenCalledWith('a'.repeat(64))
    expect(routerReplaceMock).toHaveBeenCalledWith({
      name: 'meal-plan',
      query: { owner: OWNER.id },
    })
  })

  it('weist den Besitzer auf seinen eigenen Plan hin', async () => {
    const wrapper = mountView({
      status: 'authenticated',
      user: { ...MEMBER_USER, id: OWNER.id, name: OWNER.name },
    })

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.join.ownPlanner'))
    expect(
      wrapper
        .findAll('button')
        .some((button) => button.text() === i18n.global.t('mealPlan.join.accept')),
    ).toBe(false)
  })

  it('zeigt ungültige Einladungen an', async () => {
    mockedPreviewInvite.mockRejectedValue({ status: 404 })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain(i18n.global.t('mealPlan.join.errors.invalid'))
  })
})
