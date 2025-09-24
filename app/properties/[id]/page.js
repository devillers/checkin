'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Copy,
  Play
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';

const PROPERTY_TYPE_LABELS = {
  apartment: 'Appartement',
  house: 'Maison',
  studio: 'Studio',
  villa: 'Villa',
  loft: 'Loft',
  room: 'Chambre',
  chalet: 'Chalet',
  bungalow: 'Bungalow'
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [miniSiteUrl, setMiniSiteUrl] = useState('');
  const [miniSiteDisplayUrl, setMiniSiteDisplayUrl] = useState('');
  const [isMiniSiteCopied, setIsMiniSiteCopied] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);

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
      ].filter(Boolean).join(', ');
    }

    return '';
  }, [property]);

  const operations = property?.operations || {};
  const depositText = useMemo(() => {
    if (!property) {
      return 'Non défini';
    }

    const deposit = operations.deposit || {};

    if (deposit.type === 'range') {
      if (deposit.min != null && deposit.max != null) {
        const methodLabel = deposit.method === 'virement' ? 'Virement' : 'Empreinte';
        return `${deposit.min} € - ${deposit.max} € (${methodLabel})`;
      }
      return 'Fourchette de caution non définie';
    }

    if (deposit.type === 'fixed' && deposit.amount != null) {
      const methodLabel = deposit.method === 'virement' ? 'Virement' : 'Empreinte';
      return `${deposit.amount} € (${methodLabel})`;
    }

    if (property.settings?.requireDeposit) {
      return `${property.settings.depositAmount ?? 0} €`;
    }

    return 'Non requis';
  }, [operations.deposit, property]);

  const checkInTime = operations.checkInTime || property?.settings?.checkInTime || 'Non défini';
  const checkOutTime = operations.checkOutTime || property?.settings?.checkOutTime || 'Non défini';
  const checkInModeLabel = operations.checkInMode === 'self'
    ? 'Autonome'
    : operations.checkInMode === 'in_person'
      ? 'En personne'
      : null;
  const checkOutModeLabel = operations.checkOutMode === 'self'
    ? 'Autonome'
    : operations.checkOutMode === 'in_person'
      ? 'En personne'
      : null;

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

      const fetchOwner = async () => {
        try {
          const response = await fetch('/api/profile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setOwnerProfile(data);
          }
        } catch (profileError) {
          console.error('Error fetching owner profile:', profileError);
        }
      };

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
        fetchOwner();
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
      const originUrl = `${window.location.origin}/sejour/${property.userId}/${property.id}`;
      setMiniSiteUrl(originUrl);

      const publicBaseUrl = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://sejour.checkinly.fr').replace(/\/$/, '');
      const slug = property.onlinePresence?.slug || property.slug;
      if (slug) {
        setMiniSiteDisplayUrl(`${publicBaseUrl}/${slug}`);
      } else {
        setMiniSiteDisplayUrl(`${publicBaseUrl}/${property.id}`);
      }
    }
  }, [property]);

  const heroPhoto = useMemo(() => {
    if (!property) {
      return null;
    }

    if (property.profilePhoto?.url) {
      return property.profilePhoto;
    }

    if (Array.isArray(property.descriptionPhotos)) {
      const heroInDescription = property.descriptionPhotos.find((photo) => photo?.isHero && photo?.url);
      if (heroInDescription) {
        return heroInDescription;
      }

      const firstDescriptionPhoto = property.descriptionPhotos.find((photo) => photo?.url);
      if (firstDescriptionPhoto) {
        return firstDescriptionPhoto;
      }
    }

    const categoryList = Array.isArray(property.medias?.categories) ? property.medias.categories : [];
    const firstCategoryWithMedia = categoryList.find((category) => Array.isArray(category.media) && category.media.some((media) => media?.url));
    if (firstCategoryWithMedia) {
      const firstVisibleMedia = firstCategoryWithMedia.media.find((media) => media?.url && !media.hidden);
      if (firstVisibleMedia) {
        return firstVisibleMedia;
      }
    }

    return null;
  }, [property]);

  const sortedCategories = useMemo(() => {
    const categoryList = Array.isArray(property?.medias?.categories) ? property.medias.categories : [];

    if (!Array.isArray(categoryList)) {
      return [];
    }

    return [...categoryList]
      .map((category) => ({
        ...category,
        media: Array.isArray(category.media)
          ? [...category.media].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
          : []
      }))
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
  }, [property]);

  const ownerName = useMemo(() => {
    if (!ownerProfile) {
      return '';
    }

    const parts = [ownerProfile.firstName, ownerProfile.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : ownerProfile.email;
  }, [ownerProfile]);

  const ownerInitials = useMemo(() => {
    if (!ownerProfile) {
      return '';
    }

    const initialsSource = ownerProfile.firstName || ownerProfile.lastName || ownerProfile.email || '';
    if (!initialsSource) {
      return '';
    }

    const matches = initialsSource
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase());

    if (matches.length >= 2) {
      return `${matches[0]}${matches[1]}`;
    }

    return matches[0] || initialsSource.charAt(0).toUpperCase();
  }, [ownerProfile]);

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
    const urlToCopy = miniSiteDisplayUrl || miniSiteUrl;

    if (!urlToCopy || typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(urlToCopy);
      setIsMiniSiteCopied(true);
      setTimeout(() => setIsMiniSiteCopied(false), 2000);
    } catch (copyError) {
      console.error('Failed to copy mini site URL:', copyError);
    }
  };

  const displayMiniSiteUrl = miniSiteDisplayUrl || miniSiteUrl;

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
            <div className="card overflow-hidden p-0">
              <div className="relative h-64 w-full sm:h-80">
                {heroPhoto?.url ? (
                  <Image
                    src={heroPhoto.url}
                    alt={heroPhoto.alt || `Photo principale de ${property.name}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 960px, (min-width: 768px) 80vw, 100vw"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 via-white to-primary-50 text-primary-600">
                    <Home className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4 flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-white/80 sm:h-16 sm:w-16">
                    {ownerProfile?.profile?.photoUrl ? (
                      <Image
                        src={ownerProfile.profile.photoUrl}
                        alt={ownerName || 'Photo du propriétaire'}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    ) : ownerInitials ? (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-700">
                        {ownerInitials}
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-700">
                        <Home className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="text-white drop-shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Propriétaire</p>
                    <p className="text-base font-semibold">
                      {ownerName || 'Votre profil'}
                    </p>
                    {ownerProfile?.profile?.jobTitle && (
                      <p className="text-xs text-white/70">{ownerProfile.profile.jobTitle}</p>
                    )}
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    property.status === 'inactive'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-success-500/90 text-white'
                  }`}>
                    {property.status === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </div>

                <div className="absolute bottom-6 left-4 right-4 text-white drop-shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1">
                      <Home className="h-4 w-4" />
                      {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1">
                      <Users className="h-4 w-4" />
                      {property.maxGuests} invité(s)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms} chambre(s)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms} salle(s) de bain
                    </span>
                  </div>
                  <h1 className="text-2xl font-semibold sm:text-3xl">{property.name}</h1>
                  {(property.shortDescription || property.description) && (
                    <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
                      {property.shortDescription || property.description}
                    </p>
                  )}
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
                      <code className="block truncate rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-800">{displayMiniSiteUrl}</code>
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
                      <p className="text-gray-600">{formattedAddress || 'Adresse non renseignée'}</p>
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
                    {checkInTime}
                    {checkInModeLabel && (
                      <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                        {checkInModeLabel}
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Check-out :</span>{' '}
                    {checkOutTime}
                    {checkOutModeLabel && (
                      <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                        {checkOutModeLabel}
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary-600" />
                    <span>
                      Code d&apos;accès : {property.settings?.accessCode || 'Non défini'}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Dépôt :</span>{' '}
                    {depositText}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Frais de ménage :</span>{' '}
                    {property.settings?.cleaningFee != null
                      ? `${property.settings.cleaningFee} €`
                      : 'Non défini'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${operations.smokingAllowed ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {operations.smokingAllowed ? 'Fumeurs acceptés' : 'Non fumeurs'}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${operations.petsAllowed ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {operations.petsAllowed ? 'Animaux acceptés' : 'Animaux interdits'}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${operations.partiesAllowed ? 'bg-warning-100 text-warning-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {operations.partiesAllowed ? 'Fêtes autorisées' : 'Fêtes interdites'}
                    </span>
                  </div>
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

            {sortedCategories.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Galeries photos par catégorie</h2>
                <p className="text-sm text-gray-600">
                  Retrouvez toutes les photos classées par univers pour mettre en valeur votre bien et partager une expérience immersive avec vos voyageurs.
                </p>
                <div className="space-y-6">
                  {sortedCategories.map((category) => {
                    const visibleMedia = category.media.filter((media) => media?.url && !media.hidden);

                    if (visibleMedia.length === 0) {
                      return null;
                    }

                    return (
                      <div key={category.id || category.key} className="card space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{category.label}</p>
                            {category.title && (
                              <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                            )}
                            {category.shortDescription && (
                              <p className="mt-2 text-sm text-gray-600">{category.shortDescription}</p>
                            )}
                          </div>
                          {category.videoUrl && (
                            <a
                              href={category.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-3 py-1 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                            >
                              <Play className="h-4 w-4" />
                              Voir la vidéo
                            </a>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleMedia.map((media) => (
                            <figure
                              key={media.id || media.url}
                              className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                            >
                              <div className="relative h-56 w-full bg-gray-100">
                                <Image
                                  src={media.url}
                                  alt={media.alt || `Photo de ${category.label}`}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  sizes="(min-width: 1280px) 320px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                  unoptimized
                                />
                              </div>
                              <figcaption className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">{media.alt}</p>
                                {media.credit && (
                                  <p className="mt-1 text-xs text-gray-500">© {media.credit}</p>
                                )}
                                {media.isCover && (
                                  <p className="mt-2 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                                    Photo de couverture
                                  </p>
                                )}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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

