from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    amazon_seller_id = Column(String(100), unique=True, index=True)
    email = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    products = relationship("Product", back_populates="company")
    orders = relationship("Order", back_populates="company")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asin = Column(String(20), index=True)
    sku = Column(String(100), index=True)
    title = Column(String(500))
    category = Column(String(255))
    brand = Column(String(255))
    image_url = Column(Text)
    
    # Cost of Goods Sold
    unit_cost = Column(Float, default=0.0)
    shipping_cost_per_unit = Column(Float, default=0.0)
    packaging_cost = Column(Float, default=0.0)
    
    # Amazon-specific
    fba_fee = Column(Float, default=0.0)
    referral_fee_percentage = Column(Float, default=15.0)
    
    # Inventory
    current_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    inbound_stock = Column(Integer, default=0)
    
    # Pricing
    current_price = Column(Float, default=0.0)
    min_price = Column(Float, default=0.0)
    max_price = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_history = relationship("InventoryHistory", back_populates="product")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    amazon_order_id = Column(String(50), unique=True, index=True)
    status = Column(String(20), default=OrderStatus.PENDING.value)
    
    # Customer info (anonymized)
    customer_state = Column(String(100))
    customer_country = Column(String(100))
    
    # Financials
    subtotal = Column(Float, default=0.0)
    shipping_revenue = Column(Float, default=0.0)
    tax_collected = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)
    
    # Fees
    amazon_fees = Column(Float, default=0.0)
    fba_fees = Column(Float, default=0.0)
    referral_fees = Column(Float, default=0.0)
    other_fees = Column(Float, default=0.0)
    
    # Dates
    purchase_date = Column(DateTime)
    ship_date = Column(DateTime)
    delivery_date = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    
    # Cost tracking for profit calculation
    unit_cost = Column(Float, default=0.0)
    fba_fee = Column(Float, default=0.0)
    referral_fee = Column(Float, default=0.0)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class InventoryHistory(Base):
    __tablename__ = "inventory_history"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity_change = Column(Integer, default=0)
    previous_stock = Column(Integer, default=0)
    new_stock = Column(Integer, default=0)
    reason = Column(String(100))  # sale, restock, adjustment, return
    
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="inventory_history")


class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    category = Column(String(100))  # advertising, storage, software, etc.
    description = Column(Text)
    amount = Column(Float, default=0.0)
    date = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class AdCampaign(Base):
    __tablename__ = "ad_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Campaign identifiers
    campaign_name = Column(String(255))
    campaign_id = Column(String(100), index=True)
    ad_group_name = Column(String(255))
    ad_group_id = Column(String(100))
    
    # Product info
    sku = Column(String(100), index=True)
    asin = Column(String(20))
    
    # Performance metrics
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    spend = Column(Float, default=0.0)
    sales = Column(Float, default=0.0)  # Attributed sales from ads
    orders = Column(Integer, default=0)  # Attributed orders from ads
    units = Column(Integer, default=0)   # Attributed units from ads
    
    # Calculated metrics (stored for quick access)
    ctr = Column(Float, default=0.0)      # Click-through rate
    cpc = Column(Float, default=0.0)      # Cost per click
    acos = Column(Float, default=0.0)     # Advertising Cost of Sales
    roas = Column(Float, default=0.0)     # Return on Ad Spend
    
    # Time period
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    
    # Ad type
    ad_type = Column(String(50))  # Sponsored Products, Sponsored Brands, etc.
    targeting_type = Column(String(50))  # Manual, Auto
    match_type = Column(String(50))  # Exact, Phrase, Broad
    
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    settlement_id = Column(String(100))
    type = Column(String(100))  # Order, Refund, Shipping Services, etc.
    order_id = Column(String(50), index=True)
    sku = Column(String(100))
    description = Column(Text)
    quantity = Column(Integer)
    marketplace = Column(String(100))
    account_type = Column(String(100))
    fulfillment = Column(String(100))
    order_city = Column(String(255))
    order_state = Column(String(255))
    order_postal = Column(String(50))
    
    # Financials
    product_sales = Column(Float, default=0.0)
    shipping_credits = Column(Float, default=0.0)
    gift_wrap_credits = Column(Float, default=0.0)
    promotional_rebates = Column(Float, default=0.0)
    sales_tax_liable = Column(Float, default=0.0)
    tcs_cgst = Column(Float, default=0.0)
    tcs_sgst = Column(Float, default=0.0)
    tcs_igst = Column(Float, default=0.0)
    tds_194o = Column(Float, default=0.0)
    selling_fees = Column(Float, default=0.0)
    fba_fees = Column(Float, default=0.0)
    other_transaction_fees = Column(Float, default=0.0)
    other_fees = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
