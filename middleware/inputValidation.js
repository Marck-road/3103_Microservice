// middleware/inputValidation.js
const { body, validationResult } = require('express-validator');

const validateLoginInput = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const validateUserProfileInput = [
    body('name').notEmpty().withMessage('Username is required').trim().escape(),
    body('password').notEmpty().withMessage('Password is required').trim().escape(),
    body('role').isIn(['admin', 'customer']).withMessage('User role must be either "admin" or "customer"').trim().escape(),
];

const checkValidationResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // returns unprocessable entity
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateLoginInput,
    validateUserProfileInput,
    checkValidationResults,
};
