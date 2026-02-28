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
- Python 3.9+
- Node.js 18+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Seed Sample Data

After starting both servers, visit the frontend and click "Seed Sample Data" to populate the database with sample products, orders, and analytics data.

Or call the API directly:
```bash
curl -X POST http://localhost:8000/api/seed
```

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
