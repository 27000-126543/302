import { useState, useMemo } from 'react'
import {
  Shield, Users, FileText, LogIn, ScanFace, LogOut, Eye,
  GitBranch, Lock, AlertTriangle, Download, ChevronRight,
  CheckCircle, XCircle, Clock, Settings,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkOrderStore } from '@/stores/useWorkOrderStore'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useEquipmentStore } from '@/stores/useEquipmentStore'
import DataTable from '@/components/ui/DataTable'
import StatsCard from '@/components/ui/StatsCard'
import { ROLE_LABELS, ROLE_PERMISSIONS, PAGE_LABELS, ACTION_LABELS } from '@/utils/constants'
import { exportAuditLog } from '@/utils/excelExport'

type Tab = 'users' | 'logs' | 'trace' | 'permissions'
type TraceType = 'user' | 'granary' | 'workorder' | 'equipment'
type RiskTimeRange = 'today' | 'week' | 'month'

const ROLE_ACTION_MAP: Record<string, string[]> = {
  operator: ['dispatch_inbound', 'dispatch_outbound', 'generate_maintenance_order', 'view_granary'],
  warehouse_director: ['dispatch_inbound', 'dispatch_outbound', 'generate_maintenance_order', 'view_granary', 'approve_fumigation', 'approve_inspection', 'export_report'],
  depot_director: ['*'],
  superior: ['view_granary', 'export_report'],
}

const ALL_PAGES = ['/', '/dispatch', '/inspection', '/fumigation', '/equipment', '/admin', '/report']
const ALL_ACTIONS = ['dispatch_inbound', 'dispatch_outbound', 'generate_maintenance_order', 'approve_fumigation', 'approve_inspection', 'export_report', 'create_workorder', 'view_granary']

