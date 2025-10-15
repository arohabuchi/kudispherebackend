const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the transaction schema.
const transactionSchema = new Schema({
    // Reference to the user who initiated the transaction
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Type of transaction: 'deposit' for funding, 'withdrawal' for payout
    transactionType: {
        type: String,
        enum: ['deposit', 'withdrawal', 'cryptowithdrawal', 'bankdeposit'],
        required: true
    },
    // The current status of the transaction
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        required: true,
        default: 'pending'
    },
    // The amount of the transaction
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    
    // Details specific to a crypto transaction (for deposits and crypto withdrawals)
    cryptoDetails: {
        // We use a nested object to keep crypto details organized.
        type: {
            transactionHash: {
                type: String,
                required: false
            },
            cryptoAddress: {
                type: String,
                required: false
            },
            // The coin type associated with the transaction
            coinType: {
                type: String,
                required: true,
                uppercase: true,
            },
            amountToReceive: {////  transactionHash  cryptoAddress  coinType   amountToReceive  amount
            type: Number,
            required: true,
            min: 0
        },
        },
        required: function() {
            // This field is required if the transaction is a deposit or a crypto withdrawal.  bankdeposit
            return this.transactionType === 'deposit'  || (this.transactionType === 'withdrawal' && this.withdrawalMethod === 'crypto');
        }
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
                type: String,
                required: true
            },
            accountHolderName: {
                type: String,
                required: true
            },
            feePerUSDT: {
                type: Number,
                required: true
            },
            amountToReceive: {
                type: Number,
                required: true,
                min:0
            }
        },
        required: function() {
            // This field is required if the transaction is a deposit or a crypto withdrawal.
            return this.transactionType === 'bankdeposit' || (this.transactionType === 'withdrawal' && this.withdrawalMethod === 'bank');
            // This field is required if the transaction is a bank withdrawal.
            // return this.transactionType === 'withdrawal' && this.withdrawalMethod === 'bank';
        }
    },
    // This field differentiates between bank and crypto withdrawals
    withdrawalMethod: {
        type: String,
        enum: ['bank', 'crypto'],
        required: function() {
            return this.transactionType === 'withdrawal';
        }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Transaction', transactionSchema);
