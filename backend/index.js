const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const client = require('prom-client');

mongoose.set('strictQuery', false);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
}));

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/compliance';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('MongoDB not running yet.', err));

function requireApiKey(req, res, next) {
    const providedKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;
    if (!validKey) {
        console.error('API_KEY is not set on the server.');
        return res.status(500).json({ error: 'Server misconfiguration: API key not set' });
    }
    if (!providedKey || providedKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
    }
    next();
}

const FindingSchema = new mongoose.Schema({
    cveId: { type: String, index: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Verified'], default: 'Open' },
    remediated: { type: Boolean, default: false },
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan' },
    source: { type: String, enum: ['trivy', 'semgrep', 'npm-audit'], default: 'trivy' },
    filePath: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const Finding = mongoose.model('Finding', FindingSchema);

const ScanSchema = new mongoose.Schema({
    imageName: { type: String, required: true, default: 'backend:latest' },
    scannedAt: { type: Date, default: Date.now },
    totalVulns: { type: Number, default: 0 },
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    rawReport: { type: Object, required: true }
});
const Scan = mongoose.model('Scan', ScanSchema);

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
//  PROMETHEUS METRICS
// ============================================================
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const findingsGauge = new client.Gauge({
    name: 'compliance_findings_total',
    help: 'Current findings count by severity and status',
    labelNames: ['severity', 'status'],
    registers: [register]
});

const scansCounter = new client.Counter({
    name: 'compliance_scans_total',
    help: 'Total number of scans recorded',
    registers: [register]
});

const scanCriticalGauge = new client.Gauge({
    name: 'compliance_latest_scan_critical',
    help: 'Critical vulnerability count from the most recent scan',
    registers: [register]
});

const scanHighGauge = new client.Gauge({
    name: 'compliance_latest_scan_high',
    help: 'High vulnerability count from the most recent scan',
    registers: [register]
});

async function updateFindingsMetrics() {
    try {
        const severities = ['Critical', 'High', 'Medium', 'Low'];
        const statuses = ['Open', 'In Progress', 'Resolved', 'Verified'];
        for (const severity of severities) {
            for (const status of statuses) {
                const count = await Finding.countDocuments({ severity, status });
                findingsGauge.set({ severity, status }, count);
            }
        }
    } catch (err) {
        console.error('Error updating findings metrics:', err.message);
    }
}

async function checkThresholdsAndAlert(scanCritical, scanHigh) {
    try {
        const settings = await Settings.findOne();
        if (!settings) return;
        const criticalExceeded = scanCritical > settings.criticalThreshold;
        const highExceeded = scanHigh > settings.highThreshold;
        if (!criticalExceeded && !highExceeded) return;

        const message = `Compliance Alert\n\nCritical findings: ${scanCritical} (threshold: ${settings.criticalThreshold})\nHigh findings: ${scanHigh} (threshold: ${settings.highThreshold})`;

        if (settings.slackWebhookUrl) {
            try {
                await fetch(settings.slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: message })
                });
            } catch (err) { console.error('Slack alert failed:', err.message); }
        }

        if (settings.alertEmail && process.env.SMTP_HOST) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT || 587),
                    secure: false,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                });
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: settings.alertEmail,
                    subject: 'Compliance Alert: Threshold Exceeded',
                    text: message
                });
            } catch (err) { console.error('Email alert failed:', err.message); }
        }
    } catch (err) {
        console.error('Error checking thresholds:', err.message);
    }
}

// ============================================================
//  METRICS ROUTE
// ============================================================
app.get('/metrics', async (req, res) => {
    try {
        await updateFindingsMetrics();
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        console.error('Error generating metrics:', err.message);
        res.status(500).end();
    }
});

