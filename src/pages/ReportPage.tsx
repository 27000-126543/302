import { useState, useMemo } from 'react';
import { FileSpreadsheet, Download, Calendar, BarChart3 } from 'lucide-react';
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useOrderStore } from '@/stores/useOrderStore'
import { useEquipmentStore } from '@/stores/useEquipmentStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { checkPermission } from '@/utils/constants'
import DataTable from '@/components/ui/DataTable'
import StatsCard from '@/components/ui/StatsCard'
import { exportDailyReport } from '@/utils/excelExport';

export default function ReportPage() {
  const { granaries } = useGranaryStore();
  const { orders } = useOrderStore();
  const { equipment } = useEquipmentStore();
  const currentUser = useAuthStore(s => s.currentUser)
  const addLog = useAuthStore(s => s.addLog)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportSuccess, setExportSuccess] = useState(false);

  const today = new Date().toDateString();

  const stockData = useMemo(() =>
    granaries.map(g => ({
      id: g.id, name: g.name, product: g.product, stock: g.stock,
      capacity: g.capacity, utilization: Math.round((g.stock / g.capacity) * 100), avgTemp: g.avgTemp,
    })),
    [granaries]
  );

  const inboundToday = useMemo(() => {
    const todayOrders = orders.filter(o => o.type === 'in' && new Date(o.createdAt).toDateString() === today);
    return todayOrders.reduce((s, o) => s + o.quantity, 0);
  }, [orders, today]);

  const outboundToday = useMemo(() => {
    const todayOrders = orders.filter(o => o.type === 'out' && new Date(o.createdAt).toDateString() === today);
    return todayOrders.reduce((s, o) => s + o.quantity, 0);
  }, [orders, today]);

  const faultEquipment = useMemo(
    () => equipment.filter(e => e.runningHours >= e.maintenanceThreshold),
    [equipment]
  );

  const stockColumns = [
    { key: 'name', title: '仓号' },
    { key: 'product', title: '品种' },
    { key: 'stock', title: '库存(吨)' },
    { key: 'capacity', title: '容量(吨)' },
    { key: 'utilization', title: '库存率(%)', render: (v: number) => <span className={v > 90 ? 'text-red-400' : v > 70 ? 'text-orange-400' : 'text-green-400'}>{v}%</span> },
    { key: 'avgTemp', title: '均温(℃)', render: (v: number) => <span className={v > 25 ? 'text-red-400' : ''}>{v}</span> },
  ];

  const faultColumns = [
    { key: 'name', title: '设备名称' },
    { key: 'type', title: '类型', render: (v: string) => ({ conveyor: '输送机', dryer: '烘干机', fan: '通风机' })[v] ?? v },
    { key: 'runningHours', title: '运行时长(h)' },
    { key: 'maintenanceThreshold', title: '保养阈值(h)' },
    { key: 'status', title: '状态', render: (v: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        running: { label: '运行中', cls: 'bg-green-600' },
        idle: { label: '空闲', cls: 'bg-gray-600' },
        maintenance: { label: '维护中', cls: 'bg-orange-600' },
        fault: { label: '故障', cls: 'bg-red-600' },
      };
      const info = map[v] ?? { label: v, cls: 'bg-gray-600' };
      return <span className={`px-2 py-0.5 ${info.cls} rounded text-xs`}>{info.label}</span>;
    }},
  ];

  const handleExport = () => {
    exportDailyReport({ date, granaries, orders, equipment });
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="h-screen bg-gray-950 text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">日报导出</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
            <Calendar size={16} className="text-cyan-400" />
            <input type="date" className="bg-transparent text-sm outline-none" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors" onClick={() => {}}>
            <BarChart3 size={16} /> 预览日报
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              !currentUser || checkPermission(currentUser.role, 'export_report')
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            onClick={() => {
              if (currentUser && !checkPermission(currentUser.role, 'export_report')) {
                addLog({
                  id: `log_${Date.now()}`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  action: '越权访问',
                  target: '导出日报',
                  timestamp: new Date().toISOString(),
                  detail: `${currentUser.name}尝试导出日报，权限不足`,
                  sourcePage: '日报导出',
                  objectName: '导出Excel',
                  beforeState: '无权限',
                  afterState: '已拦截',
                  targetId: currentUser.id,
                  targetType: 'user',
                })
                return
              }
              handleExport()
            }}
          >
            <Download size={16} /> {!currentUser || checkPermission(currentUser.role, 'export_report') ? '导出Excel' : '导出Excel (需授权)'}
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded-lg text-green-400 text-sm">
          ✓ 日报已成功导出：粮库日报_{date}.xlsx
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<BarChart3 size={20} />} title="仓房总数" value={granaries.length} />
        <StatsCard icon={<FileSpreadsheet size={20} />} title="今日入库(吨)" value={inboundToday} />
        <StatsCard icon={<FileSpreadsheet size={20} />} title="今日出库(吨)" value={outboundToday} color="orange" />
        <StatsCard icon={<FileSpreadsheet size={20} />} title="需检修设备" value={faultEquipment.length} color="red" />
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-cyan-400" /> 库存概览</h2>
          <DataTable columns={stockColumns} data={stockData} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><FileSpreadsheet size={18} className="text-cyan-400" /> 出入库汇总</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">今日入库</p>
                <p className="text-2xl font-bold text-green-400">{inboundToday}</p>
                <p className="text-xs text-gray-500">吨</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">今日出库</p>
                <p className="text-2xl font-bold text-blue-400">{outboundToday}</p>
                <p className="text-xs text-gray-500">吨</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><FileSpreadsheet size={18} className="text-orange-400" /> 设备检修汇总</h2>
            {faultEquipment.length > 0 ? (
              <DataTable columns={faultColumns} data={faultEquipment} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">所有设备运行正常</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
