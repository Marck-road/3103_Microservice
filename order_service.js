const express = require('express');
const axios = require('axios');
const verifyToken = require('./middleware/authMiddleware');

const app = express();
const port = 3003;

app.use(express.json());

let orders = {};
let orderCounter = 1;

// ORDER ROUTES


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

//Get order details
//for admins onlu
app.get('/all', verifyToken, (req, res) => {
    if(!orders || Object.keys(orders).length == 0)
        return res.json({message: "No orders found!"});
    else
        res.json(orders);
});

// Gets order details by ID
//for admins onlu
app.get('/:orderId', verifyToken, (req, res) => {
    const orderId = req.params.orderId;
    const order = orders[orderId];
    if(!order){
        return res.status(404).json({error: "Order not found."});
    }
    res.json(order);
});

// Creates a new order
//only for logged-on customers
app.post('/createOrder', verifyToken, async (req, res) => {
    const {customerId, productId, quantity} = req.body;
    
    try {
        const customerResponse = await axios.get(`http://localhost:3000/users/${customerId}`,{
            headers: {
                Authorization: req.headers['authorization'],  // Pass the original token
            }
        });
        const productResponse = await axios.get(`http://localhost:3000/products/${productId}`,{
            headers: {
                Authorization: req.headers['authorization'],  // Pass the original token
            }
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
app.put('/:orderId', verifyToken, (req, res) =>{
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
app.delete('/:orderId', verifyToken, (req,res ) =>{
    const orderId = req.params.orderId;
    const order = orders[orderId];

    if(!order){
        return res.status(404).json({error: "Order not found!"});
    }

    delete orders[orderId];
    res.status(200).json({message: "Order deleted successfully."});
});

