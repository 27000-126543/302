import { create } from 'zustand'
import type { Order } from '@/types'
import { mockOrders } from '@/data/mockData'

interface OrderState {
  orders: Order[]
  dispatchingOrderId: string | null
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (id: string, status: Order['status']) => void
  setDispatchingOrderId: (id: string | null) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: mockOrders,
  dispatchingOrderId: null,

  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status } : o
      ),
    })),

  setDispatchingOrderId: (id) => set({ dispatchingOrderId: id }),
}))
