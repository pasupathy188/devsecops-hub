import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const updateFinding = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    if (!window.confirm('Are you sure you want to delete this finding?')) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setFindings(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error('Error deleting finding:', err);
      setError(`Failed to delete: ${err.message}`);
    }
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

  const getStatusBadge = (status) => {
    const colors = {
      'Open': { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
      'In Progress': { bg: '#fffbeb', color: '#d97706', dot: '#d97706' },
      'Resolved': { bg: '#ecfdf5', color: '#059669', dot: '#059669' },
      'Verified': { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#6b7280' };
  };

  const getSeverityColor = (sev) => {
    const map = { 'Critical': '#dc2626', 'High': '#f97316', 'Medium': '#eab308', 'Low': '#22c55e' };
    return map[sev] || '#6b7280';
  };

  const getFindingId = (index) => `V${String(index + 1).padStart(3, '0')}`;

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🛡️</span>
          <span className="sidebar-title">Compliance</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">📊</span>
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">🔍</span>
            Findings
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📋</span>
            Scans
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </a>
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Real-time security compliance overview</p>
          </div>
          <div className="header-right">
            <span className="live-badge">
              <span className="live-dot"></span> Live
            </span>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📌</div>
            <div className="stat-info">
              <span className="stat-number">{total}</span>
              <span className="stat-label">Total Findings</span>
            </div>
          </div>
          <div className="stat-card critical">
            <div className="stat-icon">🔴</div>
            <div className="stat-info">
              <span className="stat-number">{criticalCount}</span>
              <span className="stat-label">Critical</span>
            </div>
          </div>
          <div className="stat-card open">
            <div className="stat-icon">🟡</div>
            <div className="stat-info">
              <span className="stat-number">{openCount}</span>
              <span className="stat-label">Open</span>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">{resolvedCount}</span>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
        </section>

        {/* Compliance Score Bar */}
        <section className="score-section">
          <div className="score-header">
            <span className="score-title">Compliance Score</span>
            <span className="score-percentage">{score}%</span>
          </div>
          <div className="score-track">
            <div className="score-fill" style={{ width: `${score}%`, backgroundColor: score > 70 ? '#22c55e' : score > 40 ? '#eab308' : '#dc2626' }}></div>
          </div>
        </section>

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
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Verified">Verified</option>
          </select>
          <span className="result-count">{filteredFindings.length} findings</span>
        </section>

        {/* Table */}
        <section className="table-section">
          <table className="findings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Finding</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="empty-message">Loading...</td></tr>
              ) : filteredFindings.length === 0 ? (
                <tr><td colSpan="5" className="empty-message">No findings match your filters.</td></tr>
              ) : (
                filteredFindings.map((finding, index) => {
                  const statusStyle = getStatusBadge(finding.status);
                  return (
                    <tr key={finding._id} className={finding.remediated ? 'remediated' : ''}>
                      <td>{getFindingId(index)}</td>
                      <td>{finding.description}</td>
                      <td>
                        <span className="severity-dot" style={{ backgroundColor: getSeverityColor(finding.severity) }}></span>
                        <span className="severity-label">{finding.severity}</span>
                      </td>
                      <td>
                        <span className="status-pill" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                          <span className="status-dot-small" style={{ backgroundColor: statusStyle.dot }}></span>
                          {finding.status}
                        </span>
                      </td>
                      <td>
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
                        <button className="delete-btn-mini" onClick={() => deleteFinding(finding._id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default App;