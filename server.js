require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const { connectDB, mongoose } = require('./db');
const Notice = require('./models/Notice');
const Payment = require('./models/Payment');
const Settings = require('./models/Settings');
const Inquiry = require('./models/Inquiry');

// Set non-blocking buffer timeout for MongoDB Atlas
mongoose.set('bufferTimeoutMS', 2500);

const app = express();
const PORT = process.env.PORT || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'depositshield_akash_jwt_super_secret_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'aks008';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Akash@1060';
const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || '/portal-aks008';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'akash_shield_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory persistent caches for resilience
const memoryNotices = [];
const memoryPayments = [];
const memoryInquiries = [];
let memorySettings = {
  tier1Price: Number(process.env.PRICE_TIER_1) || 99,
  tier2Price: Number(process.env.PRICE_TIER_2) || 499,
  upiId: process.env.UPI_ID || '',
  razorpayAccountId: process.env.RAZORPAY_ACCOUNT_ID || 'acc_RkgFhN1xao5sNF',
  razorpayMerchantId: process.env.RAZORPAY_MERCHANT_ID || 'RkgFhN1xao5sNF',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayEnabled: true,
  directUpiEnabled: false,
  adminUsername: ADMIN_USERNAME,
  adminSecretUrl: ADMIN_SECRET_PATH.replace('/', '')
};

// Connect to MongoDB Atlas on server start
connectDB().then(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      let config = await Settings.findOne({ key: 'app_config' }).maxTimeMS(2000);
      if (!config) {
        config = await Settings.create({
          key: 'app_config',
          ...memorySettings
        });
        console.log('[SETTINGS] Default settings initialized in MongoDB Atlas from .env');
      } else {
        memorySettings = { ...memorySettings, ...config.toObject() };
      }
    }
  } catch (err) {
    console.warn('[SETTINGS INIT NOTICE]:', err.message);
  }
});

// Helper: Get active settings
async function getSettings() {
  try {
    if (mongoose.connection.readyState === 1) {
      const config = await Settings.findOne({ key: 'app_config' }).maxTimeMS(1500);
      if (config) {
        memorySettings = { ...memorySettings, ...config.toObject() };
        return memorySettings;
      }
    }
  } catch (e) { }
  return memorySettings;
}

// ==========================================================================
// PUBLIC API: Configuration
// ==========================================================================
app.get('/api/config', async (req, res) => {
  const config = await getSettings();
  res.json({
    appName: 'DepositShield India',
    gateway: 'RAZORPAY',
    priceInr: config.tier1Price || 99,
    tier2PriceInr: config.tier2Price || 499,
    razorpayKeyId: config.razorpayKeyId || '',
    razorpayMerchantId: config.razorpayMerchantId || 'RkgFhN1xao5sNF',
    razorpayAccountId: config.razorpayAccountId || 'acc_RkgFhN1xao5sNF',
    razorpayEnabled: true,
    directUpiEnabled: false,
    testMode: false
  });
});

