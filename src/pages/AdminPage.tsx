import { useState, useMemo } from 'react';
import { Shield, Users, FileText, LogIn, ScanFace, LogOut, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import DataTable from '@/components/ui/DataTable'
import StatsCard from '@/components/ui/StatsCard'
import { ROLE_LABELS } from '@/utils/constants';

type Tab = 'users' | 'logs';

const roleDescriptions: Record<string, string> = {
  operator: '操作设备、提交工单、查看基础数据',
  warehouse_director: '审批工单、管理仓房、查看报表',
  depot_director: '全局管理、审批关键决策、查看全部数据',
  superior: '监督审查、查看汇总报表、远程巡查',
};

export default function AdminPage() {
  const { users, logs, login, logout, isLoggedIn, currentUser, addLog } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  const [faceScanStep, setFaceScanStep] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
    const loginCount = todayLogs.filter(l => l.action === '登录').length;
    return { totalUsers: users.length, online: isLoggedIn ? 1 : 0, todayLogs: todayLogs.length, loginCount };
  }, [users, logs, isLoggedIn]);

  const filteredLogs = useMemo(
    () => actionFilter ? logs.filter(l => l.action === actionFilter) : logs,
    [logs, actionFilter]
  );

  const selectedLog = useMemo(() => logs.find(l => l.id === selectedLogId), [logs, selectedLogId]);

  const handleFaceLogin = () => {
    setShowFaceDialog(true);
    setFaceScanStep(0);
    setTimeout(() => setFaceScanStep(1), 1000);
    setTimeout(() => setFaceScanStep(2), 2500);
  };

  const confirmFaceLogin = () => {
    if (users.length > 0) {
      const user = users[0];
      login(user.id);
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
        afterState: '已登录',
      });
    }
    setShowFaceDialog(false);
    setFaceScanStep(0);
  };

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
      });
    }
    logout();
  };

  const userColumns = [
    { key: 'name', title: '姓名' },
    { key: 'role', title: '角色', render: (v: string) => ROLE_LABELS[v] ?? v },
    { key: 'department', title: '部门' },
  ];

  const logColumns = [
    { key: 'userName', title: '用户' },
    { key: 'action', title: '操作', render: (v: string) => {
      const colorMap: Record<string, string> = { '登录': 'text-green-400', '退出': 'text-yellow-400', '审批': 'text-purple-400', '设备检修': 'text-orange-400', '熏蒸审批': 'text-pink-400', '创建工单': 'text-cyan-400' };
      return <span className={colorMap[v] ?? 'text-cyan-400'}>{v}</span>;
    }},
    { key: 'target', title: '对象' },
    { key: 'sourcePage', title: '来源', render: (v: string) => v ? <span className="text-xs text-gray-500">{v}</span> : <span className="text-xs text-gray-600">-</span> },
    { key: 'timestamp', title: '时间', render: (v: string) => <span className="text-xs">{new Date(v).toLocaleString()}</span> },
  ];

  return (
    <div className="h-full bg-[#050d1a] text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">系统管理</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<Users size={20} />} title="用户总数" value={stats.totalUsers} />
        <StatsCard icon={<Shield size={20} />} title="在线用户" value={stats.online} color="green" />
        <StatsCard icon={<FileText size={20} />} title="今日日志" value={stats.todayLogs} />
        <StatsCard icon={<LogIn size={20} />} title="今日登录" value={stats.loginCount} />
      </div>

      <div className="flex rounded-lg bg-[#0d1f3c] p-1 mb-6 w-64">
        <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`} onClick={() => setTab('users')}>用户管理</button>
        <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'logs' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`} onClick={() => setTab('logs')}>操作日志</button>
      </div>

      {tab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors" onClick={handleFaceLogin}>
              <ScanFace size={16} /> 人脸识别登录
            </button>
            {isLoggedIn && currentUser && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-400">当前用户: {currentUser.name} ({ROLE_LABELS[currentUser.role]})</span>
                <button className="px-3 py-1.5 bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-600/50 flex items-center gap-1 transition-colors" onClick={handleLogout}>
                  <LogOut size={14} /> 退出登录
                </button>
              </div>
            )}
          </div>
          <DataTable columns={userColumns} data={users} />
          <div className="bg-[#0d1f3c] rounded-xl p-5 border border-cyan-500/20">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2"><Shield size={16} /> 角色权限说明</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(roleDescriptions).map(([role, desc]) => (
                <div key={role} className="bg-[#0a1628] rounded-lg p-3">
                  <span className="text-sm font-medium text-white">{ROLE_LABELS[role]}</span>
                  <p className="text-xs text-gray-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
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
              <option value="修改">修改</option>
            </select>
            <span className="text-xs text-gray-500">共 {filteredLogs.length} 条记录</span>
          </div>
          <DataTable columns={logColumns} data={filteredLogs} onRowClick={(row: any) => setSelectedLogId(row.id)} />
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedLogId(null)}>
          <div className="bg-[#0d1f3c] rounded-xl p-6 w-[520px] border border-cyan-500/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-cyan-400" /> 日志详情</h3>
              <button onClick={() => setSelectedLogId(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <DetailRow label="操作用户" value={selectedLog.userName} />
              <DetailRow label="操作类型" value={selectedLog.action} />
              <DetailRow label="操作对象" value={selectedLog.objectName ?? selectedLog.target} />
              <DetailRow label="来源页面" value={selectedLog.sourcePage ?? '-'} />
              <DetailRow label="操作前状态" value={selectedLog.beforeState ?? '-'} />
              <DetailRow label="操作后状态" value={selectedLog.afterState ?? '-'} />
              <DetailRow label="关联工单" value={selectedLog.relatedWorkOrderId ?? '-'} />
              <DetailRow label="操作时间" value={new Date(selectedLog.timestamp).toLocaleString()} />
              <DetailRow label="详细描述" value={selectedLog.detail} />
            </div>
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
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1 border-b border-gray-800/50">
      <span className="text-gray-500 w-24 shrink-0 text-right">{label}</span>
      <span className="text-gray-200 flex-1">{value}</span>
    </div>
  )
}
