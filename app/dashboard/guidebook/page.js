'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  BookOpen,
  ClipboardCopy,
  Download,
  QrCode,
  Share2,
  Sparkles,
  Wand2
} from 'lucide-react';

import GuidebookGuestView from '@/components/GuidebookGuestView';

const initialFormState = {
  propertyName: '',
  address: '',
  trashLocation: '',
  wifiName: '',
  wifiPassword: '',
  activities: '',
  restaurants: '',
  rentals: ''
};

const REQUIRED_FIELDS = ['propertyName', 'address', 'wifiName', 'wifiPassword'];

const splitToList = (value) => {
  if (!value) return [];
  return value
    .split(/\n|\r|;/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const encodeGuideData = (guideData) => {
  const json = JSON.stringify(guideData);
  if (typeof window === 'undefined') {
    return '';
  }
  return window.btoa(unescape(encodeURIComponent(json)));
};

const buildGuestHtml = (guide) => {
  const listToHtml = (values) => {
    if (!values || values.length === 0) {
      return '<p style="color:#475569;font-size:14px;margin-top:12px">Informations à venir.</p>';
    }

    return `
      <ul style="margin-top:16px;padding-left:20px;color:#475569;font-size:14px;line-height:1.6">
        ${values.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    `;
  };

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Guide d'arrivée - ${guide.propertyName || 'Votre logement'}</title>
      <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin:0; padding:0; background:#f8fafc; color:#0f172a; }
        .container { max-width: 720px; margin: 0 auto; padding: 32px 20px 48px; }
        .card { background:white; border-radius:24px; box-shadow:0 20px 45px rgba(15, 23, 42, 0.08); overflow:hidden; border:1px solid rgba(148, 163, 184, 0.16); }
        .header { background: linear-gradient(135deg, #1d4ed8, #10b981); padding:48px 40px; color:white; position:relative; }
        .header::after { content:''; position:absolute; inset:0; background:radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 55%); opacity:0.45; }
        .badge { text-transform:uppercase; letter-spacing:0.4em; font-size:12px; color:rgba(255,255,255,0.75); }
        h1 { font-size:36px; margin:18px 0 0; position:relative; z-index:1; }
        .meta { font-size:14px; color:rgba(255,255,255,0.8); margin-top:8px; position:relative; z-index:1; }
        .address { display:flex; align-items:center; gap:10px; margin-top:18px; font-weight:600; font-size:16px; position:relative; z-index:1; }
        .content { padding:40px 40px 48px; background:linear-gradient(to bottom, white, #f8fafc); }
        .section { border:1px solid rgba(148, 163, 184, 0.18); border-radius:20px; padding:28px 24px; background:white; box-shadow:0 10px 30px rgba(15, 23, 42, 0.06); margin-bottom:28px; }
        .section h2 { margin:0; font-size:18px; display:flex; align-items:center; gap:10px; color:#0f172a; }
        .field { margin-top:18px; }
        .field dt { font-weight:600; font-size:14px; color:#0f172a; }
        .field dd { margin:8px 0 0; font-family:'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; background:#e0f2fe; color:#0c4a6e; padding:10px 14px; border-radius:12px; border:1px solid rgba(14, 165, 233, 0.25); }
        .footer { background:#0f172a; color:#cbd5f5; padding:24px 40px; font-size:13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <article class="card">
          <header class="header">
            <div class="badge">Guide d'arrivée Checkinly</div>
            <h1>Bienvenue à ${guide.propertyName || 'votre logement'}</h1>
            ${guide.generatedAt ? `<p class="meta">Dernière mise à jour : ${new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'long',
              timeStyle: 'short'
            }).format(new Date(guide.generatedAt))}</p>` : ''}
            ${guide.address ? `<p class="address">📍 ${guide.address}</p>` : ''}
          </header>
          <div class="content">
            <section class="section">
              <h2>🔐 Wifi et connexion</h2>
              <dl>
                <div class="field">
                  <dt>Nom du réseau</dt>
                  <dd>${guide.wifiName || 'À compléter'}</dd>
                </div>
                <div class="field">
                  <dt>Mot de passe</dt>
                  <dd>${guide.wifiPassword || 'À compléter'}</dd>
                </div>
              </dl>
            </section>

            <section class="section">
              <h2>🗑️ Gestion des déchets</h2>
              <p style="margin-top:16px;color:#475569;font-size:14px;line-height:1.6;white-space:pre-line;">
                ${guide.trashLocation ||
                  'Indiquez à vos invités où se trouvent les poubelles extérieures et les consignes de tri.'}
              </p>
            </section>

            <section class="section">
              <h2>✨ Choses à faire</h2>
              ${listToHtml(guide.activities)}
            </section>

            <section class="section">
              <h2>🍽️ Restaurants recommandés</h2>
              ${listToHtml(guide.restaurants)}
            </section>

            <section class="section">
              <h2>🚲 Location de vélos & skis</h2>
              ${listToHtml(guide.rentals)}
            </section>
          </div>
          <footer class="footer">
            Ce guide a été généré depuis Checkinly. Pensez à le mettre à jour pour vos prochains invités.
          </footer>
        </article>
      </div>
    </body>
  </html>`;
};

export default function GuidebookPage() {
  const [formState, setFormState] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [guideData, setGuideData] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');

  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (!token) {
      router.replace('/auth/login');
    }
  }, [router]);

  const hasResults = useMemo(() => Boolean(shareUrl && qrCodeDataUrl && guideData), [guideData, qrCodeDataUrl, shareUrl]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setFormState(initialFormState);
    setErrors({});
    setShareUrl('');
    setQrCodeDataUrl('');
    setGuideData(null);
    setHtmlContent('');
  };

  const handleGenerate = async () => {
    const validationErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!formState[field] || formState[field].trim().length === 0) {
        validationErrors[field] = 'Ce champ est obligatoire pour générer le guide.';
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        propertyName: formState.propertyName.trim(),
        address: formState.address.trim(),
        trashLocation: formState.trashLocation.trim(),
        wifiName: formState.wifiName.trim(),
        wifiPassword: formState.wifiPassword.trim(),
        activities: splitToList(formState.activities),
        restaurants: splitToList(formState.restaurants),
        rentals: splitToList(formState.rentals),
        generatedAt: new Date().toISOString()
      };

      const encoded = encodeGuideData(payload);
      const url = `${window.location.origin}/guidebook/view?data=${encodeURIComponent(encoded)}`;
      const qr = await QRCode.toDataURL(url, {
        margin: 1,
        width: 480,
        color: { dark: '#111827', light: '#ffffff' }
      });

      setGuideData(payload);
      setShareUrl(url);
      setQrCodeDataUrl(qr);
      setHtmlContent(buildGuestHtml(payload));
    } catch (error) {
      console.error('Failed to generate guidebook:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to copy guide link:', error);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `checkinly-guide-qr-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadHtml = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide-arrivee-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-2/5">
            <div className="rounded-3xl border border-primary-100 bg-white p-6 shadow-lg shadow-primary-950/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                    <BookOpen className="h-4 w-4" />
                    Guide d'arrivée
                  </div>
                  <h1 className="mt-4 text-2xl font-semibold text-gray-900">
                    Personnalisez votre guide digital
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Renseignez les informations clés de votre logement pour générer un guide numérique et son QR code à
                    partager avec vos invités.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="propertyName" className="block text-sm font-medium text-gray-800">
                    Nom du logement
                  </label>
                  <input
                    id="propertyName"
                    type="text"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      errors.propertyName ? 'border-danger-400' : 'border-gray-200'
                    }`}
                    value={formState.propertyName}
                    onChange={handleChange('propertyName')}
                    placeholder="Ex. Chalet des Cimes"
                  />
                  {errors.propertyName && (
                    <p className="mt-1 text-xs text-danger-500">{errors.propertyName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-800">
                    Adresse du logement
                  </label>
                  <input
                    id="address"
                    type="text"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      errors.address ? 'border-danger-400' : 'border-gray-200'
                    }`}
                    value={formState.address}
                    onChange={handleChange('address')}
                    placeholder="Ex. 12 Rue des Lilas, 75009 Paris"
                  />
                  {errors.address && <p className="mt-1 text-xs text-danger-500">{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="trashLocation" className="block text-sm font-medium text-gray-800">
                    Localisation des poubelles extérieures
                  </label>
                  <textarea
                    id="trashLocation"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    rows={3}
                    value={formState.trashLocation}
                    onChange={handleChange('trashLocation')}
                    placeholder="Expliquez où déposer les déchets et les consignes de tri."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="wifiName" className="block text-sm font-medium text-gray-800">
                      Nom du Wifi
                    </label>
                    <input
                      id="wifiName"
                      type="text"
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                        errors.wifiName ? 'border-danger-400' : 'border-gray-200'
                      }`}
                      value={formState.wifiName}
                      onChange={handleChange('wifiName')}
                      placeholder="Ex. CHECKINLY_GUEST"
                    />
                    {errors.wifiName && <p className="mt-1 text-xs text-danger-500">{errors.wifiName}</p>}
                  </div>

                  <div>
                    <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-800">
                      Mot de passe Wifi
                    </label>
                    <input
                      id="wifiPassword"
                      type="text"
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                        errors.wifiPassword ? 'border-danger-400' : 'border-gray-200'
                      }`}
                      value={formState.wifiPassword}
                      onChange={handleChange('wifiPassword')}
                      placeholder="Ex. BIENVENUE2024"
                    />
                    {errors.wifiPassword && (
                      <p className="mt-1 text-xs text-danger-500">{errors.wifiPassword}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="activities" className="block text-sm font-medium text-gray-800">
                    Choses à faire / Activités (1 par ligne)
                  </label>
                  <textarea
                    id="activities"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    rows={4}
                    value={formState.activities}
                    onChange={handleChange('activities')}
                    placeholder={'Ex.\n• Randonnée du Lac Bleu\n• Visite du centre historique'}
                  />
                </div>

                <div>
                  <label htmlFor="restaurants" className="block text-sm font-medium text-gray-800">
                    Restaurants recommandés (1 par ligne)
                  </label>
                  <textarea
                    id="restaurants"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    rows={4}
                    value={formState.restaurants}
                    onChange={handleChange('restaurants')}
                    placeholder={'Ex.\n• Le Bistro des Amis - cuisine locale\n• La Table du Marché - brunch'}
                  />
                </div>

                <div>
                  <label htmlFor="rentals" className="block text-sm font-medium text-gray-800">
                    Location de vélos & skis (1 par ligne)
                  </label>
                  <textarea
                    id="rentals"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    rows={4}
                    value={formState.rentals}
                    onChange={handleChange('rentals')}
                    placeholder={'Ex.\n• MountainRide - vélos électriques\n• SkiPro Shop - matériel de ski'}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-600/40 transition hover:bg-primary-700 disabled:opacity-70"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? 'Génération en cours...' : 'Générer le guide'}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <Wand2 className="h-4 w-4" />
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/5">
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-900/5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Share2 className="h-5 w-5 text-primary-500" /> Aperçu du guide
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Visualisez ce que vos invités verront en scannant le QR code ou en ouvrant le lien partagé.
                </p>

                <div className="mt-6">
                  {guideData ? (
                    <GuidebookGuestView guide={guideData} className="border border-gray-100" hideBranding />
                  ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center text-sm text-gray-500">
                      <BookOpen className="mb-3 h-10 w-10 text-gray-400" />
                      Remplissez les informations du logement pour générer automatiquement votre guide d'arrivée.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-primary-100 bg-white p-6 shadow-lg shadow-primary-900/10">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <QrCode className="h-5 w-5 text-primary-500" /> Partage & QR code
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Partagez le lien ou imprimez le QR code pour donner un accès immédiat au guide à vos invités.
                </p>

                {hasResults ? (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                      <Image
                        src={qrCodeDataUrl}
                        alt="QR code du guide"
                        width={192}
                        height={192}
                        className="h-48 w-48"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-gray-900/30 transition hover:bg-gray-800"
                      >
                        <Download className="h-4 w-4" /> Télécharger le QR code
                      </button>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-primary-100 bg-primary-50/70 p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
                          Lien du guide
                        </p>
                        <p className="mt-2 break-words rounded-xl bg-white/80 p-3 text-sm font-medium text-primary-800 shadow-sm">
                          {shareUrl}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
                        >
                          <ClipboardCopy className="h-4 w-4" /> Copier le lien
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadHtml}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-primary-600/40 transition hover:bg-primary-700"
                        >
                          <Download className="h-4 w-4" /> Télécharger la page HTML
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-6 text-center text-sm text-primary-700">
                    Générez votre guide pour afficher automatiquement le lien partageable et le QR code prêt à imprimer.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
   
  );
}
