import React, { useState, useEffect } from 'react';
import './App.css';

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
  const [lastScanDate, setLastScanDate] = useState(null);
  const [settings, setSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Use environment variables – no hardcoded URLs
  const API_BASE = process.env.REACT_APP_API_BASE || 'https://devsecops-hub-8qlr.onrender.com';
  const API_URL = `${API_BASE}/api/findings`;
  const API_KEY = process.env.REACT_APP_API_KEY;

  // 1. Fetch findings
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

  useEffect(() => {
    fetchFindings();
  }, [API_URL]);

  // 2. Fetch scans (only when on Scans page)
  useEffect(() => {
    if (page === 'scans') {
      const fetchScans = async () => {
        try {
          setScansLoading(true);
          const response = await fetch(`${API_BASE}/api/scans`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setScans(data);
          if (data.length > 0) {
            setLastScanDate(data[0].scannedAt);
          }
        } catch (err) {
          console.error('Error fetching scans:', err);
          setScansError('Failed to load scan history.');
        } finally {
          setScansLoading(false);
        }
      };
      fetchScans();
    }
  }, [page, API_BASE]);

  // 3. Fetch settings (only when on Settings page)
  useEffect(() => {
    if (page === 'settings') {
      const fetchSettings = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/settings`);
          const data = await res.json();
          setSettings(data);
        } catch (err) {
          console.error('Error fetching settings:', err);
        }
      };
      fetchSettings();
    }
  }, [page, API_BASE]);

  // 4. Update finding (PUT)
  const updateFinding = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
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

  // 5. Delete finding (DELETE)
  const deleteFinding = async (id) => {
    if (!window.confirm('Delete this finding? This cannot be undone.')) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setFindings(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error('Error deleting finding:', err);
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // 6. Save settings (PUT)
  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
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

  // 7. Download scan report
  const downloadReport = (scanId) => {
    window.open(`${API_BASE}/api/scans/${scanId}/download`, '_blank');
  };

  // 8. Sync (manual refresh)
  const handleSync = () => {
    fetchFindings();
  };

  // 9. Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterSeverity('All');
    setFilterStatus('All');
  };

  // 10. Filter logic
  const filteredFindings = findings.filter(f => {
    const matchesSearch = f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'All' || f.severity === filterSeverity;
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // 11. Stats
  const total = findings.length;
  const criticalCount = findings.filter(f => f.severity === 'Critical').length;
  const highCount = findings.filter(f => f.severity === 'High').length;
  const mediumCount = findings.filter(f => f.severity === 'Medium').length;
  const lowCount = findings.filter(f => f.severity === 'Low').length;
  const openCount = findings.filter(f => f.status === 'Open' || f.status === 'In Progress').length;
  const resolvedCount = findings.filter(f => f.status === 'Resolved' || f.status === 'Verified').length;
  const remediatedCount = findings.filter(f => f.remediated).length;
  const score = total === 0 ? 100 : Math.round((remediatedCount / total) * 100);

  const openOnlyCount = findings.filter(f => f.status === 'Open').length;
  const inProgressCount = findings.filter(f => f.status === 'In Progress').length;
  const resolvedOnlyCount = findings.filter(f => f.status === 'Resolved').length;
  const verifiedCount = findings.filter(f => f.status === 'Verified').length;

  // 12. Helpers
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
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">{ICONS.shield}</span>
          <span className="sidebar-title">Compliance</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={(e) => navigateTo('dashboard', e)}>
            <span className="nav-icon">{ICONS.dashboard}</span>Dashboard
          </a>
          <a href="#findings" className={`nav-item ${page === 'findings' ? 'active' : ''}`} onClick={(e) => navigateTo('findings', e)}>
            <span className="nav-icon">{ICONS.findings}</span>Findings
          </a>
          <a href="#scans" className={`nav-item ${page === 'scans' ? 'active' : ''}`} onClick={(e) => navigateTo('scans', e)}>
            <span className="nav-icon">{ICONS.scans}</span>Scans
          </a>
          <a href="#settings" className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={(e) => navigateTo('settings', e)}>
            <span className="nav-icon">{ICONS.settings}</span>Settings
          </a>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? ICONS.sun : ICONS.moon}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">

        {/* ===== DASHBOARD ===== */}
        {page === 'dashboard' && (
          <>
            <header className="top-header">
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Security compliance overview</p>
              </div>
              <div className="header-actions">
                <span className="live-badge"><span className="live-dot"></span>Live</span>
                <span className="scan-status">
                  <span className="status-dot"></span>
                  {lastScanDate ? `Last scan: ${new Date(lastScanDate).toLocaleDateString()}` : 'No scans yet'}
                </span>
              </div>
            </header>
            {error && <div className="error-banner">{error}</div>}

            {/* Hero Banner */}
            <section className="hero-banner">
              <div className="hero-ring">
                <svg viewBox="0 0 120 120" className="ring-svg">
                  <circle cx="60" cy="60" r="52" className="ring-track" />
                  <circle
                    cx="60" cy="60" r="52"
                    className="ring-fill"
                    style={{
                      strokeDasharray: 2 * Math.PI * 52,
                      strokeDashoffset: 2 * Math.PI * 52 * (1 - score / 100),
                      stroke: score > 70 ? '#22C55E' : score > 40 ? '#EAB308' : '#EF4444'
                    }}
                  />
                </svg>
                <div className="ring-label">
                  <span className="ring-number">{score}%</span>
                  <span className="ring-caption">Compliant</span>
                </div>
              </div>
              <div className="hero-text">
                <h2>Overall Compliance Score</h2>
                <p>{remediatedCount} of {total} findings remediated across all sources</p>
              </div>
            </section>

            {/* Severity Distribution Bar */}
            <div className="severity-distribution">
              <div className="dist-bar critical" style={{ width: `${total ? (criticalCount / total) * 100 : 0}%` }}></div>
              <div className="dist-bar high" style={{ width: `${total ? (highCount / total) * 100 : 0}%` }}></div>
              <div className="dist-bar medium" style={{ width: `${total ? (mediumCount / total) * 100 : 0}%` }}></div>
              <div className="dist-bar low" style={{ width: `${total ? (lowCount / total) * 100 : 0}%` }}></div>
            </div>

            {/* Stats */}
            <section className="stats-grid">
              <div className="stat-card stripe-total">
                <span className="stat-icon">🛡️</span>
                <div>
                  <span className="stat-number">{total}</span>
                  <span className="stat-label">Total findings</span>
                </div>
              </div>
              <div className="stat-card stripe-critical">
                <span className="stat-icon">🔺</span>
                <div>
                  <span className="stat-number accent-critical">{criticalCount}</span>
                  <span className="stat-label">Critical</span>
                </div>
              </div>
              <div className="stat-card stripe-open">
                <span className="stat-icon">⏱️</span>
                <div>
                  <span className="stat-number accent-open">{openCount}</span>
                  <span className="stat-label">Open</span>
                </div>
              </div>
              <div className="stat-card stripe-resolved">
                <span className="stat-icon">✅</span>
                <div>
                  <span className="stat-number accent-resolved">{resolvedCount}</span>
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ===== FINDINGS ===== */}
        {(page === 'findings' || page === 'dashboard') && (
          <>
            {/* Chevron Workflow */}
            <div className="chevron-nav">
              <div className="chevron-step" style={{ background: '#6D28D9' }}>
                Open <span className="chevron-count">{openOnlyCount}</span>
              </div>
              <div className="chevron-step" style={{ background: '#7C3AED' }}>
                In Progress <span className="chevron-count">{inProgressCount}</span>
              </div>
              <div className="chevron-step" style={{ background: '#8B5CF6' }}>
                Resolved <span className="chevron-count">{resolvedOnlyCount}</span>
              </div>
              <div className="chevron-step" style={{ background: '#A78BFA' }}>
                Verified <span className="chevron-count">{verifiedCount}</span>
              </div>
            </div>

            {/* Filters */}
            <section className="filter-section">
              <input
                type="text"
                className="search-input"
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
              <button className="sync-btn" onClick={handleSync} disabled={loading}>
                {loading ? '⟳' : '⟳'} Sync
              </button>
              <span className="result-count">
                {filteredFindings.length} results
                {(filterSeverity !== 'All' || filterStatus !== 'All' || searchTerm) && (
                  <button className="clear-filters" onClick={clearFilters}>
                    ✕ Clear filters
                  </button>
                )}
              </span>
            </section>

            {/* Table */}
            <section className="table-section">
              <table className="findings-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Finding</th>
                    <th>Source</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="empty-message">Loading findings…</td></tr>
                  ) : filteredFindings.length === 0 ? (
                    <tr><td colSpan="6" className="empty-message">No findings match your filters.</td></tr>
                  ) : (
                    filteredFindings.map((finding, index) => {
                      const statusStyle = getStatusStyle(finding.status);
                      const daysOpen = Math.floor((new Date() - new Date(finding.createdAt)) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={finding._id} className={finding.remediated ? 'remediated' : ''} style={{ borderLeft: `3px solid ${getSeverityColor(finding.severity)}` }}>
                          <td className="mono-cell">{getFindingId(index)}</td>
                          <td>
                            {finding.description}
                            <span className="age-badge" style={{ color: daysOpen > 30 ? '#DC2626' : daysOpen > 7 ? '#F97316' : '#6B7280' }}>
                              {daysOpen}d
                            </span>
                          </td>
                          <td><span className="source-badge">{finding.source || 'trivy'}</span></td>
                          <td className="mono-cell" style={{ color: getSeverityColor(finding.severity) }}>{finding.severity}</td>
                          <td>
                            <span className="status-pill" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                              {finding.status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <select
                              className="status-select-mini"
                              value={finding.status}
                              onChange={(e) => updateFinding(finding._id, {
                                status: e.target.value,
                                remediated: e.target.value === 'Resolved' || e.target.value === 'Verified'
                              })}
                            >
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

        {/* ===== SCANS ===== */}
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
                  <thead>
                    <tr>
                      <th>Scan ID</th>
                      <th>Date</th>
                      <th>Image</th>
                      <th>Total</th>
                      <th>Critical</th>
                      <th>High</th>
                      <th>Report</th>
                    </tr>
                  </thead>
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

        {/* ===== SETTINGS ===== */}
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