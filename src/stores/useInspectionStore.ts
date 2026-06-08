import { create } from 'zustand'
import type { Inspection } from '@/types'
import { mockInspections } from '@/data/mockData'

interface InspectionState {
  inspections: Inspection[]
  setInspections: (inspections: Inspection[]) => void
  addInspection: (inspection: Inspection) => void
}

export const useInspectionStore = create<InspectionState>((set) => ({
  inspections: mockInspections,

  setInspections: (inspections) => set({ inspections }),

  addInspection: (inspection) =>
    set((state) => ({
      inspections: [...state.inspections, inspection],
    })),
}))
