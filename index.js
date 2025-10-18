
const express = require("express");
require("dotenv").config();
const cors = require('cors');
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const mywalletRouter = require("./routes/mywallet");
const AdminCoinAddress = require("./models/adminCoinAddress");
const imageRouter = require("./routes/admincoinRoute");
const transactionRoute = require('./routes/transaction')

const multer = require("multer");
const path = require("path");
const adminBankRoute = require("./routes/adminBankRoute");


const PORT = process.env.PORT || 8000;
const app = express();
// app.use(cors());
app.use(cors({
  origin: [
    `http://localhost:5173`, 
    `https://kudispherebackend.vercel.app`,
    `https://www.kudispherebackend.vercel.app`, 
    `https://kudisphere.buzz`, 
    `https://www.kudisphere.buzz` // ✅ Add the 'www' version
],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type',  "x-auth-token", "Authorization"],
}));
// --- Handle CORS Preflight Requests Globally --- 
// The corrected manual preflight handler
// app.options('*', (req, res) => {
//   res.header("Access-Control-Allow-Origin", req.headers.origin);
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); // Make absolutely sure it's correct
//   res.header("Access-Control-Allow-Headers", "Content-Type, x-auth-token, Authorization");
//   return res.sendStatus(200);
// });

app.use(express.json());

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(authRouter);
app.use(mywalletRouter);
app.use(imageRouter);
// app.use(transactionRoute)
app.use('/api', transactionRoute)
app.use('/api', adminBankRoute)


 

// const AdminCoinAddress = require("./models/adminCoinAddress");



 //  "mongodb://localhost:27017"
const DB = process.env.DBConnection;

mongoose
  .connect(DB, { serverSelectionTimeoutMS: 30000, useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB Connection Successful");
  })
  .catch((e) => {
    console.error("❌ MongoDB Connection Error:", e);
  });





  
  // // Configure multer for file storage
 
  // // Create a file filter function to restrict file types
 



app.listen(PORT, "0.0.0.0", () => {
  console.log(`connected at port ${PORT}`);
});
