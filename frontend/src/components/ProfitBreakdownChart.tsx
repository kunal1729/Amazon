import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface TransactionFinancials {
  gross_sales: number;
  gross_shipping: number;
  total_refunds: number;
  net_revenue: number;
  selling_fees: number;
  fba_fees: number;
  other_fees: number;
  service_fees: number;
  total_fees: number;
  net_settlement: number;
  total_reimbursements: number;
  actual_cogs?: number;
  cogs_is_estimated?: boolean;
  true_profit?: number;
}

interface ProfitBreakdownChartProps {
  data: TransactionFinancials | null;
}

const COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

export default function ProfitBreakdownChart({ data }: ProfitBreakdownChartProps) {
  if (!data) return null;

  const grossRevenue = data.gross_sales + data.gross_shipping;
  
  const chartData = [
    { name: 'Refunds', value: data.total_refunds },
    { name: 'FBA Fees', value: data.fba_fees },
    { name: 'Service Fees', value: data.service_fees },
    { name: 'Other Fees', value: data.selling_fees + data.other_fees },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => `₹${value?.toLocaleString('en-IN')}`;
  
  // Format in lakhs for display
  const formatLakhs = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000)?.toFixed(2)}L`;
    }
    return `₹${value?.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Money Flow</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Gross Revenue</span>
          <span className="font-semibold text-gray-900">{formatLakhs(grossRevenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">- Refunds</span>
          <span className="font-semibold text-red-600">-{formatLakhs(data.total_refunds)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">- Total Fees</span>
          <span className="font-semibold text-red-600">-{formatLakhs(data.total_fees)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">+ Reimbursements</span>
          <span className="font-semibold text-green-600">+{formatLakhs(data.total_reimbursements)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="text-gray-700 font-medium">Net Settlement</span>
          <span className="font-bold text-green-700">{formatLakhs(data.net_settlement)}</span>
        </div>
        {data.actual_cogs !== undefined && data.actual_cogs > 0 && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">
                - COGS {data.cogs_is_estimated ? '(Est.)' : ''}
              </span>
              <span className="font-semibold text-red-600">-{formatLakhs(data.actual_cogs)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-gray-700 font-medium">True Profit</span>
              <span className={`font-bold ${(data.true_profit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatLakhs(data.true_profit || 0)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
