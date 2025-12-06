// ==============================================
// GLOBALTRADE360 - CRYPTO FOREX INVESTMENT PLATFORM
// Complete Backend Server
// ==============================================

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// CONFIGURATION (Hardcoded for Render Deployment)
// ==============================================
const CONFIG = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: 'production',
  
  // Email Configuration (using your Gmail App Password)
  EMAIL_USER: 'stevenlogan362@gmail.com',
  EMAIL_PASS: 'ezdftcffuatisxel', // Your 16-char App Password
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  
  // Admin Configuration
  ADMIN_USERNAME: 'globaltrade360',
  ADMIN_PASSWORD: 'myhandwork2025',
  ADMIN_EMAIL: 'stevenlogan362@gmail.com',
  
  // Security
  JWT_SECRET: 'globaltrade360_myhandwork_2025_secret',
  
  // Platform Settings
  PLATFORM_NAME: 'GlobalTrade360',
  SUPPORT_EMAIL: 'support@globaltrade360.com',
  DEFAULT_CURRENCY: 'USD',
  MIN_DEPOSIT: 100,
  MIN_WITHDRAWAL: 50,
  WELCOME_BONUS: 50,
  
  // Crypto Addresses (Admin can change these)
  CRYPTO_ADDRESSES: {
    bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    usdt: 'TNS1V6WVLkQRL2VQGP1C7nKFQZ0Gq9Zq1e'
  }
};

// ==============================================
// MIDDLEWARE
// ==============================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from root

// ==============================================
// DATABASE SETUP
// ==============================================
const DB_FILE = path.join(__dirname, 'users.json');

// Initialize database with default data
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
              totalProfit: 425.00,
              dailyProfit: 85.00
            }
          ],
          transactions: [
            {
              id: 1,
              type: "deposit",
              amount: 1000,
              status: "completed",
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              type: "withdrawal",
              amount: 500,
              status: "completed",
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          joined: new Date().toISOString(),
          verified: true,
          lastLogin: null,
          isAdmin: false
        }
      ],
      admin: {
        username: CONFIG.ADMIN_USERNAME,
        password: CONFIG.ADMIN_PASSWORD,
        email: CONFIG.ADMIN_EMAIL,
        fullName: "Steven Logan",
        lastLogin: null
      },
      cryptoAddresses: CONFIG.CRYPTO_ADDRESSES,
      messages: [],
      platformStats: {
        totalUsers: 1,
        activeUsers: 1,
        totalInvestments: 1,
        totalVolume: 1000.00,
        totalProfitPaid: 425.00,
        successRate: 98.7,
        updatedAt: new Date().toISOString()
      },
      liveTrades: [],
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
      ]
    };
    
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log("✅ Database initialized with default data");
    return initialData;
  }
  return readDatabase();
}

// Read database
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return initializeDatabase();
  }
}

// Write to database
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing to database:", error);
    return false;
  }
}

// ==============================================
// EMAIL SERVICE
// ==============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS
  }
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.log("⚠️ Email configuration issue:", error.message);
    console.log("📧 Note: Emails may not send until Gmail App Password is properly configured");
  } else {
    console.log("✅ Email server is ready");
  }
});

