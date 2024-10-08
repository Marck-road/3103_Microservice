const jwt = require("jsonwebtoken");
const express = require('express');
const app = express();
const port = 3002;

const fs = require('fs');
const https = require('https');
const path = require('path');

// middlewares
const verifyToken = require('./middleware/authMiddleware');
const { authPage, authUserAccess} = require('./middleware/rbacMiddleware');
const { validateUserCredentials, validateNewUserInput, checkValidationResults } = require('./middleware/inputValidation');
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
        id: "1", 
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
app.post('/login', validateUserCredentials, checkValidationResults, rateLimit, async (req, res) => {

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
        id: user.id,
        role: user.role,
        token: token
    })
    
});

//REGISTER ROUTE
app.post('/register', validateUserCredentials, checkValidationResults, (req, res) => {
    const userData = req.body;
    userData.role = 'customer';
    const userId = userCounter++;
    users[userId] = userData;
    const { username: userName } = userData;
    
    return res.status(201).json({
        message: `Account '${userName}' successfully created.`,
        user_name: userName,
        user_id: userId,
    });
});

let users = {"1": {username: "Test1", password: "12345", role:'admin'}};
// let users = {};
let userCounter = 2;

// CUSTOMER ROUTES
// For admins only - Adds a new user: customer/admin
app.post('/createUser', verifyToken, authPage(["admin"]), validateNewUserInput, checkValidationResults, rateLimit, (req, res) => {
    const userData = {username: req.body.username, password: "12345", role: req.body.role};
    const userId = userCounter++;
    users[userId] = userData;
    const { username: userName } = userData;

    return res.status(201).json({
        message: `Customer '${userName}' created successfully with an ID of ${userId}!`,
        user_name: userName,
        user_id: userId,
    });
});

// For admins only - Gets all users
app.get('/all', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    if(!users || Object.keys(users).length == 0){
        return res.status(200).json({message: "No users added in the list."});
    }

    let userList = Object.keys(users).reduce((acc, key) => {
        let { password, ...userList } = users[key];
        acc[key] = userList;
        return acc;
    }, {});

    res.status(200).send({
        message: 'List of all users',
        users: userList
    });
});

// Customers should only see their own details - Gets customer details by ID
app.get('/:userId', verifyToken, authPage(["customer", "admin"]), authUserAccess, rateLimit, (req, res) => {
    const userId = req.params.userId;
    const user = users[userId];

    if(!user){
        return res.status(404).json({error: "User not found."});
    }    

    res.status(200).json({username: user.username, role: user.role});
});

// Updates customer information
app.put('/:userId', verifyToken, authPage(["customer", "admin"]), authUserAccess, validateUserCredentials, checkValidationResults, rateLimit, (req, res) => {
    const newuserData = req.body;
    const userId = req.params.userId;
    const customer = users[userId];

    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }

    users[userId].username = newuserData.username;
    users[userId].password = newuserData.password;
    res.status(200).json({message: "Customer updated successfully."});
});

// For admins only - Deletes a customer
app.delete('/:userId', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    const userId = req.params.userId;
    const customer = users[userId];

    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }

    delete users[userId];
    res.status(200).json({message: "Customer deleted successfully."});
});

