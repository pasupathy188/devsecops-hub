const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Suppress Mongoose strictQuery warning
mongoose.set('strictQuery', false);

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Socket.io setup (for real-time updates) ---
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compliance';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.log('⚠️ MongoDB not running yet.', err));

// ============================================================
//  SCHEMAS & MODELS
// ============================================================

// --- Finding Schema ---
const FindingSchema = new mongoose.Schema({
    description: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    status: { 
        type: String, 
        enum: ['Open', 'In Progress', 'Resolved', 'Verified'], 
        default: 'Open' 
    },
    remediated: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Finding = mongoose.model('Finding', FindingSchema);

// --- Scan Schema (for raw Trivy reports) ---
const ScanSchema = new mongoose.Schema({
    imageName: { type: String, required: true, default: 'backend:latest' },
    scannedAt: { type: Date, default: Date.now },
    totalVulns: { type: Number, default: 0 },
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    rawReport: { type: Object, required: true }
});
const Scan = mongoose.model('Scan', ScanSchema);
// ============================================================
//  SETTINGS SCHEMA (singleton document)
// ============================================================

const SettingsSchema = new mongoose.Schema({
    criticalThreshold: { type: Number, default: 0 },
    highThreshold: { type: Number, default: 10 },
    alertEmail: { type: String, default: '' },
    slackWebhookUrl: { type: String, default: '' },
    autoRemediateResolved: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// ============================================================
//  SETTINGS ROUTES
// ============================================================

// GET current settings (auto-creates default if none exist)
app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update settings
app.put('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }
        const fields = ['criticalThreshold', 'highThreshold', 'alertEmail', 'slackWebhookUrl', 'autoRemediateResolved'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                settings[field] = req.body[field];
            }
        });
        settings.updatedAt = new Date();
        await settings.save();
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  FINDINGS ROUTES (CRUD)
// ============================================================

// GET all findings (sorted newest first)
app.get('/api/findings', async (req, res) => {
    try {
        const findings = await Finding.find().sort({ createdAt: -1 });
        res.json(findings);
    } catch (error) {
        console.error('Error fetching findings:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST a new finding
app.post('/api/findings', async (req, res) => {
    try {
        if (!req.body.description || req.body.description.trim() === '') {
            return res.status(400).json({ error: 'Description is required' });
        }
        const finding = new Finding({
            description: req.body.description.trim(),
            severity: req.body.severity || 'Medium',
            status: req.body.status || 'Open'
        });
        await finding.save();
        io.emit('finding_added', finding);
        res.status(201).json(finding);
    } catch (error) {
        console.error('Error creating finding:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update a finding (status / remediated)
app.put('/api/findings/:id', async (req, res) => {
    try {
        const finding = await Finding.findById(req.params.id);
        if (!finding) {
            return res.status(404).json({ error: 'Finding not found' });
        }
        if (req.body.status !== undefined) {
            finding.status = req.body.status;
        }
        if (req.body.remediated !== undefined) {
            finding.remediated = req.body.remediated;
        }
        await finding.save();
        io.emit('finding_updated', finding);
        res.json(finding);
    } catch (error) {
        console.error('Error updating finding:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE a finding
app.delete('/api/findings/:id', async (req, res) => {
    try {
        const finding = await Finding.findByIdAndDelete(req.params.id);
        if (!finding) {
            return res.status(404).json({ error: 'Finding not found' });
        }
        io.emit('finding_deleted', req.params.id);
        res.json({ message: 'Finding deleted successfully' });
    } catch (error) {
        console.error('Error deleting finding:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  SCANS ROUTES
// ============================================================

// GET all scan reports (sorted newest first)
app.get('/api/scans', async (req, res) => {
    try {
        const scans = await Scan.find().sort({ scannedAt: -1 });
        res.json(scans);
    } catch (error) {
        console.error('Error fetching scans:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST a raw scan report (from Trivy)
app.post('/api/scans', async (req, res) => {
    try {
        const rawReport = req.body;
        // Count vulnerabilities
        let total = 0, critical = 0, high = 0;
        if (rawReport.Results) {
            for (const result of rawReport.Results) {
                for (const vuln of (result.Vulnerabilities || [])) {
                    total++;
                    if (vuln.Severity === 'CRITICAL') critical++;
                    if (vuln.Severity === 'HIGH') high++;
                }
            }
        }
        const scan = new Scan({
            imageName: rawReport.Metadata?.ImageName || 'backend:latest',
            totalVulns: total,
            critical,
            high,
            rawReport
        });
        await scan.save();
        res.status(201).json({ message: 'Scan report stored', scanId: scan._id });
    } catch (error) {
        console.error('Error storing scan:', error);
        res.status(500).json({ error: error.message });
    }
});

// OPTIONAL: Download raw report by ID (for the Scans page download button)
app.get('/api/scans/:id/download', async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found' });
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=scan-${scan._id}.json`);
        res.send(JSON.stringify(scan.rawReport, null, 2));
    } catch (error) {
        console.error('Error downloading scan:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  START THE SERVER
// ============================================================
const PORT = process.env.PORT || 3500;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});