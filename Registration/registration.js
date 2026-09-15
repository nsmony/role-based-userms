const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./dbconnect');
const User = require('./user_schema');

app.use(express.json());
connectDB();

// POST /register/userregister
app.post('/userregister', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check for duplicate email (fast-path check)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Hash password (coerce to string in case a number/other type is sent)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(password), salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone
        });

        await newUser.save();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        // Handles the race condition: two requests passing findOne() at once
        if (err.code === 11000) {
            return res.status(409).json({ message: "Email already registered" });
        }
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.listen(5000, () => {
    console.log("Register Microservice is running on PORT: 5000");
});