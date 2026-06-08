import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };
const trendColors = { up: 'text-green-400', down: 'text-red-400', stable: 'text-gray-500' };

const StatsCard: React.FC<StatsCardProps> = ({ title, value, unit, icon, trend, color = 'cyan' }) => {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div className={`bg-[#0d1f3c]/80 border rounded-lg p-4 flex items-center gap-3`} style={{ borderColor: `${color === 'cyan' ? '#22d3ee' : color}33` }}>
      {icon && <div className="text-cyan-400 shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{title}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xl font-bold text-white">{value}</span>
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
          {TrendIcon && <TrendIcon className={`w-4 h-4 ${trendColors[trend!]}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
