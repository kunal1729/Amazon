"""
Data import script for Amazon Seller data
"""
import csv
from datetime import datetime
from sqlalchemy.orm import Session
from .models import Company, Product, Order, OrderItem, Transaction


def parse_float(value):
    """Parse a float value from CSV, handling empty strings and commas"""
    if not value or value.strip() == '':
        return 0.0
    try:
        return float(value.replace(',', ''))
    except (ValueError, AttributeError):
        return 0.0


def parse_int(value):
    """Parse an integer value from CSV"""
    if not value or value.strip() == '':
        return 0
    try:
        return int(float(value))
    except (ValueError, AttributeError):
        return 0


def parse_date(value):
    """Parse date from various formats"""
    if not value or value.strip() == '':
        return None
    formats = [
        '%Y-%m-%dT%H:%M:%S%z',
        '%Y-%m-%d %H:%M:%S',
        '%d-%m-%Y %H:%M:%S',
        '%d/%m/%Y %H:%M:%S',
        '%Y-%m-%d',
        '%d-%m-%Y',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return None


def map_order_status(amazon_status: str) -> str:
    """Map Amazon order status to internal status"""
    status_lower = amazon_status.lower() if amazon_status else ''
    if 'delivered' in status_lower:
        return 'delivered'
    elif 'shipped' in status_lower:
        return 'shipped'
    elif 'cancelled' in status_lower:
        return 'cancelled'
    elif 'returned' in status_lower or 'refund' in status_lower:
        return 'returned'
    elif 'pending' in status_lower:
        return 'pending'
    return 'shipped'


def detect_delimiter(filepath: str) -> str:
    """Detect if file is comma or tab separated"""
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        first_line = f.readline()
        if '\t' in first_line:
            return '\t'
        return ','


def import_orders_from_csv(db: Session, filepath: str, company_id: int):
    """Import orders from Amazon All Orders Report CSV/TSV"""
    orders_created = 0
    products_created = 0
    
    delimiter = detect_delimiter(filepath)
    delim_name = 'TAB' if delimiter == '\t' else 'COMMA'
    print(f"Detected delimiter: {delim_name}")
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        
        for row in reader:
            # Get or create product by SKU
            sku = row.get('sku', '') or row.get('SKU', '')
            asin = row.get('asin', '') or row.get('ASIN', '')
            
            if not sku and not asin:
                continue
                
            product = db.query(Product).filter(
                Product.company_id == company_id,
                Product.sku == sku
            ).first()
            
            item_price_for_product = parse_float(row.get('item-price', 0))
            
            if not product:
                product = Product(
                    company_id=company_id,
                    sku=sku,
                    asin=asin,
                    title=row.get('product-name', '') or row.get('product_name', '') or 'Unknown Product',
                    category=row.get('item-promotion-discount', ''),
                    current_price=item_price_for_product,
                    unit_cost=item_price_for_product * 0.4,  # Estimate 40% COGS
                )
                db.add(product)
                db.flush()
                products_created += 1
            elif product.unit_cost == 0 and item_price_for_product > 0:
                # Update product cost if it was created with 0 (from cancelled order)
                product.current_price = item_price_for_product
                product.unit_cost = item_price_for_product * 0.4
            
            # Create order
            amazon_order_id = row.get('amazon-order-id', '') or row.get('order-id', '')
            if not amazon_order_id:
                continue
                
            existing_order = db.query(Order).filter(
                Order.amazon_order_id == amazon_order_id
            ).first()
            
            if existing_order:
                continue
            
            order_status = map_order_status(row.get('order-status', '') or row.get('item-status', ''))
            
            item_price = parse_float(row.get('item-price', 0))
            shipping = parse_float(row.get('shipping-price', 0))
            
            order = Order(
                company_id=company_id,
                amazon_order_id=amazon_order_id,
                status=order_status,
                customer_state=row.get('ship-state', '') or row.get('ship-city', ''),
                customer_country=row.get('ship-country', 'IN'),
                subtotal=item_price,
                shipping_revenue=shipping,
                total_revenue=item_price + shipping,
                purchase_date=parse_date(row.get('purchase-date', '') or row.get('payments-date', '')),
            )
            db.add(order)
            db.flush()
            
            # Create order item
            quantity = parse_int(row.get('quantity', 1)) or 1
            # Use product's unit_cost, or estimate from item_price if not set
            item_unit_cost = product.unit_cost if product.unit_cost > 0 else (item_price * 0.4 / quantity if quantity > 0 else 0)
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=item_price / quantity if quantity > 0 else item_price,
                total_price=item_price,
                unit_cost=item_unit_cost,
            )
            db.add(order_item)
            orders_created += 1
    
    db.commit()
    return {'orders_created': orders_created, 'products_created': products_created}


def import_transactions_from_csv(db: Session, filepath: str, company_id: int):
    """Import transactions from Amazon Transactions Report CSV"""
    transactions_created = 0
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            txn = Transaction(
                company_id=company_id,
                settlement_id=row.get('settlement id', ''),
                type=row.get('type', ''),
                order_id=row.get('order id', ''),
                sku=row.get('Sku', '') or row.get('sku', ''),
                description=row.get('description', ''),
                quantity=parse_int(row.get('quantity', 0)),
                marketplace=row.get('marketplace', ''),
                account_type=row.get('account type', ''),
                fulfillment=row.get('fulfillment', ''),
                order_city=row.get('order city', ''),
                order_state=row.get('order state', ''),
                order_postal=row.get('order postal', ''),
                product_sales=parse_float(row.get('product sales', 0)),
                shipping_credits=parse_float(row.get('shipping credits', 0)),
                gift_wrap_credits=parse_float(row.get('gift wrap credits', 0)),
                promotional_rebates=parse_float(row.get('promotional rebates', 0)),
                sales_tax_liable=parse_float(row.get('Total sales tax liable(GST before adjusting TCS)', 0)),
                tcs_cgst=parse_float(row.get('TCS-CGST', 0)),
                tcs_sgst=parse_float(row.get('TCS-SGST', 0)),
                tcs_igst=parse_float(row.get('TCS-IGST', 0)),
                tds_194o=parse_float(row.get('TDS (Section 194-O)', 0)),
                selling_fees=parse_float(row.get('selling fees', 0)),
                fba_fees=parse_float(row.get('fba fees', 0)),
                other_transaction_fees=parse_float(row.get('other transaction fees', 0)),
                other_fees=parse_float(row.get('other', 0)),
                total=parse_float(row.get('total', 0)),
                date=parse_date(row.get('date/time', '')),
            )
            db.add(txn)
            transactions_created += 1
    
    db.commit()
    return {'transactions_created': transactions_created}
