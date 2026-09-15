const express = require('express');
const app = express();
require('dotenv').config();

const connectDB = require('./dbconnect');
const User = require('./user_schema'); 

app.use(express.json());
connectDB();

// GET /admin/searchuser?name=xxx OR ?email=xxx
app.get('/searchuser', async (req, res) => {
    try {
        const { name, email } = req.query;

        if (!name && !email) {
            return res.status(400).json({ message: "Please provide name or email to search" });
        }

        const query = {};
        if (name) query.name = { $regex: name, $options: 'i' };
        if (email) query.email = { $regex: email, $options: 'i' };

        const users = await User.find(query).select('-password');

        if (users.length === 0) {
            return res.status(404).json({ message: "No user found" });
        }

        res.status(200).json({ message: "User(s) found", users });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /admin/viewalluser
app.get('/viewalluser', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ message: "All users fetched", count: users.length, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// DELETE /admin/deluser
app.delete('/deluser', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required to delete a user" });
        }

        const deletedUser = await User.findOneAndDelete({ email });

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully", email });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.listen(5002, () => {
    console.log("Admin Microservice is running on PORT: 5002");
});