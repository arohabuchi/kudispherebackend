const mongoose = require("mongoose");

const profileAddressSchema = mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
  },
  country: {
    required: false,
    type: String,
    trim: true,
  },
  state: {
    required: false,
    type: String,
    trim: true,
  },
  homeAddress: {
    required: false,
    type: String,
    trim: true,
    
  },
  phoneNumber: {
    required: false,
    type: String,
  },
});

const ProfileAddress = mongoose.model("ProfileAddress", profileAddressSchema);
module.exports = ProfileAddress;
