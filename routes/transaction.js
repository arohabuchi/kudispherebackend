const express = require('express');
const transactionRoute = express.Router();
const Transaction = require('../models/transaction'); // Import the Transaction model
const User = require('../models/user'); // Import the User model

// Placeholder for a real authentication middleware
// In a real app, this would get the user from a session or JWT and attach it to req.user
const authMiddleware = async (req, res, next) => {
 
    try {
        const dummyAdminUser = await User.findOne({ role: 'admin' });
        if (dummyAdminUser) {
            req.user = dummyAdminUser;
        }
        next();
    } catch (e) {
        next();
    }
};

// Middleware to find a user by their ID from the URL parameters
const findUserMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        req.requestedUser = user; // Use a different name to avoid conflicts with authenticated user
        next();
    } catch (e) {
        // This will catch the Cast to ObjectId error
        res.status(400).json({ error: 'Invalid user ID provided.' });
    }
};

// Middleware to check if the user has an admin role.
const checkAdminRole = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// Middleware to check if the user is the owner of the requested resource.
const checkUserOwnership = (req, res, next) => {
    // This assumes req.user is populated by an authMiddleware and req.requestedUser by findUserMiddleware
    if (req.user && req.requestedUser && req.user._id.toString() === req.requestedUser._id.toString()) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. You can only access your own data.' });
    }
};

// Apply authMiddleware to all routes that require an authenticated user
transactionRoute.use(authMiddleware);

// --- DEPOSIT ENDPOINT ---

