# ReportHub — Marketing Management System

A full-stack marketing management platform built with Node.js, Express, SQLite, React, and Tailwind CSS.

## Overview

ReportHub helps marketing teams track campaigns, manage budgets, and generate reports with role-based access control for admins and marketers.

### Features
- **Authentication** — JWT-based login with role-based access control
- **Reports** — Create and track marketing campaign reports with ROI/CTR metrics
- **Budget Allocation** — Manage and monitor marketing budgets across campaigns
- **User Management** — Admin panel to create and manage team members

---

## Setup Instructions

### Prerequisites
- Node.js v18+ and npm

### 1. Clone / navigate to the project
```bash
cd /home/prak05/ReportHub
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

---

## Running the App

### Start the backend (from `backend/` directory)
```bash
npm run dev
# or: node server.js
```
The API server will start at **http://localhost:5000**

### Start the frontend (from `frontend/` directory)
```bash
npm run dev
```
The frontend will be available at **http://localhost:5173**

---

## Default Credentials

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| Admin    | admin@reporthub.com        | admin123     |
| Marketer | marketer@reporthub.com     | marketer123  |

---

## API Endpoints

### Auth
| Method | Path              | Description       |
|--------|-------------------|-------------------|
| POST   | /api/auth/login   | Login, returns JWT |

### Reports
| Method | Path              | Auth         | Description              |
|--------|-------------------|--------------|--------------------------|
| GET    | /api/reports      | Any auth     | List reports (role-filtered) |
| POST   | /api/reports      | Any auth     | Create report            |
| GET    | /api/reports/:id  | Any auth     | Get report with metrics  |

### Budget
| Method | Path             | Auth  | Description          |
|--------|------------------|-------|----------------------|
| GET    | /api/budget      | Any   | List all budgets     |
| POST   | /api/budget      | Admin | Create budget entry  |
| PUT    | /api/budget/:id  | Admin | Update budget entry  |
| DELETE | /api/budget/:id  | Admin | Delete budget entry  |

### Users
| Method | Path            | Auth  | Description           |
|--------|-----------------|-------|-----------------------|
| GET    | /api/users      | Admin | List all users        |
| POST   | /api/users      | Admin | Create user           |
| PATCH  | /api/users/:id  | Admin | Toggle user active    |

---

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, React Router v6
- **Database**: SQLite (via better-sqlite3, file: `backend/reporthub.db`)
