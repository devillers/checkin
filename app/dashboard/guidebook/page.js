'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clipboard, ExternalLink, Loader2, Plus, RefreshCcw, Trash2 } from 'lucide-react';

import CreateGuideModal from '@/components/CreateGuideModal';

function formatDate(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return '';
  }
}

export default function GuidebookPage() {
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [copyFeedbackId, setCopyFeedbackId] = useState(null);

  const fetchGuides = useCallback(async ({ showLoader = false } = {}) => {
    setError('');
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      const response = await fetch('/api/guides', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Réponse inattendue');
      }
      const data = await response.json();
      setGuides(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Unable to load guides', fetchError);
      setError("Impossible de charger les guides pour le moment.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGuides({ showLoader: true });
  }, [fetchGuides]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGuides();
  };

  const handleGuideCreated = useCallback(
    (guide) => {
      setGuides((prev) => {
        const next = prev.filter((item) => item._id !== guide._id);
        return [guide, ...next];
      });
    },
    []
  );

  const handleDelete = async (guideId) => {
    if (!guideId) return;
    const confirmed = window.confirm('Supprimer ce guide ? Cette action est définitive.');
    if (!confirmed) return;

    setDeletingId(guideId);
    try {
      const response = await fetch(`/api/guides/${guideId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        throw new Error('Suppression impossible');
      }
      setGuides((prev) => prev.filter((item) => item._id !== guideId));
    } catch (deleteError) {
      console.error('Unable to delete guide', deleteError);
      setError("Suppression impossible. Merci de réessayer.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = async (guide) => {
    try {
      await navigator.clipboard.writeText(guide.qrTargetUrl);
      setCopyFeedbackId(guide._id);
      setTimeout(() => setCopyFeedbackId(null), 2000);
    } catch (copyError) {
      console.error('Clipboard error', copyError);
      setError("Impossible de copier le lien. Copiez-le manuellement.");
    }
  };

  const sortedGuides = useMemo(() => {
    return [...guides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [guides]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-500">Guides d'arrivée</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Guidebook</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Créez des guides d'accueil partageables avec vos invités. Chaque guide dispose d'un QR code et d'un lien dédié.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Actualiser
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Créer un guide
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-20 flex justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-slate-600">Chargement des guides…</span>
            </div>
          </div>
        ) : sortedGuides.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Aucun guide pour le moment</h2>
            <p className="mt-2 text-sm text-slate-500">
              Créez votre premier guide pour partager toutes les informations essentielles avec vos invités.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau guide
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {sortedGuides.map((guide) => (
              <article
                key={guide._id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{guide.propertyName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{guide.address}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                      Créé le {formatDate(guide.createdAt)}
                    </p>
                  </div>
                  {guide.qrSvgDataUrl && (
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <Image
                        src={guide.qrSvgDataUrl}
                        alt={`QR code du guide ${guide.propertyName}`}
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={guide.qrTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(guide)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Clipboard className="h-4 w-4" />
                    {copyFeedbackId === guide._id ? 'Lien copié !' : 'Copier le lien'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(guide._id)}
                    disabled={deletingId === guide._id}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-500 transition hover:border-red-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === guide._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <CreateGuideModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleGuideCreated}
      />
    </div>
  );
}
