'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  MapPin,
  Users,
  Bed,
  Bath,
  Settings,
  Calendar,
  Key,
  Globe,
  Link2,
  Copy
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const PROPERTY_TYPE_LABELS = {
  apartment: 'Appartement',
  house: 'Maison',
  studio: 'Studio',
  villa: 'Villa',
  loft: 'Loft',
  room: 'Chambre'
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [miniSiteUrl, setMiniSiteUrl] = useState('');
  const [isMiniSiteCopied, setIsMiniSiteCopied] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        return;
      }

      const token = localStorage.getItem('auth-token');

      if (!token) {
        router.replace('/auth/login');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          router.replace('/auth/login');
          return;
        }

        if (!response.ok) {
          const message = response.status === 404
            ? 'Propriété introuvable'
            : 'Impossible de charger la propriété';
          setError(message);
          return;
        }

        const data = await response.json();
        setProperty(data);
      } catch (err) {
        console.error('Error loading property:', err);
        setError('Impossible de charger la propriété');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, router]);

  useEffect(() => {
    if (property?.id && property?.userId && typeof window !== 'undefined') {
      setMiniSiteUrl(`${window.location.origin}/sejour/${property.userId}/${property.id}`);
    }
  }, [property]);

  const handleGoBack = () => {
    router.push('/properties');
  };

  const handleOpenSettings = () => {
    if (property?.id) {
      router.push(`/properties/${property.id}/settings`);
    }
  };

  const handleOpenCalendar = () => {
    if (property?.id) {
      router.push(`/dashboard/calendrier?property=${property.id}`);
    }
  };

  const handlePublish = () => {
    if (miniSiteUrl) {
      window.open(miniSiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyMiniSiteUrl = async () => {
    if (!miniSiteUrl || typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(miniSiteUrl);
      setIsMiniSiteCopied(true);
      setTimeout(() => setIsMiniSiteCopied(false), 2000);
    } catch (copyError) {
      console.error('Failed to copy mini site URL:', copyError);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux propriétés
          </button>

          {property && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCalendar}
                className="btn-secondary inline-flex items-center"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendrier
              </button>
              <button
                onClick={handlePublish}
                disabled={!miniSiteUrl}
                className="btn-secondary inline-flex items-center border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                <Globe className="mr-2 h-4 w-4" />
                Publier
              </button>
              <button
                onClick={handleOpenSettings}
                className="btn-primary inline-flex items-center"
              >
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="card flex h-64 items-center justify-center">
            <div className="loading-spinner" />
          </div>
        ) : error ? (
          <div className="card border-danger-200 bg-danger-50 text-danger-700">
            <p>{error}</p>
          </div>
        ) : property ? (
          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Home className="h-8 w-8 text-primary-600" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                      <p className="text-gray-600">{PROPERTY_TYPE_LABELS[property.type] ?? property.type}</p>
                    </div>
                  </div>
                  {property.description && (
                    <p className="mt-4 text-gray-600">{property.description}</p>
                  )}
                </div>
                <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-primary-700">
                  <p className="text-sm font-medium uppercase tracking-wide">Statut</p>
                  <p className="text-lg font-semibold">
                    {property.status === 'inactive' ? 'Inactive' : 'Active'}
                  </p>
                </div>
              </div>
            </div>

            {miniSiteUrl && (
              <div className="card bg-primary-50/40 border-primary-100">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-primary-700">
                      <Link2 className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Mini site de réservation</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900">Partagez votre lien de réservation</h2>
                    <p className="mt-2 text-gray-600">
                      Ce lien ouvre un mini site inspiré d&apos;Airbnb, prêt à être partagé avec vos voyageurs. Il accueillera vos futures synchronisations de calendriers (API ou lien iCal).
                    </p>
                  </div>
                  <div className="w-full max-w-md rounded-lg border border-primary-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Lien public</p>
                    <div className="mt-2 flex flex-col gap-2">
                      <code className="block truncate rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-800">{miniSiteUrl}</code>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePublish}
                          className="btn-primary inline-flex flex-1 items-center justify-center"
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          Ouvrir
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyMiniSiteUrl}
                          className="btn-secondary inline-flex items-center"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {isMiniSiteCopied ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Informations principales</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Adresse</p>
                      <p className="text-gray-600">{property.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="mt-1 h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Capacité maximale</p>
                      <p className="text-gray-600">{property.maxGuests} invité(s)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bed className="mt-1 h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Chambres</p>
                      <p className="text-gray-600">{property.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bath className="mt-1 h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Salles de bain</p>
                      <p className="text-gray-600">{property.bathrooms}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Paramètres rapides</h2>
                <div className="space-y-3 text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Check-in :</span>{' '}
                    {property.settings?.checkInTime || 'Non défini'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Check-out :</span>{' '}
                    {property.settings?.checkOutTime || 'Non défini'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary-600" />
                    <span>
                      Code d&apos;accès : {property.settings?.accessCode || 'Non défini'}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Dépôt :</span>{' '}
                    {property.settings?.requireDeposit
                      ? `${property.settings?.depositAmount ?? 0} €`
                      : 'Non requis'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Frais de ménage :</span>{' '}
                    {property.settings?.cleaningFee != null
                      ? `${property.settings.cleaningFee} €`
                      : 'Non défini'}
                  </p>
                </div>
              </div>
            </div>

            {(property.amenities?.length ?? 0) > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900">Équipements</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.stats && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Réservations</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {property.stats.totalBookings ?? 0}
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Revenus</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {property.stats.totalRevenue ?? 0} €
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {property.stats.averageRating ?? 0} / 5
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Taux d&apos;occupation</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {property.stats.occupancyRate ?? 0}%
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <p className="text-gray-600">Propriété introuvable.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

