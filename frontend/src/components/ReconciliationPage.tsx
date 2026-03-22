import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileCheck,
  FileX,
  ArrowRight,
} from 'lucide-react';
import { getReconciliationStatus, type ReconciliationStatus } from '../api';

const COMPANY_ID = 1;

export default function ReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReconciliationStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'matched' | 'unmatched'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getReconciliationStatus(COMPANY_ID);
      setData(res.data);
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Reconciliation</h1>
        <p className="text-gray-500">Track matching between orders and settlement transactions</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <FileCheck size={16} />
            Total Orders
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.total_orders}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-green-200 bg-green-50">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
            <CheckCircle2 size={16} />
            Matched
          </div>
          <p className="text-2xl font-bold text-green-700">{data.matched_orders}</p>
          <p className="text-sm text-green-600 mt-1">{data.match_rate}% match rate</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
            <XCircle size={16} />
            Unmatched Orders
          </div>
          <p className="text-2xl font-bold text-red-700">{data.unmatched_orders}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-2">
            <AlertTriangle size={16} />
            Orphan Transactions
          </div>
          <p className="text-2xl font-bold text-yellow-700">{data.orphan_transactions}</p>
        </div>
      </div>

      {/* Match Rate Progress Bar */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Progress</h2>
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${data.match_rate}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-sm text-gray-700">
              {data.match_rate}% Matched
            </span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{data.matched_orders} matched</span>
          <span>{data.unmatched_orders} unmatched</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'matched', label: `Matched (${data.matched_orders})` },
          { id: 'unmatched', label: `Unmatched (${data.unmatched_orders})` },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Reconciliation Flow</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileCheck className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Orders Imported</p>
                  <p className="text-sm text-gray-500">{data.total_orders} total orders</p>
                </div>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="text-gray-300" size={24} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileX className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Transactions Matched</p>
                  <p className="text-sm text-gray-500">Linked by Order ID</p>
                </div>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="text-gray-300" size={24} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Settlement Calculated</p>
                  <p className="text-sm text-gray-500">{data.matched_orders} orders reconciled</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" size={18} />
                  <span className="text-gray-700">Settled Orders</span>
                </div>
                <span className="font-bold text-green-700">
                  {data.matched_details?.filter(d => d.status === 'settled').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-orange-600" size={18} />
                  <span className="text-gray-700">Refunded Orders</span>
                </div>
                <span className="font-bold text-orange-700">
                  {data.matched_details?.filter(d => d.status === 'refunded').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-600" size={18} />
                  <span className="text-gray-700">Unmatched</span>
                </div>
                <span className="font-bold text-red-700">{data.unmatched_orders}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileX className="text-yellow-600" size={18} />
                  <span className="text-gray-700">Orphan Transactions</span>
                </div>
                <span className="font-bold text-yellow-700">{data.orphan_transactions}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matched Tab */}
      {activeTab === 'matched' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Matched Orders (Top 50)</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Order ID</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Order Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Settlement</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500">Transactions</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.matched_details?.map((item) => (
                <tr key={item.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm text-gray-900">{item.order_id}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">
                    ₹{item.order_revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                    ₹{item.settlement.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {item.transaction_count}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'settled' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Unmatched Tab */}
      {activeTab === 'unmatched' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Unmatched Order IDs</h2>
            <p className="text-sm text-gray-500 mt-1">
              These orders don't have corresponding settlement transactions
            </p>
          </div>
          {data.unmatched_order_ids && data.unmatched_order_ids.length > 0 ? (
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {data.unmatched_order_ids.map((orderId) => (
                  <span
                    key={orderId}
                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-mono text-sm"
                  >
                    {orderId}
                  </span>
                ))}
              </div>
              {data.unmatched_orders > 20 && (
                <p className="text-sm text-gray-500 mt-4">
                  Showing first 20 of {data.unmatched_orders} unmatched orders
                </p>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
              <p className="text-lg font-medium text-gray-900">All Orders Matched!</p>
              <p className="text-gray-500">Every order has a corresponding settlement transaction.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
