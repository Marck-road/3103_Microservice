require('dotenv').config();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT tokens
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }
    const bearerToken = token.split(' ')[1];
    jwt.verify(bearerToken, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
