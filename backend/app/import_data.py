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
    """Import orders from Amazon All Orders Report CSV/TSV
    
    COGS Logic:
    - For existing products: Use the COGS already set in database (via COGS management)
    - For new products: Default to 40% of item price (user can update later via COGS page)
    - Never overwrite manually set COGS values
    """
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
            
            # Extract product title from various possible column names
            product_title = (
                row.get('product-name', '') or 
                row.get('product_name', '') or 
                row.get('item-name', '') or
                row.get('item_name', '') or
                row.get('title', '') or
                row.get('product-title', '') or
                row.get('product_title', '') or
                row.get('Title', '') or
                row.get('Product Name', '') or
                ''
            ).strip()
            
            if not product:
                # New product - use 40% as default COGS (can be updated via COGS management)
                default_cogs = item_price_for_product * 0.4 if item_price_for_product > 0 else 0
                product = Product(
                    company_id=company_id,
                    sku=sku,
                    asin=asin,
                    title=product_title or 'Unknown Product',
                    category=row.get('item-promotion-discount', ''),
                    current_price=item_price_for_product,
                    unit_cost=default_cogs,
                )
                db.add(product)
                db.flush()
                products_created += 1
                print(f"New product {sku}: COGS set to {default_cogs:.2f} (40% default)")
            else:
                # Existing product - preserve COGS if already set, only update if 0
                if product.unit_cost == 0 and item_price_for_product > 0:
                    default_cogs = item_price_for_product * 0.4
                    product.unit_cost = default_cogs
                    print(f"Product {sku}: COGS was 0, setting to {default_cogs:.2f} (40% default)")
                else:
                    # Use existing COGS from database (set via COGS management)
                    print(f"Product {sku}: Using existing COGS {product.unit_cost:.2f}")
                
                # Update price if we have a valid one
                if item_price_for_product > 0:
                    product.current_price = item_price_for_product
            
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
            
            # Create order item - use product's COGS from database
            quantity = parse_int(row.get('quantity', 1)) or 1
            # Always use product's stored unit_cost (from COGS management or default)
            item_unit_cost = product.unit_cost
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
    """Import transactions from Amazon Transactions Report CSV
    
    Duplicate checking: Transactions are identified by combination of
    order_id + date + total amount to prevent duplicates when re-uploading.
    """
    transactions_created = 0
    duplicates_skipped = 0
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            order_id = row.get('order id', '')
            txn_date = parse_date(row.get('date/time', ''))
            txn_total = parse_float(row.get('total', 0))
            txn_type = row.get('type', '')
            sku = row.get('Sku', '') or row.get('sku', '')
            
            # Check for duplicate transaction
            existing_txn = db.query(Transaction).filter(
                Transaction.company_id == company_id,
                Transaction.order_id == order_id,
                Transaction.type == txn_type,
                Transaction.sku == sku,
                Transaction.total == txn_total
            ).first()
            
            if existing_txn:
                duplicates_skipped += 1
                continue
            
            txn = Transaction(
                company_id=company_id,
                settlement_id=row.get('settlement id', ''),
                type=txn_type,
                order_id=order_id,
                sku=sku,
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
                total=txn_total,
                date=txn_date,
            )
            db.add(txn)
            transactions_created += 1
    
    db.commit()
    print(f"Transactions: {transactions_created} created, {duplicates_skipped} duplicates skipped")
    return {
        'transactions_created': transactions_created,
        'duplicates_skipped': duplicates_skipped
    }
