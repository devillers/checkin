// app/sejour/[userId]/[propertyId]/page.js

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarDays,
  MapPin,
  Users,
  Home,
  Sparkles,
  ShieldCheck,
  Wifi,
  ArrowUpRight
} from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { connectDB } from '@/lib/mongodb';

const FALLBACK_GALLERY = [
  {
    url: 'https://images.pexels.com/photos/1571469/pexels-photo-1571469.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: "Salon lumineux d'un appartement contemporain",
  },
  {
    url: 'https://images.pexels.com/photos/1125134/pexels-photo-1125134.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Chambre cosy avec décoration épurée',
  },
  {
    url: 'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Cuisine moderne équipée',
  },
  {
    url: 'https://images.pexels.com/photos/278209/pexels-photo-278209.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Salle de bain design',
  },
  {
    url: 'https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: "Extérieur d'une propriété de charme",
  },
];

const FALLBACK_HOST_AVATAR =
  'https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2';

const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url ?? '');

export async function fetchMiniSiteData(userIdParam, propertyParam) {
  const userId = typeof userIdParam === 'string' ? userIdParam.trim() : '';
  const propertyId = typeof propertyParam === 'string' ? propertyParam.trim() : '';

  if (!propertyId) {
    return null;
  }

  const { db } = await connectDB();

  const propertyQuery = {
    ...(userId ? { userId } : {}),
    $or: [
      { id: propertyId },
      { slug: propertyId },
      { 'onlinePresence.slug': propertyId },
    ],
  };

  const property = await db.collection('properties').findOne(propertyQuery);

  if (!property) {
    return null;
  }

  const resolvedUserId = property.userId || userId;
  const host = resolvedUserId ? await db.collection('users').findOne({ id: resolvedUserId }) : null;

  const { _id, ...propertyData } = property;
  const safeProperty = {
    ...propertyData,
    amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities : [],
    descriptionPhotos: Array.isArray(propertyData.descriptionPhotos)
      ? propertyData.descriptionPhotos
      : [],
  };

  let safeHost = null;

  if (host) {
    const { _id: hostObjectId, password, hashedPassword, passwordHash, ...hostRest } = host;
    safeHost = hostRest;
  }

  return {
    property: safeProperty,
    host: safeHost,
  };
}

export async function generateMetadata({ params }) {
  const data = await fetchMiniSiteData(params.userId, params.propertyId);

  if (!data?.property) {
    return {
      title: 'Séjour introuvable | Checkinly',
      description: "Le séjour demandé n'est plus disponible.",
    };
  }

  const { property, host } = data;
  const hostName = host ? [host.firstName, host.lastName].filter(Boolean).join(' ') : '';
  const description = property.description
    ? property.description.slice(0, 155)
    : `Réservez un séjour dans ${property.name}`;

  return {
    title: `${property.name}${hostName ? ` – ${hostName}` : ''} | Séjour Checkinly`,
    description,
  };
}

function buildHeroImage(property) {
  if (property?.descriptionPhotos?.length) {
    return property.descriptionPhotos[0]?.url ?? FALLBACK_GALLERY[0].url;
  }

  if (property?.profilePhoto?.url) {
    return property.profilePhoto.url;
  }

  return FALLBACK_GALLERY[0].url;
}

function buildGallery(property) {
  if (property?.descriptionPhotos?.length) {
    return property.descriptionPhotos;
  }

  return FALLBACK_GALLERY;
}

