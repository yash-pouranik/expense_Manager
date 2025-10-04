const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'Manager', 'Employee'], // Roles defined 
        default: 'Employee'
    },
    company: { // Links to the auto-created company 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    manager: { // For defining manager relationships [cite: 15]
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
});

module.exports = mongoose.model('User', userSchema);