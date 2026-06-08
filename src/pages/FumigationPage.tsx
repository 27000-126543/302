import { useState, useMemo } from 'react'
import { Bug, ShieldAlert, Clock, CheckCircle } from 'lucide-react'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useWorkOrderStore } from '@/stores/useWorkOrderStore'
import DataTable from '@/components/ui/DataTable'
import ApprovalFlow from '@/components/ui/ApprovalFlow'
import StatsCard from '@/components/ui/StatsCard'

export default function FumigationPage() {
  const granaries = useGranaryStore(s => s.granaries)
  const workOrders = useWorkOrderStore(s => s.workOrders)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fumigationOrders = useMemo(() => workOrders.filter(w => w.type === 'fumigation'), [workOrders])
  const pestGranaries = useMemo(() => granaries.filter(g => g.pestDensity > 5), [granaries])

  const stats = useMemo(() => ({
    pestAlert: pestGranaries.length,
    active: fumigationOrders.filter(o => o.approvalStatus === 'approved' || o.approvalStatus === 'in_progress').length,
    pending: fumigationOrders.filter(o => o.approvalStatus === 'pending').length,
    completed: fumigationOrders.filter(o => o.approvalStatus === 'completed').length,
  }), [pestGranaries, fumigationOrders])

  const selected = fumigationOrders.find(o => o.id === selectedId)

  const columns = [
    { key: 'id', title: '工单号' },
    { key: 'granaryId', title: '仓房', render: (v: string) => granaries.find(g => g.id === v)?.name ?? v },
    { key: 'title', title: '标题' },
    { key: 'assignee', title: '负责人' },
    { key: 'approvalStatus', title: '审批状态', render: (v: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        pending: { label: '待审批', cls: 'bg-yellow-600' },
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
              <span key={g.id} className="px-3 py-1.5 bg-orange-800/60 border border-orange-600/50 rounded-lg text-sm">
                {g.name} — 虫害密度 {g.pestDensity} 头/kg
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

          <h4 className="text-sm font-medium text-gray-300 mb-2">审批流程（安全员→仓储部长→粮库主任）</h4>
          <ApprovalFlow
            steps={['安全员', '仓储部长', '粮库主任']}
            currentStep={selected.approvalStatus === 'pending' ? 0 : selected.approvalStatus === 'approved' || selected.approvalStatus === 'in_progress' ? 2 : 1}
            onApprove={() => {}}
            onReject={() => {}}
            currentUserRole="仓储部长"
          />

          {(selected.approvalStatus === 'approved' || selected.approvalStatus === 'in_progress') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-purple-400">
              <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              审批通过后，3D场景中将显示紫色熏蒸禁区
            </div>
          )}
        </div>
      )}
    </div>
  )
}
