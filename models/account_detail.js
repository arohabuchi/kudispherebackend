const mongoose = require("mongoose");

const bankAccountDetailSchema = mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
  },
  accountType: {
    required: false,
    type: String,
    trim: true,
  },
  coinType: {
    required: false,
    type: String,
    trim: true,
  },
  chainType: {
    required: false,
    type: String,
    trim: true,
    
  },
  BankName: {
    required: false,
    type: String,
  },
  BankAccountNumber: {
    required: false,
    type: String,
  },
  BankUserName: {
    required: false,
    type: String,
  },
});

const AccountDetail = mongoose.model("BankAccountDetail", bankAccountDetailSchema);
module.exports = AccountDetail;
