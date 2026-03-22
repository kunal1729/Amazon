import { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Loader2, MapPin, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { getGeoAnalytics, type StateAnalytics, type CityAnalytics } from '../api';

const COMPANY_ID = 1;

const INDIA_TOPO_JSON = 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json';

const STATE_NAME_MAP: Record<string, string> = {
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'ARUNACHAL PRADESH': 'Arunachal Pradesh',
  'ASSAM': 'Assam',
  'BIHAR': 'Bihar',
  'CHHATTISGARH': 'Chhattisgarh',
  'GOA': 'Goa',
  'GUJARAT': 'Gujarat',
  'HARYANA': 'Haryana',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'JHARKHAND': 'Jharkhand',
  'KARNATAKA': 'Karnataka',
  'KERALA': 'Kerala',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'MAHARASHTRA': 'Maharashtra',
  'MANIPUR': 'Manipur',
  'MEGHALAYA': 'Meghalaya',
  'MIZORAM': 'Mizoram',
  'NAGALAND': 'Nagaland',
  'ODISHA': 'Odisha',
  'PUNJAB': 'Punjab',
  'RAJASTHAN': 'Rajasthan',
  'SIKKIM': 'Sikkim',
  'TAMIL NADU': 'Tamil Nadu',
  'TELANGANA': 'Telangana',
  'TRIPURA': 'Tripura',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'UTTARAKHAND': 'Uttarakhand',
  'WEST BENGAL': 'West Bengal',
  'DELHI': 'NCT of Delhi',
  'JAMMU AND KASHMIR': 'Jammu & Kashmir',
  'LADAKH': 'Ladakh',
  'PUDUCHERRY': 'Puducherry',
  'CHANDIGARH': 'Chandigarh',
};

export default function GeoAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<StateAnalytics[]>([]);
  const [cities, setCities] = useState<CityAnalytics[]>([]);
  const [tooltipContent, setTooltipContent] = useState('');
  const [activeTab, setActiveTab] = useState<'map' | 'states' | 'cities'>('map');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getGeoAnalytics(COMPANY_ID);
      setStates(res.data.states);
      setCities(res.data.cities);
    } catch (error) {
      console.error('Error loading geo analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStateRevenue = (geoName: string): number => {
    const stateData = states.find(s => {
      const mappedName = STATE_NAME_MAP[s.state] || s.state;
      return mappedName.toLowerCase() === geoName.toLowerCase() ||
             s.state.toLowerCase() === geoName.toLowerCase();
    });
    return stateData?.revenue || 0;
  };

  const getStateData = (geoName: string): StateAnalytics | undefined => {
    return states.find(s => {
      const mappedName = STATE_NAME_MAP[s.state] || s.state;
      return mappedName.toLowerCase() === geoName.toLowerCase() ||
             s.state.toLowerCase() === geoName.toLowerCase();
    });
  };

  const maxRevenue = Math.max(...states.map(s => s.revenue), 1);

  const getColor = (revenue: number): string => {
    if (revenue === 0) return '#f3f4f6';
    const intensity = Math.min(revenue / maxRevenue, 1);
    if (intensity > 0.7) return '#059669';
    if (intensity > 0.4) return '#10b981';
    if (intensity > 0.2) return '#34d399';
    if (intensity > 0.1) return '#6ee7b7';
    return '#a7f3d0';
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const totalRevenue = states.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders = states.reduce((sum, s) => sum + s.orders, 0);
  const totalRefunds = states.reduce((sum, s) => sum + s.refunds, 0);
  const avgReturnRate = totalOrders > 0 ? (totalRefunds / totalOrders * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geo Analytics</h1>
          <p className="text-gray-500">State-wise and city-wise sales performance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <MapPin size={16} />
            States Covered
          </div>
          <p className="text-2xl font-bold text-gray-900">{states.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp size={16} />
            Total Revenue
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            Total Orders
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <RotateCcw size={16} />
            Avg Return Rate
          </div>
          <p className="text-2xl font-bold text-orange-600">{avgReturnRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'map', label: 'India Map' },
          { id: 'states', label: 'States' },
          { id: 'cities', label: 'Top Cities' },
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

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by State</h2>
          <div className="relative">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1000,
                center: [78.9629, 22.5937]
              }}
              style={{ width: '100%', height: '500px' }}
            >
              <ZoomableGroup>
                <Geographies geography={INDIA_TOPO_JSON}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties.NAME_1 || geo.properties.name;
                      const revenue = getStateRevenue(stateName);
                      const stateData = getStateData(stateName);
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getColor(revenue)}
                          stroke="#fff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: '#6366f1', cursor: 'pointer' },
                            pressed: { outline: 'none' }
                          }}
                          onMouseEnter={() => {
                            if (stateData) {
                              setTooltipContent(
                                `${stateData.state}: ${formatCurrency(stateData.revenue)} | ${stateData.orders} orders | ${stateData.return_rate}% returns`
                              );
                            } else {
                              setTooltipContent(`${stateName}: No data`);
                            }
                          }}
                          onMouseLeave={() => setTooltipContent('')}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
            {tooltipContent && (
              <div className="absolute top-4 left-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm">
                {tooltipContent}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-sm text-gray-500">Revenue:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100"></div>
              <span className="text-xs text-gray-500">No data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-200"></div>
              <span className="text-xs text-gray-500">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-400"></div>
              <span className="text-xs text-gray-500">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-600"></div>
              <span className="text-xs text-gray-500">High</span>
            </div>
          </div>
        </div>
      )}

      {/* States Tab */}
      {activeTab === 'states' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">State-wise Performance</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">State</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Refunds</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Return %</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {states.map((state, index) => (
                <tr key={state.state} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{state.state}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{state.orders}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{state.refunds}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      state.return_rate > 20 ? 'bg-red-100 text-red-700' :
                      state.return_rate > 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {state.return_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium">₹{state.revenue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                    ₹{state.net_revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cities Tab */}
      {activeTab === 'cities' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top 50 Cities by Revenue</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">City</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">State</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Return %</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cities.map((city, index) => (
                <tr key={`${city.city}-${city.state}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{city.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{city.state}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">{city.orders}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      city.return_rate > 20 ? 'bg-red-100 text-red-700' :
                      city.return_rate > 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {city.return_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium">₹{city.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
