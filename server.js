// GlobalTrade360 Backend - Simple Version
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple database
let users = [
  {
    id: 1,
    email: 'admin@globalinvestment360',
    password: 'myhandwork', // Simple password for demo
    role: 'admin',
    name: 'Global Admin',
    balance: 100000,
    isActive: true
  }
];

let trades = [];

// Helper to find user
const findUser = (email, password) => {
  return users.find(u => u.email === email && u.password === password);
};

// ========== PUBLIC ROUTES ==========

// Welcome
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'GlobalTrade360 API is LIVE!',
    admin: 'admin@globalinvestment360',
    password: 'myhandwork'
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = findUser(email, password);
  if (!user) {
    return res.json({ success: false, message: 'Wrong email or password' });
  }
  
  if (!user.isActive) {
    return res.json({ success: false, message: 'Account disabled' });
  }
  
  // Simple token (just user ID)
  const token = `gt360_${user.id}_${Date.now()}`;
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      balance: user.balance,
      isActive: user.isActive
    }
  });
});

// Register
app.post('/api/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: 'Email already exists' });
  }
  
  const newUser = {
    id: users.length + 1,
    email,
    password,
    role: 'user',
    name,
    balance: 1000,
    isActive: true
  };
  
  users.push(newUser);
  
  res.json({
    success: true,
    message: 'Account created! You got $1000 bonus',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      balance: newUser.balance
    }
  });
});

// ========== PRIVATE ROUTES (Simple Auth) ==========

const checkAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('gt360_')) {
    return res.json({ success: false, message: 'Not authenticated' });
  }
  next();
};

// Get all users (Admin only)
app.get('/api/admin/users', checkAuth, (req, res) => {
  const userList = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    balance: u.balance,
    isActive: u.isActive
  }));
  
  res.json({ success: true, users: userList });
});

// Toggle user status
app.post('/api/admin/user/toggle', checkAuth, (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.json({ success: false, message: 'User not found' });
  }
  
  user.isActive = !user.isActive;
  
  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'disabled'}`,
    user
  });
});

// Update user balance
app.post('/api/admin/user/balance', checkAuth, (req, res) => {
  const { userId, amount, action } = req.body;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.json({ success: false, message: 'User not found' });
  }
  
  if (action === 'add') {
    user.balance += amount;
  } else if (action === 'subtract') {
    user.balance -= amount;
  }
  
  res.json({
    success: true,
    message: `Balance updated. New: $${user.balance}`,
    user
  });
});

// User trade
app.post('/api/trade', checkAuth, (req, res) => {
  const { userId, symbol, type, amount } = req.body;
  const user = users.find(u => u.id === userId);
  
  if (!user || !user.isActive) {
    return res.json({ success: false, message: 'Cannot trade' });
  }
  
  if (user.balance < amount) {
    return res.json({ success: false, message: 'Not enough balance' });
  }
  
  // Create trade
  const trade = {
    id: trades.length + 1,
    userId,
    symbol,
    type,
    amount,
    profit: (amount * 0.05 * (Math.random() > 0.4 ? 1 : -1)).toFixed(2),
    time: new Date().toLocaleTimeString(),
    status: 'active'
  };
  
  trades.push(trade);
  user.balance -= amount;
  
  res.json({
    success: true,
    message: 'Trade placed!',
    trade,
    newBalance: user.balance
  });
});

// Get user trades
app.get('/api/user/trades/:userId', checkAuth, (req, res) => {
  const userTrades = trades.filter(t => t.userId == req.params.userId);
  res.json({ success: true, trades: userTrades });
});

// Close trade
app.post('/api/trade/close', checkAuth, (req, res) => {
  const { tradeId, userId } = req.body;
  const trade = trades.find(t => t.id == tradeId && t.userId == userId);
  const user = users.find(u => u.id == userId);
  
  if (!trade) {
    return res.json({ success: false, message: 'Trade not found' });
  }
  
  trade.status = 'closed';
  user.balance += parseFloat(trade.amount) + parseFloat(trade.profit);
  
  res.json({
    success: true,
    message: `Trade closed. Profit: $${trade.profit}`,
    newBalance: user.balance
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ GlobalTrade360 Backend Running on port ${PORT}`);
  console.log(`🌐 Access: http://localhost:${PORT}`);
  console.log(`👑 Admin: admin@globalinvestment360 / myhandwork`);
});
