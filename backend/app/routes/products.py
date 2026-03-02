from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
import csv
import io
import tempfile
import os
from ..database import get_db
from ..models import Product, OrderItem, Order
from ..schemas import ProductCreate, ProductResponse, ProductUpdate, ProductWithProfit


class COGSUpdate(BaseModel):
    unit_cost: float


class BulkCOGSItem(BaseModel):
    product_id: int
    unit_cost: float


class BulkCOGSUpdate(BaseModel):
    items: List[BulkCOGSItem]

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=List[ProductResponse])
def list_products(
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 5000,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if company_id:
        query = query.filter(Product.company_id == company_id)
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/with-profit", response_model=List[ProductWithProfit])
def list_products_with_profit(
    company_id: int,
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.company_id == company_id).all()
    result = []
    
    for product in products:
        order_items = db.query(OrderItem).filter(OrderItem.product_id == product.id).all()
        
        total_units = sum(item.quantity for item in order_items)
        total_revenue = sum(item.total_price for item in order_items)
        total_cost = sum(item.unit_cost * item.quantity for item in order_items)
        total_fees = sum((item.fba_fee + item.referral_fee) * item.quantity for item in order_items)
        gross_profit = total_revenue - total_cost - total_fees
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        product_data = ProductWithProfit(
            **{k: v for k, v in product.__dict__.items() if not k.startswith('_')},
            total_revenue=total_revenue,
            total_units_sold=total_units,
            total_cost=total_cost,
            total_fees=total_fees,
            gross_profit=gross_profit,
            profit_margin=round(profit_margin, 2)
        )
        result.append(product_data)
    
    return result


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}


@router.get("/low-stock/{company_id}")
def get_low_stock_products(
    company_id: int,
    threshold: int = Query(default=10, description="Stock threshold"),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.company_id == company_id,
        Product.current_stock <= threshold
    ).all()
    return products


@router.get("/{product_id}/performance")
def get_product_performance(product_id: int, db: Session = Depends(get_db)):
    """Get detailed performance metrics for a specific product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get all order items for this product
    order_items = db.query(OrderItem, Order).join(
        Order, OrderItem.order_id == Order.id
    ).filter(OrderItem.product_id == product_id).all()
    
    # Calculate aggregates
    total_units = 0
    total_revenue = 0.0
    total_cost = 0.0
    orders_count = 0
    delivered_count = 0
    cancelled_count = 0
    returned_count = 0
    
    # Monthly breakdown
    monthly_data = {}
    
    for item, order in order_items:
        total_units += item.quantity or 0
        total_revenue += item.total_price or 0
        total_cost += (item.unit_cost or 0) * (item.quantity or 1)
        orders_count += 1
        
        if order.status == 'delivered':
            delivered_count += 1
        elif order.status == 'cancelled':
            cancelled_count += 1
        elif order.status == 'returned':
            returned_count += 1
        
        # Monthly aggregation
        if order.purchase_date:
            month_key = order.purchase_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'revenue': 0, 'units': 0, 'orders': 0}
            monthly_data[month_key]['revenue'] += item.total_price or 0
            monthly_data[month_key]['units'] += item.quantity or 0
            monthly_data[month_key]['orders'] += 1
    
    gross_profit = total_revenue - total_cost
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    avg_order_value = total_revenue / orders_count if orders_count > 0 else 0
    
    # Convert monthly data to sorted list
    monthly_trend = [
        {'month': k, **v} 
        for k, v in sorted(monthly_data.items())
    ]
    
    return {
        'product': {
            'id': product.id,
            'title': product.title,
            'sku': product.sku,
            'asin': product.asin,
            'current_price': product.current_price,
            'unit_cost': product.unit_cost,
        },
        'performance': {
            'total_revenue': round(total_revenue, 2),
            'total_units': total_units,
            'total_orders': orders_count,
            'total_cost': round(total_cost, 2),
            'gross_profit': round(gross_profit, 2),
            'profit_margin': round(profit_margin, 2),
            'avg_order_value': round(avg_order_value, 2),
        },
        'order_breakdown': {
            'delivered': delivered_count,
            'cancelled': cancelled_count,
            'returned': returned_count,
            'other': orders_count - delivered_count - cancelled_count - returned_count,
        },
        'monthly_trend': monthly_trend,
    }


@router.put("/{product_id}/cogs")
def update_product_cogs(product_id: int, cogs: COGSUpdate, db: Session = Depends(get_db)):
    """Update COGS (unit_cost) for a single product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.unit_cost = cogs.unit_cost
    db.commit()
    db.refresh(product)
    
    return {
        "success": True,
        "message": f"Updated COGS for {product.sku or product.title}",
        "product_id": product.id,
        "unit_cost": product.unit_cost
    }


