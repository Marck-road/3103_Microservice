require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const verifyToken = require('./middleware/authMiddleware');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Loading SSL certificate
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

// Proxy options for microservices
const productServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3001', // URL of the product service
    changeOrigin: true,
    secure: false
});

const userServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3002', // URL of the user service
    changeOrigin: true,
    secure: false,
    onError: (err, req, res) => {
        console.error(`Error occurred while trying to proxy to User Service:`, err.message);
        res.status(500).json({ error: 'Proxy error occurred.' });
    },
});

const orderServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3003', // URL of the order service
    changeOrigin: true,
    secure: false
});

app.post('/login', userServiceProxy); // Proxy the login request to the user service
app.post('/register', userServiceProxy); // Proxy the register request to the user service


// Routes
app.use('/products', verifyToken, productServiceProxy); // All /products routes go to product service
app.use('/orders', verifyToken, orderServiceProxy); // All /orders routes go to order service
app.use('/users', verifyToken, userServiceProxy); // All /users routes go to user service


// Start the gateway server
// app.listen(3000, () => {
//     console.log('API Gateway running on https://localhost:3000');
// });

// Starting HTTPS server
https.createServer(sslOptions, app).listen(3000, () => {
    try{
        console.log('API Gateway running on https://localhost:3000');
    }catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(400).json({error: "Error occured."});
    }
});
