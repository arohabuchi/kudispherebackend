const mongoose = require("mongoose");

const myWalletSchema = mongoose.Schema({
  amount: {
    required: true,
    type: Number,
  },
  cointype: {
    required: true,
    type: String,
    trim: true,
    
  }
});

const MyWallet = mongoose.model("MyWallet", myWalletSchema);
module.exports = MyWallet;
