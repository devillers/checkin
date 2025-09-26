'use client';

import Image from 'next/image';
import { MapPin, Eye, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

export default function PropertyRow({
  property,
  onEdit,
  onView,
  onDelete
}) {
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

  const city = useMemo(() => {
    if (!property) {
      return '';
    }

    if (typeof property.address === 'string') {
      return property.address;
    }

    if (property.address?.city) {
      return property.address.city;
    }

    if (property.city) {
      return property.city;
    }

    if (property.formattedAddress) {
      return property.formattedAddress;
    }

    if (property.address?.formatted) {
      return property.address.formatted;
    }

    return property.address?.city || '';
  }, [property]);

  const revenue = property?.stats?.totalRevenue;
  let formattedRevenue = '–';
  if (typeof revenue === 'number') {
    formattedRevenue = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(revenue);
  } else if (typeof revenue === 'string' && revenue.trim() !== '') {
    formattedRevenue = revenue;
  }

  const rawRating = property?.stats?.averageRating;
  let formattedRating = '–';
  if (typeof rawRating === 'number') {
    formattedRating = `${rawRating.toFixed(1).replace(/\.0$/, '')}/5`;
  } else if (typeof rawRating === 'string' && rawRating.trim() !== '') {
    formattedRating = rawRating.includes('/5') ? rawRating : `${rawRating}/5`;
  }

  const handleView = () => {
    if (onView) {
      onView(property);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(property);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {profilePhotoUrl ? (
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={profilePhotoThumbnail}
                  alt={`Photo de ${property.name}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center">
                Aucune
                <br />
                photo
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{property.name}</h3>
                {property.status && (
                  <span className={`badge ${getStatusColor(property.status)}`}>
                    {getStatusText(property.status)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{city || 'Ville non renseignée'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-600">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">CA</div>
              <div className="text-base font-semibold text-gray-900">{formattedRevenue}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Classement</div>
              <div className="text-base font-semibold text-gray-900">{formattedRating}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button onClick={handleView} className="btn-secondary text-sm py-2 px-4">
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors"
                aria-label={`Supprimer le logement ${property.name}`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
