const client = require('prom-client');

// Create a counter for failed authentication attempts
const failedAuthCounter = new client.Counter({
    name: 'failed_authentication_attempts_total',
    help: 'Total number of failed authentication attempts',
    labelNames: ['method', 'path'],
});

// Export the counter to be used in other files
module.exports = { failedAuthCounter }; 
