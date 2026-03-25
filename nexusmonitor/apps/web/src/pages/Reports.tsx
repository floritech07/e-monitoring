import React, { useState } from 'react';

interface ReportRow { id: string; name: string; type: string; generated_at: string; }

const REPORT_TYPES = [
  { value: 'availability', label: 'Availability SLA Report' },
  { value: 'backup_compliance', label: 'Backup Compliance Report' },
  { value: 'capacity', label: 'Capacity Planning Report' },
  { value: 'alert_summary', label: 'Alert Summary Report' },
];

const Reports: React.FC = () => {
  const [selectedType, setSelectedType] = useState('availability');
  const [orgId, setOrgId] = useState('org-001');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-25');
  const [generating, setGenerating] = useState(false);
  const [recent] = useState<ReportRow[]>([
    { id: 'r1', name: 'Availability SLA — March 2026', type: 'availability', generated_at: '2026-03-25T09:00:00Z' },
    { id: 'r2', name: 'Backup Compliance — Feb 2026', type: 'backup_compliance', generated_at: '2026-03-01T08:00:00Z' },
  ]);

  const generate = async () => {
    setGenerating(true);
    const token = sessionStorage.getItem('access_token') || '';
    try {
      const resp = await fetch(`/api/reports/${selectedType}/generate?format=pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ org_id: orgId, start_date: `${startDate}T00:00:00Z`, end_date: `${endDate}T23:59:59Z` }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `nexus_${selectedType}_report.pdf`; a.click();
    } catch (e: any) {
      alert(`Report generation failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#0A0A12', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, color: '#F8FAFC', marginBottom: 24 }}>Reports</h1>

      {/* Generator */}
      <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: 24, marginBottom: 28 }}>
        <div style={{ fontWeight: 600, color: '#94A3B8', marginBottom: 16, fontSize: 14 }}>Generate New Report</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Type</label>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#1E1E2E', color: '#E2E8F0', fontSize: 13 }}>
              {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Organization ID</label>
            <input value={orgId} onChange={e => setOrgId(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#1E1E2E', color: '#E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#1E1E2E', color: '#E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#1E1E2E', color: '#E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <button onClick={generate} disabled={generating} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: generating ? '#374151' : '#6366F1', color: '#fff', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', fontSize: 13, whiteSpace: 'nowrap'
          }}>
            {generating ? 'Generating…' : '⬇ Generate PDF'}
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div style={{ fontWeight: 600, color: '#94A3B8', marginBottom: 12, fontSize: 14 }}>Recent Reports</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recent.map(r => (
          <div key={r.id} style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{new Date(r.generated_at).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>⬇ PDF</button>
              <button style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>⬇ CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
