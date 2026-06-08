import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { X } from 'lucide-react';
import type { GrainRecord } from '@/types';

interface TrendChartProps {
  records: GrainRecord[];
  granaryName: string;
  visible: boolean;
  onClose: () => void;
}

const TrendChart: React.FC<TrendChartProps> = ({ records, granaryName, visible, onClose }) => {
  const option = useMemo(() => {
    const times = records.map((r) =>
      new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    );
    return {
      title: { text: `${granaryName} 粮情趋势`, textStyle: { color: '#67e8f9', fontSize: 14 } },
      tooltip: { trigger: 'axis', backgroundColor: '#0d1f3c', borderColor: '#22d3ee44', textStyle: { color: '#e2e8f0' } },
      legend: { data: ['温度', '湿度', '虫害密度'], textStyle: { color: '#94a3b8' }, top: 30 },
      grid: { left: 40, right: 20, top: 60, bottom: 30 },
      xAxis: { type: 'category', data: times, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e3a5f44' } } },
      series: [
        { name: '温度', type: 'line', data: records.map((r) => r.temperature), smooth: true, lineStyle: { color: '#ef4444' }, itemStyle: { color: '#ef4444' } },
        { name: '湿度', type: 'line', data: records.map((r) => r.moisture), smooth: true, lineStyle: { color: '#3b82f6' }, itemStyle: { color: '#3b82f6' } },
        { name: '虫害密度', type: 'line', data: records.map((r) => r.pestDensity), smooth: true, lineStyle: { color: '#f97316' }, itemStyle: { color: '#f97316' } },
      ],
    };
  }, [records, granaryName]);

  if (!visible) return null;

  return (
    <div className="absolute right-0 top-0 z-40 w-[500px] h-[380px] bg-[#0a1628]/95 border border-cyan-500/30 rounded-lg shadow-2xl p-4 animate-slide-in-right">
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
      <ReactECharts option={option} style={{ height: '340px', width: '100%' }} />
    </div>
  );
};

export default TrendChart;
