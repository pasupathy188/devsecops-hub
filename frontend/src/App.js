import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [findings, setFindings] = useState([]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use environment variable for backend URL
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3500/api/findings';

  // 1. Load findings
  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setFindings(data);
      } catch (err) {
        console.error('Error fetching findings:', err);
        setError('Failed to load findings. Make sure the backend is running.');
      }
    };
    fetchFindings();
  }, [API_URL]);

  // 2. Add a finding
  const addFinding = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please enter a finding description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: description.trim(), 
          severity,
          status: 'Open'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFindings(prev => [data, ...prev]);
      setDescription('');
    } catch (err) {
      console.error('Error adding finding:', err);
      setError(`Failed to add finding: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Update finding (status or remediated)
  const updateFinding = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFindings(prev => 
        prev.map(f => f._id === data._id ? data : f)
      );
    } catch (err) {
      console.error('Error updating finding:', err);
      setError(`Failed to update finding: ${err.message}`);
    }
  };

  // 4. Delete a finding
  const deleteFinding = async (id) => {
    if (!window.confirm('Are you sure you want to delete this finding?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setFindings(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error('Error deleting finding:', err);
      setError(`Failed to delete finding: ${err.message}`);
    }
  };

  // Calculate dashboard stats
  const total = findings.length;
  const criticalCount = findings.filter(f => f.severity === 'Critical').length;
  const openCount = findings.filter(f => f.status === 'Open' || f.status === 'In Progress').length;
  const resolvedCount = findings.filter(f => f.status === 'Resolved' || f.status === 'Verified').length;
  const remediatedCount = findings.filter(f => f.remediated).length;
  const score = total === 0 ? 100 : Math.round((remediatedCount / total) * 100);

  // Status badge color mapping
  const getStatusBadge = (status) => {
    const colors = {
      'Open': { bg: '#ffebee', color: '#c62828' },
      'In Progress': { bg: '#fff3e0', color: '#e65100' },
      'Resolved': { bg: '#e8f5e9', color: '#2e7d32' },
      'Verified': { bg: '#e3f2fd', color: '#0d47a1' }
    };
    return colors[status] || { bg: '#eee', color: '#555' };
  };

  const getSeverityColor = (sev) => {
    switch(sev) {
      case 'Critical': return '#d32f2f';
      case 'High': return '#f57c00';
      case 'Medium': return '#fbc02d';
      case 'Low': return '#388e3c';
      default: return '#999';
    }
  };

  // Generate sequential IDs
  const getFindingId = (index) => {
    return `V${String(index + 1).padStart(3, '0')}`;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>🛡️ DevSecOps Compliance Hub</h1>
        
        {/* Compliance Score Bar */}
        <div className="score-container">
          <div className="score-row">
            <span className="score-label">Compliance Score</span>
            <span className="score-percentage">{score}%</span>
          </div>
          <div className="score-bar-background">
            <div 
              className="score-bar-fill" 
              style={{ 
                width: `${score}%`, 
                backgroundColor: score > 70 ? '#4caf50' : score > 40 ? '#ff9800' : '#f44336' 
              }}
            ></div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats Cards */}
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

      {/* Add Finding Form */}
      <div className="add-form-container">
        <form onSubmit={addFinding} className="add-form">
          <input
            type="text"
            className="description-input"
            placeholder="Describe the security finding..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
          />
          <select 
            className="severity-select"
            value={severity} 
            onChange={(e) => setSeverity(e.target.value)}
            disabled={loading}
          >
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
          <button type="submit" className="add-button" disabled={loading}>
            {loading ? 'Adding...' : '➕ Add Finding'}
          </button>
        </form>
        {error && <div className="error-message">❌ {error}</div>}
      </div>

      {/* Findings Table */}
      <div className="table-container">
        <h2 className="table-title">Security Findings</h2>
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
            {findings.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-message">✅ No findings logged. You are compliant!</td>
              </tr>
            ) : (
              findings.map((finding, index) => {
                const statusStyle = getStatusBadge(finding.status);
                return (
                  <tr key={finding._id} className={finding.remediated ? 'remediated-row' : ''}>
                    <td>{getFindingId(index)}</td>
                    <td>{finding.description}</td>
                    <td>
                      <span 
                        className="severity-badge" 
                        style={{ backgroundColor: getSeverityColor(finding.severity) }}
                      >
                        {finding.severity}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        style={{ 
                          backgroundColor: statusStyle.bg, 
                          color: statusStyle.color,
                          borderColor: statusStyle.color
                        }}
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
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => deleteFinding(finding._id)}
                        title="Delete finding"
                      >
                        🗑️
                      </button>
                      {finding.remediated && (
                        <span className="remediated-check">✅</span>
                      )}
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