// POST /transactions/:userId/deposit
// User-only endpoint to fund a user's balance via a crypto deposit.
transactionRoute.post('/:userId/deposit', findUserMiddleware, async (req, res) => {
    const { amount, coinType, transactionHash, cryptoAddress, amountToReceive } = req.body;

    try {
        // Create a new transaction record in 'pending' status
        const newTransaction = new Transaction({
            userId: req.requestedUser._id, // Use the Mongoose ObjectId from the found user
            transactionType: 'deposit',
            amount,
            cryptoDetails: {
                transactionHash,
                cryptoAddress,
                amountToReceive,
                coinType
            },
            status: 'pending' // Initial status is always pending
        });

        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});


transactionRoute.post("/:userId/bankdeposit", async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, bankName, accountNumber, accountHolderName, feePerUSDT, amountToReceive } = req.body;

    if (!amount || !bankName || !accountNumber || !accountHolderName || !feePerUSDT || !amountToReceive) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create new transaction
    const newTransaction = new Transaction({
      userId, // taken from URL
      transactionType: "bankdeposit",
      amount,
      status: "pending",
      bankDetails: {
        bankName,
        accountNumber,
        accountHolderName,
        feePerUSDT,
        amountToReceive,
      },
    });

    await newTransaction.save();

    res.status(201).json({
      message: "Bank deposit transaction created successfully",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Bank deposit error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
// --- WITHDRAWAL ENDPOINTS ---
// POST /transactions/:userId/withdraw/crypto
transactionRoute.post('/:userId/withdraw/crypto', findUserMiddleware, checkUserOwnership, async (req, res) => {
  const { amount, coinType, amountToReceive, cryptoAddress, transactionHash } = req.body;

  try {
    // Check if the user has enough funds
    if (req.requestedUser.amount < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    // Create a new withdrawal transaction in 'pending' status
    const newTransaction = new Transaction({
      userId: req.requestedUser._id,
      transactionType: 'withdrawal',
      withdrawalMethod: 'crypto',
      amount,
      cryptoDetails: {
        transactionHash,
        coinType,
        amountToReceive,
        amount,
        cryptoAddress   /////transactionHash  cryptoAddress  coinType   amountToReceive  amount
      },
      status: 'pending'
    });

    const savedTransaction = await newTransaction.save();

    // Deduct from balance AND add to payout
    await User.updateOne(
      { _id: req.requestedUser._id },
      { 
        $inc: { 
          amount: -amount,   // decrease balance
          payout: amount     // increase payout
        } 
      }
    );
    res.status(201).json(savedTransaction);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /transactions/:userId/withdraw/bank
transactionRoute.post('/:userId/withdraw/bank', findUserMiddleware, checkUserOwnership, async (req, res) => {
  const { amount, amountToReceive, feePerUSDT, bankName, accountNumber, accountHolderName } = req.body;

  try {
    // Check if the user has enough funds
    if (req.requestedUser.amount < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create a new withdrawal transaction in 'pending' status
    const newTransaction = new Transaction({
      userId: req.requestedUser._id,
      transactionType: 'withdrawal',
      withdrawalMethod: 'bank',
      amount,
      
      bankDetails: {
        bankName,
        accountNumber,
        accountHolderName,
        feePerUSDT,
        amountToReceive
      },
      status: 'pending'
    });

    const savedTransaction = await newTransaction.save();

    /// Deduct from balance AND add to payout
    await User.updateOne(
      { _id: req.requestedUser._id },
      { 
        $inc: { 
          amount: -amount,   // decrease balance
          payout: amount     // increase payout
        } 
      }
    );
    res.status(201).json(savedTransaction);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// --- QUERY & HISTORY ENDPOINTS ---

// GET /transactions/:userId
// Endpoint to get all transactions for a specific user.
// Users can only view their own transactions. Admins can view any user's transactions.
transactionRoute.get('/transaction/:userId', findUserMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.requestedUser._id }).sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /transactions/details/:transactionId
// Endpoint to get a single transaction by its ID.
transactionRoute.get('/transaction/details/:transactionId', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        // If the user is not an admin and the transaction doesn't belong to them, deny access.
        if (req.user.role !== 'admin' && transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied. You can only view your own transactions.' });
        }
        res.status(200).json(transaction);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- INTERNAL/ADMIN ENDPOINT ---
// Update transaction status and user balance
transactionRoute.patch('/status/:transactionId', checkAdminRole, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update the transaction status
    transaction.status = status;
    await transaction.save();

    // If completed, update user balance
    if (status === 'completed') {
      const user = await User.findById(transaction.userId);

      if (transaction.transactionType === 'deposit' || transaction.transactionType === 'bankdeposit') {
        user.amount += transaction.amount;
      } else if (
        transaction.transactionType === 'withdrawal' ||
        transaction.transactionType === 'cryptowithdrawal'
      ) {
        if (user.amount < transaction.amount) {
          return res.status(400).json({ error: 'Insufficient funds for withdrawal' });
        }
        user.amount -= transaction.amount;
      }

      await user.save();
    }

    res.status(200).json({ msg: 'Transaction updated successfully', transaction });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /transactions/status/:transactionId
transactionRoute.patch('/withdrawal/status/:transactionId/', checkAdminRole, async (req, res) => {
  const { status } = req.body;

  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only allow updating pending transactions
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending transactions can be updated' });
    }

    // Handle balance/payout updates based on type + status change
    if (transaction.transactionType === 'deposit' && status === 'completed') {
      // ✅ Credit deposit to user's balance
      await User.updateOne(
        { _id: transaction.userId },
        { $inc: { amount: transaction.amount } }
      );
    } 
    else if (transaction.transactionType === 'withdrawal' && status === 'failed') {
      // ✅ Refund failed withdrawal: add back to balance & remove from payout
      await User.updateOne(
        { _id: transaction.userId },
        { 
          $inc: { 
            amount: transaction.amount,   // refund balance
            payout: -transaction.amount   // rollback payout
          } 
        }
      );
    }
    // If withdrawal is completed, do nothing (already deducted + payout incremented at request time)

    // Update the transaction status
    transaction.status = status;
    const updatedTransaction = await transaction.save();

    res.status(200).json(updatedTransaction);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /transactions/admin/all
// Admin-only endpoint to get all transactions
transactionRoute.get('/transaction/admin/all', checkAdminRole, async (req, res) => {
  try {
    // Fetch all transactions, most recent first
    const transactions = await Transaction.find()
      .populate('userId', 'firstName lastName email') // include user info
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = transactionRoute;
