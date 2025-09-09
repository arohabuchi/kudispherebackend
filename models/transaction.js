const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "usd", // or "ngn" depending on your setup
  },
  status: {
    type: String,
    default: "pending", // pending | confirmed | failed
  },
  paymentId: {
    type: String, // NOWPayments payment_id
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
