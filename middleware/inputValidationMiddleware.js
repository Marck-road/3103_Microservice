const { body, validationResult } = require('express-validator');

// Middleware for input validations
const validateUserCredentials = [
    body('username').notEmpty().withMessage('Username is required').bail().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.').trim().escape(),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.').trim().escape(),
];

const validateNewUserInput = [
    body('username').notEmpty().withMessage('Username is required').bail().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.').trim().escape(),
    body('role').isIn(['admin', 'customer']).withMessage("User role must be either 'admin' or 'customer'").trim().escape(),
];

const validateProductInput = [
    body('name').notEmpty().withMessage('Product name is required').trim().escape(),
    body('price').notEmpty().withMessage('Price is required').trim().escape().isFloat({ min: 0.01 }).withMessage('Price must be a number at least 0.01'),
    body('stock').notEmpty().withMessage('Stock is required').trim().escape().isInt({ min: 1 }).withMessage('Stock must be a number at least 1.'),
];

const validateNewOrdersInput = [
    body('productID').notEmpty().withMessage('Product ID is required').bail().trim().escape(),
    body('quantity').notEmpty().withMessage('Product Quantity is required').trim().escape().isInt({ min: 1 }).withMessage('Product Quantity must be a number at least 1.'),
    body('payment_status').isIn(['paid', 'unpaid']).withMessage("Status must be either 'Paid' or 'Unpaid'").trim().escape(),
];

const validateEditOrdersInput = [
    body('payment_status').isIn(['paid', 'unpaid']).withMessage("Payment Status must be either 'Paid' or 'Unpaid'").trim().escape(),
    body('delivery_status').isIn(['delivered', 'undelivered']).withMessage("Delivery Status must be either 'Delivered' or 'Undelivered'").trim().escape(),
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
