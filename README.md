# 🚀 User Microservice 🚀

I have developed the Users Microservice in TypeScript which you can add to any project where you don't want to handle user stuff and just need to focus on the core features. 

This service has features like:
- Sign in / Sign up
- Sign in with Google
- Update user password
- Set token in cookies
- Get token from the cookies
- Reset password
- Forgot password with OTP
- Refresh token

I use MongoDB for this project. It also has production-level graceful startup and shutdown, and Winston logger to store logs at AWS CloudWatch.

Using actuator, you can check the overall app infra configuration:
- `/actuator/health` → real DB + future service status (overrides built-in)
- `/actuator/liveness` → is the process alive? (k8s liveness probe)
- `/actuator/readiness` → ready to serve traffic? (k8s readiness probe)
- `/actuator/system` → full OS + memory breakdown (only admin role have access with token)

## Project Structure
```
fitness_ai
├── src
│   ├── app.ts                  # Entry point of the application
│   ├── Shared
│   │   └── dbconnect.ts        # Database connection logic
│   ├── gateway
│   │   └── routes
│   │       └── route.ts        # API routes
│   ├── setups
│   │   └── middleware.ts       # Middleware functions
│   └── Users
│       └── services
│           └── passport.ts     # Authentication strategies
├── package.json                 # npm configuration
├── tsconfig.json                # TypeScript configuration
├── .env                         # Environment variables
└── README.md
```

## ✨ Features

*   **User Registration:** 📝 New users can register with their email and password.
*   **User Login:** 🔑 Authenticate users with email and password.
*   **Google OAuth2:** 🇬 Authenticate users with their Google account.
*   **Password Management:** 🔒
    *   Update password for logged-in users.
    *   Forgot password functionality to send a reset OTP.
    *   Reset password using the OTP.
*   **User Profile:** 👤
    *   Update user profile information.
    *   Update user mobile number.
*   **Token-Based Authentication:** 🎟️ Uses JSON Web Tokens (JWT) for secure API authentication.
*   **Refresh Token:** 🔄 Endpoint to get a new access token using a refresh token.
*   **Secure:** 🛡️ Implements `httpOnly` cookies for storing tokens.

## 🛠️ Technologies Used

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web framework for Node.js.
*   **TypeScript:** Superset of JavaScript that adds static typing.
*   **MongoDB:** NoSQL database for storing user data.
*   **Mongoose:** ODM library for MongoDB and Node.js.
*   **Passport.js:** Authentication middleware for Node.js.
    *   `passport-google-oauth20`: Google OAuth2 strategy for Passport.
*   **JWT (JSON Web Token):** For creating access tokens.
*   **bcrypt:** For hashing passwords.
*   **nodemailer:** For sending emails (e.g., for password reset).
*   **winston:** For logging.
*   **dotenv:** For managing environment variables.

## ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd users_service_typescript
    ```
3.  **Install the dependencies:**
    ```bash
    npm install
    ```

## 🔩 Configuration

Create a `.env` file in the root directory and add the following environment variables. You can use the `.env.example` file as a template.

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_pass
```

## ▶️ Running the Application

To start the application in development mode with live reloading, run:

```bash
npm run dev
```

To build the application for production, run:

```bash
npm run build
```

To start the application in production mode, run:

```bash
npm start
```

The server will be running on the port specified in the `.env` file (default is 3000).

## 🔀 API Endpoints

All endpoints are prefixed with `/api`.

### Authentication

*   **POST /api/users/signup**

    Register a new user.

    ```bash
    curl -X POST http://localhost:3000/api/users/signup \
    -H "Content-Type: application/json" \
    -d '{
          "fname": "John",
          "lname": "Doe",
          "email": "john.doe@example.com",
          "password": "password123"
        }'
    ```

*   **POST /api/users/login**

    Log in an existing user.

    ```bash
    curl -X POST http://localhost:3000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{
          "email": "john.doe@example.com",
          "password": "password123"
        }'
    ```

*   **POST /api/users/api-login**

    API login using header-based authentication.

    ```bash
    curl -X POST http://localhost:3000/api/users/api-login \
    -H "Authorization: Bearer <your_access_token>"
    ```

*   **POST /api/users/refresh-token**

    Get a new access token using a refresh token.

    ```bash
    curl -X POST http://localhost:3000/api/users/refresh-token \
    -H "Content-Type: application/json" \
    -d '{
          "refreshToken": "<your_refresh_token>"
        }'
    ```

### Google OAuth2

*   **GET /api/oauth2/oauthsign**

    Redirects to the Google authentication page.

    ```bash
    # Open this URL in your browser
    http://localhost:3000/api/oauth2/oauthsign
    ```

*   **GET /api/oauth2/auth/google/callback**

    Callback URL for Google to redirect to after successful authentication. This endpoint is handled by the server and should not be called directly by the client.

### User Management

*   **GET /api/users/check-user**

    Check the currently authenticated user.

    ```bash
    curl -X GET http://localhost:3000/api/users/check-user \
    -H "Authorization: Bearer <your_access_token>"
    ```

*   **PUT /api/users/update-users**

    Update user's first name and last name.

    ```bash
    curl -X PUT http://localhost:3000/api/users/update-users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_access_token>" \
    -d '{
          "fname": "Johnathan",
          "lname": "Doer"
        }'
    ```

*   **PUT /api/users/update-password**

    Update user's password.

    ```bash
    curl -X PUT http://localhost:3000/api/users/update-password \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_access_token>" \
    -d '{
          "oldPassword": "password123",
          "newPassword": "newpassword456"
        }'
    ```

*   **PUT /api/users/update-mobile**

    Update user's mobile number.

    ```bash
    curl -X PUT http://localhost:3000/api/users/update-mobile \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_access_token>" \
    -d '{
          "mobileNumber": "1234567890"
        }'
    ```

### Password Recovery

*   **POST /api/users/forgot-passwords**

    Send a password reset OTP to the user's email.

    ```bash
    curl -X POST http://localhost:3000/api/users/forgot-passwords \
    -H "Content-Type: application/json" \
    -d '{
          "email": "john.doe@example.com"
        }'
    ```

*   **POST /api/users/reset-password-otps**

    Reset the password using the OTP.

    ```bash
    curl -X POST http://localhost:3000/api/users/reset-password-otps \
    -H "Content-Type: application/json" \
    -d '{
          "email": "john.doe@example.com",
          "otp": "123456",
          "newPassword": "newpassword789"
        }'
    ```
