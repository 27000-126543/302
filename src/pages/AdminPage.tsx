import { useState, useMemo } from 'react';
import { Shield, Users, FileText, LogIn, ScanFace } from 'lucide-react';
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
  const { users, logs, login, isLoggedIn, currentUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  const [faceScanStep, setFaceScanStep] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

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

  const handleFaceLogin = () => {
    setShowFaceDialog(true);
    setFaceScanStep(0);
    setTimeout(() => setFaceScanStep(1), 1000);
    setTimeout(() => setFaceScanStep(2), 2500);
  };

  const confirmFaceLogin = () => {
    if (users.length > 0) login(users[0].id);
    setShowFaceDialog(false);
    setFaceScanStep(0);
  };

  const userColumns = [
    { key: 'name', title: '姓名' },
    { key: 'role', title: '角色', render: (v: string) => ROLE_LABELS[v] ?? v },
    { key: 'department', title: '部门' },
  ];

  const logColumns = [
    { key: 'userName', title: '用户' },
    { key: 'action', title: '操作' },
    { key: 'target', title: '对象' },
    { key: 'timestamp', title: '时间', render: (v: string) => new Date(v).toLocaleString() },
    { key: 'detail', title: '详情' },
  ];

  return (
    <div className="h-screen bg-gray-950 text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">系统管理</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<Users size={20} />} title="用户总数" value={stats.totalUsers} />
        <StatsCard icon={<Shield size={20} />} title="在线用户" value={stats.online} color="green" />
        <StatsCard icon={<FileText size={20} />} title="今日日志" value={stats.todayLogs} />
        <StatsCard icon={<LogIn size={20} />} title="今日登录" value={stats.loginCount} />
      </div>

      <div className="flex rounded-lg bg-gray-900 p-1 mb-6 w-64">
        <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-400'}`} onClick={() => setTab('users')}>用户管理</button>
        <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-400'}`} onClick={() => setTab('logs')}>操作日志</button>
      </div>

      {tab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors" onClick={handleFaceLogin}>
              <ScanFace size={16} /> 人脸识别登录
            </button>
            {isLoggedIn && currentUser && (
              <span className="text-sm text-green-400">当前用户: {currentUser.name} ({ROLE_LABELS[currentUser.role]})</span>
            )}
          </div>

          <DataTable columns={userColumns} data={users} />

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2"><Shield size={16} /> 角色权限说明</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(roleDescriptions).map(([role, desc]) => (
                <div key={role} className="bg-gray-800/60 rounded-lg p-3">
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
            <select className="bg-gray-800 rounded-lg px-3 py-2 text-sm" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">全部操作</option>
              <option value="登录">登录</option>
              <option value="审批">审批</option>
              <option value="创建工单">创建工单</option>
              <option value="修改">修改</option>
            </select>
            <span className="text-xs text-gray-500">共 {filteredLogs.length} 条记录</span>
          </div>
          <DataTable columns={logColumns} data={filteredLogs} />
        </div>
      )}

      {showFaceDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowFaceDialog(false)}>
          <div className="bg-gray-900 rounded-xl p-8 w-[360px] text-center border border-purple-700" onClick={e => e.stopPropagation()}>
            <ScanFace size={64} className="mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-semibold mb-2">人脸识别验证</h3>
            {faceScanStep === 0 && <p className="text-sm text-gray-400">正在启动摄像头...</p>}
            {faceScanStep === 1 && (
              <div className="space-y-2">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-purple-500 animate-pulse flex items-center justify-center bg-gray-800">
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
