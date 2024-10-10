const rateLimit = require('express-rate-limit');
const { rateLimitCounter } = require('./metricsMiddleware'); 

// Middleware for rate limiters
// Limits to 50 requests per 15 mins
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 50, // Limit each IP to 50 requests per window
    legacyHeaders: false, 
    message: "Too many requests, please try again later.",
    handler: (req, res) => {
        rateLimitCounter.inc();
        res.status(429).json({ message: "Too many requests, please try again later." }); // Custom response
    },
});

module.exports = limiter;