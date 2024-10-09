// middleware/inputValidation.js
const { body, validationResult } = require('express-validator');

const validateUserCredentials = [
    body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.').trim().escape(),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.').trim().escape(),
];

const validateNewUserInput = [
    body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.').trim().escape(),
    body('role').isIn(['admin', 'customer']).withMessage("User role must be either 'admin' or 'customer'").trim().escape(),
];

const validateProductInput = [
    body('name').notEmpty().withMessage('Product name is required').trim().escape(),
];

const validateOrdersInput = [
    body('productID').notEmpty().withMessage('Product ID is required').trim().escape(),
    body('quantity').notEmpty().withMessage('Product Quantity is required').trim().escape(),
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
    validateUserCredentials,
    validateNewUserInput,
    validateProductInput,
    validateOrdersInput,
    checkValidationResults,
};
