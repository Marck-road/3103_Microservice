const express = require('express');
const jwt = require("jsonwebtoken");
const fs = require('fs');
const https = require('https');
const path = require('path');

// Middlewares
const verifyToken = require('./middleware/authMiddleware');
const { authPage, authUserAccess} = require('./middleware/rbacMiddleware');
const { validateUserCredentials, validateNewUserInput, checkValidationResults } = require('./middleware/inputValidation');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const app = express();
app.use(express.json());

const port = 3002;


const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`User Service running on https://localhost:${port}`);
});



const getUser = async(username) => {
    const validateUsername = username.toLowerCase();
    const userEntry = Object.entries(users).find(([id, user]) => user.username.toLowerCase() === validateUsername);
    if (userEntry) {
        const [id, user] = userEntry;
        return {
            id, 
            username: user.username, 
            password: user.password, 
            role: user.role
        };
    }
}

// Gereates a JWT Token with user id and role
function generateAccessToken(user){
    const payload = {
        id: user.id,
        role: user.role
    };
    
    const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: "1h" });
    
    return token;
}

//LOGIN ROUTE
app.post('/login', validateUserCredentials, checkValidationResults, rateLimit, async (req, res) => {

    const { username, password} = req.body;
    const user = await getUser(username, password);
    if (!user || user.password !== password){
        return res.status(403).json({
            error: "Invalid Login.",
        });
    }
    
    delete user.password;

    const token = generateAccessToken(user);

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

    const validateUsername = userData.username.toLowerCase();
    const isUsernameTaken = Object.values(users).some(user => user.username.toLowerCase() === validateUsername);
    if (isUsernameTaken) {
        return res.status(400).json({error: `Username '${userData.username}' already exists.`});
    }
    
    userData.role = 'customer';
    const userId = userCounter++;
    users[userId] = userData;
    const { username: userName } = userData;
    
    return res.status(201).json({
        message: `Account '${userName}' successfully created.`,
        user_id: userId,
        user_name: userName
    });
});


let users = {"1": {username: "Test", password: "123123", role:'admin'}};
let userCounter = 2;


// CUSTOMER ROUTES
// For admins only - Adds a new user: customer or admin
app.post('/createUser', verifyToken, authPage(["admin"]), validateNewUserInput, checkValidationResults, rateLimit, (req, res) => {
    const userData = {username: req.body.username, password: "123456", role: req.body.role};

    const validateUsername = userData.username.toLowerCase();
    const isUsernameTaken = Object.values(users).some(user => user.username.toLowerCase() === validateUsername);

    if (isUsernameTaken) {
        return res.status(400).json({error: `Username '${userData.username}' already exists.`});
    }

    const userId = userCounter++;
    users[userId] = userData;
    const { username: userName, role: userRole } = userData;

    return res.status(201).json({
        message: `Account created successfully with an ID of ${userId}!`,
        user_id: userId,
        username: userName,
        role: userRole
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

// Customers should only update their own details - Updates customer information
app.put('/:userId', verifyToken, authPage(["customer", "admin"]), authUserAccess, validateUserCredentials, checkValidationResults, rateLimit, (req, res) => {
    const newUserData = req.body;
    const userId = req.params.userId;

    if(!users[userId]){
        return res.status(404).json({error: "User not found."});
    }

    const validateUsername = newUserData.username.toLowerCase();
    const isUsernameTaken = Object.keys(users).some(id => users[id].username.toLowerCase() === validateUsername && id !== userId);

    if (isUsernameTaken) {
        return res.status(400).json({ error: `Username '${newUserData.username}' already exists.` });
    }

    users[userId].username = newUserData.username;
    users[userId].password = newUserData.password;
    res.status(200).json({message: "User account updated successfully."});
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

