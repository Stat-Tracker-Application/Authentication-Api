# Microservice: Authentication API

## Overview

The Authentication API microservice handles user authentication for the GameStats Tracker application. It provides endpoints for user signup, login, token authentication, and user deletion. The service uses bcrypt for password hashing and JWT for token-based authentication. The RabbitMQ-related code is currently commented out, because as of writing this, RabbitMQ is not working with this project.

## Setup and Configuration

1. Clone the repository.
2. Run the commands in the root project readme.

Note the environment variables:

- `AUTHDB_USER`: Username for MongoDB connection.
- `AUTHDB_PASSWORD`: Password for MongoDB connection.
- `ACCESS_TOKEN_SECRET`: Secret key for JWT token generation.

these are set through Kubernetes. See the file `auth-api-deployment.yaml` in the root/kubernetes folder of the project.

## MongoDB Connection

The Authentication API connects to a MongoDB database using the following connection string:
`mongodb://${username}:${password}@authdb-service:5350/admin?authSource=admin&authMechanism=SCRAM-SHA-256`

Access the Authentication API service at http://localhost:5300

## Endpoints

### Hello World Endpoint:

- **Endpoint:** /
- **Description:** Returns a simple "Hello world from auth api" message.
- **Example:** http://localhost:5300/

### User Signup Endpoint:

- **Endpoint:** /user/signup
- **Description:** Registers a new user by creating a user entry in the MongoDB database with hashed password.
- **Method:** POST
- **Example:** http://localhost:5300/user/signup

### User Login Endpoint:

- **Endpoint:** /user/login
- **Description:** Authenticates a user by comparing the provided password with the hashed password in the database and returns a JWT token on success.
- **Method:** POST
- **Example:** http://localhost:5300/user/login

### Token Authentication Endpoint:

- **Endpoint:** /authenticatetoken
- **Description:** Verifies the provided JWT token and returns the user information on success.
- **Method:** GET
- **Example:** http://localhost:5300/authenticatetoken

### Delete Users by Username Endpoint:

- **Endpoint:** /user/deleteusersbyusername
- **Description:** Deletes all users with a given username from the MongoDB database.
- **Method:** DELETE
- **Example:** http://localhost:5300/user/deleteusersbyusername

## RabbitMQ (Currently Commented Out)

The RabbitMQ-related code is currently commented out and not functional.

## Contact Information

For any inquiries or assistance related to the Authentication API microservice, please contact:

Bart Hagoort: </br>
Email: barthagoort2000@outlook.com </br>
Phone: +31 6 57113787 </br>
