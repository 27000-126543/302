import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import useAlertStore from '@/stores/useAlertStore';

const typeLabels = { temperature: '温度预警', pest: '虫害预警', equipment: '设备预警' } as const;
const levelColors = { critical: 'bg-red-500', warning: 'bg-orange-500', info: 'bg-blue-500' } as const;

const AlertNotification: React.FC = () => {
  const { alerts, dismissAlert } = useAlertStore();

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto bg-[#0a1628]/90 border border-cyan-500/20 rounded-lg shadow-2xl animate-slide-in-right">
      <div className="p-3 border-b border-cyan-500/20 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 font-medium text-sm">预警通知</span>
        <span className="ml-auto text-xs text-gray-500">{alerts.length} 条</span>
      </div>
      <div className="p-2 space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-stretch rounded bg-[#0d1f3c]/60 border border-cyan-500/10 overflow-hidden animate-slide-in-right`}
          >
            <div className={`w-1 shrink-0 ${levelColors[alert.level]}`} />
            <div className="flex-1 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[alert.level]} text-white`}>
                  {typeLabels[alert.type]}
                </span>
                <span className="text-[11px] text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-300">{alert.message}</p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="px-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-4">暂无预警</p>
        )}
      </div>
    </div>
  );
};

export default AlertNotification;
