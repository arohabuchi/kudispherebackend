
const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const mywalletRouter = require("./routes/mywallet");
const transactionRouter = require("./routes/transaction");



const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(authRouter);
app.use(mywalletRouter);
app.use(transactionRouter);


const DB = "mongodb+srv://buchimain:N3RzSPCPwMtpfU7o@cluster0.o8pfpye.mongodb.net/";

mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((e) => {
    console.log(e);
  });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`connected at port ${PORT}`);
});
