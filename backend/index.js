const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const server = http.createServer(app);
console.log('🔍 MONGO_URI from env:', process.env.MONGO_URI ? '✅ Present' : '❌ Missing');

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// --- Socket.io setup for REAL-TIME (Optional) ---
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- MongoDB Connection ---
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/compliance';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.log('⚠️ MongoDB not running yet.', err));

// --- Define the "Compliance Finding" Schema ---
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

// --- REST API Routes ---

// GET: Fetch all findings
app.get('/api/findings', async (req, res) => {
    try {
        const findings = await Finding.find().sort({ createdAt: -1 });
        res.json(findings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Add a new finding
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
        res.status(500).json({ error: error.message });
    }
});

// PUT: Update finding (status or remediated)
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
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Remove a finding
app.delete('/api/findings/:id', async (req, res) => {
    try {
        const finding = await Finding.findByIdAndDelete(req.params.id);
        if (!finding) {
            return res.status(404).json({ error: 'Finding not found' });
        }
        io.emit('finding_deleted', req.params.id);
        res.json({ message: 'Finding deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Start the Server ---
const PORT = 3500;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});