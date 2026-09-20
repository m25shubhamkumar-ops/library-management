# 📚 Athenaeum — Library Management & Book Lending System

A full-stack, server-side rendered web platform engineered for libraries to manage catalog inventory, member lending lifecycles, and automated overdue fine calculations.

---

## 📌 1. Project Overview & Objective
- **Problem Solved**: Replaces manual paper registers with an automated digital system for managing books, issue requests, and returns.
- **Target Audience**: Educational institutions, university libraries, and public reading rooms.
- **Architecture Model**: Server-Side Rendering (SSR) using Express.js and EJS templates with stateful session management.
- **Data Persistence**: MongoDB Atlas cloud database with Mongoose ODM modeling and atomic copy counters.
- **Access Control**: Role-Based Access Control (RBAC), bcrypt password hashing (10 salt rounds), and HTTP-only session cookies.

---

## 🛠️ 2. Technology Stack
- **Frontend**: EJS (Embedded JavaScript), HTML5, Vanilla JavaScript, and Tailwind CSS.
- **Backend**: Node.js (v18+) with Express.js application framework.
- **Database**: MongoDB Atlas cloud cluster connected via Mongoose ODM.
- **Session & Auth**: express-session with connect-flash and bcryptjs encryption.
- **Deployment**: Render Web Service paired with MongoDB Atlas cloud database.
- **Version Control & Tests**: Git & GitHub with automated operational safeguard tests.

---

## 👥 3. User Roles & Access Control
- **Member (Reader / Student)**:
  - Browse complete book catalogue with real-time multi-field search and category filtering.
  - Submit borrowing requests for books with available physical inventory.
  - Track active loans, return due dates, and dynamic overdue fines on personal dashboard.
  - View historical borrowings and initiate book returns.
- **Librarian (Admin)**:
  - Full catalog CRUD: add new titles, update book details, and adjust copy counts safely.
  - Review incoming loan requests with one-click approve or reject actions.
  - Process physical book returns, inspect copy conditions, and collect overdue fines.
  - Monitor member rosters and institutional analytics on the central dashboard.

---

## 🛡️ 4. Inventory Safeguards & Business Rules
- **Rule 1 (Zero-Copy Guard)**: Borrow requests and issuance are blocked when available copies equal zero.
- **Rule 2 (Active Borrow Limit)**: Members cannot hold more than 3 active books simultaneously.
- **Rule 3 (Duplicate Request Block)**: Prevents requesting or borrowing duplicate copies of the same title concurrently.
- **Rule 4 (Safe Copy Modification)**: Total copies cannot be reduced below currently issued copies.
- **Rule 5 (Protected Deletion)**: Books with active issued loans cannot be deleted from the database.

---

## ⏱️ 5. Lending Lifecycle & Fine Calculation
- **Issue Workflow**: Member requests book -> Librarian reviews -> Due date set (Issue Date + 7 days) -> Available copies decrement -> Book issued.
- **Return Workflow**: Member returns book -> Available copies increment -> Overdue fine assessed -> Status marked returned.
- **Fine Formula (Stretch Goal)**: Accrues ₹10 per calendar day overdue past the assigned due date:
  Overdue Days = max(0, Return Date - Due Date)
  Fine Amount = Overdue Days * ₹10/day

---

## 📊 6. Analytics Dashboard & Key Metrics
- **Catalog Overview**: Total unique titles, total physical copies, and currently available copies.
- **Circulation Stats**: Active issued loans, pending borrow requests, and flagged overdue returns.
- **Popular Titles**: Top 5 Most Borrowed Books ranking based on cumulative circulation count.
- **Member Records**: Active registered accounts and outstanding fine balances.

---

## 🔑 7. Demo Credentials
- **Librarian / Admin**: Email: `librarian@library.com` | Password: `Admin@123`
- **Member (John)**: Email: `john@member.com` | Password: `Member@123` (1 active loan)
- **Member (Emma)**: Email: `emma@member.com` | Password: `Member@123` (1 overdue loan, ₹40 fine)
- **Member (David)**: Email: `david@member.com` | Password: `Member@123` (1 returned loan)
*(Note: Login screen features 1-click credential autofill buttons for rapid demonstration).*

---

## ⚡ 8. Local Setup & Testing Instructions
- **Clone Repository**: `git clone https://github.com/m25shubhamkumar-ops/library-management.git`
- **Install Dependencies**: `cd library-management && npm install`
- **Environment Setup**: Define `PORT=3000` and `MONGO_URI` in `.env` file.
- **Seed Sample Data**: Run `npm run seed` to populate demo books, members, and loans.
- **Run Tests**: Run `npm test` to execute 8 automated operational safeguard tests.
- **Start Application**: Run `npm start` and visit `http://localhost:3000`.

---

## 🌐 9. Live Deployment & Repository Links
- **GitHub Repository**: https://github.com/m25shubhamkumar-ops/library-management
- **Live Deployed Application**: https://library-management-system-kint.onrender.com
- **Hosting Platform**: Render Web Services with MongoDB Atlas database cluster.
