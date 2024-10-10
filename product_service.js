const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const client = require('prom-client');

// Middlewares
const verifyToken = require('./middleware/authMiddleware');
const { authPage } = require('./middleware/rbacMiddleware');
const { validateProductInput, checkValidationResults } = require('./middleware/inputValidationMiddleware');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const app = express();
app.use(express.json());

const port = 3001;


const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

client.collectDefaultMetrics();

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Product service running on https://localhost:${port}`);
});



let products = {"1": {"name": "Hamburger", "price": "40", "stock": "15"},"2": {"name": "Waffles", "price": "70", "stock": "5"},"3": {"name": "Fries", "price": "20", "stock": "20"}};
let productCounter = 4;

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

// For all users - Gets all products
app.get('/all', verifyToken, authPage(["customer", "admin"]), rateLimit, (req, res) => {
    if(!products || Object.keys(products).length == 0){
        return res.status(404).json({error: "No product found!"});
    }

    res.status(200).send({
        message: 'List of all products',
        products: products
    });
});

// For all users - Gets a product by ID
app.get('/:productId', verifyToken, authPage(["customer", "admin"]), rateLimit, (req, res) => {
    const productId = req.params.productId;
    const product = products[productId];

    if(!product){
        return res.status(404).json({error: "Product not found!"});
    }

    res.json(product);
});

// For admins only - Creates a new product
app.post('/createProduct', verifyToken, authPage(["admin"]), validateProductInput, checkValidationResults, rateLimit, (req, res) => {
    const productData = req.body;

    const validateProdName = productData.name.toLowerCase();
    const isProdNameTaken = Object.values(products).some(products => products.name.toLowerCase() === validateProdName);

    if (isProdNameTaken) {
        return res.status(400).json({error: `Product '${productData.name}' already exists.`});
    }

    const productId = productCounter++;
    products[productId] = productData;
    const { name: productName } = productData;

    res.status(201).send({
        message: `${productName} successfully added with an ID of ${productId}!`,
        product_name: productName,
        product_id: productId
    });
});

// For admins only - Updates a product
app.put('/:productId', verifyToken, authPage(["admin"]), validateProductInput, checkValidationResults, rateLimit, (req, res) =>{
    const newProductData = req.body;     
    const productId = req.params.productId;

    if(!products[productId]){
        return res.status(404).json({error: "Product not found!"});
    }

    const validateProdName = newProductData.name.toLowerCase();
    const isProdNameTaken = Object.keys(products).some(id => products[id].name.toLowerCase() === validateProdName && id !== productId);

    if (isProdNameTaken) {
        return res.status(400).json({error: `Product '${newProductData.name}' already exists.`});
    }

    products[productId] = newProductData;
    res.status(200).json({message: "Product updated successfully."});

});

// For admins only - Deletes a product
app.delete('/:productId', verifyToken, authPage(["admin"]), rateLimit, (req,res ) =>{
    const productId = req.params.productId;
    const product = products[productId];

    if(!product){
        return res.status(404).json({error: "Product not found!"});
    }

    delete products[productId];
    res.status(200).json({message: "Product deleted successfully."});
});