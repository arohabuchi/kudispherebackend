const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const ProfileAddress = require("../models/profile_address");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const crypto = require("crypto");


const nodemailer = require("nodemailer");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "arohabuchi@gmail.com",
    pass: "qkesnqirzlqvwttu",
  },
});

// Function to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sign Up - Modified to send OTP
authRouter.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // If user exists but isn't verified, resend OTP
        const otp = generateOTP();
        existingUser.otp = otp;
        existingUser.otpExpires = Date.now() + 3600000; // OTP valid for 1 hour
        await existingUser.save();

        const mailOptions = {
          from: "arohabuchi@gmail.com",
          to: email,
          subject: "Email Verification OTP",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333;">Welcome to Our App!</h2>
              <p>Hi ${firstName},</p>
              <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address:</p>
              <div style="text-align: center; margin: 20px 0;">
                <h1 style="background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</h1>
              </div>
              <p>This OTP is valid for 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
              <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} Kudisphere. All rights reserved.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({
          msg: "User already exists but not verified. A new OTP has been sent.",
        });
      }
      return res.status(400).json({ msg: "User with same email already exists!" });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);
    const otp = generateOTP();

    let user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isVerified: false,  
      otp: otp,
      otpExpires: Date.now() + 3600000, // 1 hour expiration
    });

    user = await user.save();

    // 🔥 Create an empty profile address immediately after signup
    const profileAddress = new ProfileAddress({
      user: user._id,
      country: "",
      state: "",
      homeAddress: "",
      phoneNumber: "",
    });
    await profileAddress.save();

    // Send the OTP via email
    const mailOptions = {
      from: "arohabuchi@gmail.com",
      to: email,
      subject: "Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333;">Welcome to Our App!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <h1 style="background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</h1>
          </div>
          <p>This OTP is valid for 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
          <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} Kudisphere. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ msg: "User registered. Please verify your email with the OTP." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// New endpoint to resend the OTP
authRouter.post("/api/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: "Email is already verified." });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 3600000; // New OTP valid for 1 hour
    await user.save();

      const mailOptions = {
          from: "arohabuchi@gmail.com",
          to: email,
          subject: "New Email Verification OTP",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333;">Welcome to Our App!</h2>
              <p>Hi ${email},</p>
              <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address:</p>
              <div style="text-align: center; margin: 20px 0;">
                <h1 style="background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</h1>
              </div>
              <p>This OTP is valid for 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
              <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} Kudisphere. All rights reserved.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
    res.status(200).json({ msg: "A new OTP has been sent to your email." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint to verify the OTP
authRouter.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (user.otp === otp && user.otpExpires > Date.now()) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;

      await user.save();

      const profileAddress = new ProfileAddress({
        user: user._id,
      });
      await profileAddress.save();

      const token = jwt.sign({ id: user._id }, "passwordKey");
      return res.status(200).json({ token, ...user._doc });
    } else {
      return res.status(400).json({ msg: "Invalid or expired OTP." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sign In
authRouter.post("/api/signin", async (req, res) => {
  try {
    const { email, password } = req.body;    

    // const user = await User.findOne({ email });
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: "User with this email does not exist!" });
    }
    if (!user.password) {
        // This is unlikely if the user exists, but it provides a safety net
        return res.status(500).json({ error: "Server configuration error: Password field missing." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ msg: "Please verify your email address first." });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password." });
    }

    const token = jwt.sign({ id: user._id }, "passwordKey");

    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.json({ token, ...userResponse });

    // res.json({ token, ...user._doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ... your existing imports and helper functions

// Forgot Password - Step 1: Request Password Reset
// ... existing imports and code
     
// Forgot Password - Step 1: Request Password Reset
authRouter.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ msg: "If a user with that email exists, a password reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = await bcryptjs.hash(resetToken, 10);

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = Date.now() + 3600000; // Token valid for 1 hour

    await user.save();
    //// http://localhost:8000/api/forgot-password
    //// /api/reset-password/:token 
    // const resetUrl = `http://localhost:8000/api/reset-password/${resetToken}`;
    const resetUrl = `https://kudisphere.buzz/forgot-password-reset/${resetToken}`;

    const mailOptions = {
      from: "your_email@gmail.com",
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password. To proceed, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Reset My Password
            </a>
          </div>
          <p>If the button above does not work, you can also copy and paste the following link into your web browser:</p>
          <p><a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
          <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: "If a user with that email exists, a password reset link has been sent." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ... your existing endpoints



// Reset Password - Step 2: Set New Password http://localhost:8000/api/reset-password/${resetToken}
authRouter.post("/api/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Iterate through all users to find one with a matching, non-expired token.
    const users = await User.find({ passwordResetExpires: { $gt: Date.now() } });
    let user = null;
    
    // Compare the token from the URL with the hashed token in the database
    for (const u of users) {
      const isMatch = await bcryptjs.compare(token, u.passwordResetToken);
      if (isMatch) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired password reset token." });
    }

    // Hash the new password and update the user document
    const hashedPassword = await bcryptjs.hash(password, 8);
    user.password = hashedPassword;
    
    // Clear the reset token fields to prevent reuse
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    res.status(200).json({ msg: "Password has been successfully reset." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ... your existing endpoints
// Sign In

// authRouter.post("/api/signin", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(400)
//         .json({ msg: "User with this email does not exist!" });
//     }

//     const isMatch = await bcryptjs.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ msg: "Incorrect password." });
//     }

//     const token = jwt.sign({ id: user._id }, "passwordKey");
//     res.json({ token, ...user._doc });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

authRouter.post("/tokenIsValid", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);
    const verified = jwt.verify(token, "passwordKey");
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json(false);
    res.json(true);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


authRouter.get("/api/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const profileAddress = await ProfileAddress.findOne({ user: req.user });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Combine user and profile address data
    res.json({
      ...user._doc,
      profileAddress: profileAddress ? profileAddress._doc : null, // Include the profile address data
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.put("/api/edit-address", auth, async (req, res) => {
  try {
    const { country, state, homeAddress, phoneNumber } = req.body;

    // Find the profile address associated with the authenticated user
    let profileAddress = await ProfileAddress.findOne({ user: req.user });

    // If a profile address doesn't exist, this is an error case.
    if (!profileAddress) {
      return res.status(404).json({ msg: "Profile address not found!" });
    }

    // Update the fields with the new data
    profileAddress.country = country;
    profileAddress.state = state;
    profileAddress.homeAddress = homeAddress;
    profileAddress.phoneNumber = phoneNumber;

    // Save the updated profile address
    profileAddress = await profileAddress.save();
    res.json(profileAddress);
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  } 
});

// Change Password (requires authentication)
authRouter.post("/api/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Please provide both current and new passwords." });
    }

    // Find the logged-in user
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Check if current password is correct
    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect." });
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 8);
    user.password = hashedPassword;

    // Save updated password
    await user.save();

    res.status(200).json({ msg: "Password changed successfully." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = authRouter;