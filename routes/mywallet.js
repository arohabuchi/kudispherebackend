const express = require("express");
const MyWallet = require("../models/myWallet");
const mywalletRouter = express.Router();

mywalletRouter.post("/api/mywallet", async (req, res) => {
  try {
    const { amount, cointype } = req.body;

    // const existingwallet = await MyWallet.findOne({ cointype });
    
    const existingwallet = await MyWallet.findOne({ cointype: new RegExp(cointype, 'i') });
    if (existingwallet) {
      // If a wallet exists, add the new amount to the existing amount
      const updatedWallet = await MyWallet.findOneAndUpdate(
        { cointype: new RegExp(cointype, 'i') },  // The query to find the wallet
        { $inc: { amount: amount } }, // Use the $inc operator to increment the amount
        { new: true } // Return the updated document instead of the original
      );

      // Send the updated wallet back in the response
      return res.json(updatedWallet);
    }


    let mywallet = new MyWallet({
      amount,
      cointype
    });
    mywallet = await mywallet.save();
    res.json(mywallet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



mywalletRouter.get("/api/mywalletsList", async (req, res) => {
  try {
    // Find all documents in the MyWallet collection
    const wallets = await MyWallet.find({});
    // Send the list of wallets as a JSON response
    res.json(wallets);
  } catch (e) {
    // Handle any errors that occur during the query
    res.status(500).json({ error: e.message });
  }
});



module.exports = mywalletRouter;