export default function AdminPage() {
  const { users, logs, login, logout, isLoggedIn, currentUser, addLog, switchUser } = useAuthStore()
  const workOrders = useWorkOrderStore(s => s.workOrders)
  const granaries = useGranaryStore(s => s.granaries)
  const equipment = useEquipmentStore(s => s.equipment)

  const [tab, setTab] = useState<Tab>('users')
  const [showFaceDialog, setShowFaceDialog] = useState(false)
  const [faceScanStep, setFaceScanStep] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [traceType, setTraceType] = useState<TraceType>('user')
  const [traceTargetId, setTraceTargetId] = useState('')
  const [riskTimeRange, setRiskTimeRange] = useState<RiskTimeRange>('today')
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null)

  const getTimeRangeStart = (range: RiskTimeRange): number => {
    const d = new Date()
    if (range === 'today') {
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    if (range === 'week') {
      d.setDate(d.getDate() - 6)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    d.setDate(d.getDate() - 29)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today)
    const loginCount = todayLogs.filter(l => l.action === '登录').length
    return { totalUsers: users.length, online: isLoggedIn ? 1 : 0, todayLogs: todayLogs.length, loginCount }
  }, [users, logs, isLoggedIn])

  const riskStats = useMemo(() => {
    const rangeStart = getTimeRangeStart(riskTimeRange)
    const rangeLogs = logs.filter(l => new Date(l.timestamp).getTime() >= rangeStart)

    const abnormalExits = rangeLogs.filter(l => l.action === '异常退出')
    const rejectedApprovals = rangeLogs.filter(l => l.action.includes('审批') && l.afterState === 'rejected')
    const overdueOrders = workOrders.filter(wo =>
      new Date(wo.deadline).getTime() < Date.now() &&
      !['completed', 'approved', 'rejected'].includes(wo.approvalStatus)
    )
    const loginCounts: Record<string, number> = {}
    rangeLogs.filter(l => l.action === '登录').forEach(l => {
      loginCounts[l.userId] = (loginCounts[l.userId] || 0) + 1
    })
    const frequentLogins = Object.entries(loginCounts).filter(([, c]) => c >= 3)

    return { abnormalExits, rejectedApprovals, overdueOrders, frequentLogins, rangeLogs }
  }, [logs, workOrders, riskTimeRange])

  const filteredLogs = useMemo(() => {
    if (!actionFilter) return logs
    return logs.filter(l => l.action.includes(actionFilter))
  }, [logs, actionFilter])

  const selectedLog = useMemo(() => logs.find(l => l.id === selectedLogId), [logs, selectedLogId])

  const traceTargets = useMemo(() => {
    if (traceType === 'user') return users.map(u => ({ id: u.id, name: u.name }))
    if (traceType === 'granary') return granaries.map(g => ({ id: g.id, name: g.name }))
    if (traceType === 'workorder') return workOrders.map(w => ({ id: w.id, name: w.title }))
    return equipment.map(e => ({ id: e.id, name: e.name }))
  }, [traceType, users, granaries, workOrders, equipment])

  const traceLogs = useMemo(() => {
    if (!traceTargetId) return []
    return logs.filter(l => {
      if (traceType === 'user') return l.userId === traceTargetId || l.targetId === traceTargetId
      if (traceType === 'granary') return l.targetId === traceTargetId
      if (traceType === 'workorder') return l.relatedWorkOrderId === traceTargetId || l.targetId === traceTargetId
      return l.targetId === traceTargetId
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [logs, traceType, traceTargetId])

  const relatedGranary = useMemo(() => {
    if (!selectedLog) return null
    if (selectedLog.targetType === 'granary') return granaries.find(g => g.id === selectedLog.targetId)
    if (selectedLog.relatedWorkOrderId) {
      const wo = workOrders.find(w => w.id === selectedLog.relatedWorkOrderId)
      if (wo) return granaries.find(g => g.id === wo.granaryId)
    }
    return null
  }, [selectedLog, granaries, workOrders])

  const relatedWorkOrder = useMemo(() => {
    if (!selectedLog?.relatedWorkOrderId) return null
    return workOrders.find(w => w.id === selectedLog.relatedWorkOrderId)
  }, [selectedLog, workOrders])

  const relatedEquipment = useMemo(() => {
    if (!selectedLog) return null
    if (selectedLog.targetType === 'equipment') return equipment.find(e => e.id === selectedLog.targetId)
    return null
  }, [selectedLog, equipment])

  const handleFaceLogin = () => {
    setShowFaceDialog(true)
    setFaceScanStep(0)
    setTimeout(() => setFaceScanStep(1), 1000)
    setTimeout(() => setFaceScanStep(2), 2500)
  }

  const confirmFaceLogin = () => {
    if (users.length > 0) {
      const user = users[0]
      login(user.id)
      addLog({
        id: `log_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        action: '登录',
        target: '系统',
        timestamp: new Date().toISOString(),
        detail: `${user.name}通过人脸识别登录系统`,
        sourcePage: '系统管理',
        objectName: '系统登录',
        beforeState: '未登录',
        afterState: '已登录',
        targetType: 'system',
      })
    }
    setShowFaceDialog(false)
    setFaceScanStep(0)
  }

  const handleLogout = () => {
    if (currentUser) {
      addLog({
        id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        action: '退出',
        target: '系统',
        timestamp: new Date().toISOString(),
        detail: `${currentUser.name}退出系统`,
        sourcePage: '系统管理',
        objectName: '系统登出',
        beforeState: '已登录',
        afterState: '已退出',
        targetType: 'system',
      })
    }
    logout()
  }

  const handleSwitchUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    if (currentUser) {
      addLog({
        id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        action: '退出',
        target: '系统',
        timestamp: new Date().toISOString(),
        detail: `${currentUser.name}切换角色退出`,
        sourcePage: '系统管理',
        objectName: '系统登出',
        beforeState: '已登录',
        afterState: '已退出',
        targetType: 'system',
      })
    }
    switchUser(userId)
    addLog({
      id: `log_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: '登录',
      target: '系统',
      timestamp: new Date().toISOString(),
      detail: `${user.name}切换角色登录`,
      sourcePage: '系统管理',
      objectName: '系统登录',
      beforeState: '未登录',
      afterState: '已登录',
      targetType: 'system',
    })
  }

  const handleExportAuditLog = () => {
    exportAuditLog(filteredLogs)
  }

  const getRiskLogs = (type: string): typeof logs => {
    const rangeStart = getTimeRangeStart(riskTimeRange)
    const rangeLogs = logs.filter(l => new Date(l.timestamp).getTime() >= rangeStart)
    if (type === 'abnormalExits') return rangeLogs.filter(l => l.action === '异常退出')
    if (type === 'rejectedApprovals') return rangeLogs.filter(l => l.action.includes('审批') && l.afterState === 'rejected')
    if (type === 'frequentLogins') {
      const frequentUserIds = riskStats.frequentLogins.map(([uid]) => uid)
      return rangeLogs.filter(l => l.action === '登录' && frequentUserIds.includes(l.userId))
    }
    return []
  }

  const userColumns = [
    { key: 'name', title: '姓名' },
    { key: 'role', title: '角色', render: (v: string) => ROLE_LABELS[v] ?? v },
    { key: 'department', title: '部门' },
  ]

  const logColumns = [
    { key: 'userName', title: '用户', render: (v: string) => <span className="cursor-pointer text-cyan-400 hover:underline">{v}</span> },
    { key: 'action', title: '操作', render: (v: string) => {
      const colorMap: Record<string, string> = { '登录': 'text-green-400', '退出': 'text-yellow-400', '审批': 'text-purple-400', '设备检修': 'text-orange-400', '熏蒸审批': 'text-pink-400', '创建工单': 'text-cyan-400', '越权访问': 'text-red-400' }
      return <span className={colorMap[v] ?? (v.includes('审批') ? 'text-purple-400' : 'text-cyan-400')}>{v}</span>
    }},
    { key: 'target', title: '对象' },
    { key: 'sourcePage', title: '来源', render: (v: string) => v ? <span className="text-xs text-gray-500">{v}</span> : <span className="text-xs text-gray-600">-</span> },
    { key: 'timestamp', title: '时间', render: (v: string) => <span className="text-xs">{new Date(v).toLocaleString()}</span> },
  ]

  return (
    <div className="h-full bg-[#050d1a] text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">系统管理</h1>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatsCard icon={<Users size={20} />} title="用户总数" value={stats.totalUsers} />
        <StatsCard icon={<Shield size={20} />} title="在线用户" value={stats.online} color="green" />
        <StatsCard icon={<FileText size={20} />} title="今日日志" value={stats.todayLogs} />
        <StatsCard icon={<LogIn size={20} />} title="今日登录" value={stats.loginCount} />
      </div>

      <div className="bg-[#0d1f3c] rounded-xl p-4 border border-red-500/20 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} /> 审计风险统计
          </h3>
          <div className="flex gap-1">
            {(['today', 'week', 'month'] as RiskTimeRange[]).map(r => (
              <button key={r} className={`px-2 py-0.5 rounded text-xs ${riskTimeRange === r ? 'bg-red-600 text-white' : 'bg-[#0a1628] text-gray-400 border border-gray-700'}`} onClick={() => setRiskTimeRange(r)}>
                {r === 'today' ? '今日' : r === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <RiskCard label="异常退出" count={riskStats.abnormalExits.length} icon={<LogOut size={14} />} color="yellow" onClick={() => setExpandedRisk(expandedRisk === 'abnormalExits' ? null : 'abnormalExits')} />
          <RiskCard label="驳回审批" count={riskStats.rejectedApprovals.length} icon={<XCircle size={14} />} color="red" onClick={() => setExpandedRisk(expandedRisk === 'rejectedApprovals' ? null : 'rejectedApprovals')} />
          <RiskCard label="超期工单" count={riskStats.overdueOrders.length} icon={<Clock size={14} />} color="orange" onClick={() => setExpandedRisk(expandedRisk === 'overdueOrders' ? null : 'overdueOrders')} />
          <RiskCard label="频繁登录" count={riskStats.frequentLogins.length} icon={<LogIn size={14} />} color="purple" onClick={() => setExpandedRisk(expandedRisk === 'frequentLogins' ? null : 'frequentLogins')} />
        </div>
        {expandedRisk && (
          <div className="mt-3 bg-[#0a1628] rounded-lg p-3 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                {expandedRisk === 'abnormalExits' ? '异常退出记录' :
                 expandedRisk === 'rejectedApprovals' ? '驳回审批记录' :
                 expandedRisk === 'overdueOrders' ? '超期工单列表' : '频繁登录记录'}
              </span>
              <button onClick={() => setExpandedRisk(null)} className="text-xs text-gray-500 hover:text-white">收起</button>
            </div>
            {expandedRisk === 'overdueOrders' ? (
              <div className="space-y-1.5">
                {riskStats.overdueOrders.length === 0 ? <p className="text-xs text-gray-500 text-center py-2">无超期工单</p> : (
                  riskStats.overdueOrders.map(wo => (
                    <div key={wo.id} className="flex items-center justify-between text-xs bg-[#0d1f3c] rounded p-2">
                      <span className="text-orange-400 font-mono">{wo.id}</span>
                      <span className="text-gray-300">{wo.title}</span>
                      <span className="text-red-400">截止: {new Date(wo.deadline).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {getRiskLogs(expandedRisk).length === 0 ? <p className="text-xs text-gray-500 text-center py-2">无相关记录</p> : (
                  getRiskLogs(expandedRisk).slice(0, 20).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs bg-[#0d1f3c] rounded p-2 cursor-pointer hover:bg-[#142a4a]" onClick={() => setSelectedLogId(l.id)}>
                      <span className="text-gray-300">{l.userName}</span>
                      <span className={l.action === '退出' ? 'text-yellow-400' : l.afterState === 'rejected' ? 'text-red-400' : 'text-purple-400'}>{l.action}</span>
                      <span className="text-gray-500">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex rounded-lg bg-[#0d1f3c] p-1 mb-6" style={{ width: 'fit-content' }}>
        {(['users', 'logs', 'trace', 'permissions'] as Tab[]).map(t => (
          <button key={t} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} onClick={() => setTab(t)}>
            {t === 'users' ? '用户管理' : t === 'logs' ? '操作日志' : t === 'trace' ? '审计追溯' : '权限矩阵'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors" onClick={handleFaceLogin}>
              <ScanFace size={16} /> 人脸识别登录
            </button>
            {isLoggedIn && currentUser && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-400">当前: {currentUser.name} ({ROLE_LABELS[currentUser.role]})</span>
                <button className="px-3 py-1.5 bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-600/50 flex items-center gap-1 transition-colors" onClick={handleLogout}>
                  <LogOut size={14} /> 退出
                </button>
              </div>
            )}
          </div>
          <div className="bg-[#0d1f3c] rounded-xl p-4 border border-cyan-500/10">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3">切换登录角色</h3>
            <div className="flex gap-2 flex-wrap">
              {users.map(u => (
                <button key={u.id} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${currentUser?.id === u.id ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-[#0a1628] border-gray-700 text-gray-300 hover:border-cyan-500/40'}`} onClick={() => handleSwitchUser(u.id)}>
                  {u.name} ({ROLE_LABELS[u.role]})
                </button>
              ))}
            </div>
          </div>
          <DataTable columns={userColumns} data={users} onRowClick={(row: any) => { setTraceType('user'); setTraceTargetId(row.id); setTab('trace') }} />
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select className="bg-[#0d1f3c] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">全部操作</option>
              <option value="登录">登录</option>
              <option value="退出">退出</option>
              <option value="审批">审批</option>
              <option value="设备检修">设备检修</option>
              <option value="熏蒸审批">熏蒸审批</option>
              <option value="创建工单">创建工单</option>
              <option value="越权访问">越权访问</option>
              <option value="修改">修改</option>
            </select>
            <span className="text-xs text-gray-500">共 {filteredLogs.length} 条</span>
            <button className="ml-auto px-3 py-1.5 bg-green-600/30 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-600/50 flex items-center gap-1 transition-colors" onClick={handleExportAuditLog}>
              <Download size={12} /> 导出审计日志
            </button>
          </div>
          <DataTable columns={logColumns} data={filteredLogs} onRowClick={(row: any) => setSelectedLogId(row.id)} />
        </div>
      )}

      {tab === 'trace' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select className="bg-[#0d1f3c] rounded-lg px-3 py-2 text-sm border border-cyan-500/10" value={traceType} onChange={e => { setTraceType(e.target.value as TraceType); setTraceTargetId('') }}>
              <option value="user">按用户追溯</option>
              <option value="granary">按仓房追溯</option>
              <option value="workorder">按工单追溯</option>
              <option value="equipment">按设备追溯</option>
            </select>
            <select className="bg-[#0d1f3c] rounded-lg px-3 py-2 text-sm border border-cyan-500/10 min-w-[200px]" value={traceTargetId} onChange={e => setTraceTargetId(e.target.value)}>
              <option value="">选择追溯目标</option>
              {traceTargets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {traceTargetId && <span className="text-xs text-gray-500">{traceLogs.length} 条记录</span>}
          </div>
          {!traceTargetId ? (
            <div className="text-center py-16 text-gray-500">
              <GitBranch size={48} className="mx-auto mb-3 text-cyan-500/30" />
              <p className="text-sm">请选择追溯类型和目标</p>
            </div>
          ) : traceLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm">未找到相关操作记录</p>
            </div>
          ) : (
            <div className="bg-[#0d1f3c] rounded-xl p-5 border border-cyan-500/10">
              <div className="relative">
                {traceLogs.map((log, i) => (
                  <div key={log.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        log.action === '登录' ? 'bg-green-500' :
                        log.action === '退出' ? 'bg-yellow-500' :
                        log.action.includes('审批') ? 'bg-purple-500' :
                        log.action === '越权访问' ? 'bg-red-500' :
                        'bg-cyan-500'
                      }`} />
                      {i < traceLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-700 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer hover:bg-[#142a4a] rounded-lg p-2 -m-2 transition-colors" onClick={() => setSelectedLogId(log.id)}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className="font-medium">{log.userName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          log.action === '登录' ? 'bg-green-600/30 text-green-400' :
                          log.action === '退出' ? 'bg-yellow-600/30 text-yellow-400' :
                          log.action.includes('审批') ? 'bg-purple-600/30 text-purple-400' :
                          log.action === '越权访问' ? 'bg-red-600/30 text-red-400' :
                          'bg-cyan-600/30 text-cyan-400'
                        }`}>{log.action}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{log.detail}</p>
                      {(log.beforeState || log.afterState) && (
                        <div className="flex items-center gap-1 mt-1 text-[10px]">
                          {log.beforeState && <span className="text-gray-500">{log.beforeState}</span>}
                          {log.beforeState && log.afterState && <ChevronRight size={10} className="text-gray-600" />}
                          {log.afterState && <span className="text-cyan-400">{log.afterState}</span>}
                        </div>
                      )}
                      {log.sourcePage && <span className="text-[10px] text-gray-600 mt-0.5 inline-block">来源: {log.sourcePage}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-[#0d1f3c] rounded-xl p-5 border border-cyan-500/10">
            <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2"><Shield size={16} /> 页面访问权限</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-2 px-3 text-left text-gray-500">角色</th>
                    {ALL_PAGES.map(p => <th key={p} className="py-2 px-2 text-center text-gray-500">{PAGE_LABELS[p]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                    <tr key={role} className={`border-b border-gray-800/50 ${currentUser?.role === role ? 'bg-cyan-900/20' : ''}`}>
                      <td className="py-2 px-3 font-medium flex items-center gap-1">
                        {ROLE_LABELS[role]}
                        {currentUser?.role === role && <span className="text-[10px] text-cyan-400">(当前)</span>}
                      </td>
                      {ALL_PAGES.map(p => (
                        <td key={p} className="py-2 px-2 text-center">
                          {perms.pages.includes(p) ? <CheckCircle size={14} className="text-green-400 mx-auto" /> : <Lock size={14} className="text-red-400/50 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-[#0d1f3c] rounded-xl p-5 border border-cyan-500/10">
            <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2"><Settings size={16} /> 操作按钮权限</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-2 px-3 text-left text-gray-500">角色</th>
                    {ALL_ACTIONS.map(a => <th key={a} className="py-2 px-2 text-center text-gray-500">{ACTION_LABELS[a] ?? a}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ROLE_ACTION_MAP).map(([role, actions]) => (
                    <tr key={role} className={`border-b border-gray-800/50 ${currentUser?.role === role ? 'bg-cyan-900/20' : ''}`}>
                      <td className="py-2 px-3 font-medium">{ROLE_LABELS[role]}</td>
                      {ALL_ACTIONS.map(a => (
                        <td key={a} className="py-2 px-2 text-center">
                          {actions.includes('*') || actions.includes(a) ? <CheckCircle size={14} className="text-green-400 mx-auto" /> : <XCircle size={14} className="text-red-400/40 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedLogId(null)}>
          <div className="bg-[#0d1f3c] rounded-xl p-6 w-[560px] max-h-[80vh] overflow-y-auto border border-cyan-500/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-cyan-400" /> 日志详情</h3>
              <button onClick={() => setSelectedLogId(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <DetailRow label="操作用户" value={selectedLog.userName} link onClick={() => { setSelectedLogId(null); setTraceType('user'); setTraceTargetId(selectedLog.userId); setTab('trace') }} />
              <DetailRow label="操作类型" value={selectedLog.action} highlight />
              <DetailRow label="操作对象" value={selectedLog.objectName || selectedLog.target} link={!!selectedLog.targetId && selectedLog.targetType !== 'system'} onClick={() => {
                if (!selectedLog.targetId || selectedLog.targetType === 'system') return
                setSelectedLogId(null)
                setTraceType(selectedLog.targetType === 'workorder' ? 'workorder' : selectedLog.targetType === 'granary' ? 'granary' : selectedLog.targetType === 'equipment' ? 'equipment' : 'user')
                setTraceTargetId(selectedLog.targetId)
                setTab('trace')
              }} />
              <DetailRow label="来源页面" value={selectedLog.sourcePage} />
              <DetailRow label="操作前状态" value={selectedLog.beforeState} />
              <DetailRow label="操作后状态" value={selectedLog.afterState} />
              <DetailRow label="关联工单" value={selectedLog.relatedWorkOrderId} link onClick={() => { if (selectedLog.relatedWorkOrderId) { setSelectedLogId(null); setTraceType('workorder'); setTraceTargetId(selectedLog.relatedWorkOrderId); setTab('trace') } }} />
              <DetailRow label="操作时间" value={new Date(selectedLog.timestamp).toLocaleString()} />
              <DetailRow label="详细描述" value={selectedLog.detail} />
            </div>

            {(relatedGranary || relatedWorkOrder || relatedEquipment) && (
              <div className="mt-4 pt-3 border-t border-gray-800">
                <h4 className="text-xs text-gray-500 mb-2">关联信息 <span className="text-gray-600">（点击可跳转追溯）</span></h4>
                <div className="space-y-2">
                  {relatedGranary && (
                    <div className="bg-[#0a1628] rounded-lg p-3 cursor-pointer hover:bg-[#142a4a] transition-colors border border-transparent hover:border-cyan-500/20" onClick={() => { setSelectedLogId(null); setTraceType('granary'); setTraceTargetId(relatedGranary.id); setTab('trace') }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-cyan-400 font-medium">仓房: {relatedGranary.name}</span>
                        <ChevronRight size={12} className="text-gray-600" />
                      </div>
                      <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
                        <span>品种: {relatedGranary.product}</span>
                        <span>均温: {relatedGranary.avgTemp}°C</span>
                        <span>库存: {relatedGranary.stock}/{relatedGranary.capacity}吨</span>
                      </div>
                    </div>
                  )}
                  {relatedWorkOrder && (
                    <div className="bg-[#0a1628] rounded-lg p-3 cursor-pointer hover:bg-[#142a4a] transition-colors border border-transparent hover:border-purple-500/20" onClick={() => { setSelectedLogId(null); setTraceType('workorder'); setTraceTargetId(relatedWorkOrder.id); setTab('trace') }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-purple-400 font-medium">工单: {relatedWorkOrder.title}</span>
                        <ChevronRight size={12} className="text-gray-600" />
                      </div>
                      <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
                        <span>状态: {relatedWorkOrder.approvalStatus}</span>
                        <span>负责人: {relatedWorkOrder.assignee}</span>
                      </div>
                    </div>
                  )}
                  {relatedEquipment && (
                    <div className="bg-[#0a1628] rounded-lg p-3 cursor-pointer hover:bg-[#142a4a] transition-colors border border-transparent hover:border-orange-500/20" onClick={() => { setSelectedLogId(null); setTraceType('equipment'); setTraceTargetId(relatedEquipment.id); setTab('trace') }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-orange-400 font-medium">设备: {relatedEquipment.name}</span>
                        <ChevronRight size={12} className="text-gray-600" />
                      </div>
                      <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
                        <span>状态: {relatedEquipment.status}</span>
                        <span>运行: {relatedEquipment.runningHours}h</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showFaceDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowFaceDialog(false)}>
          <div className="bg-[#0d1f3c] rounded-xl p-8 w-[360px] text-center border border-purple-700" onClick={e => e.stopPropagation()}>
            <ScanFace size={64} className="mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-semibold mb-2">人脸识别验证</h3>
            {faceScanStep === 0 && <p className="text-sm text-gray-400">正在启动摄像头...</p>}
            {faceScanStep === 1 && (
              <div className="space-y-2">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-purple-500 animate-pulse flex items-center justify-center bg-[#0a1628]">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="text-sm text-purple-400">正在扫描人脸...</p>
              </div>
            )}
            {faceScanStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-green-400">✓ 人脸识别成功</p>
                <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors" onClick={confirmFaceLogin}>确认登录</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, highlight, link, onClick }: { label: string; value?: string; highlight?: boolean; link?: boolean; onClick?: () => void }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-1 border-b border-gray-800/50" onClick={onClick}>
      <span className="text-gray-500 w-24 shrink-0 text-right">{label}</span>
      <span className={`flex-1 ${highlight ? 'text-cyan-400 font-medium' : link ? 'text-purple-400 cursor-pointer hover:underline' : 'text-gray-200'}`}>{value}</span>
    </div>
  )
}

function RiskCard({ label, count, icon, color, onClick }: { label: string; count: number; icon: React.ReactNode; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    yellow: 'text-yellow-400 border-yellow-700/40 bg-yellow-900/20',
    red: 'text-red-400 border-red-700/40 bg-red-900/20',
    orange: 'text-orange-400 border-orange-700/40 bg-orange-900/20',
    purple: 'text-purple-400 border-purple-700/40 bg-purple-900/20',
  }
  return (
    <div className={`rounded-lg p-3 border cursor-pointer transition-colors hover:opacity-80 ${colorMap[color]}`} onClick={onClick}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-xl font-bold">{count}</p>
    </div>
  )
}
