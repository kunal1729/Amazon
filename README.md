# Seller Analytics Platform

A Sellerboard-like profit analytics platform for Amazon/e-commerce sellers. Track revenue, costs, fees, and profit margins in real-time.

## Features

- **Dashboard Overview**: Real-time metrics including revenue, profit, orders, and inventory
- **Sales Trends**: Visual charts showing revenue and profit over time
- **Product Analytics**: Track performance of individual products
- **Profit Breakdown**: Understand where your money goes (COGS, fees, expenses)
- **Low Stock Alerts**: Get notified when inventory is running low
- **Multi-company Support**: Manage multiple seller accounts

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** (default) / PostgreSQL - Database
- **Pydantic** - Data validation

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Database Schema

### Core Entities

1. **Company** - Seller accounts with Amazon Seller ID
2. **Product** - Products with ASIN, SKU, costs, and inventory
3. **Order** - Orders with items, fees, and revenue
4. **OrderItem** - Individual items in orders with cost tracking
5. **Expense** - Business expenses by category
6. **InventoryHistory** - Stock movement tracking

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
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Python 3.13+ / 3.14 Users

If you're using Python 3.13 or newer, you need to install **Rust** first (required to compile pydantic-core):

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Then proceed with normal setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Importing Your Data

1. Go to **Settings** tab in the app
2. Upload your **Amazon Orders Report** (.tsv or .csv)
3. Upload your **Amazon Transactions Report** (.csv)
4. Go to **COGS** tab to set your actual product costs

### COGS Management

1. Export current products: Click "Export CSV" in COGS tab
2. Edit the CSV in Excel/Sheets with your actual costs
3. Import back: Click "Import CSV" to update all COGS

## API Endpoints

### Companies
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create a company
- `GET /api/companies/{id}` - Get company details

### Products
- `GET /api/products` - List products
- `GET /api/products/with-profit?company_id=1` - Products with profit data
- `GET /api/products/low-stock/{company_id}` - Low stock products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product

### Orders
- `GET /api/orders` - List orders with filters
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}/status` - Update order status

### Analytics
- `GET /api/analytics/dashboard/{company_id}` - Dashboard summary
- `GET /api/analytics/sales-trend/{company_id}` - Sales over time
- `GET /api/analytics/top-products/{company_id}` - Best selling products
- `GET /api/analytics/profit-breakdown/{company_id}` - Cost breakdown

## How Data is Stored

### Product Data Structure
```json
{
  "id": 1,
  "company_id": 1,
  "asin": "B09ABC1234",
  "sku": "TG-PHONE-001",
  "title": "Premium Phone Case",
  "category": "Electronics",
  "unit_cost": 3.50,
  "shipping_cost_per_unit": 0.50,
  "packaging_cost": 0.25,
  "fba_fee": 3.22,
  "referral_fee_percentage": 15.0,
  "current_stock": 250,
  "current_price": 24.99
}
```

### Profit Calculation
- **Revenue** = Order total (product price × quantity)
- **COGS** = unit_cost + shipping_cost + packaging_cost
- **Amazon Fees** = FBA fee + Referral fee (% of sale)
- **Gross Profit** = Revenue - COGS - Amazon Fees
- **Net Profit** = Gross Profit - Expenses (advertising, storage, etc.)

## License

MIT
