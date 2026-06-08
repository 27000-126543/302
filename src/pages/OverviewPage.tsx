import { useState, useMemo } from 'react'
import { Warehouse, ThermometerSun, AlertTriangle, Package } from 'lucide-react'
import GrainDepotScene from '@/components/scene3d/GrainDepotScene'
import AlertNotification from '@/components/ui/AlertNotification'
import TrendChart from '@/components/ui/TrendChart'
import StatsCard from '@/components/ui/StatsCard'
import SidePanel from '@/components/layout/SidePanel'
import { useGranaryStore } from '@/stores/useGranaryStore'
import useAlertStore from '@/stores/useAlertStore'

export default function OverviewPage() {
  const [selectedGranaryId, setSelectedGranaryId] = useState<string | null>(null)
  const [showTrendChart, setShowTrendChart] = useState(false)

  const granaries = useGranaryStore(s => s.granaries)
  const grainRecords = useGranaryStore(s => s.grainRecords)
  const setSelectedId = useGranaryStore(s => s.setSelectedGranaryId)
  const alerts = useAlertStore(s => s.alerts)

  const stats = useMemo(() => ({
    totalStock: granaries.reduce((s, g) => s + g.stock, 0),
    avgTemp: granaries.length
      ? +(granaries.reduce((s, g) => s + g.avgTemp, 0) / granaries.length).toFixed(1)
      : 0,
    alertCount: alerts.filter(a => !a.resolved).length,
    granaryCount: granaries.length,
  }), [granaries, alerts])

  const selectedGranary = granaries.find(g => g.id === selectedGranaryId)
  const selectedRecords = grainRecords.filter(r => r.granaryId === selectedGranaryId)

  const handleGranaryClick = (id: string) => {
    setSelectedGranaryId(id)
    setSelectedId(id)
    setShowTrendChart(false)
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <GrainDepotScene onGranaryClick={handleGranaryClick} />

      <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
        <StatsCard icon={<Package size={20} />} title="总库存 (吨)" value={stats.totalStock.toLocaleString()} />
        <StatsCard icon={<ThermometerSun size={20} />} title="平均温度 (℃)" value={stats.avgTemp} />
        <StatsCard icon={<AlertTriangle size={20} />} title="告警数" value={stats.alertCount} color="orange" />
        <StatsCard icon={<Warehouse size={20} />} title="仓房数" value={stats.granaryCount} />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <AlertNotification />
      </div>

      <SidePanel
        isOpen={!!selectedGranaryId}
        onClose={() => { setSelectedGranaryId(null); setSelectedId(null); setShowTrendChart(false) }}
      />

      {selectedGranary && (
        <div className="absolute bottom-4 left-4 z-10">
          <button
            className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-500 text-white text-sm rounded-lg backdrop-blur transition-colors"
            onClick={() => setShowTrendChart(v => !v)}
          >
            {showTrendChart ? '关闭趋势' : '查看趋势'}
          </button>
        </div>
      )}

      {showTrendChart && selectedGranary && (
        <TrendChart
          records={selectedRecords}
          granaryName={selectedGranary.name}
          visible={showTrendChart}
          onClose={() => setShowTrendChart(false)}
        />
      )}
    </div>
  )
}
