const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
