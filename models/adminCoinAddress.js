const mongoose = require('mongoose');

const ImageSchema = mongoose.Schema ({
    name : {
        type: String,
        required: true
    },
    coinType:{
      type:String,
      default: "USDT",
      required:true
    },
    image:{
        type: String, // Store the file path as a string
        required: true,
    },
    currentPrice:{
      type: Number,
      required:false
    },
    gasfee:{
      type:Number,
      required:false
    },

});
module.exports = ImageModel = mongoose.model('imageModel', ImageSchema);










// const mongoose = require("mongoose");

// const adminCoinAddressSchema = mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   barcodeImage: {
//     type: String,
//     required:true,
//   },
// });

// const AdminCoinAddress = mongoose.model("AdminCoinAddress", adminCoinAddressSchema);
// module.exports = AdminCoinAddress;
