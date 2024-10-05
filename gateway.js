const express = require('express');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Secret key for JWT
const JWT_SECRET = 'your_secret_key';

// Middleware to verify JWT tokens
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }
    const bearerToken = token.split(' ')[1]; // Extract the token
    jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded;
        next();
    });
}

// Proxy options for microservices
const productServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3001', // URL of the product service
    changeOrigin: true,
});

const orderServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3002', // URL of the order service
    changeOrigin: true,
});

const userServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3003', // URL of the user service
    changeOrigin: true,
});

// Routes
app.use('/products', verifyToken, productServiceProxy); // All /products routes go to product service
app.use('/orders', verifyToken, orderServiceProxy); // All /orders routes go to order service
app.use('/users', verifyToken, userServiceProxy); // All /users routes go to user service

// Start the gateway server
app.listen(3000, () => {
    console.log('API Gateway running on http://localhost:3000');
});
