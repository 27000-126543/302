import { useGranaryStore } from '@/stores/useGranaryStore'
import { X, Thermometer, Droplets, Bug, Wind, ShieldAlert } from 'lucide-react'
import { PRODUCT_LEVEL_MAP } from '@/utils/constants'

const LEVEL_LABEL: Record<string, string> = {
  quasi_low_temp: '准低温仓',
  low_temp: '低温仓',
  normal: '常温仓',
}

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { granaries, selectedGranaryId } = useGranaryStore()
  const granary = granaries.find((g) => g.id === selectedGranaryId)

  if (!isOpen) return null

  const stockPct = granary ? Math.round((granary.stock / granary.capacity) * 100) : 0

  return (
    <aside className="fixed top-14 right-0 w-[380px] h-[calc(100vh-56px)] bg-[#0a1628]/95 border-l border-cyan-500/20 backdrop-blur-md z-40 animate-slide-in overflow-y-auto">
      {!granary ? (
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          请选择仓房查看详情
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">{granary.name}</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-700 transition-colors">
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <InfoCard
              icon={<Thermometer size={14} />}
              label="均温"
              value={`${granary.avgTemp}°C`}
              color={granary.avgTemp > 30 ? 'text-red-400' : 'text-cyan-300'}
            />
            <InfoCard
              icon={<Droplets size={14} />}
              label="均湿"
              value={`${granary.avgMoisture}%`}
              color="text-blue-300"
            />
            <InfoCard
              icon={<Bug size={14} />}
              label="虫害"
              value={`${granary.pestDensity}`}
              color={granary.pestDensity > 5 ? 'text-orange-400' : 'text-cyan-300'}
            />
          </div>

          <div className="flex gap-2">
            <StatusBadge active={granary.ventilating} icon={<Wind size={14} />} label="通风中" activeClass="text-green-400 border-green-500/40 bg-green-900/20" />
            <StatusBadge active={granary.fumigating} icon={<ShieldAlert size={14} />} label="熏蒸中" activeClass="text-purple-400 border-purple-500/40 bg-purple-900/20" />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>库存</span>
              <span>{granary.stock} / {granary.capacity} 吨 ({stockPct}%)</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                style={{ width: `${stockPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded border
              ${granary.level === 'quasi_low_temp' ? 'text-cyan-300 border-cyan-500/30 bg-cyan-900/20' :
                granary.level === 'low_temp' ? 'text-blue-300 border-blue-500/30 bg-blue-900/20' :
                'text-slate-400 border-slate-600/30 bg-slate-800/20'}`}
            >
              {LEVEL_LABEL[granary.level]}
            </span>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p>储粮品种：<span className="text-slate-200">{granary.product}</span></p>
            <p>适宜品种：{PRODUCT_LEVEL_MAP[granary.level]?.join('、') ?? '-'}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </aside>
  )
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
      <div className="flex items-center gap-1 text-slate-500 mb-1">{icon}<span className="text-[10px]">{label}</span></div>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ active, icon, label, activeClass }: { active: boolean; icon: React.ReactNode; label: string; activeClass: string }) {
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors
      ${active ? activeClass : 'text-slate-600 border-slate-700/50 bg-slate-800/30'}`}
    >
      {icon}{label}
    </span>
  )
}
