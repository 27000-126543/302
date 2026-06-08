import { create } from 'zustand'
import type { Alert } from '@/types'
import { mockAlerts } from '@/data/mockData'

interface AlertState {
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  markAsRead: (id: string) => void
  dismissAlert: (id: string) => void
}

const useAlertStore = create<AlertState>((set) => ({
  alerts: mockAlerts,
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, alert],
    })),
  markAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    })),
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
}))

export default useAlertStore
