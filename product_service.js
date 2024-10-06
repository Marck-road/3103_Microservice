const express = require('express');
const app = express();

// middlewares
const verifyToken = require('./middleware/authMiddleware');
const authPage = require('./middleware/rbacMiddleware');
const { validateProductInput, checkValidationResults } = require('./middleware/inputValidation');
const rateLimit = require('./middleware/rateLimiterMiddleware');

const fs = require('fs');
const https = require('https');
const path = require('path');

const port = 3001;

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

app.use(express.json());

https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Product service running on https://localhost:${port}`);
});

let products = {};
let productCounter = 1;

// app.listen(port, () => {
//     console.log(`It's alive on https://localhost:${port}`);
// });

/*-----------------------------------------------
    Gets all products with the ff format:
    http://localhost:3001/products/all
------------------------------------------------*/

//for all users
app.get('/all', verifyToken, authPage(["customer", "admin"]), rateLimit, (req, res) => {
    if(!products || Object.keys(products).length == 0){
        return res.status(404).json({error: "No product found!"});
    }

    res.status(200).send({
        message: 'List of all products',
        products: products
    });
});

/*-----------------------------------------------
    Gets a product using its ID with the ff format:
    http://localhost:3001/products/productID
------------------------------------------------*/

//for all users
app.get('/:productId', verifyToken, authPage(["customer", "admin"]), rateLimit, (req, res) => {
    const productId = req.params.productId;
    const product = products[productId];

    if(!product){
        return res.status(404).json({error: "Product not found!"});
    }

    res.json(product);
});

/*-----------------------------------------------
    Post a new product with the ff format:
    http://localhost:3001/products
------------------------------------------------*/

//for admins only
app.post('/createProduct', verifyToken, authPage(["customer", "admin"]), validateProductInput, checkValidationResults, rateLimit, (req, res) => {
    const productData = req.body;
    const productId = productCounter++;   
    products[productId] = productData;
    const { name: productName } = productData;


    // Makes sure we have product in req.body
    if (!productData){
        res.status(418).send({
            message: 'Incomplete product information!'
        })
    }

    // If successful, send response of product
    res.status(201).send({
        message: `${productName} successfully added with an ID of ${productId}!`,
        product_name: productName,
        product_id: productId
    });
});

/*-----------------------------------------------
    Updates a product with the ff format:
    http://localhost:3001/products/2
------------------------------------------------*/
//for admins only
app.put('/:productId', verifyToken, authPage(["admin"]), validateProductInput, checkValidationResults, rateLimit, (req, res) =>{
    const newProductData = req.body;     
    const productId = req.params.productId;
    const product = products[productId];

    if(!product){
        return res.status(404).json({error: "Product not found!"});
    }

    products[productId] = newProductData;
    res.status(200).json({message: "Product updated successfully."});

});

/*-----------------------------------------------
    Deletes a product using its ID with the ff format:
    http://localhost:3001/products/productID
------------------------------------------------*/

//for admins only
app.delete('/:productId', verifyToken, authPage(["admin"]), rateLimit, (req,res ) =>{
    const productId = req.params.productId;
    const product = products[productId];

    if(!product){
        return res.status(404).json({error: "Product not found!"});
    }

    delete products[productId];
    res.status(200).json({message: "Product deleted successfully."});
});