@router.post("/cogs/bulk")
def bulk_update_cogs(data: BulkCOGSUpdate, db: Session = Depends(get_db)):
    """Bulk update COGS for multiple products"""
    updated = 0
    errors = []
    
    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.unit_cost = item.unit_cost
            updated += 1
        else:
            errors.append(f"Product ID {item.product_id} not found")
    
    db.commit()
    
    return {
        "success": True,
        "updated": updated,
        "errors": errors,
        "message": f"Updated COGS for {updated} products"
    }


@router.post("/cogs/import")
async def import_cogs_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import COGS from CSV file. Also updates product titles if provided.
    Expected columns: sku, unit_cost (or product_id, unit_cost), optionally title
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="File must be CSV format")
    
    content = await file.read()
    text_content = content.decode('utf-8')
    
    updated = 0
    titles_updated = 0
    not_found = []
    errors = []
    
    try:
        reader = csv.DictReader(io.StringIO(text_content))
        
        for row in reader:
            sku = row.get('sku') or row.get('SKU') or row.get('Sku')
            product_id = row.get('product_id') or row.get('id')
            cost_str = row.get('unit_cost') or row.get('cost') or row.get('cogs') or row.get('COGS') or row.get('Cost')
            title = row.get('title') or row.get('Title') or row.get('product_name') or row.get('Product Name')
            
            if not cost_str and not title:
                continue
            
            unit_cost = None
            if cost_str:
                try:
                    unit_cost = float(cost_str.replace(',', '').strip())
                except ValueError:
                    errors.append(f"Invalid cost value: {cost_str}")
            
            product = None
            if product_id:
                try:
                    product = db.query(Product).filter(Product.id == int(product_id)).first()
                except ValueError:
                    pass
            
            if not product and sku:
                product = db.query(Product).filter(Product.sku == sku).first()
            
            if product:
                if unit_cost is not None:
                    product.unit_cost = unit_cost
                    updated += 1
                if title and title.strip() and (not product.title or product.title == 'Unknown Product'):
                    product.title = title.strip()
                    titles_updated += 1
            else:
                not_found.append(sku or product_id)
        
        db.commit()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
    
    message = f"Updated COGS for {updated} products"
    if titles_updated > 0:
        message += f", titles for {titles_updated} products"
    
    return {
        "success": True,
        "updated": updated,
        "titles_updated": titles_updated,
        "not_found": not_found[:20],
        "not_found_count": len(not_found),
        "errors": errors[:10],
        "message": message
    }


@router.get("/cogs/export")
def export_cogs_csv(company_id: int = 1, db: Session = Depends(get_db)):
    """Export all products with their COGS as CSV data"""
    products = db.query(Product).filter(Product.company_id == company_id).all()
    
    data = []
    for p in products:
        data.append({
            "product_id": p.id,
            "sku": p.sku or "",
            "asin": p.asin or "",
            "title": p.title or "",
            "current_price": p.current_price,
            "unit_cost": p.unit_cost,
            "estimated_margin": round(((p.current_price - p.unit_cost) / p.current_price * 100) if p.current_price > 0 else 0, 2)
        })
    
    return data
