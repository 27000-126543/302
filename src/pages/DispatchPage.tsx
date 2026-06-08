import { useState, useMemo } from 'react'
import { PackagePlus, PackageMinus, Route, Clock } from 'lucide-react'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useOrderStore } from '@/stores/useOrderStore'
import { findBestGranaryForInbound, findBestGranaryForOutbound } from '@/utils/dispatchAlgorithm'
import StatsCard from '@/components/ui/StatsCard'
import DataTable from '@/components/ui/DataTable'

type Tab = 'inbound' | 'outbound'

export default function DispatchPage() {
  const [tab, setTab] = useState<Tab>('inbound')
  const granaries = useGranaryStore(s => s.granaries)
  const orders = useOrderStore(s => s.orders)

  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [qualityLevel, setQualityLevel] = useState('一等')
  const [result, setResult] = useState<{ granaryId?: string; message: string } | null>(null)

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
    const inCount = todaysOrders.filter(o => o.type === 'in').length
    const outCount = todaysOrders.filter(o => o.type === 'out').length
    const pending = orders.filter(o => o.status === 'pending').length
    return { inCount, outCount, pending, avgWait: 12 }
  }, [orders])

  const handleInboundMatch = () => {
    const match = findBestGranaryForInbound(granaries, product, qualityLevel)
    if (!match) {
      setResult({ message: '无合适仓房，已生成扩容申请' })
    } else {
      setResult({ granaryId: match.id, message: `匹配仓房: ${match.name}，绿色输送线已启动` })
    }
  }

  const handleOutboundMatch = () => {
    const match = findBestGranaryForOutbound(granaries, product, +quantity)
    if (!match) {
      setResult({ message: '无匹配仓房' })
    } else {
      setResult({ granaryId: match.id, message: `匹配仓房: ${match.name}，蓝色输送路线已规划` })
    }
  }

  const columns = [
    { key: 'id', title: '单号' },
    { key: 'type', title: '类型', render: (v: string) => v === 'in' ? '入库' : '出库' },
    { key: 'product', title: '品种' },
    { key: 'quantity', title: '数量(吨)' },
    { key: 'qualityLevel', title: '等级' },
    { key: 'status', title: '状态', render: (v: string) => {
      const map: Record<string, string> = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
      return map[v] ?? v
    }},
    { key: 'createdAt', title: '日期', render: (v: string) => new Date(v).toLocaleDateString() },
  ]

  return (
    <div className="flex h-full bg-[#050d1a] text-white">
      <div className="w-[60%] flex flex-col p-4">
        <div className="flex-1 rounded-xl bg-[#0a1628] border border-cyan-500/10 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Route className="mx-auto mb-2 text-cyan-500/40" size={48} />
            <p className="text-sm">{tab === 'inbound' ? '入库路径可视化' : '出库路径可视化'}</p>
            {result && (
              <p className={`mt-2 text-sm ${result.granaryId ? (tab === 'inbound' ? 'text-green-400' : 'text-blue-400') : 'text-red-400'}`}>
                {result.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="w-[40%] flex flex-col p-4 gap-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <StatsCard icon={<PackagePlus size={20} />} title="今日入库" value={stats.inCount} />
          <StatsCard icon={<PackageMinus size={20} />} title="今日出库" value={stats.outCount} />
          <StatsCard icon={<Clock size={20} />} title="待处理" value={stats.pending} color="orange" />
          <StatsCard icon={<Route size={20} />} title="平均等待(分)" value={stats.avgWait} />
        </div>

        <div className="flex rounded-lg bg-[#0d1f3c] p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'inbound' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
            onClick={() => { setTab('inbound'); setResult(null) }}
          >入库调度</button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'outbound' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
            onClick={() => { setTab('outbound'); setResult(null) }}
          >出库调度</button>
        </div>

        <div className="bg-[#0d1f3c] rounded-xl p-4 space-y-3 border border-cyan-500/10">
          <select className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" value={product} onChange={e => setProduct(e.target.value)}>
            <option value="">选择品种</option>
            <option value="优质稻">优质稻</option>
            <option value="普通稻">普通稻</option>
            <option value="优质小麦">优质小麦</option>
            <option value="普通小麦">普通小麦</option>
            <option value="玉米">玉米</option>
            <option value="大豆">大豆</option>
          </select>
          <input className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" placeholder="数量 (吨)" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
          {tab === 'inbound' && (
            <select className="w-full bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" value={qualityLevel} onChange={e => setQualityLevel(e.target.value)}>
              <option value="一等">一等</option>
              <option value="二等">二等</option>
              <option value="三等">三等</option>
              <option value="等外">等外</option>
            </select>
          )}
          <button
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'inbound' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={tab === 'inbound' ? handleInboundMatch : handleOutboundMatch}
          >
            {tab === 'inbound' ? '智能分配' : '匹配仓房'}
          </button>
          {result && (
            <div className={`text-sm p-3 rounded-lg ${result.granaryId ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'}`}>
              <p className="font-medium">{result.message}</p>
            </div>
          )}
        </div>

        <DataTable columns={columns} data={orders} />
      </div>
    </div>
  )
}
