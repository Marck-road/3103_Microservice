const express = require('express');
const verifyToken = require('./middleware/authMiddleware');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy options for microservices
const productServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3001', // URL of the product service
    changeOrigin: true,
});

const userServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3002', // URL of the user service
    changeOrigin: true,
});

const orderServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3003', // URL of the order service
    changeOrigin: true,
});

app.post('/login', userServiceProxy); // Proxy the login request to the user service

// Routes
app.use('/products', verifyToken, productServiceProxy); // All /products routes go to product service
app.use('/orders', verifyToken, orderServiceProxy); // All /orders routes go to order service
app.use('/users', verifyToken, userServiceProxy); // All /users routes go to user service


// Start the gateway server
app.listen(3000, () => {
    console.log('API Gateway running on http://localhost:3000');
});