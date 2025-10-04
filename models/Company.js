const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
     // Default currency set based on environment's selected country [cite: 11]
    defaultCurrency: { type: String, required: true }, 
     // Reference to the Admin user auto-created on signup [cite: 11]
    adminUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Company', companySchema);