import { AlertTriangle } from 'lucide-react';
import type { Product } from '../api';

interface LowStockAlertProps {
  products: Product[];
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
        <div className="text-center py-8 text-gray-500">
          <p>All products are well stocked!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-yellow-500" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
        <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {products.length} items
        </span>
      </div>
      <div className="space-y-3">
        {products.slice(0, 5).map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.title}
              </p>
              <p className="text-xs text-gray-500">{product.sku}</p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm font-bold text-yellow-700">
                {product.current_stock} left
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
