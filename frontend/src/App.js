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
        if (!response.ok) throw new Error(HTTP error! status: );
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
      const response = await fetch(${API_URL}/, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error(HTTP error! status: );
      const data = await response.json();
      setFindings(prev => prev.map(f => f._id === data._id ? data : f));
    } catch (err) {
      console.error('Error updating finding:', err);
      setError(Failed to update: );
    }
  };

  const deleteFinding = async (id) => {
    if (!window.confirm('Are you sure you want to delete this finding?')) return;
    try {
      const response = await fetch(${API_URL}/, { method: 'DELETE' });
      if (!response.ok) throw new Error(HTTP error! status: );
      setFindings(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error('Error deleting finding:', err);
      setError(Failed to delete: );
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
      'Open': { bg: '#fee2e2', color: '#dc2626' },
      'In Progress': { bg: '#fef3c7', color: '#d97706' },
      'Resolved': { bg: '#d1fae5', color: '#059669' },
      'Verified': { bg: '#dbeafe', color: '#2563eb' }
    };
    return colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const getSeverityColor = (sev) => {
    const map = { 'Critical': '#dc2626', 'High': '#f97316', 'Medium': '#eab308', 'Low': '#22c55e' };
    return map[sev] || '#6b7280';
  };

  const getFindingId = (index) => V;

  return (
    <div className={pp }>
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">🛡️</span>
            <h1>DevSecOps Compliance Hub</h1>
          </div>
          <div className="header-actions">
            <span className="status-badge">
              <span className="status-dot"></span>
              {loading ? 'Loading...' : ${total} findings}
            </span>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="score-section">
        <div className="score-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={score > 70 ? '#22c55e' : score > 40 ? '#eab308' : '#dc2626'}
              strokeWidth="12"
              strokeDasharray="339.292"
              strokeDashoffset={339.292 - (score / 100) * 339.292}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="60" textAnchor="middle" dy="0.35em" className="score-text">{score}%</text>
          </svg>
          <div className="score-label">Compliance Score</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card critical">
            <div className="stat-number">{criticalCount}</div>
            <div className="stat-label">Critical</div>
          </div>
          <div className="stat-card open">
            <div className="stat-number">{openCount}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-number">{resolvedCount}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search findings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="filter-select" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="All">All Severities</option>
          <option value="Critical">🔴 Critical</option>
          <option value="High">🟠 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Verified">Verified</option>
        </select>
        <span className="filter-results">{filteredFindings.length} findings</span>
      </div>

      <div className="table-container">
        {error && <div className="error-message">❌ {error}</div>}
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
              <tr><td colSpan="5" className="loading-message">⏳ Loading findings...</td></tr>
            ) : filteredFindings.length === 0 ? (
              <tr><td colSpan="5" className="empty-message">✅ No findings match your filters.</td></tr>
            ) : (
              filteredFindings.map((finding, index) => {
                const statusStyle = getStatusBadge(finding.status);
                return (
                  <tr key={finding._id} className={finding.remediated ? 'remediated-row' : ''}>
                    <td>{getFindingId(index)}</td>
                    <td>{finding.description}</td>
                    <td>
                      <span className="severity-badge" style={{ backgroundColor: getSeverityColor(finding.severity) }}>
                        {finding.severity}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color }}
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
                    </td>
                    <td className="actions-cell">
                      <button className="delete-btn" onClick={() => deleteFinding(finding._id)} title="Delete">🗑️</button>
                      {finding.remediated && <span className="remediated-check">✅</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
