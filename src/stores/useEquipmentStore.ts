import { create } from 'zustand'
import type { Equipment } from '@/types'
import { mockEquipment } from '@/data/mockData'

interface EquipmentState {
  equipment: Equipment[]
  setEquipment: (equipment: Equipment[]) => void
  updateEquipment: (id: string, partial: Partial<Equipment>) => void
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  equipment: mockEquipment,

  setEquipment: (equipment) => set({ equipment }),

  updateEquipment: (id, partial) =>
    set((state) => ({
      equipment: state.equipment.map((e) =>
        e.id === id ? { ...e, ...partial } : e
      ),
    })),
}))