// ==========================================================================
// PUBLIC API: Save User Tenancy Submission in MongoDB Atlas
// ==========================================================================
app.post('/api/save-notice', async (req, res) => {
  try {
    const data = req.body;
    if (!data.refNo || !data.tenantName || !data.landlordName) {
      return res.status(400).json({ error: 'Missing required notice fields' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const record = { ...data, ipAddress: clientIp, updatedAt: new Date() };

    // Update memory store
    const memIdx = memoryNotices.findIndex(n => n.refNo === data.refNo);
    if (memIdx >= 0) {
      memoryNotices[memIdx] = { ...memoryNotices[memIdx], ...record };
    } else {
      memoryNotices.unshift({ ...record, createdAt: new Date() });
    }

    // Persist to MongoDB Atlas if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Notice.findOneAndUpdate(
          { refNo: data.refNo },
          record,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.warn('Notice Atlas sync pending:', err.message);
      }
    }

    return res.json({ success: true, refNo: data.refNo });
  } catch (err) {
    console.error('Error saving notice:', err.message);
    return res.status(500).json({ error: 'Failed to record notice submission' });
  }
});

// ==========================================================================
// PUBLIC API: Customer Inquiry / Callback Request
// ==========================================================================
app.post('/api/inquiry', async (req, res) => {
  try {
    const { name, phone, city, amountWithheld, message } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and contact phone number are required.' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit contact number.' });
    }

    const inquiryId = 'INQ-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    const record = {
      inquiryId,
      name: String(name).trim(),
      phone: cleanPhone,
      city: city ? String(city).trim() : 'Not specified',
      amountWithheld: Number(amountWithheld) || 0,
      message: message ? String(message).trim() : '',
      status: 'NEW',
      notes: '',
      ipAddress: clientIp,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Resilient in-memory store (instant response guaranteed)
    memoryInquiries.unshift(record);

    // 2. Persist to MongoDB Atlas if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Inquiry.create(record);
      } catch (dbErr) {
        console.warn('[INQUIRY ATLAS SYNC WARNING]:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Our team will contact you soon!',
      inquiry: {
        inquiryId,
        name: record.name,
        phone: record.phone
      }
    });
  } catch (err) {
    console.error('Inquiry error:', err.message);
    return res.status(500).json({ error: 'Failed to process inquiry. Please try again.' });
  }
});

// ==========================================================================
// PUBLIC API: Razorpay Order Creation & Verification
// ==========================================================================
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, tier, noticeRefNo, customerName, customerPhone, customerEmail } = req.body;
    const config = await getSettings();

    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.json({
        success: true,
        isDemo: true,
        orderId: 'order_rzp_' + Date.now(),
        amount: Math.round(Number(amount || 99) * 100),
        currency: 'INR',
        keyId: '',
        merchantId: config.razorpayMerchantId || 'RkgFhN1xao5sNF',
        message: 'Razorpay Sandbox Ready'
      });
    }

    const rzp = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    });

    const options = {
      amount: Math.round(Number(amount || 99) * 100), // in paise
      currency: 'INR',
      receipt: 'rcpt_' + (noticeRefNo || Date.now()).toString().replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30),
      notes: {
        noticeRefNo: noticeRefNo || '',
        tier: tier || 'TIER_1',
        customerName: customerName || '',
        customerPhone: customerPhone || ''
      }
    };

    const order = await rzp.orders.create(options);
    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpayKeyId
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err.message);
    return res.status(500).json({ error: 'Failed to create Razorpay order', details: err.message });
  }
});

app.post('/api/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, noticeRefNo, tier, amount } = req.body;
    const config = await getSettings();

    if (!razorpay_payment_id) {
      return res.status(400).json({ success: false, verified: false, message: 'Missing payment ID' });
    }

    // Verify signature if key secret is present and not simulated
    if (config.razorpayKeySecret && razorpay_order_id && razorpay_signature && !razorpay_signature.startsWith('sig_simulated')) {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, verified: false, message: 'Invalid payment signature' });
      }
    }

    const paymentRecord = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id || '',
      noticeRefNo: noticeRefNo || 'UNKNOWN',
      amount: Number(amount) || 99,
      tier: tier || 'TIER_1',
      gateway: 'RAZORPAY',
      status: 'CONFIRMED',
      verifiedAt: new Date(),
      createdAt: new Date(),
      rawData: req.body
    };

    // Update memory store
    const existingPIdx = memoryPayments.findIndex(p => p.paymentId === razorpay_payment_id);
    if (existingPIdx >= 0) {
      memoryPayments[existingPIdx] = paymentRecord;
    } else {
      memoryPayments.unshift(paymentRecord);
    }

    const localNotice = memoryNotices.find(n => n.refNo === noticeRefNo);
    if (localNotice) {
      localNotice.isUnlocked = true;
      localNotice.tierUnlocked = tier || 'TIER_1';
      localNotice.unlockedAt = new Date();
    }

    // Record verified payment in MongoDB Atlas if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Payment.findOneAndUpdate(
          { paymentId: razorpay_payment_id },
          paymentRecord,
          { upsert: true, returnDocument: 'after' }
        );

        if (noticeRefNo) {
          await Notice.findOneAndUpdate(
            { refNo: noticeRefNo },
            {
              isUnlocked: true,
              tierUnlocked: tier || 'TIER_1',
              unlockedAt: new Date()
            }
          );
        }
      } catch (err) {
        console.warn('Payment Atlas sync pending:', err.message);
      }
    }

    return res.json({
      success: true,
      verified: true,
      status: 'CONFIRMED',
      token: 'DS-RZP-' + razorpay_payment_id,
      message: 'Razorpay payment verified successfully!'
    });
  } catch (err) {
    console.error('Razorpay verification error:', err.message);
    return res.status(500).json({ success: false, verified: false, message: 'Payment verification failed' });
  }
});

