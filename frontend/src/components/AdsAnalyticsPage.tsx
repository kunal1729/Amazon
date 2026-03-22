import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, ShoppingCart, Target, Megaphone, AlertCircle } from 'lucide-react';
import { getAdsAnalytics, type AdsSummary, type CampaignPerformance, type SKUAdPerformance } from '../api';

const COMPANY_ID = 1;

export default function AdsAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [summary, setSummary] = useState<AdsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [skuPerformance, setSKUPerformance] = useState<SKUAdPerformance[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'skus'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getAdsAnalytics(COMPANY_ID);
      setHasData(res.data.has_data);
      setSummary(res.data.summary);
      setCampaigns(res.data.campaigns);
      setSKUPerformance(res.data.sku_performance);
    } catch (error) {
      console.error('Error loading ads analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Analytics</h1>
          <p className="text-gray-500">Advertising performance metrics and campaign analysis</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="text-orange-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-orange-900 mb-2">No Ad Data Available</h2>
          <p className="text-orange-700 mb-4">
            Upload your Amazon Sponsored Products report to see ad performance metrics.
          </p>
          <p className="text-sm text-orange-600">
            Go to Settings → Upload Sponsored Products Report (.csv)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Analytics</h1>
          <p className="text-gray-500">TACOS, ACOS, ROAS and campaign performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Target size={16} />
            TACOS
          </div>
          <p className={`text-2xl font-bold ${summary!.tacos > 15 ? 'text-red-600' : 'text-green-600'}`}>
            {summary!.tacos}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Total Ad Cost of Sales</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <DollarSign size={16} />
            ACOS
          </div>
          <p className={`text-2xl font-bold ${summary!.acos > 30 ? 'text-red-600' : summary!.acos > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
            {summary!.acos}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Ad Cost of Sales</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp size={16} />
            ROAS
          </div>
          <p className={`text-2xl font-bold ${summary!.roas >= 3 ? 'text-green-600' : summary!.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
            {summary!.roas}x
          </p>
          <p className="text-xs text-gray-400 mt-1">Return on Ad Spend</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <ShoppingCart size={16} />
            Conversion
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary!.conversion_rate}%</p>
          <p className="text-xs text-gray-400 mt-1">Click to Order</p>
        </div>
      </div>

      {/* Spend & Sales Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 text-orange-100 text-sm mb-2">
            <DollarSign size={16} />
            Total Ad Spend
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary!.total_spend)}</p>
          <p className="text-sm text-orange-200 mt-1">{summary!.campaigns_count} campaigns</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 text-green-100 text-sm mb-2">
            <TrendingUp size={16} />
            Ad-Attributed Sales
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary!.total_ad_sales)}</p>
          <p className="text-sm text-green-200 mt-1">{summary!.total_orders} orders from ads</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
            <Eye size={16} />
            Performance
          </div>
          <p className="text-3xl font-bold">{formatNumber(summary!.total_impressions)}</p>
          <p className="text-sm text-blue-200 mt-1">
            {formatNumber(summary!.total_clicks)} clicks • CTR {summary!.ctr}%
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'campaigns', label: 'Campaigns' },
          { id: 'skus', label: 'SKU Performance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-orange-600 text-orange-600'
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
          {/* Metrics Explanation */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Understanding Your Ad Metrics</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="text-orange-600" size={18} />
                  <span className="font-medium text-gray-900">TACOS (Total Ad Cost of Sales)</span>
                </div>
                <p className="text-sm text-gray-600">
                  Ad spend ÷ Total revenue = {summary!.tacos}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  How much of your total revenue goes to advertising. Lower is better. Target: &lt;15%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-orange-600" size={18} />
                  <span className="font-medium text-gray-900">ACOS (Ad Cost of Sales)</span>
                </div>
                <p className="text-sm text-gray-600">
                  Ad spend ÷ Ad-attributed sales = {summary!.acos}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  How efficiently your ads convert to sales. Lower is better. Target: &lt;30%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-green-600" size={18} />
                  <span className="font-medium text-gray-900">ROAS (Return on Ad Spend)</span>
                </div>
                <p className="text-sm text-gray-600">
                  Ad-attributed sales ÷ Ad spend = {summary!.roas}x
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  For every ₹1 spent on ads, you earn ₹{summary!.roas}. Higher is better. Target: &gt;3x
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ad Performance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Cost Per Click (CPC)</span>
                <span className="font-medium text-gray-900">₹{summary!.cpc}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Click-Through Rate (CTR)</span>
                <span className="font-medium text-gray-900">{summary!.ctr}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Impressions</span>
                <span className="font-medium text-gray-900">{formatNumber(summary!.total_impressions)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Clicks</span>
                <span className="font-medium text-gray-900">{formatNumber(summary!.total_clicks)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Orders from Ads</span>
                <span className="font-medium text-gray-900">{summary!.total_orders}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">SKUs Advertised</span>
                <span className="font-medium text-gray-900">{summary!.skus_advertised}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Campaign Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Campaign</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Spend</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">ACOS</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">ROAS</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Impressions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Clicks</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">CTR</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((campaign, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.ad_type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      ₹{campaign.spend.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      ₹{campaign.sales.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.acos > 30 ? 'bg-red-100 text-red-700' :
                        campaign.acos > 20 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {campaign.acos}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {campaign.roas}x
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {campaign.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {campaign.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {campaign.ctr}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {campaign.profitable ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <TrendingUp size={14} />
                          <span className="text-xs">Profitable</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <TrendingDown size={14} />
                          <span className="text-xs">Needs Work</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SKU Performance Tab */}
      {activeTab === 'skus' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">SKU Ad Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Spend</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">ACOS</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">ROAS</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Impressions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Clicks</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Orders</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {skuPerformance.map((sku, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{sku.sku}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{sku.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      ₹{sku.spend.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      ₹{sku.sales.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sku.acos > 30 ? 'bg-red-100 text-red-700' :
                        sku.acos > 20 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {sku.acos}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {sku.roas}x
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {sku.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {sku.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {sku.orders}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sku.profitable ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <TrendingUp size={14} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <AlertCircle size={14} />
                        </span>
                      )}
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
