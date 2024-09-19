const express = require('express');
const axios = require('axios');
const app = express();
const port = 3003;

app.use(express.json());

let orders = {};
let orderIdCounter = 1;


// ORDER ROUTES
// Creates a new order
app.post('/orders', async (req, res) => {
    const {customerId, productId, quantity} = req.body;

    try {
        const customerResponse = await axios.get(`http://localhost:3002/customers/${customerId}`);
        if(customerResponse.status !== 200){
            return res.status(404).json({error: "Customer not found."});
        }
        const customerData = customerResponse.data;

        // const productResponse = await axios.get(`http://localhost:3002/customers/${productId}`);
        // if(productResponse.status !== 200){
        //     return res.status(404).json({error: "Product not found."});
        // }
        // const productData = productResponse.data;

        const orderId = orderIdCounter++;
        // orders[orderId] = {customerName: customerData.name, productName: productData.name, quantity};
        orders[orderId] = {customerName: customerData.name, productName: productId, quantity};
        return res.status(201).json({message: "Order created successfully.", order_id: orderId});
    } catch (error) {
        return res.status(400).json({error: "Error creating the order."});
    }
});

//
app.get('/orders/all', (req, res) => {
    res.json(orders);
});

// Gets order details by ID
app.get('/orders/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const order = orders[orderId];
    if(!order){
        return res.status(404).json({error: "Order not found."});
    }
    res.json(order);
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});