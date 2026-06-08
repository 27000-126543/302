import * as XLSX from 'xlsx'
import type { Granary, Order, Equipment } from '@/types'

interface DailyReportData {
  date: string
  granaries: Granary[]
  orders: Order[]
  equipment: Equipment[]
}

export function exportDailyReport(data: DailyReportData) {
  const wb = XLSX.utils.book_new()

  const stockData = data.granaries.map(g => ({
    '仓号': g.name,
    '类型': g.type === 'flat' ? '平房仓' : '立筒仓',
    '储存品种': g.product,
    '库存量(吨)': g.stock,
    '最大容量(吨)': g.capacity,
    '库存率(%)': Math.round((g.stock / g.capacity) * 100),
    '平均粮温(℃)': g.avgTemp,
    '水分(%)': g.avgMoisture,
    '虫害密度(头/kg)': g.pestDensity,
    '通风状态': g.ventilating ? '通风中' : '停止',
    '熏蒸状态': g.fumigating ? '熏蒸中' : '正常',
  }))
  const ws1 = XLSX.utils.json_to_sheet(stockData)
  XLSX.utils.book_append_sheet(wb, ws1, '库存统计')

  const orderData = data.orders.map(o => ({
    '订单号': o.id,
    '类型': o.type === 'in' ? '入库' : '出库',
    '品种': o.product,
    '数量(吨)': o.quantity,
    '质量等级': o.qualityLevel,
    '来源/去向': o.source,
    '状态': o.status === 'completed' ? '已完成' : o.status === 'in_progress' ? '进行中' : o.status === 'pending' ? '待处理' : '已取消',
    '日期': new Date(o.createdAt).toLocaleDateString('zh-CN'),
  }))
  const ws2 = XLSX.utils.json_to_sheet(orderData)
  XLSX.utils.book_append_sheet(wb, ws2, '出入库记录')

  const equipData = data.equipment.map(e => ({
    '设备名称': e.name,
    '类型': e.type === 'conveyor' ? '输送机' : e.type === 'dryer' ? '烘干机' : '通风机',
    '运行状态': e.status === 'running' ? '运行中' : e.status === 'idle' ? '空闲' : e.status === 'maintenance' ? '维护中' : '故障',
    '累计运行(小时)': e.runningHours,
    '保养阈值(小时)': e.maintenanceThreshold,
    '需检修': e.runningHours >= e.maintenanceThreshold ? '是' : '否',
  }))
  const ws3 = XLSX.utils.json_to_sheet(equipData)
  XLSX.utils.book_append_sheet(wb, ws3, '设备故障统计')

  XLSX.writeFile(wb, `粮库日报_${data.date}.xlsx`)
}
