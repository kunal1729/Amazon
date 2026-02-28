import { Warehouse, Upload, AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500">Track stock levels and manage inventory</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Warehouse className="text-amber-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold text-amber-900 mb-2">Inventory Tracking Coming Soon</h2>
        <p className="text-amber-700 max-w-md mx-auto mb-6">
          Upload your Amazon FBA Inventory Report to track stock levels, get low stock alerts, and manage reorder points.
        </p>
        
        <div className="bg-white rounded-lg p-6 max-w-lg mx-auto border border-amber-100">
          <h3 className="font-medium text-gray-900 mb-4">To enable inventory tracking:</h3>
          <ol className="text-left text-sm text-gray-600 space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-medium text-xs">1</span>
              <span>Go to Amazon Seller Central → Reports → Fulfillment</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-medium text-xs">2</span>
              <span>Download "FBA Manage Inventory" or "Inventory Health" report</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-medium text-xs">3</span>
              <span>Upload the file here (feature coming soon)</span>
            </li>
          </ol>
        </div>

        <button
          disabled
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-amber-200 text-amber-700 rounded-lg font-medium cursor-not-allowed opacity-60"
        >
          <Upload size={18} />
          Upload Inventory Report (Coming Soon)
        </button>
      </div>

      {/* What you'll get */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <Warehouse className="text-blue-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Stock Levels</h3>
          <p className="text-sm text-gray-500">
            See real-time inventory levels for all your FBA products
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
            <AlertTriangle className="text-amber-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Low Stock Alerts</h3>
          <p className="text-sm text-gray-500">
            Get notified when products are running low and need restocking
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
            <Upload className="text-green-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Reorder Planning</h3>
          <p className="text-sm text-gray-500">
            Calculate optimal reorder quantities based on sales velocity
          </p>
        </div>
      </div>
    </div>
  );
}
