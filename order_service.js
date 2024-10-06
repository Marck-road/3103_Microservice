const express = require('express');
const https = require('https')
const axios = require('axios');
const verifyToken = require('./middleware/authMiddleware');
const authPage = require('./middleware/rbacMiddleware');
const { validateNewOrdersInput, validateEditOrdersInput, checkValidationResults } = require('./middleware/inputValidation');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const app = express();
const port = 3003;

const fs = require('fs');
const path = require('path');
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

app.use(express.json());

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Product service running on https://localhost:${port}`);
});


// Accept self-signed certificates
const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});


let orders = {};
let orderCounter = 1;

// ORDER ROUTES


// app.use(express.json());
// app.listen(port, () => {
//     console.log(`Server is listening on port ${port}`);
// });

//Get order details
//for admins onlu
app.get('/all', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    if(!orders || Object.keys(orders).length == 0)
        return res.json({message: "No orders found!"});
    else
        res.json(orders);
});

// Gets order details by ID
//for admins onlu
app.get('/:orderId', verifyToken, authPage(["admin"]), rateLimit, (req, res) => {
    const orderId = req.params.orderId;
    const order = orders[orderId];
    if(!order){
        return res.status(404).json({error: "Order not found."});
    }
    res.json(order);
});

// Creates a new order
//only for logged-on customers
app.post('/createOrder', verifyToken, authPage(["customer", "admin"]), validateNewOrdersInput, checkValidationResults, rateLimit, async (req, res) => {
    const {customerId, productId, quantity} = req.body;
    
    try {
        const customerResponse = await axios.get(`https://localhost:3000/users/${customerId}`,{
            headers: {
                Authorization: req.headers['authorization'],  // Passing orig token
            },
            httpsAgent
        });
        const productResponse = await axios.get(`https://localhost:3000/products/${productId}`,{
            headers: {
                Authorization: req.headers['authorization'],  // Passing orig token
            },
            httpsAgent
        });

        const customerData = customerResponse.data;
        const productData = productResponse.data;
        const orderId = orderCounter++;   
        
        orders[orderId] = {customerName: customerData.name, productName: productData.name, quantity};
        
        return res.status(201).json({message: "Order created successfully.", order_id: orderId});
    } catch (error) {
        console.error(`Error creating the order: ${error.message}`);
        return res.status(400).json({error: "Error creating the order."});
    }
});


/*-----------------------------------------------
    Updates an order with the ff format:
    http://localhost:3003/orders/orderID
------------------------------------------------*/

//for admins onlu
app.put('/:orderId', verifyToken, authPage(["admin"]), validateEditOrdersInput, checkValidationResults, rateLimit, (req, res) =>{
    const newOrderData = req.body;     
    const orderId = req.params.orderId;
    const order = orders[orderId];

    if(!order){
        return res.status(404).json({error: "Order not found!"});
    }

    orders[orderId] = newOrderData;
    res.status(200).json({message: "Order updated successfully."});
});

/*-----------------------------------------------
    Deletes an order using its ID with the ff format:
    http://localhost:3003/orders/orderID
------------------------------------------------*/

//for admins onlu
app.delete('/:orderId', verifyToken, authPage(["admin"]), rateLimit, (req,res ) =>{
    const orderId = req.params.orderId;
    const order = orders[orderId];

    if(!order){
        return res.status(404).json({error: "Order not found!"});
    }

    delete orders[orderId];
    res.status(200).json({message: "Order deleted successfully."});
});

