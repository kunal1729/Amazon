import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DashboardSummary {
  total_revenue: number;
  total_cost: number;
  total_fees: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  total_orders: number;
  total_units_sold: number;
  average_order_value: number;
  total_products: number;
  low_stock_products: number;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
  units: number;
  profit: number;
}

export interface TopProduct {
  product_id: number;
  title: string;
  asin: string;
  revenue: number;
  units_sold: number;
  profit: number;
  profit_margin: number;
}

export interface Product {
  id: number;
  company_id: number;
  asin: string;
  sku: string;
  title: string;
  category: string;
  brand: string;
  unit_cost: number;
  current_stock: number;
  current_price: number;
  fba_fee: number;
  total_revenue?: number;
  total_units_sold?: number;
  gross_profit?: number;
  profit_margin?: number;
}

export interface Order {
  id: number;
  company_id: number;
  amazon_order_id: string;
  status: string;
  customer_state: string;
  customer_country: string;
  subtotal: number;
  shipping_revenue: number;
  total_revenue: number;
  purchase_date: string;
}

export interface ProfitBreakdown {
  revenue: number;
  cogs: number;
  fba_fees: number;
  referral_fees: number;
  other_fees: number;
  gross_profit: number;
  expenses: Record<string, number>;
  total_expenses: number;
  net_profit: number;
}

export interface FinancialSummary {
  gross_sales: number;
  gross_shipping: number;
  total_refunds: number;
  refund_count: number;
  total_reimbursements: number;
  reimbursement_count: number;
  net_revenue: number;
  selling_fees: number;
  fba_fees: number;
  other_fees: number;
  service_fees: number;
  total_fees: number;
  settlement_amount: number;
  net_settlement: number;
  actual_cogs: number;
  cogs_is_estimated: boolean;
  true_profit: number;
  true_profit_margin: number;
}

export interface TransactionsSummary {
  total_transactions: number;
  financials: FinancialSummary;
  by_type: Record<string, { count: number; total: number }>;
}

export interface Refund {
  order_id: string;
  sku: string;
  date: string;
  product_refund: number;
  shipping_refund: number;
  amount: number;
}

export interface ProductPerformance {
  product: {
    id: number;
    title: string;
    sku: string;
    asin: string;
    current_price: number;
    unit_cost: number;
  };
  performance: {
    total_revenue: number;
    total_units: number;
    total_orders: number;
    total_cost: number;
    gross_profit: number;
    profit_margin: number;
    avg_order_value: number;
  };
  order_breakdown: {
    delivered: number;
    cancelled: number;
    returned: number;
    other: number;
  };
  monthly_trend: Array<{
    month: string;
    revenue: number;
    units: number;
    orders: number;
  }>;
}

export const seedDatabase = () => api.post('/seed');

export const getDashboardSummary = (companyId: number) =>
  api.get<DashboardSummary>(`/analytics/dashboard/${companyId}`);

export const getSalesTrend = (companyId: number, days: number = 30) =>
  api.get<SalesTrend[]>(`/analytics/sales-trend/${companyId}?days=${days}`);

export const getTopProducts = (companyId: number, limit: number = 10) =>
  api.get<TopProduct[]>(`/analytics/top-products/${companyId}?limit=${limit}`);

export const getProfitBreakdown = (companyId: number) =>
  api.get<ProfitBreakdown>(`/analytics/profit-breakdown/${companyId}`);

export const getProducts = (companyId: number) =>
  api.get<Product[]>(`/products?company_id=${companyId}`);

export const getProductsWithProfit = (companyId: number) =>
  api.get<Product[]>(`/products/with-profit?company_id=${companyId}`);

export const getProductPerformance = (productId: number) =>
  api.get<ProductPerformance>(`/products/${productId}/performance`);

export const getLowStockProducts = (companyId: number, threshold: number = 10) =>
  api.get<Product[]>(`/products/low-stock/${companyId}?threshold=${threshold}`);

export const getOrders = (companyId: number, limit: number = 5000) =>
  api.get<Order[]>(`/orders?company_id=${companyId}&limit=${limit}`);

export const getTransactionsSummary = (companyId: number) =>
  api.get<TransactionsSummary>(`/analytics/transactions-summary/${companyId}`);

export const getRefunds = (companyId: number, limit: number = 100) =>
  api.get<Refund[]>(`/analytics/refunds/${companyId}?limit=${limit}`);

export const uploadOrders = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/orders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadTransactions = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/transactions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const clearAllData = () => api.delete('/data/clear');

export const getDataStats = () => api.get('/data/stats');

// COGS Management
export interface COGSProduct {
  product_id: number;
  sku: string;
  asin: string;
  title: string;
  current_price: number;
  unit_cost: number;
  estimated_margin: number;
}

export const getCOGSExport = (companyId: number = 1) =>
  api.get<COGSProduct[]>(`/products/cogs/export?company_id=${companyId}`);

export const updateProductCOGS = (productId: number, unitCost: number) =>
  api.put(`/products/${productId}/cogs`, { unit_cost: unitCost });

export const bulkUpdateCOGS = (items: { product_id: number; unit_cost: number }[]) =>
  api.post('/products/cogs/bulk', { items });

export const importCOGSCSV = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/products/cogs/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// SKU Analytics
export interface SKUAnalytics {
  sku: string;
  title: string;
  asin: string;
  orders: number;
  refunds: number;
  return_rate: number;
  units_sold: number;
  units_refunded: number;
  revenue: number;
  refund_amount: number;
  net_revenue: number;
  fees: number;
  cogs: number;
  gross_profit: number;
  profit_margin: number;
  net_settlement: number;
}

export const getSKUAnalytics = (companyId: number) =>
  api.get<SKUAnalytics[]>(`/analytics/sku-analytics/${companyId}`);

// Geo Analytics
export interface StateAnalytics {
  state: string;
  orders: number;
  refunds: number;
  return_rate: number;
  revenue: number;
  refund_amount: number;
  net_revenue: number;
  net_settlement: number;
}

export interface CityAnalytics {
  city: string;
  state: string;
  orders: number;
  refunds: number;
  return_rate: number;
  revenue: number;
}

export interface GeoAnalyticsData {
  states: StateAnalytics[];
  cities: CityAnalytics[];
  total_states: number;
  total_cities: number;
}

export const getGeoAnalytics = (companyId: number) =>
  api.get<GeoAnalyticsData>(`/analytics/geo-analytics/${companyId}`);

// Reconciliation Status
export interface ReconciliationStatus {
  total_orders: number;
  matched_orders: number;
  unmatched_orders: number;
  orphan_transactions: number;
  match_rate: number;
  unmatched_order_ids: string[];
  matched_details: Array<{
    order_id: string;
    order_revenue: number;
    settlement: number;
    status: string;
    transaction_count: number;
  }>;
}

export const getReconciliationStatus = (companyId: number) =>
  api.get<ReconciliationStatus>(`/analytics/reconciliation-status/${companyId}`);

// Alerts
export interface Alert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  sku: string;
  title: string;
  message: string;
  value: number;
}

export interface AlertsData {
  alerts: Alert[];
  total_alerts: number;
  critical_count: number;
  warning_count: number;
}

export const getAlerts = (companyId: number) =>
  api.get<AlertsData>(`/analytics/alerts/${companyId}`);

export default api;
