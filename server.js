const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database file
const DB_FILE = path.join(__dirname, 'users.json');

// Initialize database
function initDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [],
            admin: {
                username: 'globaltrade360',
                password: 'myhandwork2025',
                email: 'stevenlogan362@gmail.com'
            },
            cryptoAddresses: {
                bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                usdt: 'TNS1V6WVLkQRL2VQGP1C7nKFQZ0Gq9Zq1e'
            },
            messages: [],
            transactions: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Read database
function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (error) {
        initDatabase();
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
}

// Write to database
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// User registration
app.post('/api/register', (req, res) => {
    const { name, email, username, password, phone } = req.body;
    const db = readDB();
    
    // Check if user exists
    if (db.users.some(u => u.email === email || u.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        username,
        password, // In production, hash this!
        phone,
        balance: 50, // Welcome bonus
        investments: [],
        totalDeposited: 0,
        totalWithdrawn: 0,
        joined: new Date().toISOString(),
        verified: false,
        kycStatus: 'pending'
    };
    
    db.users.push(newUser);
    writeDB(db);
    
    // Send welcome email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to GlobalTrade360!',
        html: `
            <h2>Welcome ${name}!</h2>
            <p>Your account has been created successfully.</p>
            <p>You received a $50 welcome bonus!</p>
            <p>Start investing today at: https://globaltrade360.com</p>
            <br>
            <p>Best regards,<br>GlobalTrade360 Team</p>
        `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log('Email error:', error);
    });
    
    res.json({ 
        success: true, 
        message: 'Registration successful',
        user: { ...newUser, password: undefined }
    });
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    
    // Check admin login
    if (username === db.admin.username && password === db.admin.password) {
        return res.json({
            success: true,
            isAdmin: true,
            user: db.admin
        });
    }
    
    // Check user login
    const user = db.users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
    );
    
    if (user) {
        res.json({
            success: true,
            isAdmin: false,
            user: { ...user, password: undefined }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get user data
app.get('/api/user/:id', (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id == req.params.id);
    
    if (user) {
        res.json({ ...user, password: undefined });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Update user balance
app.post('/api/user/:id/balance', (req, res) => {
    const { amount, type } = req.body; // type: 'deposit' or 'withdraw'
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id == req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (type === 'deposit') {
        db.users[userIndex].balance += parseFloat(amount);
        db.users[userIndex].totalDeposited += parseFloat(amount);
    } else if (type === 'withdraw') {
        if (db.users[userIndex].balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        db.users[userIndex].balance -= parseFloat(amount);
        db.users[userIndex].totalWithdrawn += parseFloat(amount);
    }
    
    // Record transaction
    db.transactions.push({
        id: Date.now(),
        userId: req.params.id,
        type,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    writeDB(db);
    res.json({ 
        success: true, 
        newBalance: db.users[userIndex].balance 
    });
});

// Get crypto addresses
app.get('/api/crypto-addresses', (req, res) => {
    const db = readDB();
    res.json(db.cryptoAddresses);
});

// Update crypto addresses (admin only)
app.post('/api/crypto-addresses', (req, res) => {
    const { bitcoin, ethereum, usdt, adminKey } = req.body;
    
    if (adminKey !== 'myhandwork2025') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const db = readDB();
    db.cryptoAddresses = { bitcoin, ethereum, usdt };
    writeDB(db);
    
    res.json({ success: true, addresses: db.cryptoAddresses });
});

// Send broadcast email (admin only)
app.post('/api/broadcast-email', (req, res) => {
    const { subject, message, adminKey } = req.body;
    
    if (adminKey !== 'myhandwork2025') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const db = readDB();
    const emails = db.users.map(u => u.email);
    
    emails.forEach(email => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: `
                <h2>${subject}</h2>
                <div>${message.replace(/\n/g, '<br>')}</div>
                <br>
                <p>This is an official announcement from GlobalTrade360.</p>
                <p>Best regards,<br>GlobalTrade360 Team</p>
            `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('Email error:', error);
        });
    });
    
    res.json({ 
        success: true, 
        message: `Email sent to ${emails.length} users` 
    });
});

// AI chat message
app.post('/api/chat', (req, res) => {
    const { userId, message } = req.body;
    const db = readDB();
    
    // Store message
    db.messages.push({
        id: Date.now(),
        userId,
        message,
        response: generateAIResponse(message),
        timestamp: new Date().toISOString()
    });
    
    writeDB(db);
    
    res.json({ 
        response: db.messages[db.messages.length - 1].response 
    });
});

function generateAIResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('deposit') || lowerMsg.includes('payment')) {
        return 'Please use the deposit addresses provided in your dashboard. For Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. Always send the exact amount.';
    } else if (lowerMsg.includes('profit') || lowerMsg.includes('earn')) {
        return 'Based on current market analysis, I recommend the Professional plan (8.5% daily). Market conditions are favorable for growth.';
    } else if (lowerMsg.includes('withdraw')) {
        return 'Withdrawals are processed within 2-24 hours. Minimum withdrawal: $50. Contact support for urgent withdrawals.';
    } else if (lowerMsg.includes('bitcoin') || lowerMsg.includes('btc')) {
        return 'BTC analysis: Currently in accumulation phase. Good entry: $45K-$48K. Target: $55K in 2 weeks. RSI shows bullish divergence.';
    } else if (lowerMsg.includes('support')) {
        return 'For support, email: support@globaltrade360.com. Include your username and issue details for faster resolution.';
    } else {
        return 'I recommend our automated trading plans for consistent returns. The AI algorithm has 94.2% accuracy this month. Need specific advice?';
    }
}

// Get platform statistics
app.get('/api/stats', (req, res) => {
    const db = readDB();
    const stats = {
        totalUsers: db.users.length,
        totalDeposits: db.users.reduce((sum, u) => sum + u.totalDeposited, 0),
        totalWithdrawals: db.users.reduce((sum, u) => sum + u.totalWithdrawn, 0),
        activeInvestments: db.users.reduce((sum, u) => sum + u.investments.filter(i => i.active).length, 0),
        totalProfit: db.users.reduce((sum, u) => sum + (u.totalWithdrawn - u.totalDeposited), 0)
    };
    
    res.json(stats);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin login: globaltrade360 / myhandwork2025`);
    console.log(`Test user: testuser / Test123!`);
});
