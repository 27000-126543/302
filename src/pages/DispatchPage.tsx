import { useState, useMemo, useCallback } from 'react'
import { PackagePlus, PackageMinus, Route, Clock, Truck, AlertTriangle } from 'lucide-react'
import type { WorkOrder, Order } from '@/types'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useOrderStore } from '@/stores/useOrderStore'
import { useWorkOrderStore } from '@/stores/useWorkOrderStore'
import { findBestGranaryForInbound, findBestGranaryForOutbound } from '@/utils/dispatchAlgorithm'
import StatsCard from '@/components/ui/StatsCard'
import DataTable from '@/components/ui/DataTable'

type Tab = 'inbound' | 'outbound'

interface PathInfo {
  from: { x: number; y: number }
  to: { x: number; y: number }
  granaryName: string
}

export default function DispatchPage() {
  const [tab, setTab] = useState<Tab>('inbound')
  const granaries = useGranaryStore(s => s.granaries)
  const updateGranary = useGranaryStore(s => s.updateGranary)
  const orders = useOrderStore(s => s.orders)
  const addOrder = useOrderStore(s => s.addOrder)
  const workOrders = useWorkOrderStore(s => s.workOrders)
  const addWorkOrder = useWorkOrderStore(s => s.addWorkOrder)

  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [qualityLevel, setQualityLevel] = useState('一等')
  const [loadingSpeed, setLoadingSpeed] = useState('50')
  const [result, setResult] = useState<{ granaryId?: string; message: string; expansionOrder?: WorkOrder } | null>(null)
  const [pathInfo, setPathInfo] = useState<PathInfo | null>(null)

  const expansionOrders = useMemo(() => workOrders.filter(w => w.type === 'expansion'), [workOrders])

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
    const inCount = todaysOrders.filter(o => o.type === 'in').length
    const outCount = todaysOrders.filter(o => o.type === 'out').length
    const pending = orders.filter(o => o.status === 'pending').length
    const waitTimes = orders.filter(o => o.status === 'in_progress' && o.type === 'out').map(o => {
      const elapsed = (Date.now() - new Date(o.createdAt).getTime()) / 60000
      return elapsed
    })
    const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0
    return { inCount, outCount, pending, avgWait }
  }, [orders])

  const handleInboundMatch = () => {
    const qty = +quantity
    if (!product || !qty || qty <= 0) return
    const match = findBestGranaryForInbound(granaries, product, qualityLevel)
    if (!match) {
      const wo: WorkOrder = {
        id: `EXP-${Date.now()}`,
        type: 'expansion',
        granaryId: '',
        title: `扩容申请 - ${product}`,
        description: `品种: ${product}, 数量: ${qty}吨, 质量等级: ${qualityLevel}`,
        assignee: '粮库主任',
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      }
      addWorkOrder(wo)
      setResult({ message: '无合适仓房，已生成扩容申请', expansionOrder: wo })
      setPathInfo(null)
      return
    }
    const remaining = match.capacity - match.stock
    if (qty > remaining) {
      const wo: WorkOrder = {
        id: `EXP-${Date.now()}`,
        type: 'expansion',
        granaryId: match.id,
        title: `扩容申请 - ${product}(${match.name})`,
        description: `仓房${match.name}剩余容量${remaining}吨，入库量${qty}吨，超出${qty - remaining}吨，需扩容`,
        assignee: '粮库主任',
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      }
      addWorkOrder(wo)
      setResult({ message: `${match.name}剩余容量仅${remaining}吨，不足${qty}吨，已生成扩容申请`, expansionOrder: wo })
      setPathInfo(null)
      return
    }
    setResult({ granaryId: match.id, message: `匹配仓房: ${match.name}（剩余${remaining}吨），绿色输送线已启动` })
    setPathInfo({
      from: { x: 50, y: 350 },
      to: { x: 350, y: 150 },
      granaryName: match.name,
    })
    const order: Order = {
      id: `IN-${Date.now()}`,
      type: 'in',
      product: product as any,
      quantity: qty,
      qualityLevel: qualityLevel as any,
      source: '入库调度',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      granaryId: match.id,
    }
    addOrder(order)
    updateGranary(match.id, { stock: match.stock + qty })
  }

  const handleOutboundMatch = () => {
    const qty = +quantity
    if (!product || !qty || qty <= 0) return
    const match = findBestGranaryForOutbound(granaries, product, qty)
    if (!match) {
      setResult({ message: '无匹配仓房，库存不足或无对应品种' })
      setPathInfo(null)
      return
    }
    const flowRate = Math.min(+loadingSpeed, qty * 0.8)
    setResult({
      granaryId: match.id,
      message: `匹配仓房: ${match.name}，蓝色输送路线已规划 | 出库流量: ${flowRate.toFixed(1)}t/h → 装车速度: ${loadingSpeed}t/h`,
    })
    setPathInfo({
      from: { x: 350, y: 150 },
      to: { x: 50, y: 350 },
      granaryName: match.name,
    })
    const order: Order = {
      id: `OUT-${Date.now()}`,
      type: 'out',
      product: product as any,
      quantity: qty,
      qualityLevel: qualityLevel as any,
      source: '出库调度',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      granaryId: match.id,
    }
    addOrder(order)
  }

  const columns = [
    { key: 'id', title: '单号' },
    { key: 'type', title: '类型', render: (v: string) => v === 'in' ? '入库' : '出库' },
    { key: 'product', title: '品种' },
    { key: 'quantity', title: '数量(吨)' },
    { key: 'qualityLevel', title: '等级' },
    { key: 'status', title: '状态', render: (v: string, row: any) => {
      const isUrgent = row.type === 'out' && row.status === 'in_progress' &&
        (Date.now() - new Date(row.createdAt).getTime()) / 60000 > 15
      if (isUrgent) return <span className="px-2 py-0.5 bg-red-600 rounded text-xs animate-pulse">催办</span>
      const map: Record<string, { label: string; cls: string }> = {
        pending: { label: '待处理', cls: 'bg-yellow-600' },
        in_progress: { label: '进行中', cls: 'bg-blue-600' },
        completed: { label: '已完成', cls: 'bg-green-600' },
        cancelled: { label: '已取消', cls: 'bg-gray-600' },
      }
      const info = map[v] ?? { label: v, cls: 'bg-gray-600' }
      return <span className={`px-2 py-0.5 ${info.cls} rounded text-xs`}>{info.label}</span>
    }},
    { key: 'createdAt', title: '日期', render: (v: string) => new Date(v).toLocaleDateString() },
  ]

  const pathColor = tab === 'inbound' ? '#00ff88' : '#00d4ff'
  const dashOffset = pathInfo ? '0' : '0'

  return (
    <div className="flex h-full bg-[#050d1a] text-white">
      <div className="w-[60%] flex flex-col p-4">
        <div className="flex-1 rounded-xl bg-[#0a1628] border border-cyan-500/10 relative overflow-hidden">
          {pathInfo ? (
            <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={pathColor} stopOpacity="0.2" />
                  <stop offset="50%" stopColor={pathColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={pathColor} stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Background grid */}
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`hg${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="#1a3050" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`vg${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="#1a3050" strokeWidth="0.5" />
              ))}

              {/* Start point */}
              <circle cx={pathInfo.from.x} cy={pathInfo.from.y} r="8" fill={pathColor} opacity="0.6" />
              <circle cx={pathInfo.from.x} cy={pathInfo.from.y} r="4" fill={pathColor} />
              <text x={pathInfo.from.x} y={pathInfo.from.y - 14} textAnchor="middle" fill={pathColor} fontSize="11">
                {tab === 'inbound' ? '入库口' : pathInfo.granaryName}
              </text>

              {/* End point */}
              <circle cx={pathInfo.to.x} cy={pathInfo.to.y} r="8" fill={pathColor} opacity="0.6" />
              <circle cx={pathInfo.to.x} cy={pathInfo.to.y} r="4" fill={pathColor} />
              <text x={pathInfo.to.x} y={pathInfo.to.y - 14} textAnchor="middle" fill={pathColor} fontSize="11">
                {tab === 'inbound' ? pathInfo.granaryName : '出库口'}
              </text>

              {/* Path line - glowing tube */}
              <line
                x1={pathInfo.from.x} y1={pathInfo.from.y}
                x2={pathInfo.to.x} y2={pathInfo.to.y}
                stroke={pathColor} strokeWidth="4" opacity="0.3" filter="url(#glow)"
              />
              <line
                x1={pathInfo.from.x} y1={pathInfo.from.y}
                x2={pathInfo.to.x} y2={pathInfo.to.y}
                stroke={pathColor} strokeWidth="2" opacity="0.8"
                strokeDasharray="8 4"
              >
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
              </line>

              {/* Flowing dots */}
              {[0, 0.2, 0.4, 0.6, 0.8].map((frac, i) => {
                const cx = pathInfo.from.x + (pathInfo.to.x - pathInfo.from.x) * frac
                const cy = pathInfo.from.y + (pathInfo.to.y - pathInfo.from.y) * frac
                return (
                  <circle key={i} r="3" fill={pathColor}>
                    <animate attributeName="cx" from={pathInfo.from.x} to={pathInfo.to.x} dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
                    <animate attributeName="cy" from={pathInfo.from.y} to={pathInfo.to.y} dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
                  </circle>
                )
              })}

              {/* Midpoint label */}
              <text x={(pathInfo.from.x + pathInfo.to.x) / 2} y={(pathInfo.from.y + pathInfo.to.y) / 2 - 10}
                textAnchor="middle" fill="white" fontSize="10" opacity="0.7">
                {tab === 'inbound' ? '入库输送中' : '出库输送中'}
              </text>
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Route className="mx-auto mb-2 text-cyan-500/40" size={48} />
                <p className="text-sm">{tab === 'inbound' ? '入库路径可视化' : '出库路径可视化'}</p>
                <p className="text-xs text-gray-600 mt-1">请填写信息后点击分配按钮</p>
              </div>
            </div>
          )}
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
            onClick={() => { setTab('inbound'); setResult(null); setPathInfo(null) }}
          >入库调度</button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'outbound' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
            onClick={() => { setTab('outbound'); setResult(null); setPathInfo(null) }}
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
          {tab === 'outbound' && (
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-gray-400" />
              <input className="flex-1 bg-[#0a1628] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" placeholder="装车速度 (t/h)" type="number" value={loadingSpeed} onChange={e => setLoadingSpeed(e.target.value)} />
              <span className="text-xs text-gray-500">t/h</span>
            </div>
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
              {result.expansionOrder && (
                <div className="mt-2 pt-2 border-t border-red-700/40 space-y-1">
                  <p className="text-xs text-red-300 font-semibold">扩容申请已生成：</p>
                  <p className="text-xs">申请单号: <span className="text-yellow-400">{result.expansionOrder.id}</span></p>
                  <p className="text-xs">品种: <span className="text-white">{product}</span></p>
                  <p className="text-xs">数量: <span className="text-white">{quantity}吨</span></p>
                  <p className="text-xs">状态: <span className="px-1.5 py-0.5 bg-yellow-600 rounded text-[10px]">待审批</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        {tab === 'outbound' && result?.granaryId && (
          <div className="bg-[#0d1f3c] rounded-xl p-4 border border-blue-700/30">
            <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <Truck size={14} /> 出库流量匹配
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0a1628] rounded p-2">
                <p className="text-gray-500">出库流量</p>
                <p className="text-blue-400 font-semibold text-lg">{(+loadingSpeed * 0.8).toFixed(1)} t/h</p>
              </div>
              <div className="bg-[#0a1628] rounded p-2">
                <p className="text-gray-500">装车速度</p>
                <p className="text-green-400 font-semibold text-lg">{loadingSpeed} t/h</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {+loadingSpeed * 0.8 <= +loadingSpeed ? '✓ 流量匹配装车速度' : '⚠ 流量超出装车速度，建议调节'}
            </p>
          </div>
        )}

        <DataTable columns={columns} data={orders} />

        {expansionOrders.length > 0 && (
          <div className="bg-[#0d1f3c] rounded-xl p-4 border border-red-700/30">
            <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> 扩容申请记录
            </h4>
            <div className="space-y-2">
              {expansionOrders.map(wo => (
                <div key={wo.id} className="bg-[#0a1628] rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-yellow-400 font-mono">{wo.id}</span>
                    <span className={`px-1.5 py-0.5 rounded ${wo.approvalStatus === 'pending' ? 'bg-yellow-600' : wo.approvalStatus === 'approved' ? 'bg-green-600' : 'bg-red-600'} text-[10px]`}>
                      {wo.approvalStatus === 'pending' ? '待审批' : wo.approvalStatus === 'approved' ? '已通过' : '已驳回'}
                    </span>
                  </div>
                  <p className="text-gray-300">{wo.title}</p>
                  <p className="text-gray-500 mt-1">{wo.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
