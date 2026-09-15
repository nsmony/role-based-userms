const express = require('express');
const app = express();

const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxy();

const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRETE = process.env.JWT_SECRETE;

// ---------- JWT VERIFICATION MIDDLEWARE ----------
function authToken(req, res, next) {
    const header = req?.headers.authorization;
    const token = header && header.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "Please send token" });
    }

    jwt.verify(token, JWT_SECRETE, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: "Token expired" });
            }
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = user; // { id, email, role }
        next();
    });
}

// ---------- ROLE VERIFICATION MIDDLEWARE ----------
function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Unauthorized: Access denied for your role" });
        }
        next();
    };
}

// ---------- PUBLIC ROUTES (No token required) ----------

// Register Microservice
app.use('/register', (req, res) => {
    console.log("GATEWAY -> REGISTER SERVICE");
    proxy.web(req, res, { target: 'http://localhost:5000' });
});

// Login Microservice
app.use('/auth', (req, res) => {
    console.log("GATEWAY -> LOGIN SERVICE");
    proxy.web(req, res, { target: 'http://localhost:5001' });
});

// ---------- PROTECTED ROUTES (Token + Role required) ----------

// Admin Microservice
app.use('/admin', authToken, authRole('admin'), (req, res) => {
    console.log("GATEWAY -> ADMIN SERVICE");
    proxy.web(req, res, { target: 'http://localhost:5002' });
});

// User Microservice
app.use('/user', authToken, authRole('user'), (req, res) => {
    console.log("GATEWAY -> USER SERVICE");
    proxy.web(req, res, { target: 'http://localhost:5003' });
});

proxy.on('error', (err, req, res) => {
    console.error("Proxy Error:", err.message);
    res.status(502).json({ message: "Bad Gateway - Target service unavailable" });
});

app.listen(4000, () => {
    console.log("API Gateway is running on PORT: 4000");
});