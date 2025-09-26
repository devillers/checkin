'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import GuidebookGuestView from '@/components/GuidebookGuestView';

const decodeGuideData = (encoded) => {
  if (!encoded) {
    return null;
  }

  try {
    const jsonString = decodeURIComponent(escape(window.atob(encoded)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decode guide data:', error);
    throw new Error('INVALID_GUIDE_DATA');
  }
};

export default function GuestGuideViewPage() {
  const searchParams = useSearchParams();
  const [guideData, setGuideData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const encoded = searchParams.get('data');
    if (!encoded) {
      setError('Aucun guide disponible pour ce lien.');
      return;
    }

    try {
      const parsed = decodeGuideData(encoded);
      setGuideData(parsed);
    } catch (err) {
      setError("Impossible de charger le guide d'arrivée. Le lien est peut-être expiré ou invalide.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="rounded-3xl border border-primary-100 bg-white/70 px-6 py-6 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-500">Checkinly</p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900">Votre guide d'arrivée</h1>
              <p className="text-sm text-gray-600">
                Retrouvez les informations utiles pour profiter pleinement de votre séjour.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
            >
              <Home className="h-4 w-4" /> Accéder au site
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-danger-100 bg-danger-50/60 p-6 text-danger-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold">Guide indisponible</h2>
                <p className="mt-2 text-sm">
                  {error}
                </p>
                <p className="mt-2 text-xs text-danger-600">
                  Vérifiez avec votre hôte si un nouveau QR code ou lien doit être généré.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <GuidebookGuestView guide={guideData} />
        )}
      </div>
    </div>
  );
}
