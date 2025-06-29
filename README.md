<p align="center">
  <img src="public/brownie.png" alt="Brownie Shop Logo" width="64" height="64">
</p>

# Brownie Shop

An elegant e-commerce platform for artisanal brownies with a robust admin dashboard.

## Features

### Customer Experience
- Beautifully designed product catalog with categories
- Real-time stock tracking
- Seamless shopping cart experience
- Secure payment integration
- Order tracking system
- Account management with email verification
- Password recovery system

### Admin Dashboard
- Comprehensive sales analytics
- Order management
- User administration
- Product inventory control
- Stock monitoring with audit logs
- Promotion management
- Sales reporting with visualizations

## Tech Stack

### Frontend
- React + TypeScript
- TailwindCSS
- shadcn/ui components
- React Router Dom
- React Context
- Recharts

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer
- bcrypt

## Getting Started

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd brownie
npm install
cd brownie-backend
npm install
```

2. Configure environment variables:

Frontend `.env`:
```
VITE_API_URL=http://localhost:5000
```

Backend `.env`:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GMAIL_USER=your_gmail
GMAIL_APP_PASSWORD=your_app_specific_password
```

3. Start development servers:

Backend:
```bash
cd brownie-backend
npm run dev
```

Frontend:
```bash
cd src
npm run dev
```

## Project Structure

```
brownie/
├── src/                    # Frontend source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route components
│   ├── context/           # React context providers
│   └── types/             # TypeScript definitions
│
└── brownie-backend/       # Backend source
    ├── src/
    │   ├── routes/        # API routes
    │   ├── models/        # Mongoose models
    │   ├── middleware/    # Express middleware
    │   └── utils/         # Utility functions
    └── tests/             # Backend tests
```

## API Documentation

### Authentication
- POST `/api/auth/register` - Create new account
- POST `/api/auth/login` - User login
- POST `/api/auth/verify-email` - Email verification
- POST `/api/auth/reset-password` - Password reset

### Products
- GET `/api/products` - List all products
- GET `/api/products/:id` - Get product details

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders/:id` - Get order details
- GET `/api/orders/track/:id` - Track order status

### Admin
- GET `/api/admin/stats` - Dashboard statistics
- GET `/api/admin/orders` - Manage orders
- GET `/api/admin/users` - User management
- GET `/api/admin/inventory` - Stock management

