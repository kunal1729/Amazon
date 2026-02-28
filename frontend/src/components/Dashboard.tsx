import { useEffect, useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Package,
  Percent,
  AlertTriangle,
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
} from '../api';
import type {
  DashboardSummary,
  SalesTrend,
  TopProduct,
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
  bank_transfers: number;
  total_reimbursements: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [txnFinancials, setTxnFinancials] = useState<TransactionFinancials | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, txnRes, trendRes, productsRes] = await Promise.all([
        getDashboardSummary(COMPANY_ID),
        getTransactionsSummary(COMPANY_ID),
        getSalesTrend(COMPANY_ID, 120),
        getTopProducts(COMPANY_ID, 5),
      ]);

      setSummary(summaryRes.data);
      setTxnFinancials(txnRes.data.financials);
      setSalesTrend(trendRes.data);
      setTopProducts(productsRes.data);
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
          title="Bank Transfers"
          value={txnFinancials?.bank_transfers || 0}
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

      <div>
        <TopProductsTable products={topProducts} />
      </div>
    </div>
  );
}
