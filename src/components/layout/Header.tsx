import { useAuthStore } from '@/stores/useAuthStore'
import { ROLE_LABELS } from '@/utils/constants'
import { Link, useLocation } from 'react-router-dom'
import {
  Warehouse, ArrowRightLeft, TestTube2, Bug,
  Wrench, Shield, FileSpreadsheet, LogOut, User,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: '全景总览', icon: Warehouse },
  { path: '/dispatch', label: '出入库调度', icon: ArrowRightLeft },
  { path: '/inspection', label: '检化验管理', icon: TestTube2 },
  { path: '/fumigation', label: '虫害熏蒸', icon: Bug },
  { path: '/equipment', label: '设备运维', icon: Wrench },
  { path: '/admin', label: '权限日志', icon: Shield },
  { path: '/report', label: '日报导出', icon: FileSpreadsheet },
]

export default function Header() {
  const location = useLocation()
  const { currentUser, isLoggedIn, logout, addLog } = useAuthStore()

  return (
    <header className="fixed top-0 left-0 w-full h-14 bg-[#0a1628]/95 border-b border-cyan-500/20 backdrop-blur-md z-50 flex items-center px-5">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          智慧粮库
        </span>
        <span className="text-xs text-slate-400 hidden md:inline">综合运营与应急调度平台</span>
      </div>

      <nav className="flex-1 flex items-center justify-center gap-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-t transition-colors relative
                ${isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Icon size={14} />
              <span>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        {isLoggedIn && currentUser ? (
          <>
            <User size={14} className="text-cyan-400" />
            <span className="text-xs text-slate-200">{currentUser.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300">
              {ROLE_LABELS[currentUser.role]}
            </span>
            <button
              onClick={() => {
                if (currentUser) {
                  addLog({
                    id: `log_${Date.now()}`,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    action: '退出',
                    target: '系统',
                    timestamp: new Date().toISOString(),
                    detail: `${currentUser.name}通过顶部导航退出系统`,
                    sourcePage: '顶部导航栏',
                  })
                }
                logout()
              }}
              className="ml-1 p-1 rounded hover:bg-slate-700 transition-colors"
              title="退出登录"
            >
              <LogOut size={14} className="text-slate-400 hover:text-red-400" />
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-500">未登录</span>
        )}
      </div>
    </header>
  )
}
