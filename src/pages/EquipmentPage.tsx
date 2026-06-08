import { useState, useMemo } from 'react'
import { Wrench, AlertTriangle, CheckCircle, Settings } from 'lucide-react'
import { useEquipmentStore } from '@/stores/useEquipmentStore'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useWorkOrderStore } from '@/stores/useWorkOrderStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { checkPermission } from '@/utils/constants'
import DataTable from '@/components/ui/DataTable'
import StatsCard from '@/components/ui/StatsCard'

const typeLabels: Record<string, string> = { conveyor: '输送机', dryer: '烘干机', fan: '通风机' }
const statusConfig: Record<string, { label: string; cls: string }> = {
  running: { label: '运行中', cls: 'bg-green-600' },
  idle: { label: '空闲', cls: 'bg-gray-600' },
  maintenance: { label: '维护中', cls: 'bg-orange-600' },
  fault: { label: '故障', cls: 'bg-red-600' },
}

export default function EquipmentPage() {
  const equipment = useEquipmentStore(s => s.equipment)
  const updateEquipment = useEquipmentStore(s => s.updateEquipment)
  const granaries = useGranaryStore(s => s.granaries)
  const workOrders = useWorkOrderStore(s => s.workOrders)
  const addWorkOrder = useWorkOrderStore(s => s.addWorkOrder)
  const { addLog, currentUser } = useAuthStore()

  const stats = useMemo(() => ({
    total: equipment.length,
    running: equipment.filter(e => e.status === 'running').length,
    maintenanceNeeded: equipment.filter(e => e.runningHours >= e.maintenanceThreshold).length,
    fault: equipment.filter(e => e.status === 'fault').length,
  }), [equipment])

  const maintenanceOrders = useMemo(
    () => workOrders.filter(w => w.type === 'maintenance'),
    [workOrders]
  )

  const handleGenerateOrder = (eq: typeof equipment[0]) => {
    const beforeStatus = eq.status
    updateEquipment(eq.id, { status: 'maintenance' })
    const woId = `wo_${Date.now()}`
    addWorkOrder({
      id: woId,
      type: 'maintenance',
      granaryId: eq.granaryId,
      title: `${eq.name}检修工单`,
      description: `${eq.name}已运行${eq.runningHours}小时，超过保养阈值${eq.maintenanceThreshold}小时，需检修`,
      assignee: '待分配',
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    })
    addLog({
      id: `log_${Date.now()}`,
      userId: currentUser?.id ?? 'system',
      userName: currentUser?.name ?? '系统',
      action: '设备检修',
      target: eq.name,
      timestamp: new Date().toISOString(),
      detail: `生成${eq.name}检修工单(${woId})，已运行${eq.runningHours}h超阈值${eq.maintenanceThreshold}h`,
      sourcePage: '设备运维',
      objectName: eq.name,
      beforeState: beforeStatus,
      afterState: 'maintenance',
      relatedWorkOrderId: woId,
    })
  }

  const woColumns = [
    { key: 'id', title: '工单号' },
    { key: 'granaryId', title: '仓房', render: (v: string) => granaries.find(g => g.id === v)?.name ?? v },
    { key: 'title', title: '标题' },
    { key: 'assignee', title: '负责人' },
    { key: 'approvalStatus', title: '状态', render: (v: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        pending: { label: '待审批', cls: 'bg-yellow-600' },
        approved: { label: '已通过', cls: 'bg-green-600' },
        rejected: { label: '已驳回', cls: 'bg-red-600' },
        completed: { label: '已完成', cls: 'bg-cyan-600' },
      }
      const info = map[v] ?? { label: v, cls: 'bg-gray-600' }
      return <span className={`px-2 py-0.5 ${info.cls} rounded text-xs`}>{info.label}</span>
    }},
    { key: 'createdAt', title: '创建日期', render: (v: string) => new Date(v).toLocaleDateString() },
  ]

  return (
    <div className="h-full bg-[#050d1a] text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">设备检修管理</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<Settings size={20} />} title="设备总数" value={stats.total} />
        <StatsCard icon={<CheckCircle size={20} />} title="运行中" value={stats.running} color="green" />
        <StatsCard icon={<AlertTriangle size={20} />} title="需检修" value={stats.maintenanceNeeded} color="orange" />
        <StatsCard icon={<Wrench size={20} />} title="故障" value={stats.fault} color="red" />
      </div>

      <h2 className="text-lg font-semibold mb-4">设备列表</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {equipment.map(eq => {
          const granary = granaries.find(g => g.id === eq.granaryId)
          const needsMaintenance = eq.runningHours >= eq.maintenanceThreshold
          const progress = Math.min((eq.runningHours / eq.maintenanceThreshold) * 100, 100)
          const st = statusConfig[eq.status] ?? { label: eq.status, cls: 'bg-gray-600' }
          return (
            <div key={eq.id} className={`bg-[#0d1f3c] rounded-xl p-4 border ${needsMaintenance ? 'border-orange-500/50' : 'border-cyan-500/10'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-cyan-400" />
                  <span className="font-semibold">{eq.name}</span>
                  <span className="text-xs text-gray-500">{typeLabels[eq.type] ?? eq.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {needsMaintenance && <span className="px-2 py-0.5 bg-orange-600 rounded text-xs">需检修</span>}
                  <span className={`px-2 py-0.5 ${st.cls} rounded text-xs`}>{st.label}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>运行时长</span>
                  <span>{eq.runningHours}h / {eq.maintenanceThreshold}h</span>
                </div>
                <div className="h-2 bg-[#0a1628] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${needsMaintenance ? 'bg-orange-500' : 'bg-cyan-500'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">所属仓房: {granary?.name ?? '-'}</span>
                {needsMaintenance && (
                  <button
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      !currentUser || checkPermission(currentUser.role, 'generate_maintenance_order')
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (currentUser && !checkPermission(currentUser.role, 'generate_maintenance_order')) {
                        addLog({
                          id: `log_${Date.now()}`,
                          userId: currentUser.id,
                          userName: currentUser.name,
                          action: '越权访问',
                          target: '生成检修工单',
                          timestamp: new Date().toISOString(),
                          detail: `${currentUser.name}尝试生成检修工单，权限不足`,
                          sourcePage: '设备运维',
                          objectName: eq.name,
                          beforeState: '无权限',
                          afterState: '已拦截',
                          targetId: currentUser.id,
                          targetType: 'user',
                        })
                        return
                      }
                      handleGenerateOrder(eq)
                    }}
                  >
                    {!currentUser || checkPermission(currentUser.role, 'generate_maintenance_order') ? '生成检修工单' : '生成检修工单 (需授权)'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <h2 className="text-lg font-semibold mb-4">检修工单</h2>
      <DataTable columns={woColumns} data={maintenanceOrders} />
    </div>
  )
}
