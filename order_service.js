const express = require('express');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Middlewares
const verifyToken = require('./middleware/authMiddleware');
const { authPage } = require('./middleware/rbacMiddleware');
const { validateOrdersInput, checkValidationResults } = require('./middleware/inputValidation');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const app = express();
app.use(express.json());

const port = 3003;


const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Product service running on https://localhost:${port}`);
});

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});



let orders = {};
let orderCounter = 1;

// For admins only - Get order details
app.get('/all', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    if(!orders || Object.keys(orders).length == 0)
        return res.json({message: "No orders found!"});
    else
        res.json(orders);
});

// For admins only - Gets order details by ID
app.get('/:orderId', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    const orderId = req.params.orderId;
    const order = orders[orderId];
    if(!order){
        return res.status(404).json({error: "Order not found."});
    }
    res.json(order);
});

// For logged-on customers only - Creates a new order
app.post('/createOrder', verifyToken, authPage(["customer"]), validateOrdersInput, checkValidationResults, rateLimit, async (req, res) => {
    const {productID, quantity} = req.body;
    const customerID = req.user.id;
    
    try {
        const customerResponse = await axios.get(`https://localhost:3000/users/${customerID}`,{
            headers: {
                Authorization: req.headers['authorization'],
            },
            httpsAgent
        });
        const productResponse = await axios.get(`https://localhost:3000/products/${productID}`,{
            headers: {
                Authorization: req.headers['authorization'],
            },
            httpsAgent
        });

        const customerData = customerResponse.data;
        const productData = productResponse.data;
        const orderID = orderCounter++;   
        
        orders[orderID] = {
            customerID: customerID, 
            customerName: customerData.username, 
            productID: productID, 
            productName: productData.name, 
            quantity
        };
        
        return res.status(201).json({message: "Order created successfully.", order_id: orderID});
    } catch (error) {
        let productError = '';
        if(error.response.data.error === 'Product not found!'){
            productError = ` ${error.response.data.error}`;
        }
        console.error(`Error creating the order: ${error.message}`);
        return res.status(400).json({error: `Error creating the order.${productError}`});
    }
});


// For admins only - Update an order
app.put('/:orderId', verifyToken, authPage(["admin"]), validateOrdersInput, checkValidationResults, rateLimit, async (req, res) =>{
    const newOrderData = req.body; 
    const orderId = req.params.orderId;
    const order = orders[orderId];

    if(!order){
        return res.status(404).json({error: "Order not found!"});
    }

    try {
        const productResponse = await axios.get(`https://localhost:3000/products/${newOrderData.productID}`,{
            headers: {
                Authorization: req.headers['authorization'],
            },
            httpsAgent
        });

        const productData = productResponse.data;
        
        orders[orderId].productID = newOrderData.productID;
        orders[orderId].productName = productData.name;
        orders[orderId].quantity = newOrderData.quantity;
                
        return res.status(200).json({message: "Order updated successfully."});
    } catch (error) {
        let productError = '';
        if(error.response.data.error === 'Product not found!'){
            productError = ` ${error.response.data.error}`;
        }
        console.error(`Error updating the order: ${error.message}`);
        return res.status(400).json({error: `Error updating the order.${productError}`});
    }
});


// For admins only - Delete an order
app.delete('/:orderId', verifyToken, authPage(["admin"]), rateLimit, (req,res ) =>{
    const orderId = req.params.orderId;
    const order = orders[orderId];

    if(!order){
        return res.status(404).json({error: "Order not found!"});
    }

    delete orders[orderId];
    res.status(200).json({message: "Order deleted successfully."});
});

