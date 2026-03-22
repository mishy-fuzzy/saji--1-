# SAJI

Multi-Service Marketplace & Escrow Platform

Joshua Project is a full-featured multi-service marketplace and escrow platform that connects customers with verified service providers while ensuring secure payments, transparent workflows, and dispute protection.

The platform is designed to handle real-world service transactions, from job posting and provider selection to escrow-protected payments, verification, and dispute resolution — all managed through a powerful admin dashboard.

🌟 Key Features
👤 User Roles

Customers – Post jobs, chat with providers, make escrow payments, and verify job completion.

Service Providers – Receive job requests, communicate with customers, complete jobs, and receive payments.

Administrators – Fully manage users, jobs, payments, disputes, verifications, site content, and branding.

🏗️ Core Modules
🏠 Public Website (Before Login)

Modern landing page with service search

Category browsing

Clear onboarding (Sign Up / Log In)

Trust indicators (secure escrow, verified providers)

👥 User Management

Customer & provider registration

Profile management

Provider verification workflow

Account status control (active, suspended, banned)

💼 Jobs Management

Customers post jobs with requirements

Providers apply or receive direct job offers

Job lifecycle states:

Pending

Active

Completed

Disputed

Real-time job status tracking

💬 Real-Time Chat System

Secure in-platform messaging

Separate chat interfaces for:

Customers

Service Providers

Job-linked conversations

Admin visibility for dispute investigations

💰 Payments & Escrow System

Secure escrow-based payment flow

Payment modes:

Deposit

Balance payments

Funds held until job completion is verified

Automatic release after approval

Refund and reversal handling

⚠️ Disputes Management

Customers or providers can raise disputes

Admin review and resolution panel

Evidence and chat history access

Controlled fund release or refund decisions

✅ Verification System

Provider identity verification

Job completion verification

Admin approval & rejection workflows

Fraud prevention controls

🛠️ Pricing & Services

Service category management

Admin-defined pricing models

Enable/disable services dynamically

Commission and platform fee configuration

⚙️ Admin Settings (Full Control)

Admins can control every aspect of the platform, including:

Branding (logo, colors, favicon)

Website content (contact info, about text, footer content)

Currency & localization

Notification rules

Payment rules

System preferences

Feature toggles

👤 Admin Profile & Security

Profile management

Password updates

Two-Factor Authentication (2FA)

Notification preferences

Appearance customization

Session & security controls

📊 Admin Dashboard

A powerful dashboard with:

User statistics

Active jobs overview

Pending verifications

Open disputes

Revenue & escrow summaries

Alerts and system activity logs

🖥️ Technology Stack
Frontend

HTML5 / CSS3

JavaScript

React Js

Modern UI/UX design

(Future-ready for React integration)

Backend

Next.js API Routes

Prisma ORM

PostgreSQL

REST-style architecture

Security

Role-based access control

Escrow protection logic

Secure authentication

Data validation and sanitization

🎨 Design Philosophy

Clean, modern UI

Admin-friendly layouts

Mobile-responsive

User-focused workflows

Scalable architecture

📦 Project Status

Core features implemented

Admin panel fully designed

Chat, escrow, disputes, and verification workflows defined

Actively evolving with future enhancements planned

🚧 Future Enhancements

Mobile app version

## API Integrations Added

### M-Pesa (Daraja)

- POST `/api/payments/mpesa/stkpush`
	- Body: `{ "phone": "2547XXXXXXXX", "amount": 100, "accountReference": "SAJI-BOOKING", "transactionDesc": "Service payment" }`
- POST `/api/payments/mpesa/callback`
	- Daraja callback receiver endpoint.

### SMS (Africa's Talking)

- POST `/api/notifications/sms/send`
	- Body: `{ "to": "2547XXXXXXXX", "message": "Your payment request was sent." }`

### Bank Transfer

- POST `/api/payments/bank/initiate`
	- Body: `{ "amount": 1000, "currency": "KES", "payerName": "John Doe", "payerPhone": "2547XXXXXXXX", "payerEmail": "john@example.com", "reference": "SAJI-BOOKING" }`

### Card Payments (Stripe)

- POST `/api/payments/card/intent`
	- Body: `{ "amount": 5000, "currency": "KES", "email": "you@example.com", "reference": "SAJI-BOOKING" }`

### PayPal

- POST `/api/payments/paypal/order`
	- Body: `{ "amount": 5000, "currency": "USD", "reference": "SAJI-BOOKING" }`
- POST `/api/payments/paypal/capture`
	- Body: `{ "orderId": "PAYPAL_ORDER_ID" }`

### Google Accounts OAuth

- GET `/api/auth/google/start?mode=login|signup&role=customer|provider|shopkeeper`
- GET `/api/auth/google/callback`

### Environment Variables

Copy `.env.example` to `.env.local` and set values for:

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `AFRICASTALKING_USERNAME`
- `AFRICASTALKING_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `BANK_DEFAULT_NAME`
- `BANK_DEFAULT_ACCOUNT_NAME`
- `BANK_DEFAULT_ACCOUNT_NUMBER`
- `STRIPE_SECRET_KEY`
- `PAYPAL_MODE`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

### Portal Login Test Accounts

- Secretary: `secretary@gmail.com` / `Secretary@123`
- Sub-admin: `subadmin@gmail.com` / `SubAdmin@123`

Advanced analytics & reporting

AI-powered provider matching

Multi-currency support

Automated dispute resolution assistance

📜 License

This project is currently under private development.
License details will be added upon public release.

🤝 Contribution

Contributions, suggestions, and feedback are welcome.
Please open an issue or submit a pull request.

✨ Author
OliverYoung-dev(githubusername)
ver-otieno-potfolio.vercel.app
Developed with passion as a real-world service marketplace solution.