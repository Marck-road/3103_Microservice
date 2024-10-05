const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const port = 3001;

app.use(express.json());

const JWT_SECRET = 'yourSecretKey'; 

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }
    const bearerToken = token.split(' ')[1]; // Extract the token
    jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded; // Attach decoded token info (like user id, role) to req
        next(); // Proceed to the next middleware or route
    });
}

let products = {};
let productCounter = 1;


app.listen(port, () => {
    console.log(`It's alive on http://localhost:${port}`);
});

/*-----------------------------------------------
    Gets all products with the ff format:
    http://localhost:3001/products/all
------------------------------------------------*/

app.get('/all', verifyToken, (req, res) => {
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

app.get('/:productId', verifyToken, (req, res) => {
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

app.post('/createProduct', verifyToken, (req, res) => {
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

app.put('/:productId', verifyToken, (req, res) =>{
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

app.delete('/:productId', verifyToken, (req,res ) =>{
    const productId = req.params.productId;
    const product = products[productId];

    if(!product){
        return res.status(404).json({error: "Product not found!"});
    }

    delete products[productId];
    res.status(200).json({message: "Product deleted successfully."});
});