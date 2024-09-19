# IT 3103 Activity
Exercise 3: Designing and Building a Microservices API
Created by:
- Calzada, Mard David
- Masayon, Gwyneth

# System Overview
The system is designed to manage Products, Customers, and Orders. This will involve three independent microservices:
- Product Service
- Customer Service
- Order Service

Each service should expose a RESTful API to allow CRUD (Create, Read, Update, Delete) operations for the relevant data.
The Order Service must interact with both the Product and Customer Service to ensure valid customer and product data before creating an order.

# Developers Guide
## Setting up the Project
1. Clone the repository in any local directory you like. For example, using the git CLI
```
git clone https://github.com/Marck-road/3103_Microservice.git
```
2. CD into the root folder
```
cd 3103_Microservice
```
3. Install the dependencies
```
npm install
```
4. Run each services in different terminals
```
node product_service
```
```
node customer_service
```
```
node order_service
```

## APIs for each Service
1. Product Service
 - **POST** `/products` — Add a new product.
 - **GET** `/products/:productId` — Get product details by ID.
 - **GET** `/products/all` — Gets the list of all products.
 - **PUT** `/products/:productId` — Update a product.
 - **DELETE** `/products/:productId` — Delete a product.
2. Customer Service
 - POST `/customers`: Add a new customer.
 - GET `/customers/:customerId` — Get customer details by ID.
 - **GET** `/customers/all` — Gets the list of all customers.
 - PUT `/customers/:customerId` — Update customer information.
 - DELETE `/customers/:customerId` — Delete a customer.
3. Order Service
 - POST `/orders` — Create a new order.
 - GET `/orders/:orderId` — Get order details.
 - **GET** `/orders/all` — Gets the list of all orders.
 - PUT `/orders/:orderId` — Update an order.
 - DELETE `/orders/:orderId` — Delete an order.
