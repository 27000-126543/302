import { useState, useMemo } from 'react'
import { Bug, ShieldAlert, Clock, CheckCircle } from 'lucide-react'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useWorkOrderStore } from '@/stores/useWorkOrderStore'
import { useAuthStore } from '@/stores/useAuthStore'
import DataTable from '@/components/ui/DataTable'
import ApprovalFlow from '@/components/ui/ApprovalFlow'
import StatsCard from '@/components/ui/StatsCard'

const APPROVAL_STEPS = ['安全员', '仓储部长', '粮库主任']
const STATUS_STEP_MAP: Record<string, number> = {
  pending: 0,
  pending_director: 1,
  pending_depot_director: 2,
  approved: 3,
  rejected: -1,
}

function getStepFromStatus(status: string): number {
  return STATUS_STEP_MAP[status] ?? 0
}

function getNextStatusOnApprove(currentStatus: string): string {
  if (currentStatus === 'pending') return 'pending_director'
  if (currentStatus === 'pending_director') return 'pending_depot_director'
  if (currentStatus === 'pending_depot_director') return 'approved'
  return currentStatus
}

export default function FumigationPage() {
  const granaries = useGranaryStore(s => s.granaries)
  const updateGranary = useGranaryStore(s => s.updateGranary)
  const workOrders = useWorkOrderStore(s => s.workOrders)
  const updateWorkOrderStatus = useWorkOrderStore(s => s.updateWorkOrderStatus)
  const addWorkOrder = useWorkOrderStore(s => s.addWorkOrder)
  const { addLog, currentUser } = useAuthStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actingAs, setActingAs] = useState<string>('安全员')

  const fumigationOrders = useMemo(() => workOrders.filter(w => w.type === 'fumigation'), [workOrders])
  const pestGranaries = useMemo(() => granaries.filter(g => g.pestDensity > 5), [granaries])

  const stats = useMemo(() => ({
    pestAlert: pestGranaries.length,
    active: fumigationOrders.filter(o => o.approvalStatus === 'approved' || o.approvalStatus === 'in_progress').length,
    pending: fumigationOrders.filter(o => ['pending', 'pending_director', 'pending_depot_director'].includes(o.approvalStatus)).length,
    completed: fumigationOrders.filter(o => o.approvalStatus === 'completed').length,
  }), [pestGranaries, fumigationOrders])

  const selected = fumigationOrders.find(o => o.id === selectedId)
  const currentStep = selected ? getStepFromStatus(selected.approvalStatus) : 0

  const handleApprove = () => {
    if (!selected) return
    const prevStatus = selected.approvalStatus
    const nextStatus = getNextStatusOnApprove(selected.approvalStatus)
    updateWorkOrderStatus(selected.id, nextStatus as any)
    if (nextStatus === 'approved') {
      updateGranary(selected.granaryId, { fumigating: true })
    }
    addLog({
      id: `log_${Date.now()}`,
      userId: currentUser?.id ?? 'system',
      userName: currentUser?.name ?? '系统',
      action: '熏蒸审批',
      target: selected.title,
      timestamp: new Date().toISOString(),
      detail: `${actingAs}审批通过熏蒸工单${selected.id}，状态从${prevStatus}变更为${nextStatus}`,
      sourcePage: '虫害熏蒸',
      objectName: selected.title,
      beforeState: prevStatus,
      afterState: nextStatus,
      relatedWorkOrderId: selected.id,
    })
  }

  const handleReject = () => {
    if (!selected) return
    const prevStatus = selected.approvalStatus
    updateWorkOrderStatus(selected.id, 'rejected')
    addLog({
      id: `log_${Date.now()}`,
      userId: currentUser?.id ?? 'system',
      userName: currentUser?.name ?? '系统',
      action: '熏蒸审批',
      target: selected.title,
      timestamp: new Date().toISOString(),
      detail: `${actingAs}驳回熏蒸工单${selected.id}`,
      sourcePage: '虫害熏蒸',
      objectName: selected.title,
      beforeState: prevStatus,
      afterState: 'rejected',
      relatedWorkOrderId: selected.id,
    })
  }

  const handleAutoGeneratePlan = (granaryId: string) => {
    const granary = granaries.find(g => g.id === granaryId)
    if (!granary) return
    const existing = fumigationOrders.find(w => w.granaryId === granaryId && ['pending', 'pending_director', 'pending_depot_director'].includes(w.approvalStatus))
    if (existing) return
    const woId = `FUM-${Date.now()}`
    addWorkOrder({
      id: woId,
      type: 'fumigation',
      granaryId,
      title: `${granary.name}熏蒸方案`,
      description: `${granary.name}虫害密度${granary.pestDensity}头/kg，超过阈值5头/kg，建议实施磷化铝熏蒸。用药量: 3g/m³，密闭时间: 7天`,
      assignee: '待分配',
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    })
    addLog({
      id: `log_${Date.now()}`,
      userId: currentUser?.id ?? 'system',
      userName: currentUser?.name ?? '系统',
      action: '创建工单',
      target: `${granary.name}熏蒸方案`,
      timestamp: new Date().toISOString(),
      detail: `自动生成${granary.name}熏蒸方案(${woId})，虫害密度${granary.pestDensity}头/kg`,
      sourcePage: '虫害熏蒸',
      objectName: granary.name,
      afterState: 'pending',
      relatedWorkOrderId: woId,
    })
  }

  const columns = [
    { key: 'id', title: '工单号' },
    { key: 'granaryId', title: '仓房', render: (v: string) => granaries.find(g => g.id === v)?.name ?? v },
    { key: 'title', title: '标题' },
    { key: 'assignee', title: '负责人' },
    { key: 'approvalStatus', title: '审批状态', render: (v: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        pending: { label: '待安全员审批', cls: 'bg-yellow-600' },
        pending_director: { label: '待仓储部长审批', cls: 'bg-yellow-500' },
        pending_depot_director: { label: '待粮库主任审批', cls: 'bg-orange-600' },
        approved: { label: '已通过', cls: 'bg-green-600' },
        rejected: { label: '已驳回', cls: 'bg-red-600' },
        in_progress: { label: '进行中', cls: 'bg-blue-600' },
        completed: { label: '已完成', cls: 'bg-cyan-600' },
      }
      const info = map[v] ?? { label: v, cls: 'bg-gray-600' }
      return <span className={`px-2 py-0.5 ${info.cls} rounded text-xs`}>{info.label}</span>
    }},
    { key: 'createdAt', title: '创建日期', render: (v: string) => new Date(v).toLocaleDateString() },
  ]

  return (
    <div className="h-full bg-[#050d1a] text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">虫害熏蒸管理</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<Bug size={20} />} title="虫害预警" value={stats.pestAlert} color="red" />
        <StatsCard icon={<ShieldAlert size={20} />} title="进行中熏蒸" value={stats.active} />
        <StatsCard icon={<Clock size={20} />} title="待审批" value={stats.pending} color="orange" />
        <StatsCard icon={<CheckCircle size={20} />} title="已完成" value={stats.completed} />
      </div>

      {pestGranaries.length > 0 && (
        <div className="mb-6 p-4 bg-orange-900/30 border border-orange-700/50 rounded-xl">
          <h3 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
            <Bug size={16} /> 虫害预警仓房
          </h3>
          <div className="flex gap-3 flex-wrap">
            {pestGranaries.map(g => (
              <span key={g.id} className="px-3 py-1.5 bg-orange-800/60 border border-orange-600/50 rounded-lg text-sm flex items-center gap-2">
                {g.name} — 虫害密度 {g.pestDensity} 头/kg
                <button
                  className="px-2 py-0.5 bg-orange-600 hover:bg-orange-700 rounded text-xs transition-colors"
                  onClick={() => handleAutoGeneratePlan(g.id)}
                >
                  生成熏蒸方案
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <DataTable columns={columns} data={fumigationOrders} onRowClick={(row: any) => setSelectedId(row.id)} />

      {selected && (
        <div className="mt-4 bg-[#0d1f3c] rounded-xl p-5 border border-cyan-500/10">
          <h3 className="text-lg font-semibold mb-1">{selected.title}</h3>
          <p className="text-sm text-gray-400 mb-4">{selected.description}</p>

          <div className="mb-3">
            <label className="text-xs text-gray-500 mr-2">当前审批身份:</label>
            <select
              className="bg-[#0a1628] rounded px-2 py-1 text-xs border border-cyan-500/10"
              value={actingAs}
              onChange={e => setActingAs(e.target.value)}
            >
              <option value="安全员">安全员</option>
              <option value="仓储部长">仓储部长</option>
              <option value="粮库主任">粮库主任</option>
            </select>
          </div>

          <h4 className="text-sm font-medium text-gray-300 mb-2">审批流程（安全员→仓储部长→粮库主任）</h4>
          <ApprovalFlow
            steps={APPROVAL_STEPS}
            currentStep={currentStep}
            onApprove={handleApprove}
            onReject={handleReject}
            currentUserRole={actingAs}
          />

          {selected.approvalStatus === 'approved' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-purple-400">
              <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              审批已全部通过，3D场景中已显示紫色熏蒸禁区
            </div>
          )}
          {selected.approvalStatus === 'rejected' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              熏蒸方案已被驳回
            </div>
          )}
        </div>
      )}
    </div>
  )
}
