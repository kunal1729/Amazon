import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getTransactionsSummary, getSalesTrend, getTopProducts, type TransactionsSummary, type SalesTrend, type TopProduct } from '../api';

const COMPANY_ID = 1;

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export default function AnalyticsPage() {
  const [txnSummary, setTxnSummary] = useState<TransactionsSummary | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txnRes, salesRes, productsRes] = await Promise.all([
        getTransactionsSummary(COMPANY_ID),
        getSalesTrend(COMPANY_ID, 90),
        getTopProducts(COMPANY_ID, 10),
      ]);
      setTxnSummary(txnRes.data);
      setSalesTrend(salesRes.data);
      setTopProducts(productsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const fin = txnSummary?.financials;
  const netSettlement = fin?.net_settlement || 0;
  const grossRevenue = fin ? fin.gross_sales + fin.gross_shipping : 0;
  const actualCOGS = fin?.actual_cogs || 0;
  const cogsIsEstimated = fin?.cogs_is_estimated || false;
  const trueProfit = fin?.true_profit || (netSettlement - actualCOGS);
  const profitMargin = grossRevenue > 0 ? (trueProfit / grossRevenue) * 100 : 0;

  // Pie chart data for fee breakdown
  const feeData = fin ? [
    { name: 'Selling Fees', value: fin.selling_fees },
    { name: 'FBA Fees', value: fin.fba_fees },
    { name: 'Other Fees', value: fin.other_fees },
    { name: 'Service Fees', value: fin.service_fees },
  ].filter(d => d.value > 0) : [];

  // Transaction type breakdown
  const typeData = txnSummary?.by_type ? Object.entries(txnSummary.by_type).map(([name, data]) => ({
    name,
    count: data.count,
    total: Math.abs(data.total),
  })).slice(0, 6) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Detailed financial analysis based on {txnSummary?.total_transactions || 0} transactions</p>
      </div>

      {/* P&L Summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Profit & Loss Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Gross Revenue</p>
            <p className="text-xl font-bold">₹{grossRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Refunds</p>
            <p className="text-xl font-bold text-red-200">-₹{(fin?.total_refunds || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Net Revenue</p>
            <p className="text-xl font-bold">₹{(fin?.net_revenue || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Total Fees</p>
            <p className="text-xl font-bold text-red-200">-₹{(fin?.total_fees || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Reimbursements</p>
            <p className="text-xl font-bold text-green-200">+₹{(fin?.total_reimbursements || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Net Settlement</p>
            <p className="text-xl font-bold">₹{netSettlement.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">
              {cogsIsEstimated ? 'COGS (Est. 40%)' : 'COGS (Actual)'}
            </p>
            <p className="text-xl font-bold text-red-200">-₹{actualCOGS.toLocaleString('en-IN')}</p>
            {cogsIsEstimated && (
              <p className="text-emerald-200 text-xs mt-1">Set actual COGS in COGS tab</p>
            )}
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">True Profit</p>
            <p className={`text-xl font-bold ${trueProfit >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {trueProfit >= 0 ? '₹' : '-₹'}{Math.abs(trueProfit).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-emerald-100 text-xs">Profit Margin</p>
            <p className={`text-xl font-bold ${profitMargin >= 0 ? '' : 'text-red-200'}`}>
              {profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {feeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {feeData.map((fee, idx) => (
              <div key={fee.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-gray-600">{fee.name}</span>
                </div>
                <span className="font-medium text-gray-900">₹{fee.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Bar dataKey="total" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {typeData.map((type) => (
              <div key={type.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{type.name}</span>
                <span className="text-gray-500">{type.count} transactions</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Sales Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend (Last 90 Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="profit" fill="#6366F1" radius={[4, 4, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Units</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((product, idx) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-md">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.asin}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    ₹{product.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{product.units_sold}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    ₹{product.profit.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.profit_margin > 20 ? 'bg-green-100 text-green-700' :
                      product.profit_margin > 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.profit_margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
