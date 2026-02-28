import { useState, useEffect } from 'react';
import {
  IndianRupee,
  Search,
  Upload,
  Download,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit3,
  X,
} from 'lucide-react';
import {
  getCOGSExport,
  updateProductCOGS,
  bulkUpdateCOGS,
  importCOGSCSV,
  type COGSProduct,
} from '../api';

const COMPANY_ID = 1;

export default function COGSPage() {
  const [products, setProducts] = useState<COGSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedCosts, setEditedCosts] = useState<Record<number, number>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getCOGSExport(COMPANY_ID);
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (productId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedCosts(prev => ({ ...prev, [productId]: numValue }));
  };

  const handleSaveSingle = async (productId: number) => {
    const newCost = editedCosts[productId];
    if (newCost === undefined) return;

    try {
      await updateProductCOGS(productId, newCost);
      setProducts(prev =>
        prev.map(p =>
          p.product_id === productId
            ? {
                ...p,
                unit_cost: newCost,
                estimated_margin: p.current_price > 0
                  ? Math.round(((p.current_price - newCost) / p.current_price) * 100 * 100) / 100
                  : 0,
              }
            : p
        )
      );
      setEditedCosts(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      setMessage({ type: 'success', text: 'COGS updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update COGS' });
    }
  };

  const handleSaveAll = async () => {
    const items = Object.entries(editedCosts).map(([id, cost]) => ({
      product_id: parseInt(id),
      unit_cost: cost,
    }));

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'No changes to save' });
      return;
    }

    setSaving(true);
    try {
      await bulkUpdateCOGS(items);
      await loadProducts();
      setEditedCosts({});
      setMessage({ type: 'success', text: `Updated COGS for ${items.length} products` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await importCOGSCSV(file);
      setMessage({
        type: 'success',
        text: `${res.data.message}${res.data.not_found_count > 0 ? ` (${res.data.not_found_count} SKUs not found)` : ''}`,
      });
      await loadProducts();
      setEditedCosts({});
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to import CSV',
      });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleExportCSV = () => {
    const headers = ['sku', 'asin', 'title', 'current_price', 'unit_cost'];
    const rows = products.map(p => [
      p.sku,
      p.asin,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      p.current_price,
      p.unit_cost,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cogs_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(
    p =>
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.asin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasChanges = Object.keys(editedCosts).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">COGS Management</h1>
          <p className="text-gray-500">Manage Cost of Goods Sold for each product</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save All ({Object.keys(editedCosts).length})
            </button>
          )}
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by SKU, ASIN, or Title..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Import CSV */}
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
            <Upload size={18} />
            Import CSV
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={saving}
            />
          </label>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* CSV Format Hint */}
        <p className="text-xs text-gray-500 mt-3">
          CSV format: <code className="bg-gray-100 px-1 rounded">sku,unit_cost</code> or{' '}
          <code className="bg-gray-100 px-1 rounded">product_id,unit_cost</code>
        </p>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">SKU</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Product</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Price</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm w-36">
                  COGS (₹)
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Margin</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => {
                const isEdited = editedCosts[product.product_id] !== undefined;
                const displayCost = isEdited ? editedCosts[product.product_id] : product.unit_cost;
                const calculatedMargin =
                  product.current_price > 0
                    ? Math.round(((product.current_price - displayCost) / product.current_price) * 100 * 100) / 100
                    : 0;

                return (
                  <tr
                    key={product.product_id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${
                      isEdited ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-700">{product.sku || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-gray-900 line-clamp-1">{product.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{product.asin}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-gray-700">
                        ₹{product.current_price.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IndianRupee size={14} className="text-gray-400" />
                        <input
                          type="number"
                          value={displayCost}
                          onChange={e => handleCostChange(product.product_id, e.target.value)}
                          className={`w-24 text-right px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isEdited ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                          }`}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          calculatedMargin >= 30
                            ? 'text-green-600'
                            : calculatedMargin >= 15
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {calculatedMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEdited && (
                        <button
                          onClick={() => handleSaveSingle(product.product_id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {!isEdited && (
                        <span className="p-1.5 text-gray-300">
                          <Edit3 size={18} />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
              {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Products with COGS Set</p>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.unit_cost > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Average Margin</p>
          <p className="text-2xl font-bold text-blue-600">
            {products.length > 0
              ? (products.reduce((acc, p) => acc + p.estimated_margin, 0) / products.length).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to use COGS Management</h3>
        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
          <li>Edit COGS directly in the table by typing in the input field</li>
          <li>Click the checkmark to save individual products, or "Save All" for bulk changes</li>
          <li>
            Import from CSV: Create a file with columns <code className="bg-blue-100 px-1 rounded">sku,unit_cost</code>
          </li>
          <li>Export to CSV to get current values and edit in a spreadsheet</li>
          <li>Margin is calculated as: (Price - COGS) / Price × 100</li>
        </ul>
      </div>
    </div>
  );
}
