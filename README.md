Banking Transaction Management System (BTMS)

Overview:

Banking Transaction Management System (BTMS) is a full stack web application designed to simulate modern digital banking operations. The system enables users to securely manage accounts, perform fund transfers, track transaction history, manage beneficiaries, and monitor account activities through a user friendly dashboard.

The project follows a modern client server architecture with a React frontend, Express TypeScript backend, PostgreSQL database, and Docker based deployment.

Features:
User Management:

• User Registration and Login
• JWT Based Authentication
• Secure Password Hashing
• Profile Management
• Session Management

Account Management:

• Create and Manage Bank Accounts
• View Account Details
• Account Balance Tracking
• Multiple Account Support

Fund Transfers:

• Secure Money Transfers
• Beneficiary Based Transfers
• Transaction Validation
• Unique Transaction References
• Transaction Status Tracking

Beneficiary Management:

• Add Beneficiaries
• Update Beneficiary Information
• Remove Beneficiaries
• View Beneficiary List

Transaction Monitoring:

• Transaction History
• Transaction Details
• Real Time Account Updates
• Financial Activity Tracking

Security Features:

• JWT Authentication
• Password Encryption using bcrypt
• Audit Logging
• Token Blacklisting
• Protected API Routes
• Role Based User Management

System Architecture:

Frontend:
• React
• TypeScript
• Vite
• Tailwind CSS
• React Query

Backend:
• Node.js
• Express.js
• TypeScript
• JWT Authentication
• REST APIs

Database:
• PostgreSQL
• Drizzle ORM

Deployment:
• Docker
• Docker Compose
• Nginx

Technology Stack:
Category	Technologies - 
Frontend	- React, TypeScript, Vite, Tailwind CSS
Backend	- Node.js, Express.js, TypeScript
Database	- PostgreSQL, Drizzle ORM
Authentication	- JWT, bcrypt
DevOps	- Docker, Docker Compose, Nginx
Version Control -	Git, GitHub
Database Design:

The system contains the following core entities:

Users:

Stores user profile and authentication information.

Accounts:

Maintains account details, balance, account type, and status.

Transactions:

Records all fund transfer activities with unique reference numbers.

Beneficiaries:

Stores beneficiary information for easier fund transfers.

Audit Logs:

Tracks user activities for monitoring and security purposes.

Token Blacklist:

Maintains invalidated authentication tokens.

Project Structure
btms-docker/
│
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── backend/
│   ├── routes/
│   ├── db/
│   ├── middlewares/
│   └── lib/
│
├── docker-compose.yml
├── .env.example
└── README.md
Installation
Clone Repository
git clone https://github.com/yourusername/btms.git
cd btms
Configure Environment
cp .env.example .env

Update database credentials and JWT secret.

Run Using Docker
docker compose up --build
Initialize Database
docker compose exec backend npm run db:push

Open:

http://localhost
Learning Outcomes

Through this project I gained experience in:

• Full Stack Application Development
• REST API Design
• Secure Authentication Implementation
• Database Design and Management
• Docker Based Deployment
• Banking System Workflows
• Audit Logging and Security Practices
• Modern React Development
• Backend Development with Express and TypeScript

Future Enhancements:

• Two Factor Authentication
• Email Notifications
• Admin Dashboard
• Fraud Detection Module
• Transaction Analytics
• Account Statements Export
• Role Based Access Control Expansion

Author:

R. Dhanush

LinkedIn: linkedin.com/in/dhanush-computerscience

GitHub: github.com/DhanushRamasway
