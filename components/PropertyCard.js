'use client';

import Image from 'next/image';
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Eye,
  Calendar,
  Edit,
  Star,
  TrendingUp,
  Trash2,
  Link2,
  ImageIcon,
  Settings,
  Building2
} from 'lucide-react';
import { useMemo } from 'react';

const statusStyles = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-700'
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-700'
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-amber-100 text-amber-700'
  },
  unknown: {
    label: 'Inconnue',
    className: 'bg-gray-100 text-gray-700'
  }
};

const getPhotoSources = (photo) => {
  if (!photo) {
    return { url: '', thumbnail: '' };
  }

  if (typeof photo === 'string') {
    return { url: photo, thumbnail: photo };
  }

  if (typeof photo === 'object') {
    return {
      url: photo.url || '',
      thumbnail: photo.thumbnailUrl || photo.url || ''
    };
  }

  return { url: '', thumbnail: '' };
};

export default function PropertyCard({
  property,
  onEdit,
  onView,
  onCalendar,
  onSettings,
  onDelete
}) {
  const statusKey = property?.status?.toLowerCase();
  const status = statusStyles[statusKey] || statusStyles.unknown;

  const { url: profilePhotoUrl, thumbnail: profilePhotoThumbnail } =
    getPhotoSources(property?.profilePhoto);

  const locationLabel = useMemo(() => {
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
    const value = rawRating.toFixed(1).replace(/\.0$/, '');
    formattedRating = `${value}/5`;
  } else if (typeof rawRating === 'string' && rawRating.trim() !== '') {
    formattedRating = rawRating.includes('/5')
      ? rawRating
      : `${rawRating}/5`;
  }

  const handleView = () => {
    if (onView) {
      onView(property);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(property);
    }
  };

  const handleCalendar = () => {
    if (onCalendar) {
      onCalendar(property);
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings(property);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(property);
    }
  };

  return (
    <div className="group relative flex flex-col gap-6 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transform">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {profilePhotoUrl ? (
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={profilePhotoThumbnail}
                alt={`Photo de ${property?.name ?? 'la propriété'}`}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {property?.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">
                {locationLabel || 'Localisation non renseignée'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleView}
            className="inline-flex items-center gap-2 rounded-lg  px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-gray-500 dark:focus-visible:ring-offset-gray-900"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Voir
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-gray-500 dark:focus-visible:ring-offset-gray-900"
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
              Modifier
            </button>
          )}
          {onCalendar && (
            <button
              type="button"
              onClick={handleCalendar}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-gray-500 dark:focus-visible:ring-offset-gray-900"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Planning
            </button>
          )}
          {onSettings && (
            <button
              type="button"
              onClick={handleSettings}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-gray-500 dark:focus-visible:ring-offset-gray-900"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Paramètres
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-500 dark:focus-visible:ring-offset-gray-900"
              aria-label={`Supprimer le logement ${property?.name ?? ''}`}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200/80 p-4 text-center dark:border-gray-800">
          <div className="mb-2 flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {property?.maxGuests ?? '–'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Invités max</div>
        </div>
        <div className="rounded-xl border border-gray-200/80 p-4 text-center dark:border-gray-800">
          <div className="mb-2 flex items-center justify-center">
            <Bed className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {property?.bedrooms ?? '–'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Chambres</div>
        </div>
        <div className="rounded-xl border border-gray-200/80 p-4 text-center dark:border-gray-800">
          <div className="mb-2 flex items-center justify-center">
            <Bath className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {property?.bathrooms ?? '–'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">SdB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-200/80 pt-6 dark:border-gray-800 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200/80 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>CA total</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {formattedRevenue}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200/80 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Note moy.</span>
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {formattedRating}
          </div>
        </div>
      </div>

      {(property?.airbnbUrl || property?.bookingUrl) && (
        <div className="space-y-3 border-t border-gray-200/80 pt-6 dark:border-gray-800">
          <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Référencement
          </div>
          <div className="flex flex-wrap gap-2">
            {property?.airbnbUrl && (
              <a
                href={property.airbnbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 dark:focus-visible:ring-offset-gray-900"
              >
                Airbnb
              </a>
            )}
            {property?.bookingUrl && (
              <a
                href={property.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:focus-visible:ring-offset-gray-900"
              >
                Booking
              </a>
            )}
          </div>
        </div>
      )}

      {property?.descriptionPhotos?.length > 0 && (
        <div className="space-y-3 border-t border-gray-200/80 pt-6 dark:border-gray-800">
          <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <ImageIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Photos descriptives
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {property.descriptionPhotos.map((photo, index) => {
              const photoData =
                typeof photo === 'string'
                  ? { url: photo, thumbnailUrl: photo, publicId: photo }
                  : photo;

              if (!photoData?.url) {
                return null;
              }

              const key = photoData.publicId || `${photoData.url}-${index}`;

              return (
                <div
                  key={key}
                  className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    src={photoData.thumbnailUrl || photoData.url}
                    alt={`Photo ${index + 1} de ${property?.name ?? 'la propriété'}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {property?.description && (
        <div className="space-y-3 border-t border-gray-200/80 pt-6 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {property.description}
          </p>
        </div>
      )}
    </div>
  );
}
