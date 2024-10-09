const rateLimit = require('express-rate-limit');
const client = require('prom-client');

// Create a counter for rate-limited requests
const rateLimitCounter = new client.Counter({
    name: 'rate_limited_requests_total',
    help: 'Total number of requests that have been rate-limited asdasd',
    labelNames: ['method', 'path'],
});

// Limit to 10 requests per hour
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100, // Limit each IP to 10 requests per window
    legacyHeaders: false,//disable the 'X-rateLimit-*' headers
    message: "Too many requests, please try again later.",
    handler: (req, res) => {
        rateLimitCounter.inc(); // Increment the rate limit counter
        res.status(429).json({ message: "Too many requests, please try again later." }); // Custom response
    },
});

module.exports = limiter;