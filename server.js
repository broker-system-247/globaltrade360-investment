// GlobalTrade360 Professional Backend
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// JWT Secret - CHANGE THIS IN PRODUCTION
const JWT_SECRET = 'globaltrade360_myhandwork_2025_secret';

// Database
let users = [
    {
        id: 1,
        email: 'admin@globalinvestment360',
        password: '$2a$10$YOUR_HASHED_PASSWORD_HERE', // Will hash on first run
        role: 'admin',
        firstName: 'Global',
        lastName: 'Admin',
        balance: 100000,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        country: 'International'
    }
];

let deposits = [];
let trades = [];
let depositCounter = 1;
let tradeCounter = 1;

// Hash admin password on startup
async function initializeAdmin() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('myhandwork', salt);
    users[0].password = hashedPassword;
    console.log('✅ Admin password hashed successfully');
}
initializeAdmin();

// Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin only' });
    }
    next();
};

// ==================== PUBLIC ROUTES ====================

// Health check
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'GlobalTrade360 API',
        version: '2.0.0',
        status: 'operational'
    });
});

// Public endpoints info
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        platform: 'GlobalTrade360',
        description: 'Professional Forex & Crypto Trading Platform',
        features: ['Secure Trading', 'Multi-Asset', '24/7 Support', 'AI Trading'],
        currencies: ['USD', 'EUR', 'BTC', 'ETH'],
        established: '2023'
    });
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, country } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            role: 'user',
            firstName,
            lastName,
            phone: phone || '',
            country: country || 'Unknown',
            balance: 0,
            isActive: true,
            emailVerified: false,
            createdAt: new Date(),
            lastLogin: null,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalTrades: 0,
            totalProfit: 0
        };

        users.push(newUser);

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please verify your email.',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                balance: newUser.balance,
                isActive: newUser.isActive
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account disabled. Contact support.' });
        }

        user.lastLogin = new Date();

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                balance: user.balance,
                isActive: user.isActive,
                country: user.country,
                totalTrades: user.totalTrades || 0,
                totalProfit: user.totalProfit || 0
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/user/profile', authenticate, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            country: user.country,
            balance: user.balance,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            totalDeposits: user.totalDeposits || 0,
            totalWithdrawals: user.totalWithdrawals || 0,
            totalTrades: user.totalTrades || 0,
            totalProfit: user.totalProfit || 0
        }
    });
});

// Create deposit request
app.post('/api/user/deposit/request', authenticate, (req, res) => {
    const { amount, method, transactionId } = req.body;
    const user = users.find(u => u.id === req.user.id);

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const deposit = {
        id: depositCounter++,
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        amount: parseFloat(amount),
        method: method || 'Bank Transfer',
        transactionId: transactionId || '',
        status: 'pending',
        createdAt: new Date(),
        reviewedAt: null,
        reviewedBy: null
    };

    deposits.push(deposit);

    res.json({
        success: true,
        message: 'Deposit request submitted. Admin approval required.',
        deposit
    });
});

// Get user deposits
app.get('/api/user/deposits', authenticate, (req, res) => {
    const userDeposits = deposits.filter(d => d.userId === req.user.id);
    res.json({ success: true, deposits: userDeposits });
});

// Get user trades
app.get('/api/user/trades', authenticate, (req, res) => {
    const userTrades = trades.filter(t => t.userId === req.user.id);
    res.json({ success: true, trades: userTrades });
});

// Create trade (automated trading)
app.post('/api/user/trade/auto', authenticate, (req, res) => {
    const { amount, asset } = req.body;
    const user = users.find(u => u.id === req.user.id);

    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account disabled' });
    }

    if (user.balance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Simulate AI trading
    const profitPercentage = (Math.random() * 20 - 5) / 100; // -5% to +15%
    const profit = amount * profitPercentage;
    const endAmount = amount + profit;

    const trade = {
        id: tradeCounter++,
        userId: user.id,
        type: 'auto',
        asset: asset || 'BTC/USD',
        amount: parseFloat(amount),
        startBalance: user.balance,
        profit: profit,
        profitPercentage: (profitPercentage * 100).toFixed(2),
        endBalance: user.balance + profit,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(Date.now() + 60000), // 1 minute later
        aiSignal: profit > 0 ? 'BUY' : 'SELL',
        confidence: (Math.random() * 30 + 70).toFixed(1) // 70-100%
    };

    // Update user balance
    user.balance += profit;
    user.totalTrades = (user.totalTrades || 0) + 1;
    user.totalProfit = (user.totalProfit || 0) + profit;

    trades.push(trade);

    res.json({
        success: true,
        message: `AI trade completed. ${profit >= 0 ? 'Profit' : 'Loss'}: $${Math.abs(profit).toFixed(2)}`,
        trade,
        newBalance: user.balance
    });
});

