const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  Razorpay = null;
}

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (Razorpay && keyId && keySecret) {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return null;
};

// Create Payment Order (Supports UPI QR, PhonePe deep link, Cards, & Admin Payment Modes)
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'INR', description, metadata = {} } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const cfg = db.findOne('payment_config', () => true) || {};
    const activeMode = cfg.paymentMode || 'demo_instant';

    const txnId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    let orderData = {
      id: txnId,
      amount: numAmount * 100, // paise
      currency,
      status: activeMode === 'demo_instant' ? 'paid' : 'created'
    };

    let keyIdToUse = cfg.razorpayKeyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_mock12345';

    if (activeMode === 'live_original') {
      const keySecretToUse = cfg.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
      if (Razorpay && keyIdToUse && keySecretToUse) {
        try {
          const rzpInstance = new Razorpay({ key_id: keyIdToUse, key_secret: keySecretToUse });
          const rzpOrder = await rzpInstance.orders.create({
            amount: Math.round(numAmount * 100),
            currency,
            receipt: txnId,
            notes: { userId: req.user.id, ...metadata }
          });
          orderData = rzpOrder;
        } catch (e) {
          console.warn('Razorpay live order creation error, falling back:', e.message);
        }
      }
    }

    const upiVpa = cfg.upiVpa || process.env.UPI_VPA || 'smarthealth@ybl';
    const upiUrl = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(cfg.merchantName || 'SmartHealthPredictor')}&am=${numAmount}&tn=${encodeURIComponent(description || 'Health Service')}&tr=${orderData.id}`;
    const phonePeIntent = `phonepe://pay?pa=${upiVpa}&pn=${encodeURIComponent(cfg.merchantName || 'SmartHealthPredictor')}&am=${numAmount}&tr=${orderData.id}`;

    const newOrder = {
      id: orderData.id,
      userId: req.user.id,
      userName: req.user.name || 'Patient',
      amount: numAmount,
      currency,
      status: 'created',
      paidAt: null,
      paymentMethod: activeMode === 'demo_instant' ? 'UPI QR / Online' : activeMode === 'demo_interactive' ? 'Interactive Sandbox' : 'Live Gateway',
      upiUrl,
      phonePeIntent,
      description: description || 'Payment',
      metadata,
      paymentMode: activeMode,
      createdAt: new Date().toISOString()
    };

    db.insert('payment_orders', newOrder);

    // If instant demo mode, credit user wallet or confirm instantly in DB
    if (activeMode === 'demo_instant') {
      const user = db.findOne('users', u => u.id === req.user.id);
      if (user) {
        db.insert('wallet_transactions', {
          id: `wt_${Date.now()}`,
          userId: user.id,
          userName: user.name,
          transactionId: orderData.id,
          type: 'credit',
          amount: numAmount,
          timestamp: new Date().toISOString(),
          paymentMethod: 'Demo 1 - Instant Auto-Success',
          status: 'Success',
          description: description || 'Service Payment (Instant Demo)'
        });
      }
    }

    res.json({
      orderId: orderData.id,
      amount: numAmount,
      currency,
      keyId: keyIdToUse,
      upiUrl,
      phonePeIntent,
      status: activeMode === 'demo_instant' ? 'paid' : 'created',
      paymentMode: activeMode,
      confirmationMessage: cfg.confirmationMessage || 'Payment Received ✅ Wallet balance updated & digital receipt generated!',
      customQrUrl: cfg.customQrUrl || ''
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ message: 'Failed to initialize payment order' });
  }
});

// Check Order Status (Live Polling)
router.get('/order-status/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const order = db.findOne('payment_orders', p => p.id === id);
    if (!order) {
      return res.status(404).json({ message: 'Payment order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error querying payment status' });
  }
});

