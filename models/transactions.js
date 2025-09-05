const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
  amount: {
    required: true,
    type: Number,
  },
  cointype: {
    required: true,
    type: String,
    trim: true,
    
  },
  status: {
    type: String,
    
  },
  typeOfTransaction: {
    type: String
  },
  walletAddress: {
    type: String
  },
 
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
