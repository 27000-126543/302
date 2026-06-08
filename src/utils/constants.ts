export const TEMP_THRESHOLD = 30;
export const TEMP_RECOVERY = 28;
export const PEST_THRESHOLD = 5;
export const MOISTURE_STANDARD = 14.5;
export const IMPURITY_STANDARD = 1.0;
export const CONVEYOR_MAINTENANCE_HOURS = 2000;
export const DRYER_MAINTENANCE_HOURS = 1500;
export const FAN_MAINTENANCE_HOURS = 3000;
export const DISPATCH_WAIT_THRESHOLD = 15;

export const PRODUCT_LEVEL_MAP: Record<string, string[]> = {
  quasi_low_temp: ['优质稻', '优质小麦'],
  low_temp: ['种子粮', '精品粮'],
  normal: ['普通稻', '普通小麦', '玉米', '大豆'],
};

export const QUALITY_LEVEL_MAP: Record<string, string> = {
  premium: 'quasi_low_temp',
  standard: 'normal',
  general: 'normal',
};

export const ROLE_LABELS: Record<string, string> = {
  operator: '操作员',
  warehouse_director: '仓储部长',
  depot_director: '粮库主任',
  superior: '上级粮管部门',
};

export const WORK_ORDER_TYPE_LABELS: Record<string, string> = {
  drying: '烘干',
  cleaning: '清理',
  fumigation: '熏蒸',
  maintenance: '检修',
  expansion: '扩容申请',
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending_safety: '待安全员审批',
  pending_inspector: '待质检员审批',
  pending_director: '待仓储部长审批',
  pending_leader: '待分管领导审批',
  pending_depot_director: '待粮库主任审批',
  approved: '已审批',
  rejected: '已驳回',
};

export const COLORS = {
  bg: '#0a1628',
  primary: '#00d4ff',
  warning: '#ff8c00',
  danger: '#ff3b3b',
  success: '#00ff88',
  purple: '#9b59b6',
  panelBg: 'rgba(10, 22, 40, 0.92)',
  border: 'rgba(0, 212, 255, 0.2)',
  textPrimary: '#e8f0fe',
  textSecondary: '#8ba3c7',
};

export const GRANARY_POSITIONS: Record<string, [number, number, number]> = {
  flat_1: [-8, 0, 2],
  flat_2: [-4.5, 0, 2],
  flat_3: [-1, 0, 2],
  flat_4: [2.5, 0, 2],
  flat_5: [6, 0, 2],
  flat_6: [9.5, 0, 2],
  silo_1: [14, 0, 4],
  silo_2: [14, 0, 1],
  silo_3: [14, 0, -2],
  silo_4: [14, 0, -5],
};

export const FACILITY_POSITIONS: Record<string, [number, number, number]> = {
  drying_workshop: [-10, 0, -5],
  inspection_center: [-2, 0, -6],
  dispatch_center: [5, 0, -6],
};
