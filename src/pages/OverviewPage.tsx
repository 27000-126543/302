import { useState, useMemo } from 'react'
import { Warehouse, ThermometerSun, AlertTriangle, Package, Shield, Bug, Settings, Filter } from 'lucide-react'
import GrainDepotScene from '@/components/scene3d/GrainDepotScene'
import AlertNotification from '@/components/ui/AlertNotification'
import TrendChart from '@/components/ui/TrendChart'
import StatsCard from '@/components/ui/StatsCard'
import SidePanel from '@/components/layout/SidePanel'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useEquipmentStore } from '@/stores/useEquipmentStore'
import useAlertStore from '@/stores/useAlertStore'

type AnomalyFilter = 'all' | 'temperature' | 'pest' | 'equipment' | 'fumigation'

interface AnomalyItem {
  id: string
  type: AnomalyFilter
  label: string
  detail: string
  granaryId?: string
  severity: 'warning' | 'critical'
}

export default function OverviewPage() {
  const [selectedGranaryId, setSelectedGranaryId] = useState<string | null>(null)
  const [showTrendChart, setShowTrendChart] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [anomalyFilter, setAnomalyFilter] = useState<AnomalyFilter>('all')

  const granaries = useGranaryStore(s => s.granaries)
  const grainRecords = useGranaryStore(s => s.grainRecords)
  const setSelectedId = useGranaryStore(s => s.setSelectedGranaryId)
  const equipment = useEquipmentStore(s => s.equipment)
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

  const anomalies = useMemo<AnomalyItem[]>(() => {
    const items: AnomalyItem[] = []
    granaries.forEach(g => {
      if (g.avgTemp > 30) {
        items.push({ id: `temp_${g.id}`, type: 'temperature', label: `${g.name} 粮温超标`, detail: `粮温${g.avgTemp}°C，超过阈值30°C`, granaryId: g.id, severity: 'critical' })
      }
      if (g.pestDensity > 5) {
        items.push({ id: `pest_${g.id}`, type: 'pest', label: `${g.name} 虫害超标`, detail: `虫害密度${g.pestDensity}头/kg，超过阈值5`, granaryId: g.id, severity: 'warning' })
      }
      if (g.fumigating) {
        items.push({ id: `fum_${g.id}`, type: 'fumigation', label: `${g.name} 熏蒸禁区`, detail: '熏蒸作业进行中，人员禁止入内', granaryId: g.id, severity: 'critical' })
      }
    })
    equipment.forEach(eq => {
      if (eq.runningHours >= eq.maintenanceThreshold) {
        const granary = granaries.find(g => g.id === eq.granaryId)
        items.push({ id: `eq_${eq.id}`, type: 'equipment', label: `${eq.name} 超保养阈值`, detail: `已运行${eq.runningHours}h，阈值${eq.maintenanceThreshold}h（${granary?.name ?? ''}）`, severity: 'warning' })
      }
    })
    return items
  }, [granaries, equipment])

  const filteredAnomalies = useMemo(() =>
    anomalyFilter === 'all' ? anomalies : anomalies.filter(a => a.type === anomalyFilter),
    [anomalies, anomalyFilter]
  )

  const handleGranaryClick = (id: string) => {
    setSelectedGranaryId(id)
    setSelectedId(id)
    setShowTrendChart(false)
  }

  const handleAnomalyClick = (item: AnomalyItem) => {
    if (item.granaryId) {
      setSelectedGranaryId(item.granaryId)
      setSelectedId(item.granaryId)
    }
  }

  const filterButtons: { key: AnomalyFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: '全部', icon: <Filter size={12} /> },
    { key: 'temperature', label: '粮温', icon: <ThermometerSun size={12} /> },
    { key: 'pest', label: '虫害', icon: <Bug size={12} /> },
    { key: 'equipment', label: '设备', icon: <Settings size={12} /> },
    { key: 'fumigation', label: '熏蒸', icon: <Shield size={12} /> },
  ]

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
        isOpen={!!selectedGranaryId && !emergencyMode}
        onClose={() => { setSelectedGranaryId(null); setSelectedId(null); setShowTrendChart(false) }}
      />

      {selectedGranary && !emergencyMode && (
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
          <button
            className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-500 text-white text-sm rounded-lg backdrop-blur transition-colors"
            onClick={() => setShowTrendChart(v => !v)}
          >
            {showTrendChart ? '关闭趋势' : '查看趋势'}
          </button>
        </div>
      )}

      {showTrendChart && selectedGranary && !emergencyMode && (
        <TrendChart
          records={selectedRecords}
          granaryName={selectedGranary.name}
          visible={showTrendChart}
          onClose={() => setShowTrendChart(false)}
        />
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          className={`px-5 py-2.5 rounded-lg text-sm font-medium backdrop-blur transition-all flex items-center gap-2 ${
            emergencyMode
              ? 'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-[#0a1628]/80 hover:bg-[#0d1f3c] text-gray-300 border border-cyan-500/20'
          }`}
          onClick={() => setEmergencyMode(v => !v)}
        >
          <AlertTriangle size={16} />
          {emergencyMode ? '退出应急态势' : '应急态势'}
          {anomalies.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${emergencyMode ? 'bg-white/20' : 'bg-red-600'}`}>
              {anomalies.length}
            </span>
          )}
        </button>
      </div>

      {emergencyMode && (
        <div className="absolute top-14 right-0 w-[360px] h-[calc(100vh-56px)] bg-[#0a1628]/95 border-l border-red-500/30 backdrop-blur-md z-40 animate-slide-in-right overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} /> 应急态势总览
              </h2>
              <span className="text-xs text-gray-500">{anomalies.length} 项异常</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                    anomalyFilter === btn.key
                      ? 'bg-red-600 text-white'
                      : 'bg-[#0d1f3c] text-gray-400 hover:text-gray-200 border border-gray-700'
                  }`}
                  onClick={() => setAnomalyFilter(btn.key)}
                >
                  {btn.icon}{btn.label}
                  {btn.key !== 'all' && (
                    <span className="ml-1 opacity-60">{anomalies.filter(a => a.type === btn.key).length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredAnomalies.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">当前无异常</div>
              ) : (
                filteredAnomalies.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] border ${
                      item.severity === 'critical'
                        ? 'bg-red-900/20 border-red-700/40 hover:border-red-500/60'
                        : 'bg-orange-900/20 border-orange-700/40 hover:border-orange-500/60'
                    }`}
                    onClick={() => handleAnomalyClick(item)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${item.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        item.type === 'temperature' ? 'bg-red-600/30 text-red-400' :
                        item.type === 'pest' ? 'bg-orange-600/30 text-orange-400' :
                        item.type === 'equipment' ? 'bg-yellow-600/30 text-yellow-400' :
                        'bg-purple-600/30 text-purple-400'
                      }`}>
                        {item.type === 'temperature' ? '粮温' : item.type === 'pest' ? '虫害' : item.type === 'equipment' ? '设备' : '熏蒸'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 ml-4">{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <style>{`
            @keyframes slide-in-right {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
          `}</style>
        </div>
      )}
    </div>
  )
}
