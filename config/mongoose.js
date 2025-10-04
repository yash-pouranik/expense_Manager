const mongoose = require('mongoose');

// Function to establish the database connection
const dbConnection = async () => {
    try {
        // Use the connection string from the .env file
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
            process.exit(1);
        }

        await mongoose.connect(mongoUri, {
            // These options are now default in Mongoose 6+ but are included for clarity/compatibility
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB Connected Successfully.');
    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        // Exit process with failure if the connection fails
        process.exit(1);
    }
};

// Execute the connection function when this file is required
dbConnection();