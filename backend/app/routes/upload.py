from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import tempfile

from ..database import get_db
from ..models import Company
from ..import_data import import_orders_from_csv, import_transactions_from_csv, import_ads_from_csv

router = APIRouter(prefix="/upload", tags=["upload"])


def get_or_create_company(db: Session) -> Company:
    """Get the first company or create a default one"""
    company = db.query(Company).first()
    if not company:
        company = Company(
            name="My Amazon Business",
            amazon_seller_id="DEFAULT",
            email="seller@example.com"
        )
        db.add(company)
        db.commit()
        db.refresh(company)
    return company


@router.post("/orders")
async def upload_orders_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload Amazon Orders Report CSV/TSV file"""
    if not file.filename.endswith(('.csv', '.tsv', '.txt')):
        raise HTTPException(status_code=400, detail="File must be CSV or TSV format")
    
    company = get_or_create_company(db)
    
    # Save uploaded file temporarily
    content = await file.read()
    print(f"Orders upload: received {len(content)} bytes from {file.filename}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='wb') as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = import_orders_from_csv(db, tmp_path, company.id)
        print(f"Orders import result: {result}")
        return {
            "success": True,
            "message": f"Imported {result['orders_created']} orders and {result['products_created']} products",
            **result
        }
    except Exception as e:
        print(f"Orders import error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@router.post("/transactions")
async def upload_transactions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload Amazon Transactions Report CSV file"""
    if not file.filename.endswith(('.csv', '.tsv', '.txt')):
        raise HTTPException(status_code=400, detail="File must be CSV format")
    
    company = get_or_create_company(db)
    
    # Save uploaded file temporarily
    content = await file.read()
    print(f"Transactions upload: received {len(content)} bytes from {file.filename}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv', mode='wb') as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = import_transactions_from_csv(db, tmp_path, company.id)
        print(f"Transactions import result: {result}")
        return {
            "success": True,
            "message": f"Imported {result['transactions_created']} transactions",
            **result
        }
    except Exception as e:
        print(f"Transactions import error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@router.post("/ads")
async def upload_ads_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload Amazon Sponsored Products/Brands Report CSV file"""
    if not file.filename.endswith(('.csv', '.tsv', '.txt', '.xlsx')):
        raise HTTPException(status_code=400, detail="File must be CSV or TSV format")
    
    company = get_or_create_company(db)
    
    content = await file.read()
    print(f"Ads upload: received {len(content)} bytes from {file.filename}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv', mode='wb') as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = import_ads_from_csv(db, tmp_path, company.id)
        print(f"Ads import result: {result}")
        return {
            "success": True,
            "message": f"Imported {result['created']} ad campaigns, updated {result['updated']}",
            **result
        }
    except Exception as e:
        print(f"Ads import error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)
