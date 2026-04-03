'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// TODO: swap this out for proper JWT-based auth with http-only cookies.
// Right now we just load all demo users on login and pick one — fine for a demo,
// obviously not for production.

export type UserRole =
  | 'super_admin'
  | 'agency_admin'
  | 'agency_viewer'
  | 'sme_admin'
  | 'sme_editor'
  | 'sme_viewer'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  agencyId?: string
  orgId?: string
  agencyName?: string
  orgName?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  availableUsers: AuthUser[]
  isLoading: boolean

  // Actions
  login: (userId: string) => void
  logout: () => void
  loadAvailableUsers: () => Promise<void>
  setUser: (user: AuthUser) => void
  setLoading: (loading: boolean) => void
}

export const selectIsSuperAdmin = (state: AuthState): boolean =>
  state.user?.role === 'super_admin'

export const selectIsAgencyAdmin = (state: AuthState): boolean =>
  state.user?.role === 'agency_admin' || state.user?.role === 'agency_viewer'

export const selectIsSme = (state: AuthState): boolean =>
  state.user?.role === 'sme_admin' ||
  state.user?.role === 'sme_editor' ||
  state.user?.role === 'sme_viewer'

export const selectCanEdit = (state: AuthState): boolean =>
  state.user?.role === 'super_admin' ||
  state.user?.role === 'agency_admin' ||
  state.user?.role === 'sme_admin' ||
  state.user?.role === 'sme_editor'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      availableUsers: [],
      isLoading: false,

      login: (userId: string) => {
        const { availableUsers } = get()
        const found = availableUsers.find((u) => u.id === userId)
        if (found) {
          set({ user: found, isAuthenticated: true })
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      loadAvailableUsers: async () => {
        const { availableUsers } = get()
        if (availableUsers.length > 0) return // already loaded

        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/users')
          if (!res.ok) throw new Error('Failed to load users')
          const data: AuthUser[] = await res.json()
          set({ availableUsers: data, isLoading: false })
        } catch (error) {
          console.error('Failed to load available users:', error)
          set({ isLoading: false })
        }
      },

      setUser: (user: AuthUser) => {
        set({ user, isAuthenticated: true })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'databridge-auth',
      // persist to localStorage so we survive page refreshes.
      // only storing user + isAuthenticated, not the full user list.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
