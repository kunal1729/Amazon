from datetime import datetime, timedelta
import random
from .database import SessionLocal
from .models import Company, Product, Order, OrderItem, Expense

def seed_database():
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(Company).first():
            print("Database already seeded")
            return
        
        # Create a company
        company = Company(
            name="TechGadgets Inc.",
            amazon_seller_id="A1B2C3D4E5F6G7",
            email="seller@techgadgets.com"
        )
        db.add(company)
        db.flush()
        
        # Create products
        products_data = [
            {
                "asin": "B09ABC1234",
                "sku": "TG-PHONE-CASE-001",
                "title": "Premium Phone Case - iPhone 15 Pro Max",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 3.50,
                "shipping_cost_per_unit": 0.50,
                "packaging_cost": 0.25,
                "fba_fee": 3.22,
                "referral_fee_percentage": 15.0,
                "current_stock": 250,
                "current_price": 24.99
            },
            {
                "asin": "B09DEF5678",
                "sku": "TG-CHARGER-002",
                "title": "65W USB-C Fast Charger with GaN Technology",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 8.00,
                "shipping_cost_per_unit": 0.75,
                "packaging_cost": 0.50,
                "fba_fee": 4.15,
                "referral_fee_percentage": 15.0,
                "current_stock": 180,
                "current_price": 34.99
            },
            {
                "asin": "B09GHI9012",
                "sku": "TG-CABLE-003",
                "title": "USB-C to Lightning Cable 6ft (2-Pack)",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 2.00,
                "shipping_cost_per_unit": 0.30,
                "packaging_cost": 0.20,
                "fba_fee": 2.92,
                "referral_fee_percentage": 15.0,
                "current_stock": 500,
                "current_price": 19.99
            },
            {
                "asin": "B09JKL3456",
                "sku": "TG-STAND-004",
                "title": "Adjustable Laptop Stand - Aluminum",
                "category": "Office Products",
                "brand": "TechGadgets",
                "unit_cost": 12.00,
                "shipping_cost_per_unit": 2.00,
                "packaging_cost": 1.00,
                "fba_fee": 5.50,
                "referral_fee_percentage": 15.0,
                "current_stock": 75,
                "current_price": 49.99
            },
            {
                "asin": "B09MNO7890",
                "sku": "TG-MOUSE-005",
                "title": "Wireless Ergonomic Mouse - Rechargeable",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 6.50,
                "shipping_cost_per_unit": 0.60,
                "packaging_cost": 0.40,
                "fba_fee": 3.86,
                "referral_fee_percentage": 15.0,
                "current_stock": 8,  # Low stock
                "current_price": 29.99
            },
            {
                "asin": "B09PQR1234",
                "sku": "TG-HUB-006",
                "title": "USB-C Hub 7-in-1 with HDMI 4K",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 15.00,
                "shipping_cost_per_unit": 1.00,
                "packaging_cost": 0.75,
                "fba_fee": 5.20,
                "referral_fee_percentage": 15.0,
                "current_stock": 120,
                "current_price": 44.99
            },
            {
                "asin": "B09STU5678",
                "sku": "TG-SCREEN-007",
                "title": "Screen Protector iPhone 15 (3-Pack)",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 1.50,
                "shipping_cost_per_unit": 0.25,
                "packaging_cost": 0.15,
                "fba_fee": 2.50,
                "referral_fee_percentage": 15.0,
                "current_stock": 5,  # Low stock
                "current_price": 14.99
            },
            {
                "asin": "B09VWX9012",
                "sku": "TG-KEYBOARD-008",
                "title": "Bluetooth Mechanical Keyboard - RGB",
                "category": "Electronics",
                "brand": "TechGadgets",
                "unit_cost": 22.00,
                "shipping_cost_per_unit": 2.50,
                "packaging_cost": 1.50,
                "fba_fee": 6.75,
                "referral_fee_percentage": 15.0,
                "current_stock": 45,
                "current_price": 79.99
            }
        ]
        
        created_products = []
        for p_data in products_data:
            product = Product(company_id=company.id, **p_data)
            db.add(product)
            created_products.append(product)
        
        db.flush()
        
        # Create orders for the last 60 days
        states = ["CA", "TX", "NY", "FL", "WA", "IL", "PA", "OH", "GA", "NC"]
        
        for day_offset in range(60):
            order_date = datetime.utcnow() - timedelta(days=day_offset)
            num_orders = random.randint(3, 15)  # 3-15 orders per day
            
            for _ in range(num_orders):
                amazon_order_id = f"111-{random.randint(1000000, 9999999)}-{random.randint(1000000, 9999999)}"
                
                order = Order(
                    company_id=company.id,
                    amazon_order_id=amazon_order_id,
                    status=random.choice(["delivered", "delivered", "delivered", "shipped", "pending"]),
                    customer_state=random.choice(states),
                    customer_country="US",
                    purchase_date=order_date + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
                )
                db.add(order)
                db.flush()
                
                # Add 1-3 items per order
                num_items = random.randint(1, 3)
                selected_products = random.sample(created_products, min(num_items, len(created_products)))
                
                subtotal = 0.0
                total_fba = 0.0
                total_referral = 0.0
                
                for product in selected_products:
                    quantity = random.randint(1, 3)
                    unit_price = product.current_price
                    total_price = unit_price * quantity
                    referral_fee = total_price * (product.referral_fee_percentage / 100)
                    
                    item = OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        unit_cost=product.unit_cost + product.shipping_cost_per_unit + product.packaging_cost,
                        fba_fee=product.fba_fee,
                        referral_fee=referral_fee / quantity
                    )
                    db.add(item)
                    
                    subtotal += total_price
                    total_fba += product.fba_fee * quantity
                    total_referral += referral_fee
                
                order.subtotal = subtotal
                order.total_revenue = subtotal
                order.fba_fees = total_fba
                order.referral_fees = total_referral
                order.amazon_fees = total_fba + total_referral
        
        # Create some expenses
        expense_categories = [
            ("advertising", "Amazon PPC Campaigns", 500, 2000),
            ("storage", "FBA Storage Fees", 100, 500),
            ("software", "Inventory Management Software", 50, 200),
            ("photography", "Product Photography", 100, 400),
            ("shipping", "Inbound Shipping to FBA", 200, 800),
        ]
        
        for day_offset in range(0, 60, 7):  # Weekly expenses
            expense_date = datetime.utcnow() - timedelta(days=day_offset)
            for category, description, min_amt, max_amt in expense_categories:
                if random.random() > 0.3:  # 70% chance of each expense type
                    expense = Expense(
                        company_id=company.id,
                        category=category,
                        description=description,
                        amount=random.uniform(min_amt, max_amt),
                        date=expense_date
                    )
                    db.add(expense)
        
        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
