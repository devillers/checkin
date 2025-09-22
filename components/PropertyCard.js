'use client';

import { 
  Home, 
  MapPin, 
  Users, 
  Bed, 
  Bath,
  Settings,
  Eye,
  Calendar,
  Edit,
  MoreVertical,
  Star,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

export default function PropertyCard({ property, onEdit, onView, onCalendar, onSettings }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Inconnue';
    }
  };

  return (
    <div className="card hover-lift group relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {property.name}
            </h3>
            <span className={`badge ${getStatusColor(property.status)}`}>
              {getStatusText(property.status)}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
        </div>
        
        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    onView(property);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </button>
                <button
                  onClick={() => {
                    onEdit(property);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    onCalendar(property);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </button>
                <button
                  onClick={() => {
                    onSettings(property);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{property.maxGuests}</div>
          <div className="text-xs text-gray-600">Invités max</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Bed className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
          <div className="text-xs text-gray-600">Chambres</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Bath className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{property.bathrooms}</div>
          <div className="text-xs text-gray-600">SdB</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">CA total</span>
            <TrendingUp className="h-4 w-4 text-success-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {property.stats?.totalRevenue || 0}€
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Note moy.</span>
            <Star className="h-4 w-4 text-warning-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {property.stats?.averageRating ? `${property.stats.averageRating}/5` : '-'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => onView(property)}
          className="flex-1 btn-secondary text-sm py-2"
        >
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </button>
        <button
          onClick={() => onCalendar(property)}
          className="flex-1 btn-primary text-sm py-2"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Planning
        </button>
      </div>

      {/* Description */}
      {property.description && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            {property.description}
          </p>
        </div>
      )}
    </div>
  );
}