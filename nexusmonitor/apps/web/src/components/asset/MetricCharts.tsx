import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface Props { assetId: string; }

const mkSeries = (base: number, len = 40) =>
  Array.from({ length: len }, (_, i) => ({ t: `${i}m`, v: base + Math.random() * 20 - 10 }));

const CHART_STYLE = { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, padding: '16px 20px', marginBottom: 16 };

const MetricCharts: React.FC<Props> = ({ assetId }) => {
  const cpuData = mkSeries(52);
  const memData = mkSeries(68);
  const netIn   = mkSeries(1.8);
  const netOut  = mkSeries(0.7);

  const common = {
    cartesian: <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />,
    xAxis: <XAxis dataKey="t" tick={{ fill: '#4B5563', fontSize: 10 }} />,
    yAxis: <YAxis tick={{ fill: '#4B5563', fontSize: 10 }} />,
    tooltip: <Tooltip contentStyle={{ background: '#1E1E2E', border: '1px solid #374151', color: '#E2E8F0', fontSize: 11 }} />,
  };

  return (
    <div>
      <div style={CHART_STYLE}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#94A3B8', fontSize: 13 }}>CPU Usage %</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={cpuData}>
            <defs>
              <linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            {common.cartesian}{common.xAxis}{common.yAxis}{common.tooltip}
            <Area type="monotone" dataKey="v" stroke="#6366F1" fill="url(#cpuG)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={CHART_STYLE}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#94A3B8', fontSize: 13 }}>Memory Usage %</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={memData}>
            <defs>
              <linearGradient id="memG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
              </linearGradient>
            </defs>
            {common.cartesian}{common.xAxis}{common.yAxis}{common.tooltip}
            <Area type="monotone" dataKey="v" stroke="#60A5FA" fill="url(#memG)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={CHART_STYLE}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#94A3B8', fontSize: 13 }}>Network I/O (Gbps)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={netIn.map((d, i) => ({ t: d.t, in: d.v, out: netOut[i].v }))}>
            {common.cartesian}{common.xAxis}{common.yAxis}{common.tooltip}
            <Line type="monotone" dataKey="in" stroke="#34D399" strokeWidth={2} dot={false} name="In" />
            <Line type="monotone" dataKey="out" stroke="#FB923C" strokeWidth={2} dot={false} name="Out" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricCharts;