function buildMediaCategories(property) {
  if (!property?.medias?.categories) {
    return [];
  }

  return property.medias.categories
    .map((category, index) => {
      const order = Number.isFinite(category?.order) ? Number(category.order) : index * 10;
      const mediaItems = Array.isArray(category?.media) ? category.media : [];
      const visibleMedia = mediaItems
        .filter((item) => item?.url && !item.hidden)
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

      return {
        ...category,
        order,
        media: visibleMedia,
      };
    })
    .filter((category) => category.media.length > 0 || category.videoUrl)
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

function buildHighlightCards(property) {
  return [
    {
      icon: Users,
      label: 'Voyageurs',
      value: property?.maxGuests ? `${property.maxGuests} voyageurs` : 'Capacité personnalisable',
    },
    {
      icon: Home,
      label: 'Type de logement',
      value: property?.type
        ? property.type.charAt(0).toUpperCase() + property.type.slice(1)
        : 'À définir',
    },
    {
      icon: CalendarDays,
      label: 'Séjours flexibles',
      value: 'Réservations sur mesure',
    },
  ];
}

function formatHostName(host) {
  if (!host) {
    return 'Votre hôte';
  }

  const parts = [host.firstName, host.lastName].filter(Boolean);

  return parts.length ? parts.join(' ') : host.company || 'Votre hôte';
}

function buildCta(property, host) {
  const mailto = host?.email
    ? `mailto:${host.email}?subject=${encodeURIComponent(`Demande de séjour – ${property.name}`)}`
    : '#demande-reservation';
  const href = property.bookingUrl || property.airbnbUrl || mailto;
  const label = property.bookingUrl
    ? 'Réserver maintenant'
    : property.airbnbUrl
    ? 'Voir sur Airbnb'
    : "Contacter l'hôte";
  const target = property.bookingUrl || property.airbnbUrl ? '_blank' : undefined;

  return { href, label, target };
}

function extractIcalUrl(property) {
  if (!property) {
    return '';
  }

  if (property.calendar?.icalUrl) {
    return property.calendar.icalUrl;
  }

  if (property.icalUrl) {
    return property.icalUrl;
  }

  if (property.settings?.icalUrl) {
    return property.settings.icalUrl;
  }

  if (Array.isArray(property.calendarIntegrations)) {
    const integration = property.calendarIntegrations.find((item) => item?.type === 'ical');
    if (integration?.url) {
      return integration.url;
    }
  }

  if (Array.isArray(property.calendarConnections)) {
    const connection = property.calendarConnections.find((item) => item?.type === 'ical');
    if (connection?.url) {
      return connection.url;
    }
  }

  return '';
}

export default async function MiniSitePage({ params }) {
  const data = await fetchMiniSiteData(params.userId, params.propertyId);

  if (!data?.property) {
    notFound();
  }

  const { property, host } = data;
  const heroImage = buildHeroImage(property);
  const gallery = buildGallery(property);
  const highlightCards = buildHighlightCards(property);
  const mediaCategories = buildMediaCategories(property);
  const hostName = formatHostName(host);
  const cta = buildCta(property, host);
  const icalUrl = extractIcalUrl(property);
  const updatedAt = property.updatedAt ? new Date(property.updatedAt) : null;
  const formattedUpdate =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? format(updatedAt, 'd MMMM yyyy', { locale: fr })
      : null;
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const shortDescription =
    property.shortDescription ||
    property.general?.shortDescription ||
    (property.description ? property.description.slice(0, 160) : '');
  const formattedAddress =
    property.formattedAddress ||
    property.address?.formatted ||
    (typeof property.address === 'string' ? property.address : '');
  const cityLabel = property.address?.city || formattedAddress || property.name;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={property.name || 'Propriété'}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-white">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Checkinly Séjours
          </Link>
          <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/50">
              <Image
                src={host?.profilePhoto?.url || FALLBACK_HOST_AVATAR}
                alt={hostName}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div className="text-sm leading-tight">
              <p className="font-semibold">{hostName}</p>
              {host?.email && <p className="text-white/80">{host.email}</p>}
            </div>
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 text-white md:pt-24">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              Séjour sélectionné
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{property.name}</h1>


            {shortDescription && (
              <p className="max-w-2xl text-lg text-white/80">{shortDescription}</p>
            )}


            <div className="flex flex-wrap gap-3">
              {highlightCards.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur"
                >
                  <item.icon className="h-5 w-5" />
                  <div>
                    <p className="text-white/70">{item.label}</p>
                    <p className="font-semibold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {amenities.length > 0 && (
              <div className="rounded-3xl bg-white/10 p-6 shadow-lg backdrop-blur">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  Équipements essentiels
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-white/80">
                  {amenities.slice(0, 8).map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 font-medium shadow-sm backdrop-blur"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      {amenity}
                    </span>
                  ))}
                  {amenities.length > 8 && (
                    <span className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-white/70 backdrop-blur">
                      + {amenities.length - 8} autres
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={cta.href}
                target={cta.target}
                rel={cta.target === '_blank' ? 'noopener noreferrer' : undefined}
                className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-base"
              >
                {cta.label}
                <ArrowUpRight className="h-5 w-5" />
              </a>
              {cityLabel && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{cityLabel}</span>
                </div>
              )}
              {formattedUpdate && (
                <span className="text-sm text-white/70">Dernière mise à jour : {formattedUpdate}</span>
              )}
            </div>
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-16">
        <section className="grid gap-8 md:grid-cols-[4fr,1fr]">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Vivez une expérience mémorable</h2>
            <div className="text-gray-600">
              {property.shortDescription && (
              <p className="text-lg text-justify w-full">{property.shortDescription}</p>
            )}
            </div>
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>

       
        </section>

        {mediaCategories.length > 0 && (
          <section className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">Univers & ambiances</h2>
             
                 {property.description && (
              <p className="text-lg w-full text-justify text-gray-600 leading-loose">{property.description}</p>
            )}
              
            </div>
            <div className="space-y-12">
              {mediaCategories.map((category) => (
                <div
                  key={category.id || category.key || category.label}
                  className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft lg:p-8"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                        {category.label}
                      </p>
                      {category.title && (
                        <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                      )}
                      {category.shortDescription && (
                        <p className="text-sm text-gray-600">{category.shortDescription}</p>
                      )}
                    </div>
                    {category.videoUrl && (
                      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-900/5 lg:max-w-xl">
                        <AspectRatio ratio={16 / 9}>
                          {isDirectVideoUrl(category.videoUrl) ? (
                            <video src={category.videoUrl} controls className="h-full w-full object-cover" />
                          ) : (
                            <iframe
                              src={category.videoUrl}
                              title={`Vidéo ${category.label}`}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          )}
                        </AspectRatio>
                      </div>
                    )}
                  </div>

                  {category.media.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {category.media.map((media) => (
                        <figure
                          key={media.id || media.url}
                          className="group overflow-hidden rounded-2xl border border-gray-100 bg-white"
                        >
                          <div className="relative h-56 w-full bg-gray-100">
                            <Image
                              src={media.url}
                              alt={media.alt || `Photo ${category.label}`}
                              fill
                              sizes="(min-width: 1280px) 320px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <figcaption className="px-4 py-3">
                            {media.alt && (
                              <p className="text-sm font-medium text-gray-900">{media.alt}</p>
                            )}
                            {media.credit && (
                              <p className="mt-1 text-xs text-gray-500">© {media.credit}</p>
                            )}
                            {media.isCover && (
                              <p className="mt-2 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                                Photo mise en avant
                              </p>
                            )}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

   

        <section className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-soft">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Disponibilités & synchronisation</h2>
            </div>
            <p className="mt-3 text-gray-600">
              Connectez vos canaux (Airbnb, Booking.com, PMS, etc.) pour afficher automatiquement les disponibilités et
              éviter les doubles réservations. Ce module est prêt pour une intégration via API ou par import/export iCal.
            </p>

            <div className="mt-6 rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-6">
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-primary-600">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm">
                {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => {
                  const status =
                    day === 4 || day === 5 ? 'reserved' : day === 11 ? 'pending' : day === 18 ? 'blocked' : 'free';
                  return (
                    <span
                      key={day}
                      className={`flex h-10 items-center justify-center rounded-xl border text-sm font-medium ${
                        status === 'reserved'
                          ? 'border-danger-100 bg-danger-50 text-danger-600'
                          : status === 'pending'
                          ? 'border-warning-100 bg-warning-50 text-warning-700'
                          : status === 'blocked'
                          ? 'border-gray-200 bg-gray-100 text-gray-500'
                          : 'border-primary-100 bg-white text-primary-600'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-danger-50 px-3 py-1 text-danger-600">
                  <span className="h-2 w-2 rounded-full bg-danger-500" /> Réservé
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-warning-50 px-3 py-1 text-warning-700">
                  <span className="h-2 w-2 rounded-full bg-warning-500" /> Option
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-gray-400" /> Bloqué
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-primary-700">
                  <span className="h-2 w-2 rounded-full bg-primary-500" /> Disponible
                </span>
              </div>
            </div>

            {icalUrl ? (
              <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50/60 p-6 text-sm text-primary-800">
                <p className="font-semibold uppercase tracking-wide text-primary-600">Lien iCal connecté</p>
                <p className="mt-2 break-all font-mono text-xs text-primary-700">{icalUrl}</p>
                <p className="mt-2 text-primary-700">
                  Ce lien est prêt à être partagé avec vos partenaires pour synchroniser automatiquement les
                  disponibilités.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Connexion API</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Préparez l&apos;intégration avec Airbnb, Booking.com ou votre PMS via API. Vos réservations seront
                    synchronisées en temps réel.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Lien iCal</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Importez ou exportez des calendriers au format iCal en un clic. Les disponibilités resteront alignées
                    sur tous vos canaux.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-gray-200 bg-white p-8 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-primary-100">
                <Image
                  src={host?.profilePhoto?.url || FALLBACK_HOST_AVATAR}
                  alt={hostName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-primary-600">Hôte Checkinly</p>
                <p className="text-xl font-semibold text-gray-900">{hostName}</p>
                {host?.email && (
                  <a
                    href={`mailto:${host.email}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Contacter l'hôte
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            {host?.phone && <p className="mt-4 text-sm text-gray-600">Téléphone : {host.phone}</p>}
            <div className="mt-6 space-y-4 text-sm text-gray-600">
              <p>
                <span className="font-semibold text-gray-900">Accueil personnalisé :</span> check-in flexible, conseils
                sur mesure et assistance à tout moment.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Services complémentaires :</span> ménage hôtelier, panier de
                bienvenue, transferts.
              </p>
              <p className="flex items-center gap-2 text-primary-700">
                <Wifi className="h-4 w-4" />
                Wi-Fi haut débit inclus
              </p>
            </div>
          </aside>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Checkinly. Mini site généré automatiquement pour {hostName}.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact" className="hover:text-primary-600">
              Demander une démo
            </Link>
            <Link href="/fonctionnalites" className="hover:text-primary-600">
              Découvrir la plateforme
            </Link>
            <Link href="/tarifs" className="hover:text-primary-600">
              Tarifs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
