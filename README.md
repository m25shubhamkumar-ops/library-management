# 📚 Athenaeum — Library Management & Book Lending System

A modern, full-stack Library Management and Lending System built with **Node.js**, **Express.js**, **EJS**, **MongoDB Atlas (Mongoose)**, **Express Session**, **bcryptjs**, and **Tailwind CSS**. Designed for straightforward deployment on **Render** and tracked via structured **Git** version control.

---

## 🌟 Core Features

- 🔐 **Role-Based Authentication (RBAC)**:
  - **Member**: Browse catalogue, live search & category filters, request book issues, monitor active loans, track due dates & dynamically calculated overdue fines, initiate book returns.
  - **Librarian (Admin)**: Full CRUD catalog management with copy safeguards, review & approve/reject book loan requests, process returns with fine calculation, manage member rosters, and access analytical dashboards.
- 📦 **Inventory & Copy Tracking**:
  - `totalCopies` and `availableCopies` dual tracking.
  - **Safeguard 1 (Zero-Copy Guard)**: Prevent requesting or issuing books when `availableCopies <= 0`.
  - **Safeguard 2 (Active Borrowing Limit)**: Per-member cap of **3 active books** concurrently.
  - **Safeguard 3 (Duplicate Loan Prevention)**: Members cannot request or borrow multiple copies of the same book at once.
  - **Safeguard 4 (Safe Deletion)**: Deletion is rejected if any copies are out on loan (`totalCopies !== availableCopies`).
  - **Safeguard 5 (Safe Edit)**: Total copies cannot be reduced below the number of currently issued copies.
- 💰 **Automatic Fine Calculation**:
  - Automatically assesses fines at **₹10 per overdue day** past the return due date.
  - Dynamically displayed in real-time on member and librarian dashboards.
- 📊 **Analytical Dashboard**:
  - Real-time aggregate counters (Total Titles, Total Copies, Issued Books, Available Books, Overdue Books, Total Members).
  - Top 5 Most Borrowed Books ranking (via `borrowCount`).
  - Upcoming and Overdue Returns monitor.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | EJS (Embedded JavaScript) + HTML5 + CSS3 + Tailwind CSS |
| **Backend** | Node.js (v18+) + Express.js |
| **Database** | MongoDB Atlas (via Mongoose ODM) |
| **Authentication** | Express Session + Bcrypt password hashing (10 salt rounds) |
| **Deployment** | Render (Blueprint via `render.yaml`) |
| **Version Control** | Git & GitHub |

---

## 📁 Directory Structure

```
library-management/
├── config/
│   └── db.js                 # Resilient MongoDB Atlas connection
├── controllers/
│   ├── authController.js      # Login, Register, Logout
│   ├── bookController.js      # Catalog browse, search, add, edit, delete
│   ├── dashboardController.js # Analytics & role-based dashboard metrics
│   ├── issueController.js     # Lending requests, approvals, returns, fines
│   └── memberController.js    # Member roster & borrowing statistics
├── middleware/
│   ├── authMiddleware.js      # isLoggedIn & isGuest guards
│   └── roleMiddleware.js      # isLibrarian & isMember RBAC guards
├── models/
│   ├── Book.js                # Inventory, copy counters, borrowCount
│   ├── Issue.js               # Lending lifecycle, due dates, fines
│   └── User.js                # Password hashing, roles (member/librarian)
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   ├── dashboardRoutes.js
│   ├── issueRoutes.js
│   └── memberRoutes.js
├── views/
│   ├── auth/                  # login.ejs, register.ejs
│   ├── books/                 # allbooks.ejs, bookdetails.ejs, addbook.ejs, editbook.ejs
│   ├── dashboard/             # dashboard.ejs (librarian), member-dashboard.ejs
│   ├── issues/                # requests.ejs, issued.ejs, mybooks.ejs
│   ├── members/               # allmembers.ejs
│   ├── partials/              # navbar.ejs, footer.ejs, alerts.ejs
│   └── error.ejs              # 404, 403, 500 error templates
├── public/
│   ├── css/custom.css         # Custom animations & scrollbars
│   └── js/main.js             # Flash message auto-dismiss
├── seeds/
│   └── seed.js                # Demo books, members, librarian & sample loans
├── tests/
│   └── businessRules.test.js  # Automated tests for all 8 business rules
├── .env.example               # Template environment variables
├── .gitignore
├── render.yaml                # Render Blueprint deployment specification
├── Procfile
├── app.js                     # Express application entrypoint
└── package.json
```

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd library-management
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update your `MONGO_URI` with your MongoDB Atlas or local MongoDB connection:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/library_db?retryWrites=true&w=majority
SESSION_SECRET=super_secret_library_session_key_2026
FINE_PER_DAY=10
MAX_BORROW_LIMIT=3
DEFAULT_DUE_DAYS=7
```

### 3. Seed Demo Data (Optional)

```bash
npm run seed
```

### 4. Start the Application

```bash
# Production start
npm start

# Development mode with live reload
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password | Pre-loaded State |
|---|---|---|---|
| **Librarian / Admin** | `librarian@library.com` | `Admin@123` | Full administrative privileges |
| **Member (John)** | `john@member.com` | `Member@123` | 1 active loan (*The Alchemist*), 1 pending request |
| **Member (Emma)** | `emma@member.com` | `Member@123` | 1 overdue loan (*Atomic Habits*, 4 days late, ₹40 fine) |
| **Member (David)** | `david@member.com` | `Member@123` | 1 returned loan (*Clean Code*, fine settled) |

*Note: The login page includes convenient one-click buttons to instantly autofill these credentials.*

---

## 🧪 Automated Testing

Run the business rule verification test suite:

```bash
npm test
```

Verifies all 8 critical operational safeguards:
- `Rule 1`: Prevent issue when availableCopies <= 0
- `Rule 2`: Maximum borrowing limit (3 books) enforcement
- `Rule 3`: Duplicate concurrent book request prevention
- `Rule 4`: Prevent book deletion when copies are issued
- `Rule 5`: Role authorization (Member cannot access librarian endpoints)
- `Rule 6`: Bcrypt password hashing & comparison
- `Rule 7`: Due date overdue fine calculation (₹10/day)
- `Rule 8`: Total copies update safeguard (cannot reduce below issued copies)

---

## 🌐 Deploying to Render

This repository is ready for immediate deployment on **[Render](https://render.com/)**:

### Option A: Using `render.yaml` Blueprint (Recommended)
1. Push your repository to **GitHub**.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. In the environment variables prompt, enter your **`MONGO_URI`** (MongoDB Atlas connection string).
6. Click **Apply**. Render will automatically build and deploy the web service.

### Option B: Manual Web Service Setup
1. On Render, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://<username>:<password>@cluster0.mongodb.net/library_db?retryWrites=true&w=majority`
   - `SESSION_SECRET` = `<random-32-char-secret>`
   - `FINE_PER_DAY` = `10`
   - `MAX_BORROW_LIMIT` = `3`
   - `DEFAULT_DUE_DAYS` = `7`
5. Click **Create Web Service**.
