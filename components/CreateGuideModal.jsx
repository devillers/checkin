'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { nanoid } from 'nanoid';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function sanitizeLines(value) {
  if (!value) return [];
  return value
    .split('\n')
    .map((line) => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

function createEmptyRecommendation() {
  return {
    id: nanoid(8),
    title: '',
    content: '',
    linkLabel: '',
    linkUrl: '',
  };
}

function toTrimmedString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function getPropertyNameValue(property) {
  if (!property) return '';

  const candidates = [property.name, property.general?.name, property.general?.title];

  for (const candidate of candidates) {
    const name = toTrimmedString(candidate);
    if (name) {
      return name;
    }
  }

  return '';
}

function getPropertyDisplayName(property) {
  const name = getPropertyNameValue(property);
  return name || 'Logement sans nom';
}

function formatPropertyAddress(property) {
  if (!property) return '';

  const candidates = [
    property.formattedAddress,
    property.addressLabel,
    typeof property.address === 'string' ? property.address : undefined,
    property.address?.formatted,
  ];

  for (const candidate of candidates) {
    const value = toTrimmedString(candidate);
    if (value) {
      return value;
    }
  }

  const address = property.address;
  if (address && typeof address === 'object') {
    const streetLine = [toTrimmedString(address.streetNumber), toTrimmedString(address.street)]
      .filter(Boolean)
      .join(' ')
      .trim();
    const complement = toTrimmedString(address.complement);
    const postalCity = [toTrimmedString(address.postalCode), toTrimmedString(address.city)]
      .filter(Boolean)
      .join(' ')
      .trim();
    const country = toTrimmedString(address.country);

    const parts = [streetLine, complement, postalCity, country].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  const fallbackCity = toTrimmedString(property.city ?? property.address?.city);
  return fallbackCity;
}

function extractWifiCredentials(property) {
  if (!property) {
    return { name: '', password: '' };
  }

  const nameCandidates = [
    property.general?.wifi?.name,
    property.general?.wifiName,
    property.wifi?.name,
    property.wifiName,
  ];

  const passwordCandidates = [
    property.general?.wifi?.password,
    property.general?.wifiPassword,
    property.wifi?.password,
    property.wifiPassword,
  ];

  let wifiName = '';
  for (const candidate of nameCandidates) {
    const value = toTrimmedString(candidate);
    if (value) {
      wifiName = value;
      break;
    }
  }

  let wifiPassword = '';
  for (const candidate of passwordCandidates) {
    const value = toTrimmedString(candidate);
    if (value) {
      wifiPassword = value;
      break;
    }
  }

  return { name: wifiName, password: wifiPassword };
}

export default function CreateGuideModal({ open, onClose, onCreated }) {
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [trashLocation, setTrashLocation] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGuide, setCreatedGuide] = useState(null);
  const [copied, setCopied] = useState(false);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  const dialogRef = useRef(null);

  const resetForm = useCallback(() => {
    setPropertyName('');
    setAddress('');
    setTrashLocation('');
    setWifiName('');
    setWifiPassword('');
    setRecommendations([]);
    setErrors({});
    setServerError('');
    setIsSubmitting(false);
    setCreatedGuide(null);
    setCopied(false);
    setSelectedPropertyId('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    if (onClose) {
      onClose();
    }
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const activeElement = document.activeElement;
    const node = dialogRef.current;
    if (!node) {
      return () => {};
    }

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea',
      'input',
      'select',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const focusable = Array.from(node.querySelectorAll(focusableSelectors.join(',')));
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key === 'Tab') {
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (activeElement && typeof activeElement.focus === 'function') {
        activeElement.focus();
      }
    };
  }, [open, createdGuide, handleClose]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const addRecommendation = () => {
    setRecommendations((prev) => [...prev, createEmptyRecommendation()]);
  };

  const removeRecommendation = (id) => {
    setRecommendations((prev) => prev.filter((item) => item.id !== id));
  };

  const moveRecommendation = (id, direction) => {
    setRecommendations((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      updated.splice(newIndex, 0, removed);
      return updated;
    });
  };

  const updateRecommendationField = (id, field, value) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let isCancelled = false;

    const loadProperties = async () => {
      setPropertiesLoading(true);
      setPropertiesError('');

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;

        if (!token) {
          throw new Error('Impossible de charger vos logements. Veuillez vous reconnecter.');
        }

        const response = await fetch('/api/properties', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json().catch(() => {
          throw new Error('Réponse invalide du serveur.');
        });

        if (!response.ok) {
          throw new Error(data?.message || 'Impossible de récupérer vos logements.');
        }

        if (!isCancelled) {
          setProperties(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!isCancelled) {
          setPropertiesError(error.message || 'Impossible de récupérer vos logements.');
        }
      } finally {
        if (!isCancelled) {
          setPropertiesLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      isCancelled = true;
    };
  }, [open]);

  const sortedProperties = useMemo(() => {
    return properties
      .filter((property) => property && property.id !== null && property.id !== undefined)
      .slice()
      .sort((a, b) => {
        const nameA = getPropertyDisplayName(a);
        const nameB = getPropertyDisplayName(b);
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });
  }, [properties]);

  const handlePropertySelect = useCallback(
    (event) => {
      const propertyId = event.target.value;
      setSelectedPropertyId(propertyId);

      if (!propertyId) {
        return;
      }

      const property = properties.find((item) => String(item?.id) === propertyId);
      if (!property) {
        return;
      }

      const name = getPropertyNameValue(property);
      const formattedAddress = formatPropertyAddress(property);
      const { name: wifiNetwork, password: wifiPass } = extractWifiCredentials(property);

      setPropertyName(name);
      setAddress(formattedAddress);
      setWifiName(wifiNetwork);
      setWifiPassword(wifiPass);

      setErrors((prev) => {
        if (!prev || Object.keys(prev).length === 0) {
          return prev;
        }

        const nextErrors = { ...prev };
        delete nextErrors.propertyName;
        delete nextErrors.address;
        delete nextErrors.wifiName;
        delete nextErrors.wifiPassword;
        return nextErrors;
      });
    },
    [properties]
  );

  const handleCopyLink = async () => {
    if (!createdGuide) return;
    try {
      await navigator.clipboard.writeText(createdGuide.qrTargetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  };

  const handleDownloadQr = () => {
    if (!createdGuide?.qrSvgDataUrl) return;
    const link = document.createElement('a');
    link.href = createdGuide.qrSvgDataUrl;
    link.download = `guide-${createdGuide.qrToken}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const preparedRecommendations = useMemo(
    () =>
      recommendations
        .map((item) => {
          const title = item.title.trim();
          const lines = sanitizeLines(item.content);

          let link;
          const linkUrl = item.linkUrl.trim();
          const linkLabel = item.linkLabel.trim();

          if (linkUrl) {
            try {
              const validatedUrl = new URL(linkUrl);
              link = { url: validatedUrl.toString() };
              if (linkLabel) {
                link.label = linkLabel.slice(0, 80);
              }
            } catch (error) {
              link = undefined;
            }
          }

          return {
            id: item.id || nanoid(8),
            title,
            lines,
            link,
          };
        })
        .filter((item) => item.title.length >= 2 && (item.lines.length > 0 || item.link?.url)),
    [recommendations]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setServerError('');
    setErrors({});

    const payload = {
      propertyName,
      address,
      trashLocation,
      wifiName,
      wifiPassword,
      recommendations: preparedRecommendations,
    };

    try {
      const response = await fetch('/api/guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.errors) {
          setErrors(data.errors);
        } else if (data?.message) {
          setServerError(data.message);
        } else {
          setServerError("Une erreur est survenue lors de la création du guide.");
        }
        return;
      }

      const guide = await response.json();
      setCreatedGuide(guide);
      setErrors({});
      if (typeof onCreated === 'function') {
        onCreated(guide);
      }
    } catch (error) {
      console.error('Guide creation failed', error);
      setServerError("Impossible de créer le guide pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 py-8"
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-guide-title"
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">Guide d'arrivée</p>
            <h2 id="create-guide-title" className="mt-2 text-2xl font-semibold text-slate-900">
              Créer un nouveau guide
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Renseignez les informations indispensables pour accueillir vos invités.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="sr-only">Fermer</span>
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          {createdGuide ? (
            <div className="space-y-6">
              <div className="rounded-2xl bg-slate-50 p-6">
                <h3 className="text-lg font-medium text-slate-900">Guide créé avec succès !</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Partagez le lien ou téléchargez le QR code pour vos invités.
                </p>
                <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="created-guide-link">
                  Lien du guide
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="created-guide-link"
                    type="text"
                    readOnly
                    value={createdGuide.qrTargetUrl}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={classNames(
                      'rounded-xl border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      copied
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {copied ? 'Lien copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              {createdGuide.qrSvgDataUrl && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <Image
                    src={createdGuide.qrSvgDataUrl}
                    alt="QR code du guide"
                    width={192}
                    height={192}
                    unoptimized
                    className="h-48 w-48"
                  />
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Télécharger le QR code
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="existingProperty" className="block text-sm font-medium text-slate-700">
                    Sélectionnez un logement existant
                  </label>
                  <select
                    id="existingProperty"
                    name="existingProperty"
                    value={selectedPropertyId}
                    onChange={handlePropertySelect}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={propertiesLoading}
                  >
                    <option value="">— Choisissez un logement —</option>
                    {sortedProperties.map((property) => {
                      const optionValue = String(property.id);
                      return (
                        <option key={optionValue} value={optionValue}>
                          {getPropertyDisplayName(property)}
                        </option>
                      );
                    })}
                  </select>
                  {propertiesLoading && (
                    <p className="mt-2 text-xs text-slate-500">Chargement des logements…</p>
                  )}
                  {!propertiesLoading && sortedProperties.length === 0 && !propertiesError && (
                    <p className="mt-2 text-xs text-slate-500">Aucun logement enregistré pour le moment.</p>
                  )}
                  {propertiesError && <p className="mt-2 text-xs text-red-500">{propertiesError}</p>}
                </div>
                <div>
                  <label htmlFor="propertyName" className="block text-sm font-medium text-slate-700">
                    Nom du logement
                  </label>
                  <input
                    id="propertyName"
                    name="propertyName"
                    value={propertyName}
                    onChange={(event) => setPropertyName(event.target.value)}
                    className={classNames(
                      'mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',
                      errors.propertyName
                        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400'
                        : 'border-slate-200 text-slate-700 placeholder-slate-400'
                    )}
                    placeholder="Villa Horizon"
                    required
                    minLength={2}
                  />
                  {errors.propertyName && (
                    <p className="mt-1 text-xs text-red-500">{errors.propertyName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                    Adresse
                  </label>
                  <input
                    id="address"
                    name="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className={classNames(
                      'mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',
                      errors.address
                        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400'
                        : 'border-slate-200 text-slate-700 placeholder-slate-400'
                    )}
                    placeholder="12 rue des Pins, Annecy"
                    required
                    minLength={2}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>
                <div>
                  <label htmlFor="wifiName" className="block text-sm font-medium text-slate-700">
                    Nom du Wi-Fi
                  </label>
                  <input
                    id="wifiName"
                    name="wifiName"
                    value={wifiName}
                    onChange={(event) => setWifiName(event.target.value)}
                    className={classNames(
                      'mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',
                      errors.wifiName
                        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400'
                        : 'border-slate-200 text-slate-700 placeholder-slate-400'
                    )}
                    placeholder="Maison_Horizon"
                    required
                    minLength={2}
                  />
                  {errors.wifiName && <p className="mt-1 text-xs text-red-500">{errors.wifiName}</p>}
                </div>
                <div>
                  <label htmlFor="wifiPassword" className="block text-sm font-medium text-slate-700">
                    Mot de passe Wi-Fi
                  </label>
                  <input
                    id="wifiPassword"
                    name="wifiPassword"
                    value={wifiPassword}
                    onChange={(event) => setWifiPassword(event.target.value)}
                    className={classNames(
                      'mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',
                      errors.wifiPassword
                        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400'
                        : 'border-slate-200 text-slate-700 placeholder-slate-400'
                    )}
                    placeholder="horizon2024"
                    required
                    minLength={2}
                  />
                  {errors.wifiPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.wifiPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="trashLocation" className="block text-sm font-medium text-slate-700">
                  Localisation des poubelles (optionnel)
                </label>
                <textarea
                  id="trashLocation"
                  name="trashLocation"
                  value={trashLocation}
                  onChange={(event) => setTrashLocation(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Conteneurs verts au bout de l'allée, collecte le mardi et vendredi."
                />
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Bloc D — Recommandations personnalisées</p>
                    <p className="text-xs text-slate-500">
                      Ajoutez vos bonnes adresses et conseils pour vos voyageurs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRecommendation}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Ajouter une catégorie
                  </button>
                </div>

                {errors.recommendations && (
                  <p className="text-xs text-red-500">{errors.recommendations}</p>
                )}

                {recommendations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Aucune recommandation pour le moment. Cliquez sur “Ajouter une catégorie”.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((item, index) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">Catégorie {index + 1}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveRecommendation(item.id, -1)}
                              disabled={index === 0}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="sr-only">Monter</span>↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRecommendation(item.id, 1)}
                              disabled={index === recommendations.length - 1}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="sr-only">Descendre</span>↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRecommendation(item.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:border-red-300 hover:text-red-600"
                            >
                              <span className="sr-only">Supprimer</span>×
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Titre de la catégorie
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(event) => updateRecommendationField(item.id, 'title', event.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Activités incontournables"
                              required
                              minLength={2}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Contenu (1 élément par ligne)
                            </label>
                            <textarea
                              value={item.content}
                              onChange={(event) => updateRecommendationField(item.id, 'content', event.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              rows={4}
                              placeholder={'• Balade au bord du lac\n• Marché local le samedi'}
                            />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Lien (URL)
                              </label>
                              <input
                                type="url"
                                value={item.linkUrl}
                                onChange={(event) => updateRecommendationField(item.id, 'linkUrl', event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="https://monbonplan.fr"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Libellé du lien (optionnel)
                              </label>
                              <input
                                type="text"
                                value={item.linkLabel}
                                onChange={(event) => updateRecommendationField(item.id, 'linkLabel', event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Voir sur Google Maps"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {serverError && <p className="text-sm text-red-500">{serverError}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={classNames(
                    'rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    isSubmitting ? 'opacity-60' : 'hover:bg-blue-700'
                  )}
                >
                  {isSubmitting ? 'Création en cours…' : 'Créer le guide'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
