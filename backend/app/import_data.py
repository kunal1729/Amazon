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
    
    # Clean the value - remove UTC suffix
    cleaned = value.strip()
    if cleaned.endswith(' UTC'):
        cleaned = cleaned[:-4]
    
    formats = [
        '%d %b %Y %I:%M:%S %p',  # 31 Dec 2025 8:05:31 pm
        '%d %b %Y %H:%M:%S',     # 31 Dec 2025 20:05:31
        '%Y-%m-%dT%H:%M:%S%z',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d %H:%M:%S',
        '%d-%m-%Y %H:%M:%S',
        '%d/%m/%Y %H:%M:%S',
        '%Y-%m-%d',
        '%d-%m-%Y',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt)
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


def get_csv_value(row, *keys):
    """Get value from CSV row trying multiple possible column names (case-insensitive)"""
    # Filter out None keys and create lowercase mapping
    row_lower = {k.lower().strip(): v for k, v in row.items() if k is not None}
    for key in keys:
        # Try exact match first
        if key in row:
            return row[key] or ''
        # Try lowercase match
        if key.lower() in row_lower:
            return row_lower[key.lower()] or ''
    return ''


def import_transactions_from_csv(db: Session, filepath: str, company_id: int):
    """Import transactions from Amazon Transactions Report CSV
    
    Handles files that have definition/header lines before the actual column headers.
    Looks for the row containing 'date/time' and 'type' as the header row.
    """
    transactions_created = 0
    duplicates_skipped = 0
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    
    # Find the actual header row (contains 'date/time' and 'type')
    header_row_idx = 0
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if 'date/time' in line_lower and 'type' in line_lower and 'total' in line_lower:
            header_row_idx = i
            print(f"Found header row at line {i + 1}")
            break
    
    # Parse CSV starting from the header row
    csv_content = ''.join(lines[header_row_idx:])
    reader = csv.DictReader(csv_content.splitlines())
    
    print(f"CSV Headers: {reader.fieldnames}")
    
    for row in reader:
        # Get values with multiple possible column names
        order_id = get_csv_value(row, 'order id', 'Order ID', 'order_id', 'OrderId', 'Amazon Order Id')
        txn_date = parse_date(get_csv_value(row, 'date/time', 'Date/Time', 'date', 'Date', 'Posted Date', 'posted date', 'Transaction Date'))
        txn_total = parse_float(get_csv_value(row, 'total', 'Total', 'Amount', 'amount', 'Net Amount', 'net amount'))
        txn_type = get_csv_value(row, 'type', 'Type', 'Transaction Type', 'transaction type', 'Description')
        sku = get_csv_value(row, 'sku', 'Sku', 'SKU', 'MSKU', 'Merchant SKU')
        
        # If no type found, try to infer from description or other fields
        if not txn_type:
            desc = get_csv_value(row, 'description', 'Description', 'Item Description')
            if 'refund' in desc.lower():
                txn_type = 'Refund'
            elif 'order' in desc.lower() or 'product' in desc.lower():
                txn_type = 'Order'
            elif 'transfer' in desc.lower():
                txn_type = 'Transfer'
            elif 'fee' in desc.lower():
                txn_type = 'Service Fee'
            else:
                txn_type = 'Unknown'
        
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
            settlement_id=get_csv_value(row, 'settlement id', 'Settlement ID', 'settlement_id'),
            type=txn_type,
            order_id=order_id,
            sku=sku,
            description=get_csv_value(row, 'description', 'Description', 'Item Description'),
            quantity=parse_int(get_csv_value(row, 'quantity', 'Quantity', 'qty')),
            marketplace=get_csv_value(row, 'marketplace', 'Marketplace'),
            account_type=get_csv_value(row, 'account type', 'Account Type'),
            fulfillment=get_csv_value(row, 'fulfillment', 'Fulfillment', 'Fulfillment Channel'),
            order_city=get_csv_value(row, 'order city', 'Order City', 'City'),
            order_state=get_csv_value(row, 'order state', 'Order State', 'State'),
            order_postal=get_csv_value(row, 'order postal', 'Order Postal', 'Postal Code'),
            product_sales=parse_float(get_csv_value(row, 'product sales', 'Product Sales', 'Item Price', 'Principal')),
            shipping_credits=parse_float(get_csv_value(row, 'shipping credits', 'Shipping Credits', 'Shipping')),
            gift_wrap_credits=parse_float(get_csv_value(row, 'gift wrap credits', 'Gift Wrap Credits')),
            promotional_rebates=parse_float(get_csv_value(row, 'promotional rebates', 'Promotional Rebates', 'Promotion')),
            sales_tax_liable=parse_float(get_csv_value(row, 'Total sales tax liable(GST before adjusting TCS)', 'Sales Tax', 'Tax')),
            tcs_cgst=parse_float(get_csv_value(row, 'TCS-CGST', 'CGST')),
            tcs_sgst=parse_float(get_csv_value(row, 'TCS-SGST', 'SGST')),
            tcs_igst=parse_float(get_csv_value(row, 'TCS-IGST', 'IGST')),
            tds_194o=parse_float(get_csv_value(row, 'TDS (Section 194-O)', 'TDS')),
            selling_fees=parse_float(get_csv_value(row, 'selling fees', 'Selling Fees', 'Commission', 'Referral Fee')),
            fba_fees=parse_float(get_csv_value(row, 'fba fees', 'FBA Fees', 'FBA Fee', 'Fulfillment Fee')),
            other_transaction_fees=parse_float(get_csv_value(row, 'other transaction fees', 'Other Transaction Fees', 'Other Fees')),
            other_fees=parse_float(get_csv_value(row, 'other', 'Other')),
            total=txn_total,
            date=txn_date,
        )
        db.add(txn)
        transactions_created += 1
    
    db.commit()
    print(f"Transactions: {transactions_created} created, {duplicates_skipped} duplicates skipped")
    
    # Update order statuses based on refund transactions
    orders_updated = update_order_statuses_from_transactions(db, company_id)
    
    return {
        'transactions_created': transactions_created,
        'duplicates_skipped': duplicates_skipped,
        'orders_status_updated': orders_updated
    }


def update_order_statuses_from_transactions(db: Session, company_id: int) -> int:
    """Update order statuses based on transaction data (refunds, etc.)"""
    updated_count = 0
    
    # Get all refund transactions with order_ids
    refund_txns = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.type == 'Refund',
        Transaction.order_id != None,
        Transaction.order_id != ''
    ).all()
    
    # Collect unique order IDs that have refunds
    refunded_order_ids = set(txn.order_id for txn in refund_txns if txn.order_id)
    
    if refunded_order_ids:
        # Update orders that have refunds to 'returned' status
        orders_to_update = db.query(Order).filter(
            Order.company_id == company_id,
            Order.amazon_order_id.in_(refunded_order_ids),
            Order.status != 'returned'
        ).all()
        
        for order in orders_to_update:
            order.status = 'returned'
            updated_count += 1
        
        db.commit()
        print(f"Updated {updated_count} orders to 'returned' status based on refund transactions")
    
    return updated_count
