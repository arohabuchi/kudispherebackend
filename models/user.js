const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: {
    required: true,
    type: String,
    trim: true,
  },
  lastName: {
    required: true,
    type: String,
    trim: true,
  },
  email: {
    required: true,
    type: String,
    trim: true,
    unique: true,
    validate: {
      validator: (value) => {// firstName lastName email password
        const re =
          /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return value.match(re);
      },
      message: "Please enter a valid email address",
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Enforcing specific, valid roles
    default: 'user',
    required: true
  },
  password: {
    required: true,
    type: String,
  },
  isVerified: {  
    type: Boolean,
    default: false,
  },
  otp: { 
    type: String,
  },
  otpExpires: {  
    type: Date,
  }, 
  passwordResetToken: {  // <-- Add this field
    type: String,
  },
  passwordResetExpires: { // <-- Add this field
    type: Date,
  },
  amount: {
    type: Number,
    required: true,
    min: 0, // A balance cannot be negative
    default: 0
  },
  payout: {
    type: Number,
    required: true,
    min: 0, // A balance cannot be negative
    default: 0
  }

}, {
    timestamps: true // Adds createdAt and updatedAt timestamps

});

const User = mongoose.model("User", userSchema);
module.exports = User;



















