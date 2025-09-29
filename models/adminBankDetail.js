const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the transaction schema.
const adminBankDetailSchema = new Schema({
    // Reference to the user who initiated the transaction
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Details specific to a bank withdrawal
    bankDetails: {
        // We use a nested object to keep bank details organized.
        type: {
            bankName: {
                type: String,
                required: true
            },
            accountNumber: {
                type: Number,
                required: true
            },
            accountHolderName: {
                type: String,
                required: true
            },
            feePerUSDT: {  ///// bankName  accountNumber feePerUSDT AmountToReceive 
                type: Number,
                required: true
            },
            usdtRate: {  ///// bankName  accountNumber feePerUSDT AmountToReceive 
                type: Number,
                required: true,
            },
           
        },
        required: function() {
            // This field is required if the transaction is a bankdeposit.
            return this.transactionType === 'bankdeposit' 
        }
    },
    // This field differentiates between bank and crypto withdrawals
    
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('AdminBankDetail', adminBankDetailSchema);
