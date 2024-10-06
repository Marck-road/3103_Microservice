const jwt = require("jsonwebtoken");
const express = require('express');
const app = express();
const port = 3002;

const fs = require('fs');
const https = require('https');
const path = require('path');

// middlewares
const verifyToken = require('./middleware/authMiddleware');
const authPage = require('./middleware/rbacMiddleware');
const { validateLoginInput, validateUserProfileInput, checkValidationResults } = require('./middleware/inputValidation');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

app.use(express.json());

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`User Service running on https://localhost:${port}`);
});
// app.listen(port, () => {
//     console.log(`Server is listening on port ${port}`);
// });


const getUser = async(username) => {
    return {
        id: 123, 
        password: "12345", 
        username, 
        role:'admin' 
    };
}

// Gereates a JWT Token with user id and role
function generateAccessToken(user){
    const payload = {
        id: user.id,
        role: user.role
    };
    
    //security measurement and acts as the key to hit endpoints and ensure the user is correct user
    const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: "1h" });
    
    return token;
}

//LOGIN ROUTE
app.post('/login', validateLoginInput, checkValidationResults, rateLimit, async (req, res) => {

    const { username, password} = req.body;
    const user = await getUser(username);

    if (!user || user.password !== password){
        return res.status(403).json({
            error: "invalid login",
        });
    }
    
    delete user.password;

    const token = generateAccessToken(user);

    // so that browser can keep track of it and sed that cookie when future requests
    res.cookie("token", token, {
        httpOnly: true,
    });

    return res.status(200).json({
        message: "Login successful",
        role: user.role,
        token: token
    })
    
});

let customers = {};
let customerCounter = 1;

// CUSTOMER ROUTES
// Adds a new customer
app.post('/createCustomer', verifyToken, authPage(["customer", "admin"]), validateUserProfileInput, checkValidationResults, rateLimit, (req, res) => {
    const customerData = req.body;
    const customerId = customerCounter++;
    customers[customerId] = customerData;
    const { name: customerName } = customerData;

    return res.status(201).json({
        message: `${customerName} Customer created successfully.`, 
        customer_name: customerName,
        customer_id: customerId,
    });
});

// Gets all customers
app.get('/all', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    if(customers.length == 0)
        return res.json({message: "No customers added in the list."});
    else
        res.json(customers);
});

// Gets customer details by ID
app.get('/:customerId', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    const customerId = req.params.customerId;
    const customer = customers[customerId];
    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }
    res.json(customer);
});

// Updates customer information
app.put('/:customerId', verifyToken, authPage(["customer", "admin"]), verifyToken, validateUserProfileInput, checkValidationResults, rateLimit, (req, res) => {
    const newCustomerData = req.body;
    const customerId = req.params.customerId;
    const customer = customers[customerId];
    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }
    customers[customerId] = newCustomerData;
    res.status(200).json({message: "Customer updated successfully."});
});

// Deletes a customer
app.delete('/:customerId', authPage(["admin"]), verifyToken, rateLimit, (req, res) => {
    const customerId = req.params.customerId;
    const customer = customers[customerId];
    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }
    delete customers[customerId];
    res.status(200).json({message: "Customer deleted successfully."});
});

