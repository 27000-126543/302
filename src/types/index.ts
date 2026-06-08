export type GranaryType = 'flat' | 'silo'

export type GranaryLevel = 'normal' | 'low_temp' | 'quasi_low_temp'

export type GrainProduct = '优质稻' | '普通稻' | '优质小麦' | '普通小麦' | '玉米' | '大豆'

export type OrderType = 'in' | 'out'

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type QualityLevel = '一等' | '二等' | '三等' | '等外'

export type WorkOrderType = 'drying' | 'fumigation' | 'maintenance' | 'expansion'

export type ApprovalStatus = 'pending' | 'pending_director' | 'pending_depot_director' | 'approved' | 'rejected' | 'in_progress' | 'completed'

export type EquipmentType = 'conveyor' | 'dryer' | 'fan'

export type EquipmentStatus = 'running' | 'idle' | 'maintenance' | 'fault'

export type UserRole = 'operator' | 'warehouse_director' | 'depot_director' | 'superior'

export type AlertType = 'temperature' | 'pest' | 'equipment'

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface Granary {
  id: string
  name: string
  type: GranaryType
  product: GrainProduct
  stock: number
  capacity: number
  avgTemp: number
  avgMoisture: number
  pestDensity: number
  ventilating: boolean
  fumigating: boolean
  level: GranaryLevel
  position: [number, number, number]
}

export interface GrainRecord {
  id: string
  granaryId: string
  timestamp: string
  temperature: number
  moisture: number
  pestDensity: number
}

export interface Order {
  id: string
  type: OrderType
  product: GrainProduct
  quantity: number
  qualityLevel: QualityLevel
  source: string
  status: OrderStatus
  createdAt: string
  granaryId: string
}

export interface Inspection {
  id: string
  granaryId: string
  inspector: string
  timestamp: string
  moisture: number
  impurity: number
  pestDensity: number
  exceeded: boolean
  remark: string
}

export interface WorkOrder {
  id: string
  type: WorkOrderType
  granaryId: string
  title: string
  description: string
  assignee: string
  approvalStatus: ApprovalStatus
  createdAt: string
  deadline: string
}

export interface Equipment {
  id: string
  name: string
  type: EquipmentType
  status: EquipmentStatus
  runningHours: number
  maintenanceThreshold: number
  position: [number, number, number]
  granaryId: string
}

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  department: string
}

export interface Alert {
  id: string
  type: AlertType
  level: AlertLevel
  message: string
  source: string
  timestamp: string
  resolved: boolean
}

export interface OperationLog {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  timestamp: string
  detail: string
}
