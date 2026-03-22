# Seller Analytics Platform

A comprehensive profit analytics and reconciliation platform for Amazon/e-commerce sellers. Track revenue, costs, fees, profit margins, and get actionable insights in real-time.

## Features

### Core Analytics
- **Dashboard Overview**: Real-time metrics including revenue, profit, orders, and inventory
- **Sales Trends**: Visual charts showing revenue and profit over time
- **Product Analytics**: Track performance of individual products
- **Profit Breakdown**: Understand where your money goes (COGS, fees, expenses)
- **SKU Analytics**: Profit per SKU with return rates and margins
- **True Profit Calculation**: Accurate profit after all fees and COGS

### Advanced Features
- **Geo Analytics**: India map visualization with state/city revenue breakdown
- **Ads Analytics**: TACOS, ACOS, ROAS metrics and campaign performance
- **Reconciliation**: Track matched vs unmatched orders with settlements
- **In-App Alerts**: Automatic detection of loss-making SKUs and high return rates
- **COGS Management**: Bulk import/export of product costs

### Authentication
- **User Login/Signup**: Secure JWT-based authentication
- **Password Hashing**: bcrypt encryption for passwords
- **Session Management**: Persistent login with token storage

### Data Management
- **CSV Upload**: Import Amazon Orders, Transactions, and Ad reports
- **CSV Export**: Export SKU analytics and COGS data
- **Multi-company Support**: Manage multiple seller accounts

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** (default) / PostgreSQL - Database
- **Pydantic** - Data validation
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **react-simple-maps** - Geo visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

## Database Schema

### Core Entities

1. **User** - User accounts with email, password, company link
2. **Company** - Seller accounts with Amazon Seller ID
3. **Product** - Products with ASIN, SKU, costs, and inventory
4. **Order** - Orders with items, fees, and revenue
5. **Transaction** - Amazon settlement transactions
6. **AdCampaign** - Advertising campaign performance data
7. **Expense** - Business expenses by category

## Getting Started

### Prerequisites
- **Python 3.9 - 3.12** (recommended) or Python 3.13+ with Rust installed
- **Node.js 18+**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/kunal1729/Amazon.git
cd Amazon

# Terminal 1 - Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### First Time Setup

1. Open the app and **Sign up** with your email
2. Go to **Settings** tab
3. Upload your **Amazon Orders Report** (.tsv or .csv)
4. Upload your **Amazon Transactions Report** (.csv)
5. (Optional) Upload **Sponsored Products Report** for ad analytics
6. Go to **COGS** tab to set your actual product costs

### Python 3.13+ / 3.14 Users

If you're using Python 3.13 or newer, you need to install **Rust** first:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Then proceed with normal setup
```

## Pages & Features

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with key metrics, sales trends, money flow, alerts |
| **Products** | Product list with revenue, profit, margin per product |
| **Orders** | Order history with status and filtering |
| **COGS** | Cost of goods management - import/export CSV |
| **Inventory** | Stock levels and low stock alerts |
| **Analytics** | Detailed P&L statement and financial breakdown |
| **Ads Analytics** | TACOS, ACOS, ROAS, campaign & SKU ad performance |
| **Geo Analytics** | India map, state-wise and city-wise analytics |
| **Reconciliation** | Order matching status, settled vs unmatched |
| **Reports** | P&L reports, SKU analytics with CSV export |
| **Settings** | Upload data files (Orders, Transactions, Ads) |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user

### Analytics
- `GET /api/analytics/dashboard/{company_id}` - Dashboard summary
- `GET /api/analytics/transactions-summary/{company_id}` - Financial summary
- `GET /api/analytics/sku-analytics/{company_id}` - SKU-level analytics
- `GET /api/analytics/geo-analytics/{company_id}` - State/city breakdown
- `GET /api/analytics/ads-analytics/{company_id}` - Ad performance metrics
- `GET /api/analytics/reconciliation-status/{company_id}` - Order matching
- `GET /api/analytics/alerts/{company_id}` - Loss/return alerts

### Data Upload
- `POST /api/upload/orders` - Upload orders CSV
- `POST /api/upload/transactions` - Upload transactions CSV
- `POST /api/upload/ads` - Upload ad campaign CSV

### Products & Orders
- `GET /api/products` - List products
- `GET /api/products/with-profit` - Products with profit data
- `GET /api/orders` - List orders

## Key Metrics Explained

### Ad Metrics
| Metric | Formula | Description |
|--------|---------|-------------|
| **TACOS** | Ad Spend ÷ Total Revenue | Total Advertising Cost of Sales |
| **ACOS** | Ad Spend ÷ Ad Sales | Advertising Cost of Sales |
| **ROAS** | Ad Sales ÷ Ad Spend | Return on Ad Spend |

### Profit Metrics
- **Gross Revenue** = Product Sales + Shipping Credits
- **Net Revenue** = Gross Revenue - Refunds
- **Net Settlement** = Net Revenue - All Fees
- **True Profit** = Net Settlement - COGS

## Amazon Transaction Fee Types

### Order-Level Fees

| Fee | CSV Column | Description |
|-----|------------|-------------|
| Selling Fees | `selling fees` | Referral/commission fees |
| FBA Fees | `fba fees` | Fulfillment fees |
| Other Transaction Fees | `other transaction fees` | Chargebacks, holdbacks |

### Tax Deductions

| Fee | CSV Column | Description |
|-----|------------|-------------|
| TCS-CGST | `TCS-CGST` | Central GST |
| TCS-SGST | `TCS-SGST` | State GST |
| TCS-IGST | `TCS-IGST` | Integrated GST |
| TDS 194-O | `TDS (Section 194-O)` | Tax Deducted at Source |

### Account-Level Fees

| Transaction Type | Description |
|------------------|-------------|
| Service Fee | Cost of Advertising, Subscriptions |
| Others | ABA Fee (Amazon Business Account) |
| FBA Inventory Fee | Storage fees |
| Shipping Services | Easy Ship handling fees |

## License

MIT
