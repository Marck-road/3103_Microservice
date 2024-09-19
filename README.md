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

# Setting up the Project
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
node product_service.js
```
```
node order_service.js
```
```
node customer_service.js
```
