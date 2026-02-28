from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# Company Schemas
class CompanyBase(BaseModel):
    name: str
    amazon_seller_id: Optional[str] = None
    email: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Product Schemas
class ProductBase(BaseModel):
    asin: Optional[str] = None
    sku: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    unit_cost: float = 0.0
    shipping_cost_per_unit: float = 0.0
    packaging_cost: float = 0.0
    fba_fee: float = 0.0
    referral_fee_percentage: float = 15.0
    current_stock: int = 0
    current_price: float = 0.0


class ProductCreate(ProductBase):
    company_id: int


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    unit_cost: Optional[float] = None
    shipping_cost_per_unit: Optional[float] = None
    packaging_cost: Optional[float] = None
    fba_fee: Optional[float] = None
    current_stock: Optional[int] = None
    current_price: Optional[float] = None


class ProductResponse(ProductBase):
    id: int
    company_id: int
    reserved_stock: int
    inbound_stock: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProductWithProfit(ProductResponse):
    total_revenue: float = 0.0
    total_units_sold: int = 0
    total_cost: float = 0.0
    total_fees: float = 0.0
    gross_profit: float = 0.0
    profit_margin: float = 0.0


# Order Schemas
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    unit_price: float = 0.0


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    total_price: float
    unit_cost: float
    fba_fee: float
    referral_fee: float
    
    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    amazon_order_id: str
    status: str = "pending"
    customer_state: Optional[str] = None
    customer_country: Optional[str] = None
    purchase_date: Optional[datetime] = None


class OrderCreate(OrderBase):
    company_id: int
    items: List[OrderItemCreate]


class OrderResponse(OrderBase):
    id: int
    company_id: int
    subtotal: float
    shipping_revenue: float
    tax_collected: float
    total_revenue: float
    amazon_fees: float
    fba_fees: float
    referral_fees: float
    other_fees: float
    ship_date: Optional[datetime]
    delivery_date: Optional[datetime]
    created_at: datetime
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True


# Analytics Schemas
class DashboardSummary(BaseModel):
    total_revenue: float
    total_cost: float
    total_fees: float
    gross_profit: float
    net_profit: float
    profit_margin: float
    total_orders: int
    total_units_sold: int
    average_order_value: float
    total_products: int
    low_stock_products: int


class SalesTrend(BaseModel):
    date: str
    revenue: float
    orders: int
    units: int
    profit: float


class TopProduct(BaseModel):
    product_id: int
    title: str
    asin: str
    revenue: float
    units_sold: int
    profit: float
    profit_margin: float


class ExpenseBase(BaseModel):
    category: str
    description: Optional[str] = None
    amount: float
    date: datetime


class ExpenseCreate(ExpenseBase):
    company_id: int


class ExpenseResponse(ExpenseBase):
    id: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