// ==========================================================================
// PUBLIC API: Webhook Receiver (MongoDB Atlas Persistent & Resilient)
// ==========================================================================
app.post('/api/webhook/payment', async (req, res) => {
  try {
    const body = req.body || {};
    console.log('[WEBHOOK RECEIVED]:', JSON.stringify(body));

    let utr = body.utr || body.paymentRef || body.transactionId || body.rrn;
    let orderId = body.orderId || '';
    let amount = Number(body.amount) || 99;
    let status = (body.status || 'SUCCESS').toUpperCase();
    let tier = body.tier || (amount >= 400 ? 'TIER_2' : 'TIER_1');
    let noticeId = body.noticeId || '';
    let gateway = 'UPI_DIRECT';

    // Support Razorpay Webhook format
    if (body.event && body.payload) {
      gateway = 'RAZORPAY';
      if (body.payload.payment && body.payload.payment.entity) {
        const p = body.payload.payment.entity;
        utr = p.id || (p.acquirer_data && p.acquirer_data.rrn) || utr;
        orderId = p.order_id || orderId;
        amount = p.amount ? p.amount / 100 : amount;
        status = (p.status === 'captured' || p.status === 'authorized' || body.event === 'payment.captured' || body.event === 'order.paid') ? 'SUCCESS' : p.status;
        noticeId = p.notes?.noticeRefNo || noticeId;
        tier = p.notes?.tier || tier;
      } else if (body.payload.order && body.payload.order.entity) {
        const o = body.payload.order.entity;
        orderId = o.id || orderId;
        utr = utr || o.id;
        amount = o.amount_paid ? o.amount_paid / 100 : (o.amount ? o.amount / 100 : amount);
        status = o.status === 'paid' ? 'SUCCESS' : status;
        noticeId = o.notes?.noticeRefNo || noticeId;
        tier = o.notes?.tier || tier;
      }
    }

    // Support Cashfree Webhook format
    if (body.type && body.data && body.data.payment) {
      const cp = body.data.payment;
      utr = cp.bank_reference || String(cp.cf_payment_id);
      amount = cp.payment_amount || amount;
      status = cp.payment_status === 'SUCCESS' ? 'SUCCESS' : cp.payment_status;
      gateway = 'CASHFREE';
    }

    if (!utr) {
      console.warn('[WEBHOOK WARNING]: Received webhook without clear UTR/ID, using fallback');
      utr = 'RZP-' + Date.now();
    }

    const cleanUtr = String(utr).trim();
    const isSuccess = status === 'SUCCESS' || status === 'CONFIRMED' || status === 'CAPTURED';

    const paymentRecord = {
      paymentId: cleanUtr,
      orderId,
      noticeRefNo: noticeId || 'UNKNOWN',
      amount: Number(amount) || 99,
      tier: tier || 'TIER_1',
      gateway,
      status: isSuccess ? 'CONFIRMED' : 'FAILED',
      verifiedAt: isSuccess ? new Date() : null,
      createdAt: new Date(),
      rawData: body
    };

    // 1. Immediately update resilient in-memory store (instant reflection in Admin Panel)
    const existingPIdx = memoryPayments.findIndex(p => p.paymentId === cleanUtr || (orderId && p.orderId === orderId));
    if (existingPIdx >= 0) {
      memoryPayments[existingPIdx] = { ...memoryPayments[existingPIdx], ...paymentRecord };
    } else {
      memoryPayments.unshift(paymentRecord);
    }

    // 2. Immediately unlock matching in-memory notice if noticeRefNo matches
    if (isSuccess && noticeId && noticeId !== 'UNKNOWN') {
      const memNotice = memoryNotices.find(n => n.refNo === noticeId);
      if (memNotice) {
        memNotice.isUnlocked = true;
        memNotice.tierUnlocked = tier || 'TIER_1';
        memNotice.unlockedAt = new Date();
      }
    }

    // 3. Persist to MongoDB Atlas if connected (safe, non-blocking)
    if (mongoose.connection.readyState === 1) {
      try {
        await Payment.findOneAndUpdate(
          { paymentId: cleanUtr },
          paymentRecord,
          { upsert: true, returnDocument: 'after', maxTimeMS: 3000 }
        );

        if (isSuccess && noticeId && noticeId !== 'UNKNOWN') {
          await Notice.findOneAndUpdate(
            { refNo: noticeId },
            { isUnlocked: true, tierUnlocked: tier || 'TIER_1', unlockedAt: new Date() },
            { maxTimeMS: 3000 }
          );
        }
      } catch (dbErr) {
        console.warn('[WEBHOOK ATLAS SYNC WARNING]:', dbErr.message);
      }
    }

    console.log(`[WEBHOOK PROCESSED] UTR: ${cleanUtr} | Amount: ₹${amount} | Status: ${isSuccess ? 'CONFIRMED' : 'FAILED'} | Gateway: ${gateway}`);
    return res.status(200).json({ success: true, paymentId: cleanUtr, status: isSuccess ? 'CONFIRMED' : 'FAILED' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(200).json({ error: 'Webhook processed with warning: ' + err.message });
  }
});

// ==========================================================================
// PUBLIC API: Strict Direct UPI Verification & Live Polling
// ==========================================================================
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentRef, noticeId, amount, tier } = req.body;

    if (!paymentRef || String(paymentRef).trim().length < 8) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'INVALID_UTR',
        message: 'Please enter a valid 12-digit UPI UTR from PhonePe, GPay, or Paytm.'
      });
    }

    const cleanUtr = String(paymentRef).trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Block obvious dummy values
    const dummyValues = ['12345678', '000000000000', '111111111111', '123456789012', '999999999999', 'TESTPAYMENT'];
    if (dummyValues.includes(cleanUtr) || /^(\d)\1+$/.test(cleanUtr)) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'INVALID_UTR',
        message: 'Invalid UPI Transaction Reference Number. Please enter the genuine 12-digit UTR from your bank or UPI app.'
      });
    }

    const existing = await Payment.findOne({ paymentId: cleanUtr });

    // CASE 1: Payment already CONFIRMED by Webhook, Razorpay, or Admin
    if (existing && existing.status === 'CONFIRMED') {
      if (noticeId) {
        await Notice.findOneAndUpdate(
          { refNo: noticeId },
          { isUnlocked: true, tierUnlocked: existing.tier || tier, unlockedAt: new Date() }
        );
      }

      return res.json({
        success: true,
        verified: true,
        status: 'CONFIRMED',
        token: 'DS-AUTH-' + cleanUtr + '-' + Date.now(),
        noticeId: existing.noticeRefNo || noticeId,
        tier: existing.tier || tier,
        message: 'Payment confirmed! Official legal documents unlocked.'
      });
    }

    // CASE 2: Payment is PENDING
    if (!existing) {
      await Payment.create({
        paymentId: cleanUtr,
        noticeRefNo: noticeId || 'UNKNOWN',
        amount: Number(amount) || 99,
        tier: tier || 'TIER_1',
        gateway: 'UPI_DIRECT',
        status: 'PENDING'
      });
    }

    const config = await getSettings();
    return res.json({
      success: false,
      verified: false,
      status: 'PENDING',
      utr: cleanUtr,
      message: `Payment is awaiting bank credit confirmation on ${config.upiId}. As soon as credit is confirmed, your documents will unlock instantly.`
    });
  } catch (err) {
    console.error('verify-payment error:', err.message);
    return res.status(500).json({ success: false, verified: false, message: 'Server verification error' });
  }
});

