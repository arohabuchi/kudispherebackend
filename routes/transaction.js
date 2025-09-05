const express = require("express");
const MyWallet = require("../models/myWallet");
const Transaction = require("../models/transactions");
const transactionRouter = express.Router();



transactionRouter.post("/api/transaction", async (req, res) => {
  try {
    const { amount, cointype, typeOfTransaction, walletAddress } = req.body;

    // Define the transaction status. Assuming it's 'completed' upon successful save.
    const transactionStatus = "completed";

    // Create and save the new transaction first
    let myTransaction = new Transaction({
      amount,
      cointype,
      typeOfTransaction,
      walletAddress,
      status: transactionStatus, // Add the status field to the transaction
    });

    myTransaction = await myTransaction.save();

    // Check if the transaction was successfully saved and the status is 'completed'
    if (myTransaction && myTransaction.status === "completed") {
      // Determine the amount to add or subtract based on the transaction type
      let walletAmountUpdate = myTransaction.amount;
      
      if (myTransaction.typeOfTransaction === "withdrawal" || myTransaction.typeOfTransaction === "transfer") {
        walletAmountUpdate = -myTransaction.amount;
      }

      // Find the wallet with the same cointype and update it
      const existingWallet = await MyWallet.findOne({ cointype: new RegExp(myTransaction.cointype, 'i') });

      if (existingWallet) {
        // If a wallet exists, add or deduct the amount
        await MyWallet.findOneAndUpdate(
          { cointype: new RegExp(myTransaction.cointype, 'i') },
          { $inc: { amount: walletAmountUpdate } },
          { new: true }
        );
      } else {
        // If no existing wallet is found, create a new one
        let mywallet = new MyWallet({
          amount: myTransaction.amount,
          cointype: myTransaction.cointype,
        });
        await mywallet.save();
      }
    }

    // Send the saved transaction details back to the client
    res.json(myTransaction);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = transactionRouter;