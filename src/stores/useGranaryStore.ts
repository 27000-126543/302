import { create } from 'zustand'
import type { Granary, GrainRecord } from '@/types'
import { mockGranaries, mockGrainRecords } from '@/data/mockData'
import { TEMP_THRESHOLD, TEMP_RECOVERY } from '@/utils/constants'

interface GranaryState {
  granaries: Granary[]
  grainRecords: GrainRecord[]
  selectedGranaryId: string | null
  setGranaries: (granaries: Granary[]) => void
  updateGranary: (id: string, partial: Partial<Granary>) => void
  setSelectedGranaryId: (id: string | null) => void
  addGrainRecord: (record: GrainRecord) => void
  getGrainRecordsByGranaryId: (id: string) => GrainRecord[]
  checkTemperatureAlerts: () => void
}

export const useGranaryStore = create<GranaryState>((set, get) => ({
  granaries: mockGranaries,
  grainRecords: mockGrainRecords,
  selectedGranaryId: null,

  setGranaries: (granaries) => set({ granaries }),

  updateGranary: (id, partial) =>
    set((state) => ({
      granaries: state.granaries.map((g) =>
        g.id === id ? { ...g, ...partial } : g
      ),
    })),

  setSelectedGranaryId: (id) => set({ selectedGranaryId: id }),

  addGrainRecord: (record) =>
    set((state) => ({
      grainRecords: [...state.grainRecords, record],
    })),

  getGrainRecordsByGranaryId: (id) =>
    get().grainRecords.filter((r) => r.granaryId === id),

  checkTemperatureAlerts: () =>
    set((state) => ({
      granaries: state.granaries.map((g) => {
        if (g.avgTemp > TEMP_THRESHOLD) return { ...g, ventilating: true }
        if (g.avgTemp < TEMP_RECOVERY) return { ...g, ventilating: false }
        return g
      }),
    })),
}))
