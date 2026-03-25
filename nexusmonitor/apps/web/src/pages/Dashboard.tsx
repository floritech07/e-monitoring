import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MOCK_CPU = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}m`,
  value: Math.floor(30 + Math.random() * 50),
}));

const MOCK_MEMORY = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}m`,
  used: Math.floor(40 + Math.random() * 40),
  cached: Math.floor(10 + Math.random() * 15),
}));

const MetricCard: React.FC<{ title: string; value: string; unit: string; color: string; trend?: 'up' | 'down' | 'stable' }> = 
  ({ title, value, unit, color, trend }) => (
  <div style={{
    background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12,
    padding: '20px', flex: 1, minWidth: 180
  }}>
    <div style={{ color: '#64748B', fontSize: 12, marginBottom: 6 }}>{title}</div>
    <div style={{ color, fontSize: 28, fontWeight: 700 }}>{value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{unit}</span></div>
    {trend && <div style={{ fontSize: 11, marginTop: 4, color: trend === 'up' ? '#F87171' : trend === 'down' ? '#34D399' : '#64748B' }}>
      {trend === 'up' ? '↑ Rising' : trend === 'down' ? '↓ Falling' : '→ Stable'}
    </div>}
  </div>
);

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');

  return (
    <div style={{ padding: '24px', background: '#0A0A12', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: '#F8FAFC' }}>Operations Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['15m', '1h', '6h', '24h', '7d'].map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: timeRange === r ? '#6366F1' : '#1E1E2E', color: '#E2E8F0', fontSize: 12, fontWeight: 600
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <MetricCard title="Active Alerts" value="7" unit="" color="#F87171" trend="up" />
        <MetricCard title="Avg CPU" value="54" unit="%" color="#FCD34D" trend="stable" />
        <MetricCard title="Avg Memory" value="72" unit="%" color="#60A5FA" trend="up" />
        <MetricCard title="Network In" value="3.2" unit="Gbps" color="#34D399" trend="down" />
        <MetricCard title="Asset Health" value="98.2" unit="%" color="#34D399" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* CPU Chart */}
        <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, color: '#F1F5F9' }}>CPU Usage — Last 30 minutes</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_CPU}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
              <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1E1E2E', border: '1px solid #374151', color: '#E2E8F0' }} />
              <Area type="monotone" dataKey="value" stroke="#6366F1" fill="url(#cpuGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Chart */}
        <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, color: '#F1F5F9' }}>Memory Usage — Last 30 minutes</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_MEMORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
              <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1E1E2E', border: '1px solid #374151', color: '#E2E8F0' }} />
              <Area type="monotone" dataKey="used" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="cached" stroke="#34D399" fill="#34D399" fillOpacity={0.1} strokeWidth={1} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
