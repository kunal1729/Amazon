from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import List, Optional
from ..database import get_db
from ..models import Order, OrderItem, Product, Expense, Transaction
from ..schemas import DashboardSummary, SalesTrend, TopProduct

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard/{company_id}", response_model=DashboardSummary)
def get_dashboard_summary(
    company_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    # Build query - only apply date filters if provided
    query = db.query(Order).filter(Order.company_id == company_id)
    
    if start_date:
        query = query.filter(Order.purchase_date >= start_date)
    if end_date:
        query = query.filter(Order.purchase_date <= end_date)
    
    # Get orders (all-time if no date range specified)
    orders = query.all()
    
    total_revenue = sum(o.total_revenue for o in orders)
    total_fees = sum(o.amazon_fees for o in orders)
    total_orders = len(orders)
    
    # Calculate costs from order items
    total_cost = 0.0
    total_units = 0
    for order in orders:
        for item in order.items:
            total_cost += item.unit_cost * item.quantity
            total_units += item.quantity
    
    # Get expenses (with optional date filter)
    expense_query = db.query(func.sum(Expense.amount)).filter(
        Expense.company_id == company_id
    )
    if start_date:
        expense_query = expense_query.filter(Expense.date >= start_date)
    if end_date:
        expense_query = expense_query.filter(Expense.date <= end_date)
    expenses = expense_query.scalar() or 0.0
    
    gross_profit = total_revenue - total_cost - total_fees
    net_profit = gross_profit - expenses
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Product stats
    total_products = db.query(Product).filter(Product.company_id == company_id).count()
    low_stock = db.query(Product).filter(
        Product.company_id == company_id,
        Product.current_stock <= 10
    ).count()
    
    return DashboardSummary(
        total_revenue=round(total_revenue, 2),
        total_cost=round(total_cost, 2),
        total_fees=round(total_fees, 2),
        gross_profit=round(gross_profit, 2),
        net_profit=round(net_profit, 2),
        profit_margin=round(profit_margin, 2),
        total_orders=total_orders,
        total_units_sold=total_units,
        average_order_value=round(avg_order_value, 2),
        total_products=total_products,
        low_stock_products=low_stock
    )


@router.get("/sales-trend/{company_id}", response_model=List[SalesTrend])
def get_sales_trend(
    company_id: int,
    days: int = Query(default=90, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all orders in range
    orders = db.query(Order).filter(
        Order.company_id == company_id,
        Order.purchase_date >= start_date
    ).all()
    
    # Group by date
    daily_data = {}
    for order in orders:
        date_key = order.purchase_date.strftime("%Y-%m-%d") if order.purchase_date else "unknown"
        if date_key not in daily_data:
            daily_data[date_key] = {
                "revenue": 0,
                "orders": 0,
                "units": 0,
                "cost": 0,
                "fees": 0
            }
        
        daily_data[date_key]["revenue"] += order.total_revenue
        daily_data[date_key]["orders"] += 1
        daily_data[date_key]["fees"] += order.amazon_fees
        
        for item in order.items:
            daily_data[date_key]["units"] += item.quantity
            daily_data[date_key]["cost"] += item.unit_cost * item.quantity
    
    # Convert to list and sort
    result = []
    for date, data in sorted(daily_data.items()):
        profit = data["revenue"] - data["cost"] - data["fees"]
        result.append(SalesTrend(
            date=date,
            revenue=round(data["revenue"], 2),
            orders=data["orders"],
            units=data["units"],
            profit=round(profit, 2)
        ))
    
    return result


@router.get("/top-products/{company_id}", response_model=List[TopProduct])
def get_top_products(
    company_id: int,
    limit: int = Query(default=10, description="Number of top products"),
    days: int = Query(default=90, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get products with their sales data
    products = db.query(Product).filter(Product.company_id == company_id).all()
    
    product_stats = []
    for product in products:
        # Get order items for this product in date range
        items = db.query(OrderItem).join(Order).filter(
            OrderItem.product_id == product.id,
            Order.purchase_date >= start_date
        ).all()
        
        if not items:
            continue
        
        revenue = sum(item.total_price for item in items)
        units = sum(item.quantity for item in items)
        cost = sum(item.unit_cost * item.quantity for item in items)
        fees = sum((item.fba_fee + item.referral_fee) * item.quantity for item in items)
        profit = revenue - cost - fees
        margin = (profit / revenue * 100) if revenue > 0 else 0
        
        product_stats.append(TopProduct(
            product_id=product.id,
            title=product.title or "Unknown",
            asin=product.asin or "N/A",
            revenue=round(revenue, 2),
            units_sold=units,
            profit=round(profit, 2),
            profit_margin=round(margin, 2)
        ))
    
    # Sort by revenue and return top N
    product_stats.sort(key=lambda x: x.revenue, reverse=True)
    return product_stats[:limit]


@router.get("/profit-breakdown/{company_id}")
def get_profit_breakdown(
    company_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    # Build query - only apply date filters if provided
    query = db.query(Order).filter(Order.company_id == company_id)
    if start_date:
        query = query.filter(Order.purchase_date >= start_date)
    if end_date:
        query = query.filter(Order.purchase_date <= end_date)
    
    orders = query.all()
    
    total_revenue = 0.0
    total_cogs = 0.0
    total_fba_fees = 0.0
    total_referral_fees = 0.0
    total_other_fees = 0.0
    
    for order in orders:
        total_revenue += order.total_revenue
        total_fba_fees += order.fba_fees
        total_referral_fees += order.referral_fees
        total_other_fees += order.other_fees
        
        for item in order.items:
            total_cogs += item.unit_cost * item.quantity
    
    # Get expenses breakdown (with optional date filter)
    expense_query = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total')
    ).filter(Expense.company_id == company_id)
    if start_date:
        expense_query = expense_query.filter(Expense.date >= start_date)
    if end_date:
        expense_query = expense_query.filter(Expense.date <= end_date)
    expenses = expense_query.group_by(Expense.category).all()
    
    expense_breakdown = {e.category: round(e.total, 2) for e in expenses}
    total_expenses = sum(expense_breakdown.values())
    
    gross_profit = total_revenue - total_cogs - total_fba_fees - total_referral_fees - total_other_fees
    net_profit = gross_profit - total_expenses
    
    return {
        "revenue": round(total_revenue, 2),
        "cogs": round(total_cogs, 2),
        "fba_fees": round(total_fba_fees, 2),
        "referral_fees": round(total_referral_fees, 2),
        "other_fees": round(total_other_fees, 2),
        "gross_profit": round(gross_profit, 2),
        "expenses": expense_breakdown,
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2)
    }


@router.get("/transactions-summary/{company_id}")
def get_transactions_summary(
    company_id: int,
    db: Session = Depends(get_db)
):
    """Get comprehensive financial summary from transaction data"""
    transactions = db.query(Transaction).filter(
        Transaction.company_id == company_id
    ).all()
    
    if not transactions:
        return {
            "total_transactions": 0,
            "financials": {
                "gross_sales": 0, "gross_shipping": 0,
                "total_refunds": 0, "refund_count": 0,
                "total_reimbursements": 0, "reimbursement_count": 0,
                "net_revenue": 0,
                "selling_fees": 0, "fba_fees": 0, "other_fees": 0, "service_fees": 0,
                "total_fees": 0, "settlement_amount": 0,
                "true_profit": 0, "true_profit_margin": 0
            },
            "by_type": {}
        }
    
    # Calculate aggregates
    gross_sales = 0.0
    gross_shipping = 0.0
    total_refunds = 0.0
    refund_count = 0
    total_reimbursements = 0.0
    reimbursement_count = 0
    selling_fees = 0.0
    fba_fees = 0.0
    other_fees = 0.0
    service_fees = 0.0
    settlement_total = 0.0
    bank_transfers = 0.0  # Actual money sent to bank
    
    by_type = {}
    
    for txn in transactions:
        txn_type = txn.type or 'Unknown'
        if txn_type not in by_type:
            by_type[txn_type] = {"count": 0, "total": 0}
        by_type[txn_type]["count"] += 1
        by_type[txn_type]["total"] += txn.total or 0
        
        settlement_total += txn.total or 0
        
        if txn_type == 'Order':
            gross_sales += txn.product_sales or 0
            gross_shipping += txn.shipping_credits or 0
            selling_fees += abs(txn.selling_fees or 0)
            fba_fees += abs(txn.fba_fees or 0)
            other_fees += abs(txn.other_transaction_fees or 0) + abs(txn.other_fees or 0)
        elif txn_type == 'Refund':
            total_refunds += abs(txn.product_sales or 0) + abs(txn.shipping_credits or 0)
            refund_count += 1
            # Fees refunded back
            selling_fees += abs(txn.selling_fees or 0)  # Usually negative (refund)
            fba_fees += abs(txn.fba_fees or 0)
        elif 'Reimbursement' in txn_type or 'FBA' in txn_type or 'Fulfilment Fee Refund' in txn_type:
            total_reimbursements += txn.total or 0
            reimbursement_count += 1
        elif 'Service' in txn_type or 'Shipping' in txn_type:
            service_fees += abs(txn.total or 0)
        elif txn_type == 'Transfer':
            bank_transfers += abs(txn.total or 0)  # Transfers are negative, so abs()
    
    total_fees = selling_fees + fba_fees + other_fees + service_fees
    net_revenue = gross_sales + gross_shipping - total_refunds
    
    # Calculate actual COGS from order items (using COGS set via COGS management)
    order_items = db.query(OrderItem).join(Order).filter(
        Order.company_id == company_id
    ).all()
    
    actual_cogs = sum(item.unit_cost * item.quantity for item in order_items)
    
    # If no COGS data available, estimate as 40% (fallback)
    if actual_cogs == 0 and gross_sales > 0:
        actual_cogs = gross_sales * 0.4
        cogs_is_estimated = True
    else:
        cogs_is_estimated = False
    
    true_profit = bank_transfers - actual_cogs
    true_profit_margin = (true_profit / net_revenue * 100) if net_revenue > 0 else 0
    
    return {
        "total_transactions": len(transactions),
        "financials": {
            "gross_sales": round(gross_sales, 2),
            "gross_shipping": round(gross_shipping, 2),
            "total_refunds": round(total_refunds, 2),
            "refund_count": refund_count,
            "total_reimbursements": round(total_reimbursements, 2),
            "reimbursement_count": reimbursement_count,
            "net_revenue": round(net_revenue, 2),
            "selling_fees": round(selling_fees, 2),
            "fba_fees": round(fba_fees, 2),
            "other_fees": round(other_fees, 2),
            "service_fees": round(service_fees, 2),
            "total_fees": round(total_fees, 2),
            "settlement_amount": round(settlement_total, 2),
            "bank_transfers": round(bank_transfers, 2),
            "actual_cogs": round(actual_cogs, 2),
            "cogs_is_estimated": cogs_is_estimated,
            "true_profit": round(true_profit, 2),
            "true_profit_margin": round(true_profit_margin, 2)
        },
        "by_type": by_type
    }


@router.get("/refunds/{company_id}")
def get_refunds(
    company_id: int,
    limit: int = Query(default=100),
    db: Session = Depends(get_db)
):
    """Get all refund transactions"""
    refunds = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.type == 'Refund'
    ).limit(limit).all()
    
    return [{
        "order_id": r.order_id,
        "sku": r.sku,
        "date": r.date.isoformat() if r.date else None,
        "product_refund": abs(r.product_sales or 0),
        "shipping_refund": abs(r.shipping_credits or 0),
        "amount": abs((r.product_sales or 0) + (r.shipping_credits or 0))
    } for r in refunds]