// ==================== ADMIN ROUTES ====================

// Admin login (hidden endpoint)
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email && u.role === 'admin');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all users (admin)
app.get('/api/admin/users', authenticate, isAdmin, (req, res) => {
    const userList = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        balance: user.balance,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        totalDeposits: user.totalDeposits || 0,
        totalWithdrawals: user.totalWithdrawals || 0,
        totalTrades: user.totalTrades || 0,
        totalProfit: user.totalProfit || 0
    }));

    res.json({ success: true, users: userList });
});

// Get pending deposits (admin)
app.get('/api/admin/deposits/pending', authenticate, isAdmin, (req, res) => {
    const pendingDeposits = deposits.filter(d => d.status === 'pending');
    res.json({ success: true, deposits: pendingDeposits });
});

// Approve deposit (admin)
app.post('/api/admin/deposit/approve/:id', authenticate, isAdmin, (req, res) => {
    const depositId = parseInt(req.params.id);
    const deposit = deposits.find(d => d.id === depositId);

    if (!deposit) {
        return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    const user = users.find(u => u.id === deposit.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update deposit
    deposit.status = 'approved';
    deposit.reviewedAt = new Date();
    deposit.reviewedBy = req.user.email;

    // Update user balance
    user.balance += deposit.amount;
    user.totalDeposits = (user.totalDeposits || 0) + deposit.amount;

    res.json({
        success: true,
        message: 'Deposit approved successfully',
        deposit,
        user: {
            id: user.id,
            email: user.email,
            newBalance: user.balance
        }
    });
});

// Reject deposit (admin)
app.post('/api/admin/deposit/reject/:id', authenticate, isAdmin, (req, res) => {
    const depositId = parseInt(req.params.id);
    const deposit = deposits.find(d => d.id === depositId);

    if (!deposit) {
        return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    deposit.status = 'rejected';
    deposit.reviewedAt = new Date();
    deposit.reviewedBy = req.user.email;

    res.json({
        success: true,
        message: 'Deposit rejected',
        deposit
    });
});

// Update user status (admin)
app.post('/api/admin/user/:id/status', authenticate, isAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;

    res.json({
        success: true,
        message: `User account ${isActive ? 'activated' : 'deactivated'}`,
        user: {
            id: user.id,
            email: user.email,
            isActive: user.isActive
        }
    });
});

// Update user balance (admin)
app.post('/api/admin/user/:id/balance', authenticate, isAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const { amount, type, reason } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (type === 'add') {
        user.balance += parseFloat(amount);
    } else if (type === 'subtract') {
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }
        user.balance -= parseFloat(amount);
    }

    res.json({
        success: true,
        message: `Balance updated. New balance: $${user.balance}`,
        user: {
            id: user.id,
            email: user.email,
            newBalance: user.balance
        }
    });
});

// Get all trades (admin)
app.get('/api/admin/trades', authenticate, isAdmin, (req, res) => {
    res.json({
        success: true,
        trades: trades,
        total: trades.length,
        totalVolume: trades.reduce((sum, t) => sum + t.amount, 0),
        totalProfit: trades.reduce((sum, t) => sum + t.profit, 0)
    });
});

// Get system stats (admin)
app.get('/api/admin/stats', authenticate, isAdmin, (req, res) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    const pendingDeposits = deposits.filter(d => d.status === 'pending');
    const totalDeposits = deposits.filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + d.amount, 0);

    res.json({
        success: true,
        stats: {
            totalUsers,
            activeUsers,
            newUsers24h: users.filter(u => 
                new Date() - new Date(u.createdAt) < 24 * 60 * 60 * 1000
            ).length,
            totalBalance: parseFloat(totalBalance.toFixed(2)),
            pendingDeposits: pendingDeposits.length,
            pendingDepositsAmount: pendingDeposits.reduce((sum, d) => sum + d.amount, 0),
            totalDeposits: parseFloat(totalDeposits.toFixed(2)),
            totalTrades: trades.length,
            activeTrades: trades.filter(t => t.status === 'active').length,
            totalProfit: trades.reduce((sum, t) => sum + t.profit, 0).toFixed(2)
        }
    });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🌐 GlobalTrade360 Backend v2.0
    📡 Port: ${PORT}
    🔒 JWT Secret: Configured
    👑 Admin: admin@globalinvestment360
    🔑 Password: myhandwork
    🚀 Ready for professional trading platform
    `);
});
