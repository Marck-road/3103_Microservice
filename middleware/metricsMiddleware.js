const client = require('prom-client');

// Create a counter for failed authentication attempts
const failedAuthCounter = new client.Counter({
    name: 'failed_authentication_attempts_total',
    help: 'Total number of failed authentication attempts',
    labelNames: ['method', 'path'],
});

// Create a counter for rate-limited requests 
const rateLimitCounter = new client.Counter({
    name: 'rate_limited_requests_total',
    help: 'Total number of requests that have been rate-limited',
    labelNames: ['method', 'path'],
});

// Counter to track total requests
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests received',
    labelNames: ['method', 'path'],
});

// A histogram for API request durations
const apiRequestDuration = new client.Histogram({
    name: 'api_request_duration_seconds',
    help: 'Duration of API requests in seconds',
    labelNames: ['method', 'route', 'status'], 
    buckets: [0.1, 0.5, 1, 2, 5, 10], 
});

module.exports = { 
    failedAuthCounter, 
    rateLimitCounter, 
    requestCounter,
    apiRequestDuration
}; 
