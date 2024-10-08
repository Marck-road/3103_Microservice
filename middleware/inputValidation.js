// middleware/inputValidation.js
const { body, validationResult } = require('express-validator');

const validateUserCredentials = [
    body('username').notEmpty().withMessage('Username is required').trim().escape(),
    body('password').notEmpty().withMessage('Password is required').trim().escape(),
];

const validateNewUserInput = [
    body('username').notEmpty().withMessage('Username is required').trim().escape(),
    body('role').isIn(['admin', 'customer']).withMessage("User role must be either 'admin' or 'customer'").trim().escape(),
];

const validateProductInput = [
    body('name').notEmpty().withMessage('Product name is required').trim().escape(),
];

const validateNewOrdersInput = [
    body('productID').notEmpty().withMessage('Product ID is required').trim().escape(),
    body('quantity').notEmpty().withMessage('Product Quantity is required').trim().escape(),
];

const validateEditOrdersInput = [
    body('customerID').notEmpty().withMessage('Customer ID is required').trim().escape(),
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
    validateNewOrdersInput,
    validateEditOrdersInput,
    checkValidationResults,
};
