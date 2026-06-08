import { create } from 'zustand'
import type { WorkOrder } from '@/types'
import { mockWorkOrders } from '@/data/mockData'

interface WorkOrderState {
  workOrders: WorkOrder[]
  setWorkOrders: (workOrders: WorkOrder[]) => void
  addWorkOrder: (workOrder: WorkOrder) => void
  updateWorkOrderStatus: (id: string, status: WorkOrder['approvalStatus']) => void
}

export const useWorkOrderStore = create<WorkOrderState>((set) => ({
  workOrders: mockWorkOrders,

  setWorkOrders: (workOrders) => set({ workOrders }),

  addWorkOrder: (workOrder) =>
    set((state) => ({
      workOrders: [...state.workOrders, workOrder],
    })),

  updateWorkOrderStatus: (id, status) =>
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === id ? { ...w, approvalStatus: status } : w
      ),
    })),
}))
