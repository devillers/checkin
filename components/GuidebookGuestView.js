'use client';

import { MapPin, Trash2, Wifi, Utensils, Bike, Sparkles, Shield } from 'lucide-react';

const formatList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => item && item.trim().length > 0).map((item) => item.trim());
  }
  return String(value)
    .split(/\n|\r|;/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const formatDateTime = (value) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  } catch (error) {
    console.error('Failed to format guide date:', error);
    return null;
  }
};

export default function GuidebookGuestView({ guide, className = '', hideBranding = false }) {
  if (!guide) {
    return null;
  }

  const {
    propertyName,
    address,
    trashLocation,
    wifiName,
    wifiPassword,
    activities,
    restaurants,
    rentals,
    generatedAt
  } = guide;

  const formattedActivities = formatList(activities);
  const formattedRestaurants = formatList(restaurants);
  const formattedRentals = formatList(rentals);
  const formattedDate = formatDateTime(generatedAt);

  return (
    <div
      className={`overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-100/70 ${className}`}
    >
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 px-8 py-10 text-white">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <span className="text-sm uppercase tracking-widest text-white/80">
              Guide d'arrivée Checkinly
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Bienvenue à {propertyName || 'votre logement'}
          </h1>

          {formattedDate && (
            <p className="text-sm text-white/80">
              Dernière mise à jour : {formattedDate}
            </p>
          )}

          {address && (
            <div className="mt-2 flex items-center gap-2 text-base font-medium text-white">
              <MapPin className="h-5 w-5" />
              <span>{address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 bg-gradient-to-b from-white via-white to-gray-50 px-8 py-10">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Wifi className="h-5 w-5 text-primary-500" />
              Wifi et connexion
            </h2>
            <dl className="mt-4 space-y-2 text-sm text-gray-600">
              <div>
                <dt className="font-semibold text-gray-900">Nom du réseau</dt>
                <dd className="mt-1 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 font-mono text-primary-700">
                  {wifiName || 'À compléter'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Mot de passe</dt>
                <dd className="mt-1 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 font-mono text-primary-700">
                  {wifiPassword || 'À compléter'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Trash2 className="h-5 w-5 text-primary-500" />
              Gestion des déchets
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-600">
              {trashLocation ||
                "Indiquez à vos invités où se trouvent les poubelles extérieures et les consignes de tri."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-primary-500" />
            Choses à faire autour
          </h2>
          {formattedActivities.length > 0 ? (
            <ul className="mt-4 grid list-disc gap-2 pl-5 text-sm text-gray-600">
              {formattedActivities.map((activity, index) => (
                <li key={`activity-${index}`}>{activity}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-600">
              Ajoutez vos meilleures recommandations d'activités pour que vos invités profitent au maximum de leur
              séjour.
            </p>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Utensils className="h-5 w-5 text-primary-500" />
              Restaurants recommandés
            </h2>
            {formattedRestaurants.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                {formattedRestaurants.map((restaurant, index) => (
                  <li key={`restaurant-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-primary-400" />
                    <span>{restaurant}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Partagez vos bonnes adresses pour les repas, du petit déjeuner au dîner.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bike className="h-5 w-5 text-primary-500" />
              Location de vélos & skis
            </h2>
            {formattedRentals.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                {formattedRentals.map((rental, index) => (
                  <li key={`rental-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-primary-400" />
                    <span>{rental}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Indiquez où louer facilement du matériel pour explorer la région.
              </p>
            )}
          </div>
        </section>
      </div>

      {!hideBranding && (
        <div className="bg-gray-900/95 px-8 py-6 text-gray-200">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Checkinly</p>
          <p className="mt-1 text-sm text-gray-200">
            Ce guide numérique est généré depuis votre espace hôte Checkinly. Mettez-le à jour à tout moment pour vos
            invités.
          </p>
        </div>
      )}
    </div>
  );
}
