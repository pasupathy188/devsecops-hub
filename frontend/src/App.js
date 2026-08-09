import React, { useState, useEffect } from 'react';
import './App.css';
const API_KEY = process.env.REACT_APP_API_KEY;

const ICONS = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  findings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  scans: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/></svg>,
  shield: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l8 3.5v6c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5v-6L12 2z"/></svg>
};

function App() {
  const [page, setPage] = useState('dashboard');
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [scansError, setScansError] = useState('');

  const [settings, setSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3500/api/findings';

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setFindings(data);
      } catch (err) {
        console.error('Error fetching findings:', err);
        setError('Failed to load findings.');
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, [API_URL]);

  useEffect(() => {
    if (page === 'scans') {
      const fetchScans = async () => {
        try {
          setScansLoading(true);
          const response = await fetch('https://devsecops-hub-8qlr.onrender.com/api/scans');
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setScans(data);
        } catch (err) {
          console.error('Error fetching scans:', err);
          setScansError('Failed to load scan history.');
        } finally {
          setScansLoading(false);
        }
      };
      fetchScans();
    }
  }, [page]);

  useEffect(() => {
    if (page === 'settings') {
      const fetchSettings = async () => {
        try {
          const res = await fetch('https://devsecops-hub-8qlr.onrender.com/api/settings');
          const data = await res.json();
          setSettings(data);
        } catch (err) {
          console.error('Error fetching settings:', err);
        }
      };
      fetchSettings();
    }
  }, [page]);

  const updateFinding = async (id, updates) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setFindings(prev => prev.map(f => f._id === data._id ? data : f));
    } catch (err) {
        console.error('Error updating finding:', err);
        setError(`Failed to update: ${err.message}`);
    }
  };

  const deleteFinding = async (id) => {
    if (!window.confirm('Delete this finding? This cannot be undone.')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': API_KEY
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        setFindings(prev => prev.filter(f => f._id !== id));
    } catch (err) {
        console.error('Error deleting finding:', err);
        setError(`Failed to delete: ${err.message}`);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
        const res = await fetch('https://devsecops-hub-8qlr.onrender.com/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        setSettings(data);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
        console.error('Error saving settings:', err);
    } finally {
        setSettingsSaving(false);
    }
  };

  const downloadReport = (scanId) => {
    window.open(`https://devsecops-hub-8qlr.onrender.com/api/scans/${scanId}/download`, '_blank');
  };

  const filteredFindings = findings.filter(f => {
    const matchesSearch = f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'All' || f.severity === filterSeverity;
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const total = findings.length;
  const criticalCount = findings.filter(f => f.severity === 'Critical').length;
  const openCount = findings.filter(f => f.status === 'Open' || f.status === 'In Progress').length;
  const resolvedCount = findings.filter(f => f.status === 'Resolved' || f.status === 'Verified').length;
  const remediatedCount = findings.filter(f => f.remediated).length;
  const score = total === 0 ? 100 : Math.round((remediatedCount / total) * 100);

  const getStatusStyle = (status) => {
    const styles = {
      'Open': { bg: 'rgba(220,38,38,0.08)', color: '#B91C1C' },
      'In Progress': { bg: 'rgba(217,119,6,0.1)', color: '#B45309' },
      'Resolved': { bg: 'rgba(22,163,74,0.1)', color: '#15803D' },
      'Verified': { bg: 'rgba(79,70,229,0.1)', color: '#4338CA' }
    };
    return styles[status] || { bg: '#f1f1f1', color: '#6b7280' };
  };

  const getSeverityColor = (sev) => {
    const map = { 'Critical': '#DC2626', 'High': '#EA580C', 'Medium': '#CA8A04', 'Low': '#16A34A' };
    return map[sev] || '#6b7280';
  };

  const getFindingId = (index) => `VULN-${String(index + 1).padStart(3, '0')}`;

  const navigateTo = (pageName, e) => {
    e.preventDefault();
    setPage(pageName);
  };

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">{ICONS.shield}</span>
          <span className="sidebar-title">Compliance</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={(e) => navigateTo('dashboard', e)}>
            <span className="nav-icon">{ICONS.dashboard}</span>Dashboard
          </a>
          <a href="#" className={`nav-item ${page === 'findings' ? 'active' : ''}`} onClick={(e) => navigateTo('findings', e)}>
            <span className="nav-icon">{ICONS.findings}</span>Findings
          </a>
          <a href="#" className={`nav-item ${page === 'scans' ? 'active' : ''}`} onClick={(e) => navigateTo('scans', e)}>
            <span className="nav-icon">{ICONS.scans}</span>Scans
          </a>
          <a href="#" className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={(e) => navigateTo('settings', e)}>
            <span className="nav-icon">{ICONS.settings}</span>Settings
          </a>
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? ICONS.sun : ICONS.moon}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {page === 'dashboard' && (
          <>
            <header className="top-header">
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Security compliance overview</p>
              </div>
              <span className="live-badge"><span className="live-dot"></span>Live</span>
            </header>
            {error && <div className="error-banner">{error}</div>}
            <section className="stats-grid">
              <div className="stat-card"><span className="stat-number">{total}</span><span className="stat-label">Total findings</span></div>
              <div className="stat-card"><span className="stat-number accent-critical">{criticalCount}</span><span className="stat-label">Critical</span></div>
              <div className="stat-card"><span className="stat-number accent-open">{openCount}</span><span className="stat-label">Open</span></div>
              <div className="stat-card"><span className="stat-number accent-resolved">{resolvedCount}</span><span className="stat-label">Resolved</span></div>
            </section>
            <section className="score-section">
              <div className="score-header"><span className="score-title">Compliance score</span><span className="score-percentage">{score}%</span></div>
              <div className="score-track"><div className="score-fill" style={{ width: `${score}%`, backgroundColor: score > 70 ? '#16A34A' : score > 40 ? '#CA8A04' : '#DC2626' }}></div></div>
            </section>
          </>
        )}

        {(page === 'findings' || page === 'dashboard') && (
          <>
            <section className="filter-section">
              <input type="text" className="search-input" placeholder="Search findings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select className="filter-select" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                <option value="All">All severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Verified">Verified</option>
              </select>
              <span className="result-count">{filteredFindings.length} results</span>
            </section>

            <section className="table-section">
              <table className="findings-table">
                <thead><tr><th>ID</th><th>Finding</th><th>Source</th><th>Severity</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="empty-message">Loading findings…</td></tr>
                  ) : filteredFindings.length === 0 ? (
                    <tr><td colSpan="6" className="empty-message">No findings match your filters.</td></tr>
                  ) : (
                    filteredFindings.map((finding, index) => {
                      const statusStyle = getStatusStyle(finding.status);
                      return (
                        <tr key={finding._id} className={finding.remediated ? 'remediated' : ''} style={{ borderLeft: `3px solid ${getSeverityColor(finding.severity)}` }}>
                          <td className="mono-cell">{getFindingId(index)}</td>
                          <td>{finding.description}</td>
                          <td><span className="source-badge">{finding.source || 'trivy'}</span></td>
                          <td className="mono-cell" style={{ color: getSeverityColor(finding.severity) }}>{finding.severity}</td>
                          <td><span className="status-pill" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>{finding.status}</span></td>
                          <td className="actions-cell">
                            <select className="status-select-mini" value={finding.status} onChange={(e) => updateFinding(finding._id, { status: e.target.value, remediated: e.target.value === 'Resolved' || e.target.value === 'Verified' })}>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Verified">Verified</option>
                            </select>
                            <button className="delete-btn-mini" onClick={() => deleteFinding(finding._id)}>{ICONS.trash}</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {page === 'scans' && (
          <>
            <header className="top-header">
              <div>
                <h1 className="page-title">Scans</h1>
                <p className="page-subtitle">Historical vulnerability scan reports</p>
              </div>
              <span className="live-badge"><span className="live-dot"></span>{scans.length} scans</span>
            </header>
            {scansError && <div className="error-banner">{scansError}</div>}
            <section className="table-section">
              {scansLoading ? (
                <div className="empty-message">Loading scan history…</div>
              ) : scans.length === 0 ? (
                <div className="empty-message">
                  No scans recorded yet.<br />
                  <span style={{ fontSize: '13px', color: '#9095A3' }}>Push code to trigger a scan via the CI/CD pipeline.</span>
                </div>
              ) : (
                <table className="findings-table">
                  <thead><tr><th>Scan ID</th><th>Date</th><th>Image</th><th>Total</th><th>Critical</th><th>High</th><th>Report</th></tr></thead>
                  <tbody>
                    {scans.map((scan, index) => (
                      <tr key={scan._id}>
                        <td className="mono-cell">SCAN-{String(index + 1).padStart(3, '0')}</td>
                        <td>{new Date(scan.scannedAt).toLocaleString()}</td>
                        <td>{scan.imageName || 'backend:latest'}</td>
                        <td>{scan.totalVulns || 0}</td>
                        <td className="mono-cell" style={{ color: '#DC2626' }}>{scan.critical || 0}</td>
                        <td className="mono-cell" style={{ color: '#EA580C' }}>{scan.high || 0}</td>
                        <td><button className="download-btn" onClick={() => downloadReport(scan._id)}>JSON</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        {page === 'settings' && (
          <>
            <header className="top-header">
              <div>
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure compliance thresholds and integrations</p>
              </div>
            </header>

            {!settings ? (
              <div className="empty-message">Loading settings…</div>
            ) : (
              <div className="settings-card">
                <div className="settings-section">
                  <h3 className="settings-section-title">Alert thresholds</h3>
                  <p className="settings-section-desc">Get notified when findings exceed these counts.</p>
                  <div className="settings-row">
                    <label className="settings-label">Critical findings threshold</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      value={settings.criticalThreshold}
                      onChange={(e) => setSettings({ ...settings, criticalThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="settings-row">
                    <label className="settings-label">High findings threshold</label>
                    <input
                      type="number"
                      min="0"
                      className="settings-input"
                      value={settings.highThreshold}
                      onChange={(e) => setSettings({ ...settings, highThreshold: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h3 className="settings-section-title">Alert destinations</h3>
                  <p className="settings-section-desc">Where to send notifications when thresholds are exceeded.</p>
                  <div className="settings-row">
                    <label className="settings-label">Alert email</label>
                    <input
                      type="email"
                      className="settings-input"
                      placeholder="security-team@company.com"
                      value={settings.alertEmail}
                      onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
                    />
                  </div>
                  <div className="settings-row">
                    <label className="settings-label">Slack webhook URL</label>
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="https://hooks.slack.com/services/..."
                      value={settings.slackWebhookUrl}
                      onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-actions">
                  <button className="settings-save-btn" onClick={saveSettings} disabled={settingsSaving}>
                    {settingsSaving ? 'Saving…' : 'Save changes'}
                  </button>
                  {settingsSaved && <span className="settings-saved-msg">Saved</span>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;