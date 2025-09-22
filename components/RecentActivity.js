import { FileText, Users, CreditCard, CheckCircle, Clock } from 'lucide-react';

export default function RecentActivity({ activities = [] }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'inventory':
        return FileText;
      case 'guest':
        return Users;
      case 'deposit':
        return CreditCard;
      case 'checkin':
      case 'checkout':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'inventory':
        return 'text-primary-600 bg-primary-100';
      case 'guest':
        return 'text-success-600 bg-success-100';
      case 'deposit':
        return 'text-warning-600 bg-warning-100';
      case 'checkin':
      case 'checkout':
        return 'text-success-600 bg-success-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary-600" />
          Activité récente
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2 text-primary-600" />
        Activité récente
      </h2>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Voir toute l'activité
          </button>
        </div>
      )}
    </div>
  );
}