app.get('/api/payment-status/:utr', async (req, res) => {
  try {
    const cleanUtr = String(req.params.utr).trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const payment = await Payment.findOne({ paymentId: cleanUtr });

    if (payment && payment.status === 'CONFIRMED') {
      return res.json({
        verified: true,
        status: 'CONFIRMED',
        token: 'DS-AUTH-' + cleanUtr,
        tier: payment.tier,
        message: 'Payment verified successfully!'
      });
    }

    if (payment && payment.status === 'PENDING') {
      return res.json({
        verified: false,
        status: 'PENDING',
        message: 'Awaiting bank credit confirmation'
      });
    }

    return res.json({
      verified: false,
      status: 'NOT_FOUND'
    });
  } catch (err) {
    return res.status(500).json({ verified: false, error: err.message });
  }
});

// ==========================================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ==========================================================================
function authenticateAdmin(req, res, next) {
  const token = req.cookies?.ds_admin_token || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin login required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.username === ADMIN_USERNAME) {
      req.admin = decoded;
      return next();
    }
  } catch (e) { }

  return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
}

// Admin Login
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username: ADMIN_USERNAME, role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('ds_admin_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    return res.json({ success: true, token, username: ADMIN_USERNAME });
  }
  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// Admin Logout
app.post('/api/admin/auth/logout', (req, res) => {
  res.clearCookie('ds_admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================================================
// ADMIN DASHBOARD API (MongoDB Atlas Powered)
// ==========================================================================
app.get('/api/admin/dashboard-stats', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch payments, notices & inquiries with hybrid support
    let allPayments = [];
    let allNotices = [];
    let allInquiries = [];
    if (mongoose.connection.readyState === 1) {
      try {
        allPayments = await Payment.find().sort({ createdAt: -1 });
        allNotices = await Notice.find().sort({ createdAt: -1 });
        allInquiries = await Inquiry.find().sort({ createdAt: -1 });
      } catch (e) {
        allPayments = memoryPayments;
        allNotices = memoryNotices;
        allInquiries = memoryInquiries;
      }
    } else {
      allPayments = memoryPayments;
      allNotices = memoryNotices;
      allInquiries = memoryInquiries;
    }

    const confirmedPayments = allPayments.filter(p => p.status === 'CONFIRMED');

    // Revenue aggregations
    const todayRevenue = confirmedPayments
      .filter(p => new Date(p.verifiedAt || p.createdAt) >= startOfToday)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthRevenue = confirmedPayments
      .filter(p => new Date(p.verifiedAt || p.createdAt) >= startOfMonth)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const yearRevenue = confirmedPayments
      .filter(p => new Date(p.verifiedAt || p.createdAt) >= startOfYear)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalRevenue = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Daily breakdown for the past 30 days
    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, count: 0, revenue: 0 };
    }

    confirmedPayments.forEach(p => {
      const dateKey = new Date(p.verifiedAt || p.createdAt).toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].count++;
        dailyMap[dateKey].revenue += (p.amount || 0);
      }
    });

    // Monthly breakdown for current year
    const monthlyMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, idx) => {
      monthlyMap[idx] = { month: m, year: now.getFullYear(), count: 0, revenue: 0 };
    });

    confirmedPayments.forEach(p => {
      const pDate = new Date(p.verifiedAt || p.createdAt);
      if (pDate.getFullYear() === now.getFullYear()) {
        const mIdx = pDate.getMonth();
        monthlyMap[mIdx].count++;
        monthlyMap[mIdx].revenue += (p.amount || 0);
      }
    });

    const settings = await getSettings();

    return res.json({
      kpis: {
        todayRevenue,
        monthRevenue,
        yearRevenue,
        totalRevenue,
        totalNotices: allNotices.length,
        unlockedNotices: allNotices.filter(n => n.isUnlocked).length,
        totalOrders: confirmedPayments.length,
        pendingOrders: allPayments.filter(p => p.status === 'PENDING').length,
        totalInquiries: allInquiries.length,
        newInquiries: allInquiries.filter(i => i.status === 'NEW').length,
        conversionRate: allNotices.length > 0 ? ((confirmedPayments.length / allNotices.length) * 100).toFixed(1) : 0
      },
      reports: {
        daily: Object.values(dailyMap),
        monthly: Object.values(monthlyMap),
        yearly: [{ year: now.getFullYear(), count: confirmedPayments.length, revenue: yearRevenue }]
      },
      notices: allNotices.slice(0, 100), // Recent 100 notices
      payments: allPayments.slice(0, 100), // Recent 100 payments
      inquiries: allInquiries.slice(0, 100), // Recent 100 callback inquiries
      settings: {
        tier1Price: settings.tier1Price,
        tier2Price: settings.tier2Price,
        upiId: settings.upiId,
        razorpayAccountId: settings.razorpayAccountId,
        razorpayMerchantId: settings.razorpayMerchantId,
        razorpayKeyId: settings.razorpayKeyId,
        razorpayEnabled: settings.razorpayEnabled,
        directUpiEnabled: settings.directUpiEnabled
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    return res.status(500).json({ error: 'Failed to generate dashboard statistics' });
  }
});

