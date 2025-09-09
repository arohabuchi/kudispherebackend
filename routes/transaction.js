const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");

const router = express.Router();
require("dotenv").config();
const API_KEY = process.env.NOWPAYMENTS_API_KEY;


const NOWPAYMENTS_API = "https://nowpayments.io/donation/kudisphere" //"https://api.nowpayments.io/v1";
// const API_KEY = "YOUR_NOWPAYMENTS_API_KEY"; // keep in .env file

// Fund wallet using crypto (create payment)
router.post("/api/transaction/fund", auth, async (req, res) => {
  try {
    const { amount, pay_currency } = req.body; // e.g., { amount: 10, pay_currency: "btc" }

    // Create a NOWPayments payment
    const response = await axios.post(
      `${NOWPAYMENTS_API}/payment`,
      {
        price_amount: amount,
        price_currency: "usd", // you can also use NGN if supported
        pay_currency,
        order_id: `${req.user}-${Date.now()}`,
        order_description: "Wallet Funding",
      },
      {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const payment = response.data;

    // Save transaction to DB
    const transaction = new Transaction({
      user: req.user,
      amount,
      currency: pay_currency,
      paymentId: payment.payment_id,
      status: payment.payment_status,
    });
    await transaction.save();

    res.json({
      msg: "Payment created",
      payment_url: payment.invoice_url,
      transaction,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
});

// Check transaction status
router.get("/api/transaction/status/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    const response = await axios.get(`${NOWPAYMENTS_API}/payment/${transaction.paymentId}`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    const payment = response.data;
    transaction.status = payment.payment_status;

    // Update wallet balance if confirmed
    if (payment.payment_status === "finished") {
      let wallet = await Wallet.findOne({ user: req.user });
      if (!wallet) {
        wallet = new Wallet({ user: req.user, balance: 0 });
      }
      wallet.balance += transaction.amount;
      await wallet.save();
    }

    await transaction.save();

    res.json({ transaction, payment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not fetch transaction status" });
  }
});

// Get user transaction history
router.get("/api/transaction/history", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
