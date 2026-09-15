const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectDB = require('./dbconnect');
const User = require('./user_schema'); 

const JWT_SECRETE = process.env.JWT_SECRETE;

app.use(express.json());
connectDB();

// POST /auth/login
app.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "Email, password, and role are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // Check role match
        if (user.role !== role) {
            return res.status(401).json({ message: "Invalid role for this account" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRETE,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Login successful",
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.listen(5001, () => {
    console.log("Login Microservice is running on PORT: 5001");
});