// Developer Simulation Endpoint: Instantly confirm payment
router.post('/simulate-confirm', authenticateToken, (req, res) => {
  try {
    const { orderId } = req.body;
    const order = db.findOne('payment_orders', p => p.id === orderId);
    if (!order) return res.status(404).json({ message: 'Payment order not found' });

    db.update('payment_orders', order.id, { status: 'paid', paidAt: new Date().toISOString() });

    const user = db.findOne('users', u => u.id === order.userId);
    if (user) {
      const currentBal = Number(user.walletBalance || 0);
      const newBal = currentBal + Number(order.amount);
      const history = user.walletHistory || [];
      history.push({
        type: 'credit',
        amount: Number(order.amount),
        txnId: order.id,
        date: new Date().toISOString(),
        description: order.description || 'Wallet Top-up'
      });
      db.update('users', user.id, { walletBalance: newBal, walletHistory: history });

      db.insert('wallet_transactions', {
        id: `wt_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        transactionId: order.id,
        type: 'credit',
        amount: Number(order.amount),
        timestamp: new Date().toISOString(),
        paymentMethod: 'UPI / PhonePe',
        status: 'Success',
        description: order.description || 'Wallet Top-up'
      });
    }

    res.json({ message: 'Payment confirmed & wallet credited!', orderId: order.id, status: 'paid' });
  } catch (error) {
    console.error('Simulate payment confirm error:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// Pay Order using Health Wallet Balance
router.post('/pay-with-wallet', authenticateToken, (req, res) => {
  try {
    const { orderId } = req.body;
    const order = db.findOne('payment_orders', p => p.id === orderId);
    if (!order) return res.status(404).json({ message: 'Payment order not found' });

    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const walletBal = Number(user.walletBalance || 0);
    const amount = Number(order.amount || 0);

    if (walletBal < amount) {
      return res.status(400).json({ message: `Insufficient Wallet Balance (₹${walletBal}.00). Required: ₹${amount}.00` });
    }

    const newBal = walletBal - amount;
    const history = user.walletHistory || [];
    history.push({
      type: 'debit',
      amount,
      txnId: `TXN_WALL_${Date.now()}`,
      date: new Date().toISOString(),
      description: order.description || 'Consultation Fee Payment'
    });

    db.update('users', user.id, { walletBalance: newBal, walletHistory: history });
    db.update('payment_orders', order.id, { status: 'paid', paidAt: new Date().toISOString(), paymentMethod: 'Health Wallet' });

    db.insert('wallet_transactions', {
      id: `wt_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      transactionId: order.id,
      type: 'debit',
      amount,
      timestamp: new Date().toISOString(),
      paymentMethod: 'Health Wallet',
      status: 'Success',
      description: order.description || 'Consultation Fee Payment'
    });

    res.json({ message: 'Paid via Health Wallet successfully!', orderId: order.id, status: 'paid', remainingBalance: newBal });
  } catch (error) {
    console.error('Pay with wallet error:', error);
    res.status(500).json({ message: 'Error processing wallet payment' });
  }
});

// Webhook Verification
router.post('/verify-webhook', (req, res) => {
  try {
    const { event, payload } = req.body;
    if (event === 'payment.captured' && payload && payload.payment) {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id || paymentEntity.receipt;
      const order = db.findOne('payment_orders', p => p.id === orderId);
      
      if (order && order.status !== 'paid') {
        db.update('payment_orders', order.id, { status: 'paid', paidAt: new Date().toISOString() });

        const user = db.findOne('users', u => u.id === order.userId);
        if (user) {
          const currentBal = Number(user.walletBalance || 0);
          const newBal = currentBal + Number(order.amount);
          const history = user.walletHistory || [];
          history.push({
            type: 'credit',
            amount: Number(order.amount),
            txnId: order.id,
            date: new Date().toISOString(),
            description: order.description || 'Wallet Top-up'
          });
          db.update('users', user.id, { walletBalance: newBal, walletHistory: history });

          db.insert('wallet_transactions', {
            id: `wt_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            transactionId: order.id,
            type: 'credit',
            amount: Number(order.amount),
            timestamp: new Date().toISOString(),
            paymentMethod: paymentEntity.method || 'Razorpay',
            status: 'Success',
            description: order.description || 'Wallet Top-up'
          });
        }
      }
    }
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// PDF Payment Receipt Stream Endpoint
router.get('/receipt/:id/pdf', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.findOne('payment_orders', p => p.id === id) || 
                  db.findOne('wallet_transactions', w => w.id === id || w.transactionId === id) ||
                  db.findOne('appointments', a => a.id === id);

    const pdfService = require('../services/pdfService');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${id}.pdf`);

    pdfService.buildReceiptPDF(order || { id, amount: 350, description: 'Consultation Fee' }, res);
  } catch (error) {
    console.error('Receipt PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate PDF receipt' });
    }
  }
});

module.exports = { router, getRazorpay };
