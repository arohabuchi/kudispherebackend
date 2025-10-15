
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
  origin: ['http://localhost:5173', 'https://kudispherebackend.vercel.app', 'https://kudisphere.buzz'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type',  "x-auth-token", "Authorization"],
}));
// --- Handle CORS Preflight Requests Globally ---
app.options('*', (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-auth-token, Authorization");
  return res.sendStatus(200);
});

app.use(express.json());

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
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB Connection Successful");
  })
  .catch((e) => {
    console.error("❌ MongoDB Connection Error:", e);
  });





  
  // Configure multer for file storage
  const storage = multer.diskStorage({
      destination: (req, file, cb) => {
          cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
  });
  // Create a file filter function to restrict file types
  const fileFilter = (req, file, cb) => {
      // Check the file's mimetype
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
          // Accept the file
          cb(null, true);
      } else {
          // Reject the file with an error message
          cb(null, false);
      }
  };
  const upload = multer({ 
      storage: storage,
      fileFilter: fileFilter // Apply the file filter to the multer middleware
  }).single("testImage");
  app.post('/upload', (req, res)=>{
      upload(req, res, (err)=>{
          if (err) {
              console.log(err)
          }
          else{
              const newImage =new ImageModel({
                  name:req.body.name,
                  image:{
                      data:req.file.fieldname,
                      contentType:'image/jpg'
                  }
              })
              newImage.save()
              .then(()=>res.send('successfully uploaded'))
              .catch((err) => console.log(err))
          }
      })
  })



app.listen(PORT, "0.0.0.0", () => {
  console.log(`connected at port ${PORT}`);
});
