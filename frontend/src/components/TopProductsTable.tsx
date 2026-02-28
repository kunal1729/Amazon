import type { TopProduct } from '../api';

interface TopProductsTableProps {
  products: TopProduct[];
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-500 border-b border-gray-100">
              <th className="pb-3 pr-4">Product</th>
              <th className="pb-3 pr-4 text-right">Revenue</th>
              <th className="pb-3 pr-4 text-right">Units</th>
              <th className="pb-3 pr-4 text-right">Profit</th>
              <th className="pb-3 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.product_id}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500">{product.asin}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-right font-medium">
                  ₹{product.revenue.toLocaleString('en-IN')}
                </td>
                <td className="py-4 pr-4 text-right text-gray-600">
                  {product.units_sold}
                </td>
                <td className="py-4 pr-4 text-right">
                  <span
                    className={`font-medium ${
                      product.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ₹{product.profit.toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.profit_margin >= 20
                        ? 'bg-green-100 text-green-800'
                        : product.profit_margin >= 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.profit_margin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
