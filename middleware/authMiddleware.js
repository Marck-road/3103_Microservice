const jwt = require('jsonwebtoken');

const JWT_SECRET = 'yourSecretKey';

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

module.exports = verifyToken;
