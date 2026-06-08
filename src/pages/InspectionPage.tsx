import { useState, useMemo } from 'react'
import { TestTube2, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { useInspectionStore } from '@/stores/useInspectionStore'
import { useWorkOrderStore } from '@/stores/useWorkOrderStore'
import { useGranaryStore } from '@/stores/useGranaryStore'
import DataTable from '@/components/ui/DataTable'
import ApprovalFlow from '@/components/ui/ApprovalFlow'
import StatsCard from '@/components/ui/StatsCard'

export default function InspectionPage() {
  const inspections = useInspectionStore(s => s.inspections)
  const addInspection = useInspectionStore(s => s.addInspection)
  const workOrders = useWorkOrderStore(s => s.workOrders)
  const granaries = useGranaryStore(s => s.granaries)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ granaryId: '', moisture: '', impurity: '', pestDensity: '', remark: '' })

  const stats = useMemo(() => ({
    total: inspections.length,
    exceeded: inspections.filter(i => i.exceeded).length,
    pendingApproval: workOrders.filter(w => w.approvalStatus === 'pending').length,
    completed: workOrders.filter(w => w.approvalStatus === 'approved').length,
  }), [inspections, workOrders])

  const selected = inspections.find(i => i.id === selectedId)

  const handleSubmit = () => {
    const exceeded = +form.moisture > 14.5 || +form.impurity > 1.0
    addInspection({
      id: `insp_${Date.now()}`,
      granaryId: form.granaryId,
      inspector: '当前用户',
      timestamp: new Date().toISOString(),
      moisture: +form.moisture,
      impurity: +form.impurity,
      pestDensity: +form.pestDensity,
      exceeded,
      remark: form.remark,
    })
    setShowForm(false)
    setForm({ granaryId: '', moisture: '', impurity: '', pestDensity: '', remark: '' })
  }

  const columns = [
    { key: 'id', title: '批次号' },
    { key: 'granaryId', title: '仓房', render: (v: string) => granaries.find(g => g.id === v)?.name ?? v },
    { key: 'inspector', title: '检验员' },
    { key: 'moisture', title: '水分(%)', render: (v: number) => <span className={v > 14.5 ? 'text-red-400 font-semibold' : ''}>{v}</span> },
    { key: 'impurity', title: '杂质(%)', render: (v: number) => <span className={v > 1.0 ? 'text-red-400 font-semibold' : ''}>{v}</span> },
    { key: 'exceeded', title: '超标', render: (v: boolean) => v ? <span className="px-2 py-0.5 bg-red-600 rounded text-xs">超标</span> : <span className="text-green-400 text-xs">合格</span> },
    { key: 'timestamp', title: '时间', render: (v: string) => new Date(v).toLocaleString() },
  ]

  return (
    <div className="h-full bg-[#050d1a] text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">检化验管理</h1>
        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium" onClick={() => setShowForm(true)}>
          新增检化验
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<TestTube2 size={20} />} title="总检验数" value={stats.total} />
        <StatsCard icon={<AlertCircle size={20} />} title="超标数" value={stats.exceeded} color="red" />
        <StatsCard icon={<FileText size={20} />} title="待审批" value={stats.pendingApproval} color="orange" />
        <StatsCard icon={<CheckCircle size={20} />} title="已完成" value={stats.completed} />
      </div>

      <DataTable columns={columns} data={inspections} onRowClick={(row: any) => setSelectedId(row.id)} />

      {selected?.exceeded && (
        <div className="mt-4 bg-[#0d1f3c] rounded-xl p-5 border border-red-800/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-red-600 rounded text-sm font-bold">超标</span>
            <span className="text-lg font-semibold">{granaries.find(g => g.id === selected.granaryId)?.name}</span>
          </div>
          <ApprovalFlow
            steps={['质检员', '仓储部长', '分管领导']}
            currentStep={1}
            onApprove={() => {}}
            onReject={() => {}}
            currentUserRole="仓储部长"
          />
          <div className="mt-3 text-sm text-gray-400">
            <p>自动生成工单: {+selected.moisture > 14.5 ? '烘干作业' : '清理作业'}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0d1f3c] rounded-xl p-6 w-[420px] space-y-3 border border-cyan-500/20" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-2">新增检化验记录</h2>
            <select className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" value={form.granaryId} onChange={e => setForm(f => ({ ...f, granaryId: e.target.value }))}>
              <option value="">选择仓房</option>
              {granaries.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" placeholder="水分 (%)" type="number" value={form.moisture} onChange={e => setForm(f => ({ ...f, moisture: e.target.value }))} />
            <input className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" placeholder="杂质 (%)" type="number" value={form.impurity} onChange={e => setForm(f => ({ ...f, impurity: e.target.value }))} />
            <input className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" placeholder="虫害密度 (头/kg)" type="number" value={form.pestDensity} onChange={e => setForm(f => ({ ...f, pestDensity: e.target.value }))} />
            <input className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" placeholder="备注" value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium" onClick={handleSubmit}>提交</button>
          </div>
        </div>
      )}
    </div>
  )
}
