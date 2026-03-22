import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { uploadOrders, uploadTransactions, uploadAds, clearAllData, getDataStats } from '../api';

interface SettingsPageProps {
  onNavigate: (tab: string) => void;
}

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ orders: number; products: number; transactions: number } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await getDataStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFileUpload = async (type: 'orders' | 'transactions' | 'ads', file: File) => {
    setUploading(type);
    setMessage(null);
    
    try {
      if (type === 'orders') {
        const res = await uploadOrders(file);
        setMessage({ type: 'success', text: res.data.message });
      } else if (type === 'transactions') {
        const res = await uploadTransactions(file);
        setMessage({ type: 'success', text: res.data.message });
      } else {
        const res = await uploadAds(file);
        setMessage({ type: 'success', text: res.data.message });
      }
      
      // Refresh stats
      const statsRes = await getDataStats();
      setStats(statsRes.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Upload failed' });
    } finally {
      setUploading(null);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete all data? This cannot be undone.')) return;
    
    setUploading('clear');
    try {
      await clearAllData();
      setMessage({ type: 'success', text: 'All data cleared successfully' });
      setStats({ orders: 0, products: 0, transactions: 0 });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear data' });
    } finally {
      setUploading(null);
    }
  };

  const handleDrop = (type: 'orders' | 'transactions' | 'ads') => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(type, file);
  };

  const handleFileSelect = (type: 'orders' | 'transactions' | 'ads') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(type, file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Upload your Amazon Seller data and manage settings</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          {message.type === 'success' && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Dashboard <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Upload Areas */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Orders Upload */}
        <div
          onDrop={handleDrop('orders')}
          onDragOver={(e) => e.preventDefault()}
          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-8 hover:border-indigo-400 transition-colors"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {uploading === 'orders' ? (
                <Loader2 className="text-indigo-600 animate-spin" size={28} />
              ) : (
                <FileText className="text-indigo-600" size={28} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Amazon Orders Report</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Upload your All Orders Report (.tsv)
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
              <Upload size={18} />
              Select File
              <input
                type="file"
                accept=".tsv,.csv,.txt"
                className="hidden"
                onChange={handleFileSelect('orders')}
                disabled={uploading !== null}
              />
            </label>
            <p className="text-xs text-gray-400 mt-3">or drag & drop here</p>
          </div>
        </div>

        {/* Transactions Upload */}
        <div
          onDrop={handleDrop('transactions')}
          onDragOver={(e) => e.preventDefault()}
          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-8 hover:border-purple-400 transition-colors"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {uploading === 'transactions' ? (
                <Loader2 className="text-purple-600 animate-spin" size={28} />
              ) : (
                <FileText className="text-purple-600" size={28} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Amazon Transactions Report</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Upload your Transaction Details (.csv)
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
              <Upload size={18} />
              Select File
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileSelect('transactions')}
                disabled={uploading !== null}
              />
            </label>
            <p className="text-xs text-gray-400 mt-3">or drag & drop here</p>
          </div>
        </div>

        {/* Ads Upload */}
        <div
          onDrop={handleDrop('ads')}
          onDragOver={(e) => e.preventDefault()}
          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-8 hover:border-orange-400 transition-colors"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {uploading === 'ads' ? (
                <Loader2 className="text-orange-600 animate-spin" size={28} />
              ) : (
                <FileText className="text-orange-600" size={28} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sponsored Products Report</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Upload your Ad Campaign Report (.csv)
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer">
              <Upload size={18} />
              Select File
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileSelect('ads')}
                disabled={uploading !== null}
              />
            </label>
            <p className="text-xs text-gray-400 mt-3">or drag & drop here</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to export from Amazon Seller Central</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Go to Amazon Seller Central → Reports</li>
          <li>For Orders: Reports → Fulfillment → All Orders → Request Download</li>
          <li>For Transactions: Reports → Payments → All Statements → Transaction Details</li>
          <li>For Ads: Advertising → Campaign Manager → Reports → Create Report (Search Term or Campaign)</li>
          <li>Download the files and upload them here</li>
        </ol>
      </div>

      {/* Data Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Current Data</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats?.orders ?? 0}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats?.products ?? 0}</p>
            <p className="text-sm text-gray-500">Products</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats?.transactions ?? 0}</p>
            <p className="text-sm text-gray-500">Transactions</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">
          Clear all uploaded data. This action cannot be undone.
        </p>
        <button
          onClick={handleClearData}
          disabled={uploading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {uploading === 'clear' ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          Clear All Data
        </button>
      </div>
    </div>
  );
}
