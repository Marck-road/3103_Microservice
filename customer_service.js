const express = require('express');
const app = express();
const port = 3002;

app.use(express.json());

let customers = {};
let customerIdCounter = 1;


// CUSTOMER ROUTES
// Adds a new customer
app.post('/customers', (req, res) => {
    const customerData = req.body;
    const customerId = customerIdCounter++;
    customers[customerId] = customerData;
    return res.status(201).json({message: "Customer created successfully.", customer_id: customerId});
});

//
app.get('/customers/all', (req, res) => {
    if(customers.length == 0)
        return res.json({message: "No customers added in the list."});
    else
        res.json(customers);
});

// Gets customer details by ID
app.get('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    const customer = customers[customerId];
    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }
    res.json(customer);
});

// Updates customer information
app.put('/customers/:customerId', (req, res) => {
    const customerNewData = req.body;
    const customerId = req.params.customerId;
    const customer = customers[customerId];
    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }
    customers[customerId] = customerNewData;
    res.status(200).json({message: "Customer updated successfully."});
});

// Deletes a customer
app.delete('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    const customer = customers[customerId];
    if(!customer){
        return res.status(404).json({error: "Customer not found."});
    }
    delete customers[customerId];
    res.status(200).json({message: "Customer deleted successfully."});
});



app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});