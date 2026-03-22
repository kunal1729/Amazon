import { useEffect, useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Package,
  Percent,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import StatCard from './StatCard';
import SalesChart from './SalesChart';
import TopProductsTable from './TopProductsTable';
import ProfitBreakdownChart from './ProfitBreakdownChart';
import {
  getDashboardSummary,
  getSalesTrend,
  getTopProducts,
  getTransactionsSummary,
  getAlerts,
} from '../api';
import type {
  DashboardSummary,
  SalesTrend,
  TopProduct,
  Alert,
} from '../api';

const COMPANY_ID = 1;

interface TransactionFinancials {
  gross_sales: number;
  gross_shipping: number;
  total_refunds: number;
  refund_count: number;
  net_revenue: number;
  selling_fees: number;
  fba_fees: number;
  other_fees: number;
  service_fees: number;
  total_fees: number;
  settlement_amount: number;
  net_settlement: number;
  total_reimbursements: number;
  actual_cogs: number;
  cogs_is_estimated: boolean;
  true_profit: number;
  true_profit_margin: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [txnFinancials, setTxnFinancials] = useState<TransactionFinancials | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertCounts, setAlertCounts] = useState({ critical: 0, warning: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, txnRes, trendRes, productsRes, alertsRes] = await Promise.all([
        getDashboardSummary(COMPANY_ID),
        getTransactionsSummary(COMPANY_ID),
        getSalesTrend(COMPANY_ID, 120),
        getTopProducts(COMPANY_ID, 5),
        getAlerts(COMPANY_ID),
      ]);

      setSummary(summaryRes.data);
      setTxnFinancials(txnRes.data.financials);
      setSalesTrend(trendRes.data);
      setTopProducts(productsRes.data);
      setAlerts(alertsRes.data.alerts);
      setAlertCounts({
        critical: alertsRes.data.critical_count,
        warning: alertsRes.data.warning_count,
      });
    } catch (err: unknown) {
      console.error('Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-500 mb-4">
          Upload your Amazon Orders and Transactions reports to get started.
        </p>
        <p className="text-sm text-gray-400">
          Go to <span className="text-blue-600 font-medium">Settings</span> to upload your data files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your business overview.</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Gross Revenue"
          value={txnFinancials ? txnFinancials.gross_sales + txnFinancials.gross_shipping : 0}
          icon={IndianRupee}
          prefix="₹"
          color="blue"
        />
        <StatCard
          title="Net Revenue"
          value={txnFinancials?.net_revenue || 0}
          icon={TrendingUp}
          prefix="₹"
          color="green"
        />
        <StatCard
          title="Total Fees"
          value={txnFinancials?.total_fees || 0}
          icon={Percent}
          prefix="₹"
          color="red"
        />
        <StatCard
          title="Refunds"
          value={txnFinancials?.total_refunds || 0}
          icon={AlertTriangle}
          prefix="₹"
          color="yellow"
        />
        <StatCard
          title="Total Orders"
          value={summary.total_orders}
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="Net Settlement"
          value={txnFinancials?.net_settlement || 0}
          icon={Package}
          prefix="₹"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesTrend} />
        </div>
        <div>
          <ProfitBreakdownChart data={txnFinancials} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopProductsTable products={topProducts} />
        </div>
        
        {/* Alerts Section */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Alerts</h3>
            {(alertCounts.critical > 0 || alertCounts.warning > 0) && (
              <div className="flex gap-2">
                {alertCounts.critical > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {alertCounts.critical} critical
                  </span>
                )}
                {alertCounts.warning > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    {alertCounts.warning} warning
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2 text-green-500" size={32} />
                <p className="font-medium text-gray-900">All Clear!</p>
                <p className="text-sm">No alerts at this time.</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {alert.type === 'high_return' ? (
                        <RotateCcw size={16} className={
                          alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        } />
                      ) : (
                        <AlertTriangle size={16} className={
                          alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        } />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {alerts.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-100 text-center">
              <span className="text-sm text-indigo-600 font-medium">
                +{alerts.length - 5} more alerts
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
