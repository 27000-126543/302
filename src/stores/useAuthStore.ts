import { create } from 'zustand'
import type { User, OperationLog } from '@/types'
import { mockUsers, mockLogs } from '@/data/mockData'

interface AuthState {
  currentUser: User | null
  isLoggedIn: boolean
  users: User[]
  logs: OperationLog[]
  login: (userId: string) => void
  logout: () => void
  addLog: (log: OperationLog) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoggedIn: false,
  users: mockUsers,
  logs: mockLogs,

  login: (userId) =>
    set((state) => {
      const user = state.users.find((u) => u.id === userId)
      if (!user) return state
      return { currentUser: user, isLoggedIn: true }
    }),

  logout: () => set({ currentUser: null, isLoggedIn: false }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),
}))
