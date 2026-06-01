const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'frontend')));

// Google AI API Key
const GOOGLE_AI_KEY = 'AlzaSyCIRqNclsNTnFv0WQz0PDLj0bti8WVJH4';

// In-memory database (no MongoDB needed)
const students = [
    { name: 'Test Student', phone: '1234567890', password: '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8N8' } // password: test123
];

// Signup route
app.post('/api/signup', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        
        const existingStudent = students.find(s => s.phone === phone);
        if (existingStudent) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        students.push({ name, phone, password: hashedPassword });
        
        res.status(201).json({ message: 'Signup successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        const student = students.find(s => s.phone === phone);
        if (!student) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', name: student.name });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Save score endpoint
app.post('/api/save-score', (req, res) => {
    try {
        const { username, easyScore, mediumScore, hardScore } = req.body;
        const scoresPath = path.join(__dirname, 'data', 'scores.json');
        
        let scores = {};
        if (fs.existsSync(scoresPath)) {
            scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
        }
        
        scores[username] = { easyScore, mediumScore, hardScore };
        fs.writeFileSync(scoresPath, JSON.stringify(scores, null, 2));
        
        res.json({ message: 'Score saved' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving score' });
    }
});

// Get score endpoint
app.get('/api/get-score/:username', (req, res) => {
    try {
        const { username } = req.params;
        const scoresPath = path.join(__dirname, 'data', 'scores.json');
        
        if (!fs.existsSync(scoresPath)) {
            return res.json({ easyScore: 0, mediumScore: 0, hardScore: 0 });
        }
        
        const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
        res.json(scores[username] || { easyScore: 0, mediumScore: 0, hardScore: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error loading score' });
    }
});

// Get all scores endpoint
app.get('/api/all-scores', (req, res) => {
    try {
        const scoresPath = path.join(__dirname, 'data', 'scores.json');
        
        if (!fs.existsSync(scoresPath)) {
            return res.json({});
        }
        
        const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
        res.json(scores);
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
