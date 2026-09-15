const express = require('express');
const app = express();
require('dotenv').config();

const connectDB = require('./dbconnect');
const User = require('./user_schema'); 

app.use(express.json());
connectDB();

// GET /user/viewprofile
// req.user comes from the decoded JWT forwarded by the gateway,
// but since Express doesn't forward custom fields across a raw HTTP proxy,
// we pass the user's email/id via a header or the token itself.
// Simplest reliable way: gateway forwards the Authorization header,
// and this service re-decodes it locally.

const jwt = require('jsonwebtoken');
const JWT_SECRETE = process.env.JWT_SECRETE;

function getUserFromToken(req) {
    const header = req.headers.authorization;
    const token = header && header.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRETE);
    } catch (err) {
        return null;
    }
}

app.get('/viewprofile', async (req, res) => {
    try {
        const decoded = getUserFromToken(req);
        if (!decoded) {
            return res.status(403).json({ message: "Invalid or missing token" });
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile fetched", user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.put('/updateprofile', async (req, res) => {
    try {
        const decoded = getUserFromToken(req);
        if (!decoded) {
            return res.status(403).json({ message: "Invalid or missing token" });
        }

        const { name, phone } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            { $set: { name, phone } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.listen(5003, () => {
    console.log("User Microservice is running on PORT: 5003");
});