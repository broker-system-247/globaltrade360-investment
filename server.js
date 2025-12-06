const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve files from root

// Database file
const DB_FILE = path.join(__dirname, 'users.json');

// Initialize database
function initDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [
                {
                    id: 1001,
                    name: "Test User",
                    email: "test@example.com",
                    username: "testuser",
                    password: "Test123!",
                    phone: "+1234567890",
                    balance: 1500.00,
                    totalDeposited: 2000.00,
                    totalWithdrawn: 500.00,
                    investments: [
                        {
                            id: 1,
                            plan: "Professional",
                            amount: 1000,
                            dailyRate: 8.5,
                            duration: 45,
                            startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
                            active: true,
                            totalProfit: 425.00
                        }
                    ],
                    transactions: [],
                    joined: new Date().toISOString(),
                    verified: true,
                    kycStatus: "approved",
                    lastLogin: null
                }
            ],
            admin: {
                username: "globaltrade360",
                password: "myhandwork2025",
                email: "stevenlogan362@gmail.com",
                fullName: "Steven Logan",
                lastLogin: null
            },
            cryptoAddresses: {
                bitcoin: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                ethereum: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                usdt: "TNS1V6WVLkQRL2VQGP1C7nKFQZ0Gq9Zq1e",
                updatedAt: new Date().toISOString(),
                updatedBy: "system"
            },
            messages: [],
            liveTrades: [],
            platformStats: {
                totalUsers: 1,
                activeUsers: 1,
                totalInvestments: 1,
                totalVolume: 1000.00,
                totalProfitPaid: 425.00,
                successRate: 98.7,
                updatedAt: new Date().toISOString()
            }
        };
        
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        console.log("✅ Database initialized with test data");
    }
}

// Read database
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log("🔄 Creating new database...");
        initDatabase();
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
}

// Write to database
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'stevenlogan362@gmail.com',
        pass: process.env.EMAIL_PASS || 'ezdftcffuatisxel'
    }
});

// Routes

// Serve main HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Get crypto addresses
app.get('/api/crypto', (req, res) => {
    const db = readDB();
    res.json({ success: true, addresses: db.cryptoAddresses });
});

// API: Register user
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, username, password, phone } = req.body;
        const db = readDB();
        
        // Validation
        if (!name || !email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user exists
        if (db.users.some(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        if (db.users.some(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            username,
            password,
            phone: phone || '',
            balance: 50.00,
            totalDeposited: 0,
            totalWithdrawn: 0,
            investments: [],
            transactions: [],
            joined: new Date().toISOString(),
            verified: false,
            kycStatus: 'pending',
            lastLogin: null
        };
        
        db.users.push(newUser);
        db.platformStats.totalUsers = db.users.length;
        writeDB(db);
        
        // Send welcome email (non-blocking)
        transporter.sendMail({
            from: `"GlobalTrade360" <${process.env.EMAIL_USER || 'stevenlogan362@gmail.com'}>`,
            to: email,
            subject: 'Welcome to GlobalTrade360!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #FFD700;">Welcome to GlobalTrade360, ${name}!</h2>
                    <p>Your account has been successfully created.</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #28a745;">🎁 $50 Welcome Bonus Added!</h3>
                        <p>Your account has been credited with $50 to start your investment journey.</p>
                    </div>
                    <p><strong>Account Details:</strong></p>
                    <ul>
                        <li>Username: ${username}</li>
                        <li>Email: ${email}</li>
                        <li>Account Balance: $50.00</li>
                    </ul>
                    <p>Start investing now at: <a href="${req.headers.origin}">GlobalTrade360 Platform</a></p>
                    <br>
                    <p>Best regards,<br>
                    <strong>GlobalTrade360 Team</strong></p>
                </div>
            `
        }).catch(err => console.log('Email error (non-critical):', err.message));
        
        res.json({ 
            success: true, 
            message: 'Registration successful! $50 bonus added.',
            user: { 
                id: newUser.id, 
                name: newUser.name, 
                email: newUser.email, 
                username: newUser.username,
                balance: newUser.balance 
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// API: Login user
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const db = readDB();
        
        // Check admin login
        if (username === db.admin.username && password === db.admin.password) {
            db.admin.lastLogin = new Date().toISOString();
            writeDB(db);
            
            return res.json({
                success: true,
                isAdmin: true,
                user: {
                    username: db.admin.username,
                    email: db.admin.email,
                    fullName: db.admin.fullName
                }
            });
        }
        
        // Check user login
        const user = db.users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password
        );
        
        if (user) {
            user.lastLogin = new Date().toISOString();
            writeDB(db);
            
            res.json({
                success: true,
                isAdmin: false,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    balance: user.balance,
                    investments: user.investments
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: 'Invalid username/email or password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// API: Get user data
app.get('/api/user/:id', (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id == req.params.id);
        
        if (user) {
            // Calculate real-time profits
            user.investments.forEach(inv => {
                if (inv.active) {
                    const daysActive = Math.floor((Date.now() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24));
                    inv.currentProfit = inv.amount * (inv.dailyRate / 100) * daysActive;
                }
            });
            
            res.json({ 
                success: true, 
                user: { 
                    ...user, 
                    password: undefined 
                } 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// API: Deposit request
app.post('/api/deposit', (req, res) => {
    try {
        const { userId, amount, cryptoType } = req.body;
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount < 100) {
            return res.status(400).json({ error: 'Minimum deposit is $100' });
        }
        
        // Add transaction record
        const transaction = {
            id: Date.now(),
            userId: userId,
            type: 'deposit',
            amount: depositAmount,
            currency: 'USD',
            cryptoType: cryptoType,
            status: 'pending',
            date: new Date().toISOString()
        };
        
        db.users[userIndex].transactions.push(transaction);
        db.platformStats.totalVolume += depositAmount;
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: 'Deposit request received',
            cryptoAddress: db.cryptoAddresses[cryptoType.toLowerCase()],
            transactionId: transaction.id
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ error: 'Deposit failed' });
    }
});

// API: Confirm deposit (admin would call this after payment)
app.post('/api/confirm-deposit', (req, res) => {
    try {
        const { userId, amount } = req.body;
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const depositAmount = parseFloat(amount);
        db.users[userIndex].balance += depositAmount;
        db.users[userIndex].totalDeposited += depositAmount;
        
        // Update transaction status
        const transaction = db.users[userIndex].transactions.find(t => t.type === 'deposit' && t.status === 'pending');
        if (transaction) {
            transaction.status = 'completed';
        }
        
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: 'Deposit confirmed',
            newBalance: db.users[userIndex].balance
        });
    } catch (error) {
        console.error('Confirm deposit error:', error);
        res.status(500).json({ error: 'Confirmation failed' });
    }
});

// API: Withdraw request
app.post('/api/withdraw', (req, res) => {
    try {
        const { userId, amount, walletAddress } = req.body;
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount < 50) {
            return res.status(400).json({ error: 'Minimum withdrawal is $50' });
        }
        
        if (db.users[userIndex].balance < withdrawAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Add transaction record
        const transaction = {
            id: Date.now(),
            userId: userId,
            type: 'withdrawal',
            amount: withdrawAmount,
            currency: 'USD',
            walletAddress: walletAddress,
            status: 'processing',
            date: new Date().toISOString()
        };
        
        db.users[userIndex].transactions.push(transaction);
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: 'Withdrawal request submitted',
            transactionId: transaction.id
        });
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({ error: 'Withdrawal failed' });
    }
});

// API: Complete withdrawal (admin would call this)
app.post('/api/complete-withdrawal', (req, res) => {
    try {
        const { userId, amount } = req.body;
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const withdrawAmount = parseFloat(amount);
        db.users[userIndex].balance -= withdrawAmount;
        db.users[userIndex].totalWithdrawn += withdrawAmount;
        db.platformStats.totalProfitPaid += withdrawAmount;
        
        // Update transaction status
        const transaction = db.users[userIndex].transactions.find(t => t.type === 'withdrawal' && t.status === 'processing');
        if (transaction) {
            transaction.status = 'completed';
        }
        
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: 'Withdrawal completed',
            newBalance: db.users[userIndex].balance
        });
    } catch (error) {
        console.error('Complete withdrawal error:', error);
        res.status(500).json({ error: 'Completion failed' });
    }
});

// API: Create investment
app.post('/api/invest', (req, res) => {
    try {
        const { userId, plan, amount } = req.body;
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const investmentAmount = parseFloat(amount);
        if (db.users[userIndex].balance < investmentAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Plan details
        const planDetails = {
            'basic': { dailyRate: 5, duration: 30, min: 100, max: 1000 },
            'professional': { dailyRate: 8.5, duration: 45, min: 1000, max: 10000 },
            'vip': { dailyRate: 12, duration: 60, min: 10000, max: 100000 }
        }[plan.toLowerCase()];
        
        if (!planDetails) {
            return res.status(400).json({ error: 'Invalid investment plan' });
        }
        
        if (investmentAmount < planDetails.min) {
            return res.status(400).json({ error: `Minimum for ${plan} plan is $${planDetails.min}` });
        }
        
        // Deduct amount and create investment
        db.users[userIndex].balance -= investmentAmount;
        
        const investment = {
            id: Date.now(),
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            amount: investmentAmount,
            dailyRate: planDetails.dailyRate,
            duration: planDetails.duration,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000).toISOString(),
            active: true,
            totalProfit: 0
        };
        
        db.users[userIndex].investments.push(investment);
        db.platformStats.totalInvestments++;
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: `Investment created in ${plan} plan`,
            investment: investment,
            newBalance: db.users[userIndex].balance
        });
    } catch (error) {
        console.error('Investment error:', error);
        res.status(500).json({ error: 'Investment failed' });
    }
});

// API: Update crypto addresses (admin)
app.post('/api/admin/update-crypto', (req, res) => {
    try {
        const { bitcoin, ethereum, usdt, adminKey } = req.body;
        
        if (adminKey !== 'myhandwork2025') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const db = readDB();
        db.cryptoAddresses.bitcoin = bitcoin || db.cryptoAddresses.bitcoin;
        db.cryptoAddresses.ethereum = ethereum || db.cryptoAddresses.ethereum;
        db.cryptoAddresses.usdt = usdt || db.cryptoAddresses.usdt;
        db.cryptoAddresses.updatedAt = new Date().toISOString();
        db.cryptoAddresses.updatedBy = 'admin';
        
        writeDB(db);
        
        res.json({ 
            success: true, 
            message: 'Crypto addresses updated',
            addresses: db.cryptoAddresses
        });
    } catch (error) {
        console.error('Update crypto error:', error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// API: Broadcast email (admin)
app.post('/api/admin/broadcast', async (req, res) => {
    try {
        const { subject, message, adminKey } = req.body;
        
        if (adminKey !== 'myhandwork2025') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const db = readDB();
        
        // In production, this would send to all users
        // For demo, send to admin email
        await transporter.sendMail({
            from: `"GlobalTrade360 Admin" <${process.env.EMAIL_USER || 'stevenlogan362@gmail.com'}>`,
            to: db.admin.email,
            subject: `[BROADCAST] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>${subject}</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                    <p><em>This message was sent to all platform users.</em></p>
                </div>
            `
        });
        
        res.json({ 
            success: true, 
            message: 'Broadcast email sent to all users' 
        });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ error: 'Failed to send broadcast' });
    }
});

// API: Get platform stats
app.get('/api/stats', (req, res) => {
    try {
        const db = readDB();
        
        // Update stats with random growth
        db.platformStats.totalVolume += Math.random() * 1000;
        db.platformStats.totalProfitPaid += Math.random() * 500;
        db.platformStats.updatedAt = new Date().toISOString();
        writeDB(db);
        
        res.json({ 
            success: true, 
            stats: db.platformStats 
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// API: Get live trades
app.get('/api/live-trades', (req, res) => {
    const trades = [
        { user: 'John D.', amount: 1000, profit: 85, time: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { user: 'Sarah M.', amount: 2500, profit: 212.5, time: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { user: 'Mike R.', amount: 500, profit: 42.5, time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { user: 'Lisa K.', amount: 7500, profit: 637.5, time: new Date(Date.now() - 45 * 60 * 1000).toISOString() }
    ];
    
    res.json({ success: true, trades });
});

// API: AI chat response
app.post('/api/ai-chat', (req, res) => {
    const { message } = req.body;
    
    const responses = {
        deposit: `Use these deposit addresses:<br>
        <strong>Bitcoin:</strong> 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa<br>
        <strong>Ethereum:</strong> 0x742d35Cc6634C0532925a3b844Bc454e4438f44e<br>
        <strong>USDT:</strong> TNS1V6WVLkQRL2VQGP1C7nKFQZ0Gq9Zq1e<br>
        Minimum deposit: $100. Send exact amount and wait for confirmation.`,
        
        profit: 'Current market analysis shows bullish trends. Professional plan (8.5% daily) is optimal. Consider investing in BTC/ETH pairs.',
        
        withdraw: 'Withdrawals processed in 2-24 hours. Minimum: $50. Ensure wallet address is correct.',
        
        support: 'Contact support: stevenlogan362@gmail.com. Include username and issue details.',
        
        bitcoin: 'BTC analysis: Strong buy signal. Current accumulation phase. Target: $55,000. Good entry: $45K-$48K.',
        
        default: 'I recommend automated trading with 94.2% success rate. Which market interests you: Crypto or Forex?'
    };
    
    const msg = message.toLowerCase();
    let response = responses.default;
    
    if (msg.includes('deposit') || msg.includes('pay')) response = responses.deposit;
    else if (msg.includes('profit') || msg.includes('earn')) response = responses.profit;
    else if (msg.includes('withdraw') || msg.includes('cash out')) response = responses.withdraw;
    else if (msg.includes('support') || msg.includes('help')) response = responses.support;
    else if (msg.includes('bitcoin') || msg.includes('btc')) response = responses.bitcoin;
    
    res.json({ 
        success: true, 
        response: response 
    });
});

// API: Market data
app.get('/api/market-data', (req, res) => {
    const data = {
        btc: { price: 45218.50 + (Math.random() * 1000 - 500), change: 2.3 + (Math.random() - 0.5) },
        eth: { price: 2415.75 + (Math.random() * 100 - 50), change: 1.8 + (Math.random() - 0.3) },
        xrp: { price: 0.6245 + (Math.random() * 0.1 - 0.05), change: -0.5 + (Math.random() - 0.5) },
        eur_usd: { price: 1.0850 + (Math.random() * 0.01 - 0.005), change: 0.2 + (Math.random() - 0.5) },
        gold: { price: 2034.50 + (Math.random() * 10 - 5), change: 0.8 + (Math.random() - 0.5) }
    };
    
    res.json({ success: true, data });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GlobalTrade360 Platform running on port ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`🔐 Admin: globaltrade360 / myhandwork2025`);
    console.log(`👤 Test User: testuser / Test123!`);
    console.log(`📧 Email configured: ${process.env.EMAIL_USER || 'stevenlogan362@gmail.com'}`);
    
    // Initialize database
    initDatabase();
});