// Email sending function
async function sendEmail(to, subject, htmlContent) {
  try {
    const mailOptions = {
      from: `"GlobalTrade360" <${CONFIG.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return false;
  }
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================
function generateUserId() {
  return Date.now();
}

function generateTransactionId() {
  return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
}

function calculateInvestmentProfit(investment) {
  const startDate = new Date(investment.startDate);
  const now = new Date();
  const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const dailyProfit = (investment.amount * investment.dailyRate) / 100;
  return {
    daysActive: daysDiff,
    totalProfit: dailyProfit * daysDiff,
    dailyProfit: dailyProfit
  };
}

function generateMarketData() {
  const basePrices = {
    btc: 45218.50,
    eth: 2415.75,
    xrp: 0.6245,
    eur_usd: 1.0850,
    gbp_usd: 1.2650,
    gold: 2034.50
  };
  
  const data = {};
  for (const [key, basePrice] of Object.entries(basePrices)) {
    const change = (Math.random() - 0.5) * 2;
    const price = basePrice * (1 + change / 100);
    data[key] = {
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      symbol: key.toUpperCase()
    };
  }
  
  return data;
}

// ==============================================
// API ROUTES
// ==============================================

// Serve main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get platform configuration
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      platformName: CONFIG.PLATFORM_NAME,
      supportEmail: CONFIG.SUPPORT_EMAIL,
      minDeposit: CONFIG.MIN_DEPOSIT,
      minWithdrawal: CONFIG.MIN_WITHDRAWAL,
      welcomeBonus: CONFIG.WELCOME_BONUS
    }
  });
});

// Get crypto addresses
app.get('/api/crypto-addresses', (req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    addresses: db.cryptoAddresses
  });
});

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, username, password, phone } = req.body;
    const db = readDatabase();
    
    // Validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    // Check if user exists
    if (db.users.some(u => u.email === email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }
    
    if (db.users.some(u => u.username === username)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already taken' 
      });
    }
    
    // Create new user
    const newUser = {
      id: generateUserId(),
      name,
      email,
      username,
      password, // In production, hash this!
      phone: phone || '',
      balance: CONFIG.WELCOME_BONUS,
      totalDeposited: 0,
      totalWithdrawn: 0,
      investments: [],
      transactions: [],
      joined: new Date().toISOString(),
      verified: false,
      lastLogin: null,
      isAdmin: false
    };
    
    db.users.push(newUser);
    db.platformStats.totalUsers = db.users.length;
    db.platformStats.updatedAt = new Date().toISOString();
    writeDatabase(db);
    
    // Send welcome email
    await sendEmail(
      email,
      'Welcome to GlobalTrade360!',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FFD700;">Welcome to GlobalTrade360, ${name}!</h2>
        <p>Your account has been successfully created.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #28a745;">🎁 $${CONFIG.WELCOME_BONUS} Welcome Bonus Added!</h3>
          <p>Your account has been credited with $${CONFIG.WELCOME_BONUS} to start your investment journey.</p>
        </div>
        <p><strong>Account Details:</strong></p>
        <ul>
          <li>Username: ${username}</li>
          <li>Email: ${email}</li>
          <li>Account Balance: $${CONFIG.WELCOME_BONUS}.00</li>
        </ul>
        <p>Start investing now and grow your wealth with our AI-powered trading platform.</p>
        <br>
        <p>Best regards,<br>
        <strong>GlobalTrade360 Team</strong><br>
        Email: ${CONFIG.SUPPORT_EMAIL}</p>
      </div>
      `
    );
    
    res.json({
      success: true,
      message: `Registration successful! $${CONFIG.WELCOME_BONUS} bonus added to your account.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        balance: newUser.balance,
        isAdmin: false
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// User login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const db = readDatabase();
    
    // Check admin login
    if (username === db.admin.username && password === db.admin.password) {
      db.admin.lastLogin = new Date().toISOString();
      writeDatabase(db);
      
      return res.json({
        success: true,
        isAdmin: true,
        user: {
          username: db.admin.username,
          email: db.admin.email,
          fullName: db.admin.fullName,
          isAdmin: true
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
      writeDatabase(db);
      
      res.json({
        success: true,
        isAdmin: false,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          balance: user.balance,
          investments: user.investments,
          isAdmin: false
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
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

// Get user profile
app.get('/api/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = readDatabase();
    const user = db.users.find(u => u.id == userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Calculate profits for active investments
    if (user.investments && user.investments.length > 0) {
      user.investments.forEach(investment => {
        if (investment.active) {
          const profitData = calculateInvestmentProfit(investment);
          investment.currentProfit = profitData.totalProfit;
          investment.dailyProfit = profitData.dailyProfit;
        }
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        investments: user.investments || [],
        transactions: user.transactions || [],
        joined: user.joined,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// Process deposit
app.post('/api/deposit', (req, res) => {
  try {
    const { userId, amount, cryptoType } = req.body;
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id == userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < CONFIG.MIN_DEPOSIT) {
      return res.status(400).json({
        success: false,
        error: `Minimum deposit is $${CONFIG.MIN_DEPOSIT}`
      });
    }
    
    // Get crypto address
    const cryptoAddress = db.cryptoAddresses[cryptoType.toLowerCase()];
    if (!cryptoAddress) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cryptocurrency selected'
      });
    }
    
    // Create transaction record
    const transaction = {
      id: generateTransactionId(),
      type: 'deposit',
      amount: depositAmount,
      cryptoType: cryptoType,
      status: 'pending',
      address: cryptoAddress,
      date: new Date().toISOString()
    };
    
    db.users[userIndex].transactions.push(transaction);
    writeDatabase(db);
    
    res.json({
      success: true,
      message: 'Deposit request created. Send cryptocurrency to the address below.',
      transaction: transaction,
      address: cryptoAddress,
      minConfirmations: 3
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Deposit processing failed'
    });
  }
});

// Process withdrawal
app.post('/api/withdraw', (req, res) => {
  try {
    const { userId, amount, walletAddress } = req.body;
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id == userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < CONFIG.MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal is $${CONFIG.MIN_WITHDRAWAL}`
      });
    }
    
    if (db.users[userIndex].balance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }
    
    // Create transaction record
    const transaction = {
      id: generateTransactionId(),
      type: 'withdrawal',
      amount: withdrawAmount,
      walletAddress: walletAddress,
      status: 'processing',
      date: new Date().toISOString()
    };
    
    db.users[userIndex].transactions.push(transaction);
    db.platformStats.totalProfitPaid += withdrawAmount;
    db.platformStats.updatedAt = new Date().toISOString();
    writeDatabase(db);
    
    // Send email notification
    sendEmail(
      db.users[userIndex].email,
      'Withdrawal Request Received',
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
        <br>
        <p>Best regards,<br>
        <strong>GlobalTrade360 Team</strong></p>
      </div>
      `
    );
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transaction: transaction
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Withdrawal processing failed'
    });
  }
});

// Create investment
app.post('/api/invest', (req, res) => {
  try {
    const { userId, plan, amount } = req.body;
    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id == userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const investmentAmount = parseFloat(amount);
    
    // Check balance
    if (db.users[userIndex].balance < investmentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }
    
    // Get plan details
    const planDetails = db.investmentPlans.find(p => p.name.toLowerCase() === plan.toLowerCase());
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        error: 'Invalid investment plan'
      });
    }
    
    // Check amount limits
    if (investmentAmount < planDetails.minAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum amount for ${plan} plan is $${planDetails.minAmount}`
      });
    }
    
    if (investmentAmount > planDetails.maxAmount) {
      return res.status(400).json({
        success: false,
        error: `Maximum amount for ${plan} plan is $${planDetails.maxAmount}`
      });
    }
    
    // Deduct from balance and create investment
    db.users[userIndex].balance -= investmentAmount;
    
    const investment = {
      id: generateUserId(),
      plan: planDetails.name,
      amount: investmentAmount,
      dailyRate: planDetails.dailyRate,
      duration: planDetails.duration,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      totalProfit: 0,
      dailyProfit: (investmentAmount * planDetails.dailyRate) / 100
    };
    
    db.users[userIndex].investments.push(investment);
    db.platformStats.totalInvestments++;
    db.platformStats.updatedAt = new Date().toISOString();
    writeDatabase(db);
    
    // Send investment confirmation email
    sendEmail(
      db.users[userIndex].email,
      'New Investment Created',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FFD700;">Investment Created Successfully</h2>
        <p>Hello ${db.users[userIndex].name},</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Investment Details</h3>
          <p><strong>Plan:</strong> ${planDetails.name}</p>
          <p><strong>Amount:</strong> $${investmentAmount}</p>
          <p><strong>Daily Rate:</strong> ${planDetails.dailyRate}%</p>
          <p><strong>Duration:</strong> ${planDetails.duration} days</p>
          <p><strong>Daily Profit:</strong> $${investment.dailyProfit.toFixed(2)}</p>
          <p><strong>Total Return:</strong> $${(investmentAmount + (investment.dailyProfit * planDetails.duration)).toFixed(2)}</p>
        </div>
        <p>Your investment is now active and earning profits daily!</p>
        <br>
        <p>Best regards,<br>
        <strong>GlobalTrade360 Team</strong></p>
      </div>
      `
    );
    
    res.json({
      success: true,
      message: `Investment created successfully in ${planDetails.name} plan`,
      investment: investment,
      newBalance: db.users[userIndex].balance
    });
  } catch (error) {
    console.error('Investment error:', error);
    res.status(500).json({
      success: false,
      error: 'Investment creation failed'
    });
  }
});

// Get market data
app.get('/api/market-data', (req, res) => {
  try {
    const marketData = generateMarketData();
    res.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
});

// Get live trades
app.get('/api/live-trades', (req, res) => {
  try {
    const db = readDatabase();
    
    // Generate some live trade activities
    const liveTrades = [
      { user: 'John D.', amount: 1250, profit: 106.25, time: '2 minutes ago', type: 'BTC/USD' },
      { user: 'Sarah M.', amount: 3500, profit: 297.50, time: '5 minutes ago', type: 'ETH/USD' },
      { user: 'Mike R.', amount: 750, profit: 63.75, time: '8 minutes ago', type: 'EUR/USD' },
      { user: 'Lisa K.', amount: 5200, profit: 442.00, time: '12 minutes ago', type: 'GOLD' },
      { user: 'David T.', amount: 2100, profit: 178.50, time: '15 minutes ago', type: 'XRP/USD' }
    ];
    
    // Update database with new trades
    db.liveTrades = liveTrades;
    writeDatabase(db);
    
    res.json({
      success: true,
      trades: liveTrades
    });
  } catch (error) {
    console.error('Live trades error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live trades'
    });
  }
});

// AI Chat response
app.post('/api/ai-chat', (req, res) => {
  try {
    const { message, userId } = req.body;
    const db = readDatabase();
    
    let response = '';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('deposit') || lowerMessage.includes('payment')) {
      response = `To deposit funds, go to the Deposit section and select a cryptocurrency. Our addresses are:<br><br>
      <strong>Bitcoin (BTC):</strong> ${db.cryptoAddresses.bitcoin}<br>
      <strong>Ethereum (ETH):</strong> ${db.cryptoAddresses.ethereum}<br>
      <strong>USDT (TRC20):</strong> ${db.cryptoAddresses.usdt}<br><br>
      Minimum deposit: $${CONFIG.MIN_DEPOSIT}. Send exact amount and wait for 3 confirmations.`;
    } else if (lowerMessage.includes('withdraw') || lowerMessage.includes('cash out')) {
      response = `Withdrawals are processed within 2-24 hours. Minimum withdrawal: $${CONFIG.MIN_WITHDRAWAL}.<br><br>
      Make sure your wallet address is correct. Contact support for urgent withdrawals.`;
    } else if (lowerMessage.includes('profit') || lowerMessage.includes('earn') || lowerMessage.includes('interest')) {
      response = `Our investment plans offer excellent returns:<br><br>
      <strong>Basic Plan:</strong> 5% daily for 30 days<br>
      <strong>Professional Plan:</strong> 8.5% daily for 45 days<br>
      <strong>VIP Plan:</strong> 12% daily for 60 days<br><br>
      All plans include capital return. Current market conditions favor the Professional Plan.`;
    } else if (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc')) {
      response = `Bitcoin analysis: Currently in accumulation phase. Good entry points: $45,000-$48,000.<br><br>
      Technical indicators show bullish divergence. Target: $55,000 in 2-3 weeks.<br>
      RSI: 56 (neutral), MACD: Bullish crossover imminent.`;
    } else if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('issue')) {
      response = `For support, please email: ${CONFIG.SUPPORT_EMAIL}<br><br>
      Include your username and detailed description of the issue.<br>
      Our support team responds within 1-4 hours.`;
    } else if (lowerMessage.includes('investment') || lowerMessage.includes('plan')) {
      response = `I recommend the <strong>Professional Plan (8.5% daily)</strong> for optimal risk/reward balance.<br><br>
      Minimum: $1,000, Maximum: $10,000<br>
      Duration: 45 days<br>
      Expected return: 382.5% total return<br><br>
      The AI trading system is currently showing 94.2% accuracy.`;
    } else {
      response = `I'm your AI trading advisor. I can help with:<br><br>
      • Deposit instructions and crypto addresses<br>
      • Withdrawal procedures<br>
      • Investment plan recommendations<br>
      • Market analysis (BTC, ETH, Forex)<br>
      • Technical analysis and trading signals<br><br>
      What would you like to know?`;
    }
    
    // Store message in database
    const chatMessage = {
      id: generateUserId(),
      userId: userId,
      message: message,
      response: response,
      timestamp: new Date().toISOString()
    };
    
    db.messages.push(chatMessage);
    writeDatabase(db);
    
    res.json({
      success: true,
      response: response
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'AI chat service is temporarily unavailable'
    });
  }
});

// ==============================================
// ADMIN ROUTES
// ==============================================

// Admin login verification middleware
function verifyAdmin(req, res, next) {
  const { adminKey } = req.query;
  
  if (adminKey === CONFIG.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Unauthorized admin access'
    });
  }
}

// Get all users (admin)
app.get('/api/admin/users', verifyAdmin, (req, res) => {
  try {
    const db = readDatabase();
    
    const users = db.users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
      investments: user.investments.length,
      joined: user.joined,
      lastLogin: user.lastLogin,
      verified: user.verified
    }));
    
    res.json({
      success: true,
      users: users,
      total: users.length
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Update crypto addresses (admin)
app.post('/api/admin/update-crypto', verifyAdmin, (req, res) => {
  try {
    const { bitcoin, ethereum, usdt } = req.body;
    const db = readDatabase();
    
    db.cryptoAddresses = {
      bitcoin: bitcoin || db.cryptoAddresses.bitcoin,
      ethereum: ethereum || db.cryptoAddresses.ethereum,
      usdt: usdt || db.cryptoAddresses.usdt,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    };
    
    writeDatabase(db);
    
    res.json({
      success: true,
      message: 'Crypto addresses updated successfully',
      addresses: db.cryptoAddresses
    });
  } catch (error) {
    console.error('Update crypto error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update crypto addresses'
    });
  }
});

// Send broadcast email (admin)
app.post('/api/admin/broadcast', verifyAdmin, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const db = readDatabase();
    
    // Get all user emails
    const userEmails = db.users.map(user => user.email);
    
    // Add admin email
    const allEmails = [...userEmails, CONFIG.ADMIN_EMAIL];
    
    // Send to all emails
    const emailPromises = allEmails.map(email =>
      sendEmail(
        email,
        `[GlobalTrade360 Announcement] ${subject}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFD700;">${subject}</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p><em>This is an official announcement from GlobalTrade360.</em></p>
          <p>Please do not reply to this email. Contact support if needed.</p>
          <br>
          <p>Best regards,<br>
          <strong>GlobalTrade360 Team</strong></p>
        </div>
        `
      )
    );
    
    await Promise.all(emailPromises);
    
    res.json({
      success: true,
      message: `Broadcast email sent to ${allEmails.length} recipients`
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast email'
    });
  }
});

// Get platform statistics (admin)
app.get('/api/admin/stats', verifyAdmin, (req, res) => {
  try {
    const db = readDatabase();
    
    // Update stats with some random growth
    db.platformStats.totalVolume += Math.random() * 1000;
    db.platformStats.totalProfitPaid += Math.random() * 500;
    db.platformStats.updatedAt = new Date().toISOString();
    writeDatabase(db);
    
    res.json({
      success: true,
      stats: db.platformStats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics'
    });
  }
});

// Get all transactions (admin)
app.get('/api/admin/transactions', verifyAdmin, (req, res) => {
  try {
    const db = readDatabase();
    
    // Collect all transactions from all users
    const allTransactions = [];
    db.users.forEach(user => {
      if (user.transactions && user.transactions.length > 0) {
        user.transactions.forEach(transaction => {
          allTransactions.push({
            userId: user.id,
            username: user.username,
            ...transaction
          });
        });
      }
    });
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      transactions: allTransactions,
      total: allTransactions.length
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// ==============================================
// START SERVER
// ==============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 GLOBALTRADE360 PLATFORM STARTED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`📍 Server running on port: ${PORT}`);
  console.log(`🌐 Access URL: http://localhost:${PORT}`);
  console.log(`🔐 Admin login: ${CONFIG.ADMIN_USERNAME} / ${CONFIG.ADMIN_PASSWORD}`);
  console.log(`👤 Test user: testuser / Test123!`);
  console.log(`📧 Support email: ${CONFIG.SUPPORT_EMAIL}`);
  console.log('='.repeat(60));
  console.log('✅ Platform is ready for deployment!');
  console.log('='.repeat(60));
  
  // Initialize database
  initializeDatabase();
});
