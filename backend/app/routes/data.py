from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company, Product, Order, OrderItem, Transaction, InventoryHistory, Expense

router = APIRouter(prefix="/data", tags=["data"])


@router.delete("/clear")
def clear_all_data(db: Session = Depends(get_db)):
    """Clear all data from the database"""
    db.query(Transaction).delete()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(InventoryHistory).delete()
    db.query(Product).delete()
    db.query(Expense).delete()
    db.query(Company).delete()
    db.commit()
    
    return {"success": True, "message": "All data cleared"}


@router.get("/stats")
def get_data_stats(db: Session = Depends(get_db)):
    """Get counts of all data in the database"""
    return {
        "companies": db.query(Company).count(),
        "products": db.query(Product).count(),
        "orders": db.query(Order).count(),
        "transactions": db.query(Transaction).count(),
    }
