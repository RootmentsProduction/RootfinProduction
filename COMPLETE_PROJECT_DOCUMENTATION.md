# RootFin - Complete Project Documentation

**Version:** 1.0.0 | **Last Updated:** January 2025 | **Status:** ✅ Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture & Design](#architecture--design)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Features & Functionality](#features--functionality)
9. [Security Implementation](#security-implementation)
10. [Development Guide](#development-guide)
11. [Deployment](#deployment)
12. [Support & Contact](#support--contact)

---

## Executive Summary

**RootFin** is a comprehensive financial management platform built using the MERN stack (MongoDB, Express.js, React, Node.js). The platform manages store/venue transactions, bookings, and financial reporting with robust tools for tracking income, expenses, security deposits, cash/bank ledgers, and generating detailed closing reports.

**Key Statistics:**
- Tech Stack: MERN (MongoDB, Express.js, React 19, Node.js)
- Code Quality: ⭐⭐⭐⭐⭐ (Zero linter errors, zero dead code)
- Frontend: React 19 with Vite, Tailwind CSS 4, DaisyUI
- Backend: Express.js 4.21, MongoDB with Mongoose 8.12
- Authentication: JWT with bcrypt password hashing

---

## Project Overview

### Purpose

RootFin serves as a centralized financial management system for businesses managing multiple stores or venues. It enables transaction management, financial reporting, booking management, security deposit tracking, multi-store support, and daily closing operations.

### Target Users

1. **Store Managers:** Daily transaction entry and reporting
2. **Administrators:** Multi-store management, user creation, consolidated reporting
3. **Business Owners:** Financial oversight, analytics, and reporting

### Key Features

- Secure authentication and authorization with role-based access control
- Transaction CRUD operations with multiple payment methods
- File attachment support and CSV export functionality
- Multiple reporting views (Day Book, Financial Summary, Revenue, etc.)
- Multi-store management with admin controls
- Security deposit tracking and closing report automation

---

## Architecture & Design

### Monorepo Structure

```
TESTROOTFIN/
├── frontend/          # React + Vite Application
│   ├── src/
│   │   ├── api/      # API configuration
│   │   ├── components/ # Reusable components
│   │   ├── pages/    # Page components (18 pages)
│   │   ├── hooks/    # Custom React hooks
│   │   ├── utils/    # Utility functions
│   │   └── data/     # Static data
│   └── package.json
├── backend/           # Express.js + MongoDB API
│   ├── controllers/  # Business logic (6 controllers)
│   ├── model/        # MongoDB schemas (5 models)
│   ├── route/        # API routes (3 route files)
│   ├── db/           # Database configuration
│   ├── utils/        # Utility functions
│   └── server.js     # Entry point
└── Documentation/    # Project documentation
```

### Design Principles

1. Separation of Concerns
2. Component-Based Architecture
3. RESTful API Design
4. Database Normalization
5. Security First
6. Scalability
7. Maintainability

---

## Technology Stack

### Frontend

- **React 19.0.0** - UI library
- **React Router DOM 7.2.0** - Routing
- **Vite 6.3.5** - Build tool
- **Tailwind CSS 4.0.9** - Styling
- **DaisyUI 4.12.24** - Component library
- **React Icons 5.5.0** - Icons
- **React CSV 2.2.2** - CSV export
- **React Toastify 11.0.5** - Notifications

### Backend

- **Node.js** - JavaScript runtime
- **Express.js 4.21.2** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 8.12.2** - ODM
- **Bcrypt 5.1.1** - Password hashing
- **JWT** - Authentication
- **Swagger** - API documentation
- **CORS 2.8.5** - Cross-origin support

---

## Installation & Setup

### Prerequisites

- Node.js v16+
- MongoDB (local or Atlas)
- npm or yarn
- Git

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd TESTROOTFIN
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   **Backend** (`backend/.env.development`):
   ```env
   NODE_ENV=development
   PORT=7000
   MONGODB_URI_DEV=mongodb://localhost:27017/rootfin_dev
   MONGODB_URI_PROD=mongodb+srv://user:pass@cluster.mongodb.net/rootfin_prod
   JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:7000/
   ```

5. **Start Application**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

6. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:7000
   - API Docs: http://localhost:7000/api-docs

---

## Database Schema

### User Model

```javascript
{
  username: String,      // Required
  email: String,         // Required, Unique
  password: String,      // Required, Hashed (bcrypt)
  locCode: String,       // Required, Location code
  power: String,         // Required: "admin" or "normal"
  createdAt: Date,       // Auto
  updatedAt: Date        // Auto
}
```

### Transaction Model

```javascript
{
  type: String,                    // Required
  invoiceNo: String,               // Required, Unique (Auto-generated)
  category: String,                // Required
  remark: String,                  // Optional
  billValue: Number,               // Optional (default: 0)
  amount: String,                  // Required
  cash: String,                    // Required
  bank: String,                    // Required
  upi: String,                     // Required
  paymentMethod: String,           // Required: "cash","bank","upi","split"
  date: Date,                      // Required
  locCode: String,                 // Required
  quantity: String,                // Optional
  customerName: String,            // Optional
  securityAmount: Number,          // Optional (default: 0)
  Balance: Number,                 // Optional (default: 0)
  subCategory1: String,            // Optional
  totalTransaction: Number,        // Optional (default: 0)
  attachment: {                    // Optional: File attachment
    filename: String,
    contentType: String,
    data: Buffer
  },
  timestamps: true
}
```

### Transaction History Model

```javascript
{
  invoiceNo: String,               // Required
  originalTransactionId: ObjectId, // Required (Reference)
  historyType: String,             // Required: "EDIT" or "DELETE"
  changedBy: ObjectId,             // Required (User reference)
  changedAt: Date,                 // Auto
  reason: String,                  // Optional
  oldData: Object,                 // Required
  newData: Object,                 // Optional (null for DELETE)
  timestamps: true
}
```

### Closing Model

```javascript
{
  cash: Number,                    // Required
  Closecash: Number,               // Required
  bank: Number,                    // Required
  date: Date,                      // Required
  locCode: String,                 // Required
  email: String,                   // Optional
  timestamps: true
}
```

### Counter Model

```javascript
{
  _id: String,                     // Location code
  seq: Number                      // Sequence number (Auto-increment)
}
```

---

## API Documentation

### Base URL

- Development: `http://localhost:7000`
- Production: `https://rootfin-testenv-ebb5.onrender.com`
- Swagger UI: `http://localhost:7000/api-docs`

### Authentication Endpoints

#### POST /user/signin
Register a new user.

**Request:**
```json
{
  "username": "Store Manager",
  "email": "manager@store.com",
  "password": "securepassword123",
  "locCode": "144",
  "power": "admin"
}
```

#### POST /user/login
User login and authentication.

**Request:**
```json
{
  "email": "manager@store.com",
  "EmpId": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### GET /user/getAllStores
Get all stores/users.

**Headers:** `Authorization: Bearer <jwt_token>`

### Transaction Endpoints

#### POST /user/createPayment
Create a new transaction.

**Request:**
```json
{
  "type": "income",
  "category": "Compensation",
  "remark": "Monthly payment",
  "locCode": "144",
  "amount": "10000",
  "cash": "5000",
  "bank": "3000",
  "upi": "2000",
  "paymentMethod": "split",
  "date": "2025-01-01"
}
```

#### GET /user/Getpayment
Get transactions with filters.

**Query Parameters:**
- `LocCode` (required): Location code
- `DateFrom` (optional): Start date (YYYY-MM-DD)
- `DateTo` (optional): End date (YYYY-MM-DD)

#### POST /user/editPayment
Edit an existing transaction.

#### DELETE /user/deletePayment/:id
Delete a transaction.

### Cash/Bank Endpoints

#### POST /user/saveCashBank
Save cash/bank closing data.

#### GET /user/getsaveCashBank
Get cash/bank closing data.

**Query Parameters:**
- `locCode` (required): Location code
- `date` (optional): Date (YYYY-MM-DD)

---

## Features & Functionality

### Authentication & Authorization
- User registration with email validation
- Secure password hashing (bcrypt, 10 rounds)
- JWT token-based authentication
- Role-based access control (Admin/Normal)

### Transaction Management
- Create, edit, delete transactions
- Multiple payment methods (Cash, Bank, UPI, Split)
- File attachment support
- Auto-generated invoice numbers
- Transaction history tracking

### Financial Reporting
- **Day Book:** Daily transaction listing with filters
- **Financial Summary:** Date-range reports with category breakdown
- **Revenue Report:** Revenue analytics and trend analysis
- **Booking Report:** Booking transaction management
- **Security Report:** Security deposit tracking

### Cash/Bank Ledger
- Separate cash and bank tracking
- Cash/Bank transfer operations
- Balance reconciliation
- Daily closing reports
- Multi-store closing (Admin)

### Admin Features
- Store management and user creation
- Multi-store reports and analytics
- Admin closing operations
- Consolidated reporting

### Data Management
- CSV export functionality
- Print reports with professional formatting
- Date-range filtering
- Search and category filtering

---

## Security Implementation

### Password Security
- Bcrypt hashing with 10 salt rounds
- No plain text password storage

### Authentication Security
- JWT tokens with secret key signing
- Token expiration
- Protected routes with middleware

### API Security
- CORS configuration for allowed origins
- Input validation and sanitization
- Mongoose parameterized queries (SQL injection protection)

### Authorization
- Role-based access control
- Store data isolation
- Admin-only route protection

---

## Development Guide

### Running in Development

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Building for Production

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
```

### Adding New Features

**New Page:**
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link

**New API Endpoint:**
1. Create controller in `backend/controllers/`
2. Add route in `backend/route/`
3. Add Swagger documentation

---

## Deployment

### Backend Deployment

1. Set environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI_PROD`
   - `JWT_SECRET`

2. Deploy to Render/Heroku/Vercel

### Frontend Deployment

1. Set `VITE_API_URL` to production API URL
2. Build: `npm run build`
3. Deploy `dist/` folder to Vercel/Netlify

### Production Checklist

- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] CORS configured
- [ ] SSL/HTTPS enabled
- [ ] Error logging configured

---

## Support & Contact

**Developer:** Jishnu M  
**Email:** mjishnu990@gmail.com  
**LinkedIn:** [Jishnu M](https://www.linkedin.com/in/jishnu-m-11760b2b0/)  
**GitHub:** [jishnuMgit](https://github.com/jishnuMgit)

**License:** MIT License - Rootments

---

**Document Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Complete

