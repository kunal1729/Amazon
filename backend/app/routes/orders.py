from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Order, OrderItem, Product
from ..schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    if company_id:
        query = query.filter(Order.company_id == company_id)
    if status:
        query = query.filter(Order.status == status)
    if start_date:
        query = query.filter(Order.purchase_date >= start_date)
    if end_date:
        query = query.filter(Order.purchase_date <= end_date)
    
    orders = query.order_by(Order.purchase_date.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    order_data = order.model_dump(exclude={'items'})
    db_order = Order(**order_data)
    
    subtotal = 0.0
    total_fba_fees = 0.0
    total_referral_fees = 0.0
    
    db.add(db_order)
    db.flush()
    
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        total_price = item.unit_price * item.quantity
        referral_fee = total_price * (product.referral_fee_percentage / 100)
        fba_fee = product.fba_fee * item.quantity
        
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=total_price,
            unit_cost=product.unit_cost + product.shipping_cost_per_unit + product.packaging_cost,
            fba_fee=product.fba_fee,
            referral_fee=referral_fee / item.quantity
        )
        db.add(db_item)
        
        subtotal += total_price
        total_fba_fees += fba_fee
        total_referral_fees += referral_fee
        
        # Update inventory
        product.current_stock -= item.quantity
    
    db_order.subtotal = subtotal
    db_order.total_revenue = subtotal
    db_order.fba_fees = total_fba_fees
    db_order.referral_fees = total_referral_fees
    db_order.amazon_fees = total_fba_fees + total_referral_fees
    
    db.commit()
    db.refresh(db_order)
    return db_order


@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_order.status = status
    
    if status == "shipped":
        db_order.ship_date = datetime.utcnow()
    elif status == "delivered":
        db_order.delivery_date = datetime.utcnow()
    
    db.commit()
    db.refresh(db_order)
    return db_order


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}