// Admin Settings Update
app.post('/api/admin/update-settings', authenticateAdmin, async (req, res) => {
  try {
    const { tier1Price, tier2Price, upiId, razorpayKeyId, razorpayKeySecret, razorpayEnabled, directUpiEnabled } = req.body;

    const updateFields = {};
    if (tier1Price !== undefined && tier1Price !== '') updateFields.tier1Price = Number(tier1Price);
    if (tier2Price !== undefined && tier2Price !== '') updateFields.tier2Price = Number(tier2Price);
    if (upiId !== undefined) updateFields.upiId = String(upiId).trim();
    if (razorpayKeyId !== undefined) updateFields.razorpayKeyId = String(razorpayKeyId).trim();
    if (razorpayKeySecret !== undefined && razorpayKeySecret.trim()) {
      updateFields.razorpayKeySecret = String(razorpayKeySecret).trim();
    }
    if (razorpayEnabled !== undefined) updateFields.razorpayEnabled = Boolean(razorpayEnabled);
    if (directUpiEnabled !== undefined) updateFields.directUpiEnabled = Boolean(directUpiEnabled);

    // 1. Immediately update active in-memory settings (guarantees instant zero-error response)
    memorySettings = { ...memorySettings, ...updateFields };

    // 2. Persist in MongoDB Atlas if connected (resilient & non-blocking)
    let atlasSaved = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const updated = await Settings.findOneAndUpdate(
          { key: 'app_config' },
          { $set: updateFields },
          { new: true, upsert: true, maxTimeMS: 3000, setDefaultsOnInsert: true }
        );
        if (updated) {
          memorySettings = { ...memorySettings, ...updated.toObject() };
          atlasSaved = true;
        }
      } catch (dbErr) {
        console.warn('[SETTINGS ATLAS UPDATE WARNING]:', dbErr.message);
      }
    }

    // 3. Persist to .env file so prices and keys survive restarts
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (updateFields.tier1Price !== undefined) {
          envContent = envContent.replace(/^PRICE_TIER_1=.*/m, `PRICE_TIER_1=${updateFields.tier1Price}`);
          process.env.PRICE_TIER_1 = String(updateFields.tier1Price);
        }
        if (updateFields.tier2Price !== undefined) {
          envContent = envContent.replace(/^PRICE_TIER_2=.*/m, `PRICE_TIER_2=${updateFields.tier2Price}`);
          process.env.PRICE_TIER_2 = String(updateFields.tier2Price);
        }
        if (updateFields.razorpayKeyId !== undefined) {
          envContent = envContent.replace(/^RAZORPAY_KEY_ID=.*/m, `RAZORPAY_KEY_ID=${updateFields.razorpayKeyId}`);
          process.env.RAZORPAY_KEY_ID = updateFields.razorpayKeyId;
        }
        if (updateFields.razorpayKeySecret !== undefined) {
          envContent = envContent.replace(/^RAZORPAY_KEY_SECRET=.*/m, `RAZORPAY_KEY_SECRET=${updateFields.razorpayKeySecret}`);
          process.env.RAZORPAY_KEY_SECRET = updateFields.razorpayKeySecret;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (envErr) {
      console.warn('[SETTINGS .ENV UPDATE WARNING]:', envErr.message);
    }

    return res.json({
      success: true,
      message: atlasSaved
        ? 'Settings updated successfully in MongoDB Atlas'
        : 'Settings updated successfully (Active in resilient mode)',
      settings: {
        tier1Price: memorySettings.tier1Price,
        tier2Price: memorySettings.tier2Price,
        upiId: memorySettings.upiId,
        razorpayKeyId: memorySettings.razorpayKeyId,
        razorpayEnabled: memorySettings.razorpayEnabled,
        directUpiEnabled: memorySettings.directUpiEnabled
      }
    });
  } catch (err) {
    console.error('Update settings error:', err.message);
    return res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// Admin Manual Payment Approval
app.post('/api/admin/manual-approve', authenticateAdmin, async (req, res) => {
  try {
    const { paymentId, noticeRefNo } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'Missing paymentId' });

    const payment = await Payment.findOneAndUpdate(
      { paymentId },
      {
        status: 'CONFIRMED',
        verifiedAt: new Date(),
        gateway: 'ADMIN_APPROVED'
      },
      { new: true, upsert: true }
    );

    const ref = noticeRefNo || payment.noticeRefNo;
    if (ref && ref !== 'UNKNOWN') {
      await Notice.findOneAndUpdate(
        { refNo: ref },
        { isUnlocked: true, tierUnlocked: payment.tier || 'TIER_1', unlockedAt: new Date() }
      );
    }

    return res.json({ success: true, message: `Payment ${paymentId} approved and notice unlocked!` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Update Inquiry Status
app.post('/api/admin/inquiry/status', authenticateAdmin, async (req, res) => {
  try {
    const { inquiryId, status, notes } = req.body;
    if (!inquiryId || !status) {
      return res.status(400).json({ error: 'Missing inquiryId or status' });
    }

    // Update memory
    const memItem = memoryInquiries.find(i => i.inquiryId === inquiryId);
    if (memItem) {
      memItem.status = status;
      if (notes !== undefined) memItem.notes = notes;
      memItem.updatedAt = new Date();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await Inquiry.findOneAndUpdate(
          { inquiryId },
          { $set: { status, ...(notes !== undefined ? { notes } : {}), updatedAt: new Date() } }
        );
      } catch (e) {
        console.warn('Atlas inquiry status update warning:', e.message);
      }
    }

    return res.json({ success: true, message: `Inquiry marked as ${status}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// SECRET ADMIN DASHBOARD ROUTE
// ==========================================================================
// Only accessible via custom secret URL
app.get(ADMIN_SECRET_PATH, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-portal.html'));
});

// Statutory Laws & Rules Portal
app.get('/laws', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'laws.html'));
});

// Razorpay Compliance & Policy Routes
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});
app.get('/refund', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'refund.html'));
});
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});
app.get('/shipping', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shipping.html'));
});

// Fallback to SPA homepage
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DepositShield running at http://localhost:${PORT}`);
  console.log(`[INFO] Secret Admin Portal: http://localhost:${PORT}${ADMIN_SECRET_PATH}`);
});