// ============================================================
//  FINDINGS ROUTES
// ============================================================
app.get('/api/findings', async (req, res) => {
    try {
        const findings = await Finding.find().sort({ createdAt: -1 });
        res.json(findings);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/findings', requireApiKey, async (req, res) => {
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
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/findings/bulk', requireApiKey, async (req, res) => {
    try {
        const { source, findings } = req.body;
        if (!source || !Array.isArray(findings)) {
            return res.status(400).json({ error: 'source and findings[] are required' });
        }
        let added = 0;
        for (const f of findings) {
            const existing = await Finding.findOne({
                description: f.description,
                source,
                status: { $in: ['Open', 'In Progress'] }
            });
            if (existing) continue;
            const finding = new Finding({
                cveId: f.cveId || undefined,
                description: f.description,
                severity: f.severity,
                status: 'Open',
                remediated: false,
                source,
                filePath: f.filePath || undefined
            });
            await finding.save();
            added++;
        }
        res.status(201).json({ message: `${source} findings processed`, added });
    } catch (error) {
        console.error('Error storing bulk findings:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/findings/:id', requireApiKey, async (req, res) => {
    try {
        const finding = await Finding.findById(req.params.id);
        if (!finding) return res.status(404).json({ error: 'Finding not found' });
        if (req.body.status !== undefined) {
            finding.status = req.body.status;
            finding.remediated = (req.body.status === 'Resolved' || req.body.status === 'Verified');
        }
        await finding.save();
        io.emit('finding_updated', finding);
        res.json(finding);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/findings/:id', requireApiKey, async (req, res) => {
    try {
        const finding = await Finding.findByIdAndDelete(req.params.id);
        if (!finding) return res.status(404).json({ error: 'Finding not found' });
        io.emit('finding_deleted', req.params.id);
        res.json({ message: 'Finding deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================
//  SCANS ROUTES
// ============================================================
app.get('/api/scans', async (req, res) => {
    try {
        const scans = await Scan.find().sort({ scannedAt: -1 });
        res.json(scans);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/scans', requireApiKey, async (req, res) => {
    try {
        const rawReport = req.body;
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
            totalVulns: total, critical, high, rawReport
        });
        await scan.save();

        let findingsAdded = 0;
        const severityMap = { CRITICAL: 'Critical', HIGH: 'High' };
        if (rawReport.Results) {
            const seenInThisScan = new Set();
            for (const result of rawReport.Results) {
                for (const vuln of (result.Vulnerabilities || [])) {
                    if (!['CRITICAL', 'HIGH'].includes(vuln.Severity)) continue;
                    if (seenInThisScan.has(vuln.VulnerabilityID)) continue;
                    seenInThisScan.add(vuln.VulnerabilityID);
                    const existing = await Finding.findOne({
                        cveId: vuln.VulnerabilityID,
                        status: { $in: ['Open', 'In Progress'] }
                    });
                    if (existing) continue;
                    const finding = new Finding({
                        cveId: vuln.VulnerabilityID,
                        description: `${vuln.VulnerabilityID} - ${vuln.Title || vuln.Description || ''} (Package: ${vuln.PkgName})`,
                        severity: severityMap[vuln.Severity],
                        status: 'Open',
                        remediated: false,
                        source: 'trivy',
                        scanId: scan._id
                    });
                    await finding.save();
                    findingsAdded++;
                }
            }
        }

        checkThresholdsAndAlert(critical, high);
        scansCounter.inc();
        scanCriticalGauge.set(critical);
        scanHighGauge.set(high);

        res.status(201).json({ message: 'Scan report stored', scanId: scan._id, findingsAdded });
    } catch (error) {
        console.error('Error storing scan:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/scans/:id/download', async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) return res.status(404).json({ error: 'Scan not found' });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=scan-${scan._id}.json`);
        res.send(JSON.stringify(scan.rawReport, null, 2));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================
//  SETTINGS ROUTES
// ============================================================
app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        res.json(settings);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/settings', requireApiKey, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        const fields = ['criticalThreshold', 'highThreshold', 'alertEmail', 'slackWebhookUrl', 'autoRemediateResolved'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) settings[field] = req.body[field];
        });
        settings.updatedAt = new Date();
        await settings.save();
        res.json(settings);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = process.env.PORT || 3500;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});