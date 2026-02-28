import { useState, useEffect } from 'react';
import { Package, Search, ChevronLeft, ChevronRight, X, TrendingUp, ShoppingCart, IndianRupee, Percent, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getProducts, getProductPerformance, type Product, type ProductPerformance } from '../api';

const COMPANY_ID = 1;
const ITEMS_PER_PAGE = 50;

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.asin?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [search, products]);

  const loadProducts = async () => {
    try {
      const res = await getProducts(COMPANY_ID);
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    setLoadingPerformance(true);
    try {
      const res = await getProductPerformance(product.id);
      setProductPerformance(res.data);
    } catch (error) {
      console.error('Error loading product performance:', error);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setProductPerformance(null);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">{products.length} products in catalog • Click any product to see performance</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by title, SKU, or ASIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ASIN</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Cost (Est.)</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedProducts.map((product) => (
              <tr 
                key={product.id} 
                className="hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => handleProductClick(product)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Package className="text-indigo-600" size={18} />
                    </div>
                    <div className="max-w-xs truncate">
                      <p className="font-medium text-gray-900 truncate hover:text-indigo-600">{product.title || 'Unknown'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.asin}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                  ₹{product.current_price?.toLocaleString('en-IN') || '0'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">
                  ₹{product.unit_cost?.toLocaleString('en-IN') || '0'}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {product.current_price && product.unit_cost 
                      ? `${(((product.current_price - product.unit_cost) / product.current_price) * 100).toFixed(0)}%`
                      : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">No products found</p>
        </div>
      )}

      {/* Product Performance Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{selectedProduct.title}</h2>
                <p className="text-sm text-gray-500">SKU: {selectedProduct.sku} • ASIN: {selectedProduct.asin}</p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingPerformance ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : productPerformance ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <IndianRupee size={16} />
                        <span className="text-xs font-medium uppercase">Total Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(productPerformance.performance.total_revenue)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <TrendingUp size={16} />
                        <span className="text-xs font-medium uppercase">Gross Profit</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(productPerformance.performance.gross_profit)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <ShoppingCart size={16} />
                        <span className="text-xs font-medium uppercase">Units Sold</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {productPerformance.performance.total_units.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <Percent size={16} />
                        <span className="text-xs font-medium uppercase">Profit Margin</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">
                        {productPerformance.performance.profit_margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-lg font-semibold text-gray-900">{productPerformance.performance.total_orders}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Avg Order Value</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(productPerformance.performance.avg_order_value)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Total COGS</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(productPerformance.performance.total_cost)}</p>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly Revenue Trend */}
                    {productPerformance.monthly_trend.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <BarChart3 size={16} />
                          Monthly Revenue Trend
                        </h3>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productPerformance.monthly_trend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                              <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => {
                                  const [year, month] = v.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-IN', { month: 'short' });
                                }}
                              />
                              <YAxis 
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                labelFormatter={(label) => {
                                  const [year, month] = label.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                                }}
                              />
                              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Order Status Breakdown */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Status Breakdown</h3>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Delivered', value: productPerformance.order_breakdown.delivered },
                                { name: 'Cancelled', value: productPerformance.order_breakdown.cancelled },
                                { name: 'Returned', value: productPerformance.order_breakdown.returned },
                                { name: 'Other', value: productPerformance.order_breakdown.other },
                              ].filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {COLORS.map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                              layout="vertical" 
                              align="right" 
                              verticalAlign="middle"
                              formatter={(value, entry) => (
                                <span className="text-xs text-gray-600">{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Summary */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-indigo-100 text-sm">Price</p>
                        <p className="font-bold text-lg">{formatCurrency(selectedProduct.current_price || 0)}</p>
                      </div>
                      <div>
                        <p className="text-indigo-100 text-sm">Est. Cost</p>
                        <p className="font-bold text-lg">{formatCurrency(selectedProduct.unit_cost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-indigo-100 text-sm">Profit per Unit</p>
                        <p className="font-bold text-lg">
                          {formatCurrency((selectedProduct.current_price || 0) - (selectedProduct.unit_cost || 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-100 text-sm">Lifetime Value</p>
                        <p className="font-bold text-lg">{formatCurrency(productPerformance.performance.gross_profit)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No performance data available for this product</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
