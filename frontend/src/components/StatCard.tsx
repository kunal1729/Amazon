import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  prefix?: string;
  suffix?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
};

// Format large numbers in lakhs (L) format
const formatValue = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 100000) {
    return (value / 100000).toFixed(2) + 'L';
  } else if (absValue >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toLocaleString('en-IN');
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  prefix = '',
  suffix = '',
  color = 'blue',
}: StatCardProps) {
  const displayValue = typeof value === 'number' ? formatValue(value) : value;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1 truncate">
            {prefix}{displayValue}{suffix}
          </p>
          {trend !== undefined && (
            <p
              className={`text-xs mt-1 ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
