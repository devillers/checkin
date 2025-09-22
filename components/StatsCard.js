import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, color = 'primary', trend, trendDirection = 'up' }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="card hover-lift">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              {trendDirection === 'up' ? (
                <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger-600 mr-1" />
              )}
              <span className={`text-xs ${trendDirection === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}