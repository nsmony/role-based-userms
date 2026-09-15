 const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverApi: { version: '1', strict: true, deprecationErrors: true }
        });

        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. Successfully connected to MongoDB Atlas!");

    } catch (err) {
        console.error("MongoDB Connection Failed:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;