import { useState, useEffect } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  RotateCcw,
  Package,
  Truck,
  CreditCard,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getTransactionsSummary,
  getTopProducts,
  getRefunds,
  getSKUAnalytics,
  type TopProduct,
  type Refund,
  type SKUAnalytics,
} from '../api';

const COMPANY_ID = 1;

interface Financials {
  gross_sales: number;
  gross_shipping: number;
  total_refunds: number;
  refund_count: number;
  net_revenue: number;
  selling_fees: number;
  fba_fees: number;
  other_fees: number;
  service_fees: number;
  advertising_fees: number;
  aba_fees: number;
  promotional_rebates: number;
  tcs_tds: number;
  total_fees: number;
  shipping_and_fees: number;
  net_settlement: number;
  total_reimbursements: number;
  reimbursement_count: number;
  fulfilled_sales: number;
  fulfilled_order_count: number;
  refunded_order_count: number;
  customer_return_loss: number;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [skuAnalytics, setSKUAnalytics] = useState<SKUAnalytics[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'products' | 'sku' | 'refunds'>('summary');
  const [dataCutoffDate, setDataCutoffDate] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SKUAnalytics; direction: 'asc' | 'desc' }>({
    key: 'revenue',
    direction: 'desc',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txnRes, productsRes, refundsRes, skuRes] = await Promise.all([
        getTransactionsSummary(COMPANY_ID),
        getTopProducts(COMPANY_ID, 20),
        getRefunds(COMPANY_ID, 100),
        getSKUAnalytics(COMPANY_ID),
      ]);
      setFinancials(txnRes.data.financials);
      setDataCutoffDate(txnRes.data.data_cutoff_date);
      setTopProducts(productsRes.data);
      setRefunds(refundsRes.data);
      setSKUAnalytics(skuRes.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSKUAnalytics = [...skuAnalytics].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleSort = (key: keyof SKUAnalytics) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const downloadReport = () => {
    if (!financials) return;
    
    const grossRevenue = financials.gross_sales + financials.gross_shipping;
    
    let content = `SELLER ANALYTICS REPORT
Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}

═══════════════════════════════════════════════════════════
                    PROFIT & LOSS SUMMARY
═══════════════════════════════════════════════════════════

REVENUE
  Product Sales           ₹${financials.gross_sales.toLocaleString('en-IN')}
  Shipping Credits        ₹${financials.gross_shipping.toLocaleString('en-IN')}
  ─────────────────────────────────────────
  GROSS REVENUE           ₹${grossRevenue.toLocaleString('en-IN')}

DEDUCTIONS
  Refunds (${financials.refund_count} orders)    -₹${financials.total_refunds.toLocaleString('en-IN')}
  ─────────────────────────────────────────
  NET REVENUE             ₹${financials.net_revenue.toLocaleString('en-IN')}

AMAZON FEES
  Selling/Referral Fees   -₹${financials.selling_fees.toLocaleString('en-IN')}
  FBA Fulfillment         -₹${financials.fba_fees.toLocaleString('en-IN')}
  Service Fees            -₹${financials.service_fees.toLocaleString('en-IN')}
  Other Fees              -₹${financials.other_fees.toLocaleString('en-IN')}
  ─────────────────────────────────────────
  TOTAL FEES              -₹${financials.total_fees.toLocaleString('en-IN')}

CREDITS
  Reimbursements          +₹${financials.total_reimbursements.toLocaleString('en-IN')}

═══════════════════════════════════════════════════════════
NET SETTLEMENT                       ₹${financials.net_settlement.toLocaleString('en-IN')}
═══════════════════════════════════════════════════════════

TOP PRODUCTS BY REVENUE
`;
    
    topProducts.slice(0, 10).forEach((p, i) => {
      content += `${i + 1}. ${p.title.substring(0, 40)}...
   Revenue: ₹${p.revenue.toLocaleString('en-IN')} | Units: ${p.units_sold} | Margin: ${p.profit_margin.toFixed(0)}%
`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seller-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const downloadSKUCSV = () => {
    if (skuAnalytics.length === 0) return;
    
    const headers = ['SKU', 'Title', 'ASIN', 'Orders', 'Refunds', 'Return %', 'Units Sold', 'Revenue', 'Net Revenue', 'Fees', 'COGS', 'Gross Profit', 'Profit Margin %'];
    const rows = skuAnalytics.map(sku => [
      sku.sku,
      `"${sku.title.replace(/"/g, '""')}"`,
      sku.asin,
      sku.orders,
      sku.refunds,
      sku.return_rate,
      sku.units_sold,
      sku.revenue,
      sku.net_revenue,
      sku.fees,
      sku.cogs,
      sku.gross_profit,
      sku.profit_margin,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sku-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!financials) {
    return <div className="text-center py-12 text-gray-500">No data available</div>;
  }

  const grossRevenue = financials.gross_sales + financials.gross_shipping;
  const settlementRatio = financials.net_revenue > 0 
    ? ((financials.net_settlement / financials.net_revenue) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Report</h1>
          <p className="text-gray-500">Complete financial overview of your Amazon business</p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'summary', label: 'P&L Summary' },
          { id: 'products', label: 'Top Products' },
          { id: 'sku', label: 'SKU Analytics' },
          { id: 'refunds', label: 'Refunds' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <IndianRupee size={16} />
                Gross Revenue
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(grossRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <TrendingUp size={16} />
                Net Revenue
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(financials.net_revenue)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <CreditCard size={16} />
                Total Fees
              </div>
              <p className="text-2xl font-bold text-red-600">-{formatCurrency(financials.total_fees)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Truck size={16} />
                Net Settlement
              </div>
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(financials.net_settlement)}</p>
            </div>
          </div>

          {/* P&L Statement */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Profit & Loss Statement</h2>
                {dataCutoffDate && (
                  <span className="text-sm text-indigo-100">
                    Data through {new Date(dataCutoffDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {/* Revenue Section */}
              <div className="px-6 py-4 bg-green-50">
                <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3">Revenue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product Sales (All Orders)</span>
                    <span className="font-medium text-gray-400">₹{financials.gross_sales.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fulfilled Sales ({financials.fulfilled_order_count || 0} orders)</span>
                    <span className="font-medium">₹{(financials.fulfilled_sales || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Credits</span>
                    <span className="font-medium">₹{financials.gross_shipping.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="font-semibold text-green-800">Gross Revenue</span>
                    <span className="font-bold text-green-800">₹{grossRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="px-6 py-4 bg-red-50">
                <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide mb-3">Deductions & Returns</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refunds ({financials.refund_count} orders)</span>
                    <span className="font-medium text-red-600">-₹{financials.total_refunds.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Return Loss</span>
                    <span className="font-medium text-red-600">-₹{(financials.customer_return_loss || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-red-200">
                    <span className="font-semibold">Net Revenue</span>
                    <span className="font-bold">₹{financials.net_revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Fees Section */}
              <div className="px-6 py-4 bg-orange-50">
                <h3 className="text-sm font-semibold text-orange-800 uppercase tracking-wide mb-3">Shipping & Fees</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">FBA Fulfillment</span>
                    <span className="font-medium text-red-600">-₹{financials.fba_fees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selling/Referral Fees</span>
                    <span className="font-medium text-red-600">-₹{financials.selling_fees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Fees</span>
                    <span className="font-medium text-red-600">-₹{financials.other_fees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Promotional Rebates</span>
                    <span className="font-medium text-red-600">-₹{(financials.promotional_rebates || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TCS/TDS</span>
                    <span className="font-medium text-red-600">-₹{(financials.tcs_tds || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-orange-200">
                    <span className="font-semibold text-orange-800">Total Shipping & Fees</span>
                    <span className="font-bold text-red-600">-₹{(financials.shipping_and_fees || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Settlement */}
              <div className="px-6 py-4 bg-emerald-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-emerald-800">Net Settlement</span>
                    <p className="text-xs text-emerald-600">Fulfilled Sales - Shipping & Fees</p>
                  </div>
                  <span className="text-xl font-bold text-emerald-700">₹{(financials.net_settlement || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Other Charges (Advertising, ABA, Service Fees) */}
              <div className="px-6 py-4 bg-purple-50">
                <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wide mb-3">Other Charges</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advertising</span>
                    <span className="font-medium text-red-600">-₹{(financials.advertising_fees || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ABA Fees</span>
                    <span className="font-medium text-red-600">-₹{(financials.aba_fees || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fees</span>
                    <span className="font-medium text-red-600">-₹{financials.service_fees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-200">
                    <span className="font-semibold text-purple-800">Total Other Charges</span>
                    <span className="font-bold text-red-600">-₹{((financials.advertising_fees || 0) + (financials.aba_fees || 0) + financials.service_fees).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Credits Section */}
              <div className="px-6 py-4 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-3">Credits</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reimbursements ({financials.reimbursement_count})</span>
                  <span className="font-medium text-green-600">+₹{financials.total_reimbursements.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Final Section */}
              <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-indigo-200 text-sm">Net Settlement</p>
                    <p className="text-3xl font-bold text-white">₹{financials.net_settlement.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-200 text-sm">Settlement Ratio</p>
                    <p className="text-2xl font-bold text-white">{settlementRatio}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top Products by Revenue</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Product</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Units</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Profit</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((product, index) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-xs">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.asin}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium">₹{product.revenue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{product.units_sold}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={product.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{product.profit.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.profit_margin >= 50 ? 'bg-green-100 text-green-700' :
                      product.profit_margin >= 30 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.profit_margin.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SKU Analytics Tab */}
      {activeTab === 'sku' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SKU-Level Analytics</h2>
              <p className="text-sm text-gray-500">Profit and return analysis by SKU</p>
            </div>
            <button
              onClick={downloadSKUCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">SKU / Product</th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer hover:text-indigo-600"
                      onClick={() => handleSort('orders')}
                    >
                      Orders {sortConfig.key === 'orders' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer hover:text-indigo-600"
                      onClick={() => handleSort('return_rate')}
                    >
                      Return % {sortConfig.key === 'return_rate' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer hover:text-indigo-600"
                      onClick={() => handleSort('revenue')}
                    >
                      Revenue {sortConfig.key === 'revenue' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer hover:text-indigo-600"
                      onClick={() => handleSort('gross_profit')}
                    >
                      Profit {sortConfig.key === 'gross_profit' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer hover:text-indigo-600"
                      onClick={() => handleSort('profit_margin')}
                    >
                      Margin {sortConfig.key === 'profit_margin' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedSKUAnalytics.map((sku, index) => (
                    <tr key={sku.sku} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-xs">{sku.title}</p>
                        <p className="text-xs text-gray-500">{sku.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="text-gray-900">{sku.orders}</span>
                        {sku.refunds > 0 && (
                          <span className="text-red-500 text-xs ml-1">(-{sku.refunds})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sku.return_rate > 20 ? 'bg-red-100 text-red-700' :
                          sku.return_rate > 10 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {sku.return_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ₹{sku.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={sku.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{sku.gross_profit.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sku.profit_margin >= 30 ? 'bg-green-100 text-green-700' :
                          sku.profit_margin >= 15 ? 'bg-yellow-100 text-yellow-700' :
                          sku.profit_margin >= 0 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {sku.profit_margin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-gray-500 text-sm">Total Refunds</p>
              <p className="text-2xl font-bold text-red-600">₹{financials.total_refunds.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-gray-500 text-sm">Refund Count</p>
              <p className="text-2xl font-bold text-gray-900">{financials.refund_count}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-gray-500 text-sm">Avg Refund</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{financials.refund_count > 0 ? (financials.total_refunds / financials.refund_count).toFixed(0) : 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Refunds</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refunds.slice(0, 20).map((refund, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{refund.order_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{refund.sku || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {refund.date ? new Date(refund.date).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                      -₹{refund.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
