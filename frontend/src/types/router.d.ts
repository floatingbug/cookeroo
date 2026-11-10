import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    /** Ziel-Pfad, zu dem angemeldete Nutzer von dieser Route umgeleitet werden. */
    redirectAuthenticatedTo?: string
  }
}

export {}
