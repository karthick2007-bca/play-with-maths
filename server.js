const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://gamingmath:7604926171@cluster0.aruq9wd.mongodb.net/playwithmaths?appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB error:', err));

// Schemas
const Student = mongoose.model('Student', new mongoose.Schema({
    username: { type: String, unique: true },
    password: String
}));

const Score = mongoose.model('Score', new mongoose.Schema({
    username: { type: String, unique: true },
    easyScore: { type: Number, default: 0 },
    mediumScore: { type: Number, default: 0 },
    hardScore: { type: Number, default: 0 }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'frontend')));

// Google AI API Key
const GOOGLE_AI_KEY = 'AlzaSyCIRqNclsNTnFv0WQz0PDLj0bti8WVJH4';

// Signup route
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existing = await Student.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await Student.create({ username, password: hashedPassword });
        res.status(201).json({ message: 'Signup successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const student = await Student.findOne({ username });
        if (!student) return res.status(400).json({ message: 'Username not found' });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

        res.json({ message: 'Login successful', username: student.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Save score endpoint
app.post('/api/save-score', async (req, res) => {
    try {
        const { username, easyScore, mediumScore, hardScore } = req.body;
        await Score.findOneAndUpdate(
            { username },
            { easyScore, mediumScore, hardScore },
            { upsert: true, new: true }
        );
        res.json({ message: 'Score saved' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving score' });
    }
});

// Get score endpoint
app.get('/api/get-score/:username', async (req, res) => {
    try {
        const score = await Score.findOne({ username: req.params.username });
        res.json(score || { easyScore: 0, mediumScore: 0, hardScore: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error loading score' });
    }
});

// Get all scores endpoint
app.get('/api/all-scores', async (req, res) => {
    try {
        const scores = await Score.find();
        const result = {};
        scores.forEach(s => result[s.username] = { easyScore: s.easyScore, mediumScore: s.mediumScore, hardScore: s.hardScore });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error loading scores' });
    }
});

// AI Math Helper endpoint
app.post('/api/ai-help', async (req, res) => {
    try {
        const { question, standard } = req.body;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_AI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a math tutor for ${standard} grade students. Answer this question simply: ${question}`
                    }]
                }]
            })
        });
        
        const data = await response.json();
        console.log('AI Response:', data);
        
        if (data.candidates && data.candidates[0]) {
            const answer = data.candidates[0].content.parts[0].text;
            res.json({ answer });
        } else {
            res.status(500).json({ answer: 'Sorry, I could not process your question. Error: ' + JSON.stringify(data) });
        }
    } catch (error) {
        console.error('AI Error:', error);
        res.json({ answer: 'Sorry, the AI service is not available right now. Error: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
