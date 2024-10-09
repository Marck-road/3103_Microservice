const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const client = require('prom-client');

const verifyToken = require('./middleware/authMiddleware');
const { createProxyMiddleware } = require('http-proxy-middleware');
const limiter = require('./middleware/rateLimiterMiddleware');

const app = express();

// Counter to track total requests
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests received',
    labelNames: ['method', 'path'],
});

// Create a histogram for API request durations
const apiRequestDuration = new client.Histogram({
    name: 'api_request_duration_seconds',
    help: 'Duration of API requests in seconds',
    labelNames: ['method', 'route', 'status'], // Optional labels for more granularity
    buckets: [0.1, 0.5, 1, 2, 5, 10], // Customize buckets as needed
});

// Loading SSL certificate
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

// Proxy options for microservices
const productServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3001', // URL of the product service
    changeOrigin: true,
    secure: false,
});

const userServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3002', // URL of the user service
    changeOrigin: true,
    secure: false,
});

const orderServiceProxy = createProxyMiddleware({
    target: 'https://localhost:3003', // URL of the order service
    changeOrigin: true,
    secure: false,
});


// Collect default metrics (e.g., memory usage, CPU usage)
client.collectDefaultMetrics();

// Increment counter with method and path
app.use((req, res, next) => {
    requestCounter.inc({ method: req.method, path: req.path }); 
    next();
});

app.use(limiter);

app.post('/login', userServiceProxy); // Proxy the login request to the user service

// Routes
app.use('/products', verifyToken, productServiceProxy); // All /products routes go to product service
app.use('/orders', verifyToken, orderServiceProxy); // All /orders routes go to order service
app.use('/users', verifyToken, userServiceProxy); // All /users routes go to user service

// Expose /metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);

    try {
        const metrics = await client.register.metrics(); // Wait for the metrics Promise to resolve
        res.end(metrics); // Send the resolved metrics
    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).end('Error generating metrics'); // Handle error
    }
});

// Starting HTTPS server
https.createServer(sslOptions, app).listen(3000, () => {
    try{
        console.log('API Gateway running on https://localhost:3000');
    }catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(400).json({error: "Error occured."});
    }
});
