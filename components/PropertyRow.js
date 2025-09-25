'use client';

import Image from 'next/image';
import {
  MapPin,
  Users,
  Bed,
  Bath,
  MoreVertical,
  Eye,
  Calendar,
  Edit,
  Settings,
  Trash2,
  Link2,
  TrendingUp,
  Star
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function PropertyRow({
  property,
  onEdit,
  onView,
  onCalendar,
  onSettings,
  onDelete
}) {
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

  const getPhotoUrl = (photo) => {
    if (!photo) {
      return '';
    }

    if (typeof photo === 'string') {
      return photo;
    }

    if (typeof photo === 'object') {
      return photo.url || '';
    }

    return '';
  };

  const getThumbnailUrl = (photo) => {
    if (!photo) {
      return '';
    }

    if (typeof photo === 'string') {
      return photo;
    }

    if (typeof photo === 'object') {
      return photo.thumbnailUrl || photo.url || '';
    }

    return '';
  };

  const profilePhotoUrl = getPhotoUrl(property.profilePhoto);
  const profilePhotoThumbnail = getThumbnailUrl(property.profilePhoto);

  const formattedAddress = useMemo(() => {
    if (!property) {
      return '';
    }

    if (typeof property.address === 'string') {
      return property.address;
    }

    if (property.formattedAddress) {
      return property.formattedAddress;
    }

    if (property.address?.formatted) {
      return property.address.formatted;
    }

    if (property.address && typeof property.address === 'object') {
      const { streetNumber, street, complement, postalCode, city, country } = property.address;
      return [
        [streetNumber, street].filter(Boolean).join(' '),
        complement,
        [postalCode, city].filter(Boolean).join(' '),
        country
      ]
        .filter(Boolean)
        .join(', ');
    }

    return '';
  }, [property]);

  const toggleDropdown = () => setShowDropdown((current) => !current);

  const handleAction = (callback) => {
    if (!callback) {
      return;
    }

    callback(property);
    setShowDropdown(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-100 transition-colors">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:gap-6 gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {profilePhotoUrl ? (
              <div className="relative w-28 h-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={profilePhotoThumbnail}
                  alt={`Photo de ${property.name}`}
                  fill
                  className="object-cover"
                  sizes="112px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-28 h-24 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Aucune photo
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{property.name}</h3>
                    <span className={`badge ${getStatusColor(property.status)}`}>
                      {getStatusText(property.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {formattedAddress || 'Adresse non renseignée'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{property.maxGuests ?? '-'}</span>
                    <span className="text-gray-400">invités max</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-gray-400" />
                    <span>{property.bedrooms ?? '-'}</span>
                    <span className="text-gray-400">chambres</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-gray-400" />
                    <span>{property.bathrooms ?? '-'}</span>
                    <span className="text-gray-400">salles de bain</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success-500" />
                    <span className="font-medium text-gray-900">
                      {property.stats?.totalRevenue || 0}€
                    </span>
                    <span className="text-gray-500">CA total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning-500" />
                    <span className="font-medium text-gray-900">
                      {property.stats?.averageRating ? `${property.stats.averageRating}/5` : '-'}
                    </span>
                    <span className="text-gray-500">Note moy.</span>
                  </div>
                </div>

                {(property.airbnbUrl || property.bookingUrl) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary-500" />
                    {property.airbnbUrl && (
                      <a
                        href={property.airbnbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        Airbnb
                      </a>
                    )}
                    {property.bookingUrl && (
                      <a
                        href={property.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        Booking
                      </a>
                    )}
                  </div>
                )}
              </div>

              {property.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {property.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-haspopup="true"
                aria-expanded={showDropdown}
                aria-label="Actions"
              >
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <button
                      onClick={() => handleAction(onView)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir détails
                    </button>
                    <button
                      onClick={() => handleAction(onEdit)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleAction(onCalendar)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Calendrier
                    </button>
                    <button
                      onClick={() => handleAction(onSettings)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => handleAction(onDelete)}
                        className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 w-52">
              <button
                onClick={() => onView && onView(property)}
                className="btn-secondary text-sm py-2"
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </button>
              <button
                onClick={() => onCalendar && onCalendar(property)}
                className="btn-primary text-sm py-2"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Planning
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
