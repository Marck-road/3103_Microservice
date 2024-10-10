const express = require('express');
const axios = require('axios');
const client = require('prom-client');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Middlewares
const verifyToken = require('./middleware/authMiddleware');
const { authPage } = require('./middleware/rbacMiddleware');
const { validateNewOrdersInput, validateEditOrdersInput, checkValidationResults } = require('./middleware/inputValidationMiddleware');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const app = express();
app.use(express.json());

const port = 3003;


const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

client.collectDefaultMetrics();

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Product service running on https://localhost:${port}`);
});

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});



let orders = {};
let orderCounter = 1;

// Exposing metrics to prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);

    try {
        const metrics = await client.register.metrics();
        res.end(metrics);
    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).end('Error generating metrics');
    }
});

// ORDER ROUTES
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
app.post('/createOrder', verifyToken, authPage(["customer"]), validateNewOrdersInput, checkValidationResults, rateLimit, async (req, res) => {
    const {productID, quantity, payment_status} = req.body;
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

        if(parseInt(quantity, 10) > parseInt(productData.stock, 10)){
            return res.status(400).json({
                error: `Error creating the order. ${productData.name} has only ${productData.stock} in stock.`
            });
        }

        const orderID = orderCounter++;   
            
        orders[orderID] = {
            customerID: customerID, 
            customerName: customerData.username, 
            order_details: {
                productID: productID, 
                productName: productData.name, 
                quantity
            },
            payment_status,
            delivery_status: "undelivered"
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
app.put('/:orderId', verifyToken, authPage(["admin"]), validateEditOrdersInput, checkValidationResults, rateLimit, async (req, res) =>{
    const newOrderData = req.body; 
    const orderId = req.params.orderId;

    if(!orders[orderId]){
        return res.status(404).json({error: "Order not found!"});
    }

    if(newOrderData.delivery_status === "delivered" && newOrderData.payment_status === "unpaid"){
        return res.status(400).json({
            error: "Order cannot be updated. Please ensure that payment has been made."
        });
    }

    orders[orderId].payment_status = newOrderData.payment_status;
    orders[orderId].delivery_status = newOrderData.delivery_status;
            
    return res.status(200).json({message: "Order updated successfully."});
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

