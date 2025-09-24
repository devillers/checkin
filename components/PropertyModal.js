'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Bath,
  Bed,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  GripVertical,
  Home,
  ImageIcon,
  Info,
  Key,
  Link2,
  Loader2,
  MapPin,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Ruler,
  Save,
  Search,
  Trash2,
  Upload,
  Users,
  X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'loft', label: 'Loft' },
  { value: 'chalet', label: 'Chalet' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'room', label: 'Chambre' }
];

const EQUIPMENT_OPTIONS = [
  'Wifi',
  'Parking',
  'Piscine',
  'Sauna',
  'Spa',
  'Cuisine équipée',
  'Climatisation',
  'Lave-linge',
  'Sèche-linge',
  'Balcon',
  'Terrasse',
  'Jardin',
  'Vue mer',
  'Cheminée',
  'Bureau',
  'Télétravail',
  'TV',
  'Netflix',
  'Lit bébé',
  'Chaise haute',
  'Stationnement gratuit',
  'Stationnement payant'
];

const DEFAULT_MEDIA_CATEGORIES = [
  { key: 'living', label: 'Séjour' },
  { key: 'kitchen', label: 'Cuisine' },
  { key: 'bedroom1', label: 'Chambre 1' },
  { key: 'bedroom2', label: 'Chambre 2' },
  { key: 'bathroom', label: 'Salle de bain' },
  { key: 'outdoor', label: 'Extérieur' },
  { key: 'view', label: 'Vue' },
  { key: 'plan', label: 'Plan' },
  { key: 'misc', label: 'Divers' }
];

const CHECK_MODES = [
  { value: 'self', label: 'Autonome' },
  { value: 'in_person', label: 'En personne' }
];

const DEPOSIT_METHODS = [
  { value: 'empreinte', label: 'Empreinte bancaire' },
  { value: 'virement', label: 'Virement' }
];

function createDefaultMediaCategories() {
  return DEFAULT_MEDIA_CATEGORIES.map((category, index) => ({
    id: uuidv4(),
    key: category.key,
    label: category.label,
    title: '',
    shortDescription: '',
    isCoverCategory: index === 0,
    order: index * 10,
    videoUrl: '',
    media: []
  }));
}

function createDefaultFormData() {
  return {
    general: {
      name: '',
      type: 'apartment',
      capacity: {
        adults: 2,
        children: 0
      },
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      surface: '',
      shortDescription: '',
      longDescription: ''
    },
    address: {
      streetNumber: '',
      street: '',
      complement: '',
      postalCode: '',
      city: '',
      country: 'France',
      latitude: null,
      longitude: null
    },
    onlinePresence: {
      airbnbUrl: '',
      bookingUrl: '',
      slug: ''
    },
    medias: {
      categories: createDefaultMediaCategories()
    },
    operations: {
      checkInTime: '15:00',
      checkInMode: 'self',
      checkOutTime: '11:00',
      checkOutMode: 'in_person',
      deposit: {
        type: 'fixed',
        amount: 300,
        min: '',
        max: '',
        method: 'empreinte'
      },
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      equipments: [],
      cityTax: {
        municipality: '',
        classification: '',
        registrationNumber: ''
      }
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImageId: ''
    }
  };
}

function generateSlug(name = '', city = '') {
  const base = `${name} ${city}`.trim() || name.trim();
  if (!base) {
    return '';
  }
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function formatAddress(address = {}) {
  const parts = [
    [address.streetNumber, address.street].filter(Boolean).join(' '),
    address.complement,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country
  ].filter(Boolean);
  return parts.join(', ');
}

function isNumericKey(key) {
  return typeof key === 'string' && /^\d+$/.test(key);
}

function setNestedValue(target, path, value) {
  const keys = Array.isArray(path) ? path : path.split('.');
  if (!keys.length) {
    return value;
  }

  const [first, ...rest] = keys;
  const key = isNumericKey(first) ? Number(first) : first;
  const clone = Array.isArray(target) ? [...target] : { ...target };

  if (rest.length === 0) {
    clone[key] = value;
    return clone;
  }

  const nextTarget = clone[key] !== undefined ? clone[key] : (isNumericKey(rest[0]) ? [] : {});
  clone[key] = setNestedValue(nextTarget, rest, value);
  return clone;
}

function mapPropertyToFormData(property) {
  const base = createDefaultFormData();

  if (!property) {
    return base;
  }

  const general = {
    ...base.general,
    ...property.general,
    name: property.general?.name || property.name || '',
    type: property.general?.type || property.type || 'apartment',
    capacity: {
      adults: property.general?.capacity?.adults ?? property.capacity?.adults ?? property.maxGuests ?? 2,
      children: property.general?.capacity?.children ?? property.capacity?.children ?? 0
    },
    bedrooms: property.general?.bedrooms ?? property.bedrooms ?? 1,
    beds: property.general?.beds ?? property.beds ?? property.bedrooms ?? 1,
    bathrooms: property.general?.bathrooms ?? property.bathrooms ?? 1,
    surface: property.general?.surface ?? property.surface ?? '',
    shortDescription: property.general?.shortDescription ?? property.shortDescription ?? property.description?.slice(0, 160) ?? '',
    longDescription: property.general?.longDescription ?? property.description ?? ''
  };

  const address = {
    ...base.address,
    ...(typeof property.address === 'object' ? property.address : {}),
    street: property.address?.street || property.address?.streetTypeAndName || '',
    formatted: property.formattedAddress || property.addressFormatted || property.address || ''
  };

  const onlinePresence = {
    ...base.onlinePresence,
    ...property.onlinePresence,
    airbnbUrl: property.onlinePresence?.airbnbUrl || property.airbnbUrl || '',
    bookingUrl: property.onlinePresence?.bookingUrl || property.bookingUrl || '',
    slug: property.onlinePresence?.slug || property.slug || generateSlug(general.name, address.city)
  };

  const existingCategories = property.medias?.categories;
  let categories = createDefaultMediaCategories();

  if (Array.isArray(existingCategories) && existingCategories.length > 0) {
    categories = existingCategories.map((category, index) => ({
      id: category.id || uuidv4(),
      key: category.key || `category-${index}`,
      label: category.label || category.name || `Catégorie ${index + 1}`,
      title: category.title || '',
      shortDescription: category.shortDescription || '',
      isCoverCategory: Boolean(category.isCoverCategory),
      order: category.order ?? index * 10,
      videoUrl: category.videoUrl || '',
      media: Array.isArray(category.media)
        ? category.media.map((item) => ({
            id: item.id || uuidv4(),
            url: item.url || '',
            thumbnailUrl: item.thumbnailUrl || '',
            alt: item.alt || item.description || general.name || 'Photo',
            isHero: Boolean(item.isHero),
            hidden: Boolean(item.hidden),
            credit: item.credit || '',
            isCover: Boolean(item.isCover)
          })).filter((item) => item.url)
        : []
    }));
  } else {
    const fallbackPhotos = Array.isArray(property.descriptionPhotos) ? property.descriptionPhotos : [];
    const fallbackCategory = categories[0];
    if (property.profilePhoto?.url) {
      fallbackCategory.media.push({
        id: uuidv4(),
        url: property.profilePhoto.url,
        thumbnailUrl: property.profilePhoto.thumbnailUrl || '',
        alt: property.profilePhoto.alt || `Photo de ${general.name}`,
        isHero: true,
        hidden: false,
        credit: property.profilePhoto.credit || '',
        isCover: true
      });
    }
    fallbackPhotos.forEach((photo) => {
      if (!photo?.url) {
        return;
      }
      fallbackCategory.media.push({
        id: uuidv4(),
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || '',
        alt: photo.alt || `Photo de ${general.name}`,
        isHero: false,
        hidden: false,
        credit: photo.credit || '',
        isCover: false
      });
    });
  }

  const operations = {
    ...base.operations,
    ...property.operations,
    checkInTime: property.operations?.checkInTime || property.settings?.checkInTime || '15:00',
    checkInMode: property.operations?.checkInMode || 'self',
    checkOutTime: property.operations?.checkOutTime || property.settings?.checkOutTime || '11:00',
    checkOutMode: property.operations?.checkOutMode || 'in_person',
    deposit: {
      ...base.operations.deposit,
      ...(property.operations?.deposit || {}),
      amount: property.operations?.deposit?.amount ?? property.settings?.depositAmount ?? 300,
      min: property.operations?.deposit?.min ?? '',
      max: property.operations?.deposit?.max ?? '',
      type: property.operations?.deposit?.type || (property.settings?.requireDeposit ? 'fixed' : 'fixed'),
      method: property.operations?.deposit?.method || (property.settings?.requireDeposit ? 'empreinte' : 'empreinte')
    },
    smokingAllowed: property.operations?.smokingAllowed ?? false,
    petsAllowed: property.operations?.petsAllowed ?? false,
    partiesAllowed: property.operations?.partiesAllowed ?? false,
    equipments: property.operations?.equipments || property.amenities || [],
    cityTax: {
      ...base.operations.cityTax,
      ...(property.operations?.cityTax || {})
    }
  };

  const seo = {
    ...base.seo,
    ...property.seo,
    metaTitle: property.seo?.metaTitle || '',
    metaDescription: property.seo?.metaDescription || general.shortDescription || '',
    ogImageId: property.seo?.ogImageId || ''
  };

  return {
    general,
    address,
    onlinePresence,
    medias: { categories },
    operations,
    seo
  };
}

function flattenMediaCategories(categories = []) {
  const allImages = [];

  categories
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((category) => {
      category.media
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .forEach((image) => {
          if (!image.url) {
            return;
          }
          allImages.push({
            ...image,
            categoryId: category.id,
            categoryKey: category.key
          });
        });
    });

  return { allImages };
}

export default function PropertyModal({ property, onClose, onSave }) {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCategory, setIsUploadingCategory] = useState({});
  const [removingMediaIds, setRemovingMediaIds] = useState({});
  const [activeSection, setActiveSection] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState('idle');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const autosaveTimeoutRef = useRef(null);
  const draftKeyRef = useRef('property-draft-new');

  useEffect(() => {
    const key = property ? `property-draft-${property.id}` : 'property-draft-new';
    draftKeyRef.current = key;

    const draftRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const draft = draftRaw ? JSON.parse(draftRaw) : null;

    const mapped = mapPropertyToFormData(property);
    const state = draft ? { ...mapped, ...draft } : mapped;

    setFormData(state);
    setErrors({});
    setHasUnsavedChanges(false);
    setIsSlugManual(Boolean(draft?.onlinePresence?.slug && draft.onlinePresence.slug !== generateSlug(mapped.general.name, mapped.address.city)));
  }, [property]);

  useEffect(() => {
    const handler = (event) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [hasUnsavedChanges]);

  const scheduleAutosave = useCallback((nextData) => {
    setHasUnsavedChanges(true);
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      setIsAutosaving(true);
      requestAnimationFrame(() => {
        try {
          localStorage.setItem(draftKeyRef.current, JSON.stringify(nextData));
        } catch (error) {
          console.error('Failed to persist draft:', error);
        }
        setIsAutosaving(false);
      });
    }, 800);
  }, []);

  useEffect(() => {
    if (isSlugManual) {
      return;
    }
    const autoSlug = generateSlug(formData.general.name, formData.address.city);
    if (autoSlug && autoSlug !== formData.onlinePresence.slug) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          onlinePresence: {
            ...prev.onlinePresence,
            slug: autoSlug
          }
        };
        scheduleAutosave(updated);
        return updated;
      });
    }
  }, [formData.general.name, formData.address.city, formData.onlinePresence.slug, isSlugManual, scheduleAutosave]);

  useEffect(() => {
    if (!formData.seo.metaTitle && formData.general.name) {
      setFormData((prev) => {
        const metaTitle = `${prev.general.name}${prev.address.city ? ` – ${prev.address.city}` : ''}`.trim();
        const updated = {
          ...prev,
          seo: {
            ...prev.seo,
            metaTitle
          }
        };
        scheduleAutosave(updated);
        return updated;
      });
    }
  }, [formData.general.name, formData.address.city, formData.seo.metaTitle, scheduleAutosave]);

  const updateField = useCallback((path, value) => {
    setFormData((prev) => {
      const updated = setNestedValue(prev, path, value);
      scheduleAutosave(updated);
      return updated;
    });
    if (errors[path]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    }
  }, [errors, scheduleAutosave]);

  const clearError = useCallback((path) => {
    setErrors((prev) => {
      if (!prev[path]) {
        return prev;
      }
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const handleCategoryUpload = async (categoryId, files) => {
    if (!files || files.length === 0) {
      return;
    }
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileArray.length === 0) {
      return;
    }

    setIsUploadingCategory((prev) => ({ ...prev, [categoryId]: true }));

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentification requise');
      }

      const uploads = [];
      for (const file of fileArray) {
        const payload = new FormData();
        payload.append('file', file);
        payload.append('folder', `properties/${property?.id || 'new'}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: payload
        });

        const result = await response.json();
        if (!response.ok || !result?.url) {
          throw new Error(result?.message || 'Erreur lors du téléversement');
        }

        uploads.push({
          id: uuidv4(),
          url: result.url,
          thumbnailUrl: result.thumbnailUrl || '',
          alt: '',
          isHero: false,
          hidden: false,
          credit: '',
          isCover: false
        });
      }

      setFormData((prev) => {
        const categories = prev.medias.categories.map((category) => {
          if (category.id !== categoryId) {
            return category;
          }
          return {
            ...category,
            media: [...category.media, ...uploads]
          };
        });
        const updated = {
          ...prev,
          medias: { categories }
        };
        scheduleAutosave(updated);
        return updated;
      });
    } catch (error) {
      console.error('Upload error:', error);
      setErrors((prev) => ({
        ...prev,
        [`medias.${categoryId}`]: error.message || 'Erreur de téléversement'
      }));
    } finally {
      setIsUploadingCategory((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleRemoveMedia = async (categoryId, mediaId, publicId) => {
    setRemovingMediaIds((prev) => ({ ...prev, [mediaId]: true }));
    try {
      if (publicId) {
        const token = localStorage.getItem('auth-token');
        if (token) {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ publicId })
          });
        }
      }
    } catch (error) {
      console.error('Failed to remove media from storage:', error);
    }

    setFormData((prev) => {
      const categories = prev.medias.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        return {
          ...category,
          media: category.media.filter((item) => item.id !== mediaId)
        };
      });
      const updated = {
        ...prev,
        medias: { categories }
      };
      scheduleAutosave(updated);
      return updated;
    });

    setRemovingMediaIds((prev) => {
      const next = { ...prev };
      delete next[mediaId];
      return next;
    });
  };

  const handleMediaReorder = (categoryId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) {
      return;
    }
    setFormData((prev) => {
      const categories = prev.medias.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        const media = [...category.media];
        const [moved] = media.splice(fromIndex, 1);
        media.splice(toIndex, 0, moved);
        return {
          ...category,
          media
        };
      });
      const updated = {
        ...prev,
        medias: { categories }
      };
      scheduleAutosave(updated);
      return updated;
    });
  };

  const moveMediaBetweenCategories = (sourceCategoryId, targetCategoryId, fromIndex, toIndex) => {
    if (!sourceCategoryId || !targetCategoryId) {
      return;
    }

    setFormData((prev) => {
      const categories = prev.medias.categories.map((category) => ({
        ...category,
        media: [...category.media]
      }));

      const sourceIndex = categories.findIndex((category) => category.id === sourceCategoryId);
      const targetIndex = categories.findIndex((category) => category.id === targetCategoryId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return prev;
      }

      const [moved] = categories[sourceIndex].media.splice(fromIndex, 1);

      if (!moved) {
        return prev;
      }

      const safeIndex = Math.min(Math.max(toIndex, 0), categories[targetIndex].media.length);
      categories[targetIndex].media.splice(safeIndex, 0, moved);

      const updated = {
        ...prev,
        medias: { categories }
      };

      scheduleAutosave(updated);
      return updated;
    });
  };

  const handleCategoryReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) {
      return;
    }
    setFormData((prev) => {
      const categories = [...prev.medias.categories];
      const [moved] = categories.splice(fromIndex, 1);
      categories.splice(toIndex, 0, moved);
      const reordered = categories.map((category, index) => ({
        ...category,
        order: index * 10
      }));
      const updated = {
        ...prev,
        medias: { categories: reordered }
      };
      scheduleAutosave(updated);
      return updated;
    });
  };

  const handleToggleFlag = (categoryId, mediaId, key) => {
    setFormData((prev) => {
      const categories = prev.medias.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        return {
          ...category,
          media: category.media.map((item) => {
            if (item.id !== mediaId) {
              return item;
            }
            if (key === 'isHero') {
              return {
                ...item,
                isHero: !item.isHero
              };
            }
            if (key === 'hidden') {
              return {
                ...item,
                hidden: !item.hidden
              };
            }
            if (key === 'isCover') {
              return {
                ...item,
                isCover: !item.isCover
              };
            }
            return item;
          })
        };
      });
      const updated = {
        ...prev,
        medias: { categories }
      };
      scheduleAutosave(updated);
      return updated;
    });
  };

  const handleGeocode = useCallback(async (addressState) => {
    const query = [addressState.streetNumber, addressState.street, addressState.postalCode, addressState.city]
      .filter(Boolean)
      .join(' ');

    if (!query) {
      return;
    }

    setGeocodeStatus('loading');
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (Array.isArray(data?.features) && data.features.length > 0) {
        const feature = data.features[0];
        const city = feature.properties?.city || addressState.city;
        const postcode = feature.properties?.postcode || addressState.postalCode;
        const [longitude, latitude] = feature.geometry?.coordinates || [];

        setFormData((prev) => {
          const updatedAddress = {
            ...prev.address,
            city,
            postalCode: postcode,
            latitude: latitude ?? prev.address.latitude,
            longitude: longitude ?? prev.address.longitude
          };
          const updated = {
            ...prev,
            address: updatedAddress
          };
          scheduleAutosave(updated);
          return updated;
        });
        setGeocodeStatus('success');
      } else {
        setGeocodeStatus('empty');
      }
    } catch (error) {
      console.error('Geocode error:', error);
      setGeocodeStatus('error');
    }
  }, [scheduleAutosave]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleGeocode(formData.address);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [formData.address, handleGeocode]);

  const googleMapSrc = useMemo(() => {
    if (formData.address.latitude && formData.address.longitude) {
      return `https://maps.google.com/maps?q=${formData.address.latitude},${formData.address.longitude}&z=15&output=embed`;
    }
    const query = formatAddress(formData.address);
    if (!query) {
      return '';
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  }, [formData.address]);

  const sectionOrder = ['general', 'address', 'onlinePresence', 'medias', 'operations', 'seo'];

  const completedSections = useMemo(() => {
    const checks = {
      general: Boolean(formData.general.name && formData.general.type && formData.general.shortDescription),
      address: Boolean(formData.address.street && formData.address.postalCode && formData.address.city),
      onlinePresence: Boolean(formData.onlinePresence.slug),
      medias: formData.medias.categories.some((category) => category.media.length > 0),
      operations: true,
      seo: Boolean(formData.seo.metaTitle)
    };
    return checks;
  }, [formData]);

  const totalSections = sectionOrder.length;
  const completedCount = sectionOrder.reduce((acc, section) => acc + (completedSections[section] ? 1 : 0), 0);
  const progressValue = Math.round((completedCount / totalSections) * 100);

  const validate = () => {
    const newErrors = {};

    if (!formData.general.name?.trim()) {
      newErrors['general.name'] = 'Le nom du logement est requis';
    }
    if (!formData.general.shortDescription || formData.general.shortDescription.length > 160) {
      newErrors['general.shortDescription'] = 'Description courte obligatoire (≤ 160 caractères)';
    }
    if (formData.general.longDescription.length > 5000) {
      newErrors['general.longDescription'] = 'Description trop longue';
    }
    if (!formData.general.type) {
      newErrors['general.type'] = 'Type requis';
    }
    if (!formData.general.capacity.adults || formData.general.capacity.adults < 1) {
      newErrors['general.capacity.adults'] = 'Au moins 1 adulte';
    }
    if (formData.general.capacity.children < 0) {
      newErrors['general.capacity.children'] = 'Nombre invalide';
    }
    if (!formData.address.street?.trim()) {
      newErrors['address.street'] = 'Rue obligatoire';
    }
    if (!formData.address.postalCode || !/^\d{5}$/.test(formData.address.postalCode)) {
      newErrors['address.postalCode'] = 'Code postal à 5 chiffres requis';
    }
    if (!formData.address.city?.trim()) {
      newErrors['address.city'] = 'Ville obligatoire';
    }
    if (!formData.onlinePresence.slug?.trim()) {
      newErrors['onlinePresence.slug'] = 'Slug requis';
    }
    if (formData.onlinePresence.airbnbUrl && !/^https?:\/\/(www\.)?airbnb\.(fr|com)\/h\//.test(formData.onlinePresence.airbnbUrl)) {
      newErrors['onlinePresence.airbnbUrl'] = 'Lien Airbnb invalide (format attendu airbnb.fr/com/h/...)';
    }
    if (formData.onlinePresence.bookingUrl && !/^https?:\/\/(www\.)?booking\.com\//.test(formData.onlinePresence.bookingUrl)) {
      newErrors['onlinePresence.bookingUrl'] = 'Lien Booking invalide';
    }
    formData.medias.categories.forEach((category) => {
      category.media.forEach((item) => {
        if (!item.alt?.trim()) {
          newErrors[`medias.${category.id}.${item.id}.alt`] = 'Texte alternatif requis';
        }
      });
    });

    const deposit = formData.operations.deposit;
    if (deposit.type === 'fixed') {
      if (deposit.amount < 0) {
        newErrors['operations.deposit.amount'] = 'Montant invalide';
      }
    } else if (deposit.type === 'range') {
      if (!deposit.min || !deposit.max) {
        newErrors['operations.deposit.min'] = 'Montants requis';
      } else if (Number(deposit.min) > Number(deposit.max)) {
        newErrors['operations.deposit.max'] = 'Max doit être supérieur au min';
      }
    }

    if (formData.seo.metaTitle && formData.seo.metaTitle.length > 70) {
      newErrors['seo.metaTitle'] = 'Meta title ≤ 70 caractères';
    }
    if (formData.seo.metaDescription && formData.seo.metaDescription.length > 160) {
      newErrors['seo.metaDescription'] = 'Meta description ≤ 160 caractères';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey) {
        const section = firstErrorKey.split('.')[0];
        setActiveSection(section);
      }
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const url = property ? `/api/properties/${property.id}` : '/api/properties';
      const method = property ? 'PUT' : 'POST';

      const categories = formData.medias.categories.map((category, index) => ({
        ...category,
        order: index * 10,
        media: category.media.map((item, idx) => ({
          ...item,
          order: idx * 10
        }))
      }));

      const payload = {
        general: formData.general,
        address: formData.address,
        onlinePresence: formData.onlinePresence,
        medias: { categories },
        operations: formData.operations,
        seo: formData.seo
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }

      const saved = await response.json();
      setHasUnsavedChanges(false);
      localStorage.removeItem(draftKeyRef.current);
      onSave(saved);
    } catch (error) {
      console.error('Save error:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Erreur lors de la sauvegarde'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const { allImages } = useMemo(
    () => flattenMediaCategories(formData.medias.categories),
    [formData.medias.categories]
  );

  const selectedOgImage = useMemo(() => {
    if (!formData.seo.ogImageId) {
      return null;
    }
    return allImages.find((image) => image.id === formData.seo.ogImageId) || null;
  }, [allImages, formData.seo.ogImageId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {property ? 'Modifier la propriété' : 'Nouvelle propriété'}
            </h2>
            <p className="text-sm text-gray-500">Centralisez toutes les informations de votre logement.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Progression</span>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{progressValue}%</span>
              </div>
              {isAutosaving ? (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Auto-sauvegarde…
                </span>
              ) : hasUnsavedChanges ? (
                <span className="flex items-center gap-1 text-xs text-warning-600">
                  <AlertTriangle className="h-3 w-3" /> Modifications non enregistrées
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-success-600">
                  <Check className="h-3 w-3" /> À jour
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {sectionOrder.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 transition ${
                    activeSection === section
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : completedSections[section]
                      ? 'border-success-200 bg-success-50 text-success-700'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  <span className="capitalize">{section}</span>
                  {completedSections[section] ? <Check className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-6">
            {/* Section: Informations générales */}
            <section className="rounded-lg border border-gray-200">
              <header
                className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                onClick={() => setActiveSection(activeSection === 'general' ? '' : 'general')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Home className="h-4 w-4 text-primary-500" /> Informations générales
                </div>
                {activeSection === 'general' ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </header>
              {activeSection === 'general' && (
                <div className="space-y-4 px-4 py-4">
                  {errors['submit'] && (
                    <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                      {errors['submit']}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="general-name" className="form-label flex items-center gap-2">
                        Nom du logement <span className="text-danger-500">*</span>
                      </label>
                      <input
                        id="general-name"
                        type="text"
                        required
                        maxLength={120}
                        value={formData.general.name}
                        onChange={(event) => updateField('general.name', event.target.value)}
                        className={`form-input ${errors['general.name'] ? 'border-danger-500' : ''}`}
                        aria-describedby="general-name-helper"
                      />
                      <p id="general-name-helper" className="mt-1 text-xs text-gray-500">
                        Unicité par propriétaire. Ce nom apparaîtra sur le mini-site.
                      </p>
                      {errors['general.name'] && <p className="mt-1 text-xs text-danger-600">{errors['general.name']}</p>}
                    </div>
                    <div>
                      <label htmlFor="general-type" className="form-label">Type de logement</label>
                      <select
                        id="general-type"
                        value={formData.general.type}
                        onChange={(event) => updateField('general.type', event.target.value)}
                        className={`form-select ${errors['general.type'] ? 'border-danger-500' : ''}`}
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors['general.type'] && <p className="mt-1 text-xs text-danger-600">{errors['general.type']}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label htmlFor="capacity-adults" className="form-label flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" /> Adultes
                      </label>
                      <input
                        id="capacity-adults"
                        type="number"
                        min={1}
                        value={formData.general.capacity.adults}
                        onChange={(event) => updateField('general.capacity.adults', Number(event.target.value))}
                        className={`form-input ${errors['general.capacity.adults'] ? 'border-danger-500' : ''}`}
                      />
                      {errors['general.capacity.adults'] && (
                        <p className="mt-1 text-xs text-danger-600">{errors['general.capacity.adults']}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="capacity-children" className="form-label flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" /> Enfants
                      </label>
                      <input
                        id="capacity-children"
                        type="number"
                        min={0}
                        value={formData.general.capacity.children}
                        onChange={(event) => updateField('general.capacity.children', Number(event.target.value))}
                        className={`form-input ${errors['general.capacity.children'] ? 'border-danger-500' : ''}`}
                      />
                      {errors['general.capacity.children'] && (
                        <p className="mt-1 text-xs text-danger-600">{errors['general.capacity.children']}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="general-bedrooms" className="form-label flex items-center gap-2">
                        <Bed className="h-4 w-4 text-gray-400" /> Chambres
                      </label>
                      <input
                        id="general-bedrooms"
                        type="number"
                        min={0}
                        value={formData.general.bedrooms}
                        onChange={(event) => updateField('general.bedrooms', Number(event.target.value))}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="general-beds" className="form-label flex items-center gap-2">
                        <Bed className="h-4 w-4 text-gray-400" /> Lits
                      </label>
                      <input
                        id="general-beds"
                        type="number"
                        min={0}
                        value={formData.general.beds}
                        onChange={(event) => updateField('general.beds', Number(event.target.value))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="general-bathrooms" className="form-label flex items-center gap-2">
                        <Bath className="h-4 w-4 text-gray-400" /> Salles de bain
                      </label>
                      <input
                        id="general-bathrooms"
                        type="number"
                        min={0}
                        value={formData.general.bathrooms}
                        onChange={(event) => updateField('general.bathrooms', Number(event.target.value))}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="general-surface" className="form-label flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" /> Surface (m²)
                      </label>
                      <input
                        id="general-surface"
                        type="number"
                        min={0}
                        value={formData.general.surface}
                        onChange={(event) => updateField('general.surface', event.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="general-short-description" className="form-label flex items-center gap-2">
                      Description courte <span className="text-danger-500">*</span>
                      <span className="text-xs text-gray-400" aria-live="polite">
                        {formData.general.shortDescription.length}/160
                      </span>
                    </label>
                    <textarea
                      id="general-short-description"
                      maxLength={160}
                      value={formData.general.shortDescription}
                      onChange={(event) => updateField('general.shortDescription', event.target.value)}
                      className={`form-textarea ${errors['general.shortDescription'] ? 'border-danger-500' : ''}`}
                    />
                    {errors['general.shortDescription'] && (
                      <p className="mt-1 text-xs text-danger-600">{errors['general.shortDescription']}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="general-long-description" className="form-label flex items-center gap-2">
                        Description longue
                      </label>
                      <span className="text-xs text-gray-400" aria-live="polite">
                        {formData.general.longDescription.length} caractères
                      </span>
                    </div>
                    <textarea
                      id="general-long-description"
                      value={formData.general.longDescription}
                      onChange={(event) => updateField('general.longDescription', event.target.value)}
                      className={`form-textarea min-h-[160px] ${errors['general.longDescription'] ? 'border-danger-500' : ''}`}
                    />
                    {errors['general.longDescription'] && (
                      <p className="mt-1 text-xs text-danger-600">{errors['general.longDescription']}</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Section: Adresse */}
            <section className="rounded-lg border border-gray-200">
              <header
                className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                onClick={() => setActiveSection(activeSection === 'address' ? '' : 'address')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <MapPin className="h-4 w-4 text-primary-500" /> Adresse & géolocalisation
                </div>
                {activeSection === 'address' ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </header>
              {activeSection === 'address' && (
                <div className="space-y-4 px-4 py-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label htmlFor="address-number" className="form-label">N° de voie</label>
                      <input
                        id="address-number"
                        value={formData.address.streetNumber}
                        onChange={(event) => updateField('address.streetNumber', event.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label htmlFor="address-street" className="form-label">Type + nom de voie</label>
                      <input
                        id="address-street"
                        value={formData.address.street}
                        onChange={(event) => updateField('address.street', event.target.value)}
                        className={`form-input ${errors['address.street'] ? 'border-danger-500' : ''}`}
                      />
                      {errors['address.street'] && (
                        <p className="mt-1 text-xs text-danger-600">{errors['address.street']}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address-complement" className="form-label">Complément (bâtiment, étage…)</label>
                    <input
                      id="address-complement"
                      value={formData.address.complement}
                      onChange={(event) => updateField('address.complement', event.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="address-postal" className="form-label">Code postal</label>
                      <input
                        id="address-postal"
                        value={formData.address.postalCode}
                        onChange={(event) => updateField('address.postalCode', event.target.value)}
                        className={`form-input ${errors['address.postalCode'] ? 'border-danger-500' : ''}`}
                        inputMode="numeric"
                        maxLength={5}
                      />
                      {errors['address.postalCode'] && (
                        <p className="mt-1 text-xs text-danger-600">{errors['address.postalCode']}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="address-city" className="form-label">Ville</label>
                      <input
                        id="address-city"
                        value={formData.address.city}
                        onChange={(event) => updateField('address.city', event.target.value)}
                        className={`form-input ${errors['address.city'] ? 'border-danger-500' : ''}`}
                      />
                      {errors['address.city'] && <p className="mt-1 text-xs text-danger-600">{errors['address.city']}</p>}
                    </div>
                    <div>
                      <label htmlFor="address-country" className="form-label">Pays</label>
                      <select
                        id="address-country"
                        value={formData.address.country}
                        onChange={(event) => updateField('address.country', event.target.value)}
                        className="form-select"
                      >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Search className="h-3 w-3" />
                      {geocodeStatus === 'loading' && 'Recherche de la position…'}
                      {geocodeStatus === 'success' && 'Adresse géolocalisée ✅'}
                      {geocodeStatus === 'empty' && 'Adresse introuvable, vérifiez les informations'}
                      {geocodeStatus === 'error' && 'Erreur lors de la géolocalisation'}
                    </div>
                    {googleMapSrc ? (
                      <iframe
                        title="Carte Google"
                        src={googleMapSrc}
                        className="h-60 w-full rounded-lg border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-60 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
                        Renseignez une adresse pour afficher la carte
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Section: Présence en ligne */}
            <section className="rounded-lg border border-gray-200">
              <header
                className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                onClick={() => setActiveSection(activeSection === 'onlinePresence' ? '' : 'onlinePresence')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Link2 className="h-4 w-4 text-primary-500" /> Présence en ligne
                </div>
                {activeSection === 'onlinePresence' ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </header>
              {activeSection === 'onlinePresence' && (
                <div className="space-y-4 px-4 py-4">
                  <div>
                    <label htmlFor="online-airbnb" className="form-label flex items-center gap-2">
                      Lien Airbnb
                    </label>
                    <input
                      id="online-airbnb"
                      type="url"
                      placeholder="https://www.airbnb.com/h/..."
                      value={formData.onlinePresence.airbnbUrl}
                      onChange={(event) => updateField('onlinePresence.airbnbUrl', event.target.value)}
                      className={`form-input ${errors['onlinePresence.airbnbUrl'] ? 'border-danger-500' : ''}`}
                    />
                    {errors['onlinePresence.airbnbUrl'] && (
                      <p className="mt-1 text-xs text-danger-600">{errors['onlinePresence.airbnbUrl']}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="online-booking" className="form-label flex items-center gap-2">
                      Lien Booking
                    </label>
                    <input
                      id="online-booking"
                      type="url"
                      placeholder="https://www.booking.com/..."
                      value={formData.onlinePresence.bookingUrl}
                      onChange={(event) => updateField('onlinePresence.bookingUrl', event.target.value)}
                      className={`form-input ${errors['onlinePresence.bookingUrl'] ? 'border-danger-500' : ''}`}
                    />
                    {errors['onlinePresence.bookingUrl'] && (
                      <p className="mt-1 text-xs text-danger-600">{errors['onlinePresence.bookingUrl']}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="online-slug" className="form-label flex items-center gap-2">
                      Slug mini-site
                      <span className="text-xs text-gray-400" title="Slug = URL du mini-site">
                        <Info className="h-3 w-3" />
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="online-slug"
                        value={formData.onlinePresence.slug}
                        onChange={(event) => {
                          setIsSlugManual(true);
                          updateField('onlinePresence.slug', event.target.value);
                        }}
                        className={`form-input ${errors['onlinePresence.slug'] ? 'border-danger-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const auto = generateSlug(formData.general.name, formData.address.city);
                          setIsSlugManual(false);
                          updateField('onlinePresence.slug', auto);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                      >
                        <RefreshCw className="h-4 w-4" /> Auto
                      </button>
                    </div>
                    {errors['onlinePresence.slug'] && <p className="mt-1 text-xs text-danger-600">{errors['onlinePresence.slug']}</p>}
                    <p className="mt-1 text-xs text-gray-500">URL finale : checkinly.com/sejour/{formData.onlinePresence.slug || 'slug'}</p>
                  </div>
                </div>
              )}
            </section>
            {/* Section: Médias */}
            <section className="rounded-lg border border-gray-200">
              <header
                className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                onClick={() => setActiveSection(activeSection === 'medias' ? '' : 'medias')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <ImageIcon className="h-4 w-4 text-primary-500" /> Médias
                </div>
                {activeSection === 'medias' ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </header>
              {activeSection === 'medias' && (
                <div className="space-y-6 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Glissez-déposez vos médias dans les catégories et organisez-les par glisser-déposer.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          const categories = [
                            ...prev.medias.categories,
                            {
                              id: uuidv4(),
                              key: `custom-${prev.medias.categories.length + 1}`,
                              label: `Catégorie ${prev.medias.categories.length + 1}`,
                              title: '',
                              shortDescription: '',
                              isCoverCategory: false,
                              order: prev.medias.categories.length * 10,
                              videoUrl: '',
                              media: []
                            }
                          ];
                          const updated = {
                            ...prev,
                            medias: { categories }
                          };
                          scheduleAutosave(updated);
                          return updated;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" /> Ajouter une catégorie
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.medias.categories.map((category, index) => (
                      <div key={category.id} className="rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="flex flex-1 items-center gap-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 cursor-grab text-gray-400" draggable onDragStart={(event) => {
                                event.dataTransfer.setData('text/plain', String(index));
                              }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                                event.preventDefault();
                                const from = Number(event.dataTransfer.getData('text/plain'));
                                handleCategoryReorder(from, index);
                              }} />
                              <input
                                value={category.label}
                                onChange={(event) => updateField(`medias.categories.${index}.label`, event.target.value)}
                                className="form-input h-9"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={category.isCoverCategory}
                                  onChange={() => updateField(`medias.categories.${index}.isCoverCategory`, !category.isCoverCategory)}
                                  className="form-checkbox"
                                />
                                Catégorie couverture
                              </label>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500">{category.media.length} média(s)</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => {
                                const categories = prev.medias.categories.filter((item) => item.id !== category.id);
                                const updated = {
                                  ...prev,
                                  medias: { categories }
                                };
                                scheduleAutosave(updated);
                                return updated;
                              });
                            }}
                            className="rounded-full p-2 text-gray-400 transition hover:bg-danger-50 hover:text-danger-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-4 p-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <label className="form-label">Titre (H3)</label>
                            <input
                              value={category.title}
                              onChange={(event) => updateField(`medias.categories.${index}.title`, event.target.value)}
                              className="form-input"
                            />
                            <label className="form-label">Description courte</label>
                            <textarea
                              value={category.shortDescription}
                              maxLength={120}
                              onChange={(event) => updateField(`medias.categories.${index}.shortDescription`, event.target.value)}
                              className="form-textarea"
                            />
                            <label className="form-label">Lien vidéo (optionnel)</label>
                            <input
                              type="url"
                              value={category.videoUrl}
                              onChange={(event) => updateField(`medias.categories.${index}.videoUrl`, event.target.value)}
                              className="form-input"
                              placeholder="https://..."
                            />
                          </div>

                          <div
                            className="flex min-h-[180px] flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              const data = event.dataTransfer.getData('application/json');
                              if (!data) {
                                return;
                              }

                              try {
                                const parsed = JSON.parse(data);
                                if (!parsed || parsed.index === undefined) {
                                  return;
                                }

                                if (parsed.categoryId === category.id) {
                                  handleMediaReorder(category.id, parsed.index, category.media.length);
                                } else {
                                  moveMediaBetweenCategories(parsed.categoryId, category.id, parsed.index, category.media.length);
                                }
                              } catch (error) {
                                console.error('Drop error:', error);
                              }
                            }}
                          >
                            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 transition hover:border-primary-400">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(event) => handleCategoryUpload(category.id, event.target.files)}
                              />
                              {isUploadingCategory[category.id] ? (
                                <>
                                  <Loader2 className="mb-2 h-5 w-5 animate-spin text-primary-500" />
                                  Téléversement…
                                </>
                              ) : (
                                <>
                                  <Upload className="mb-2 h-5 w-5 text-primary-500" />
                                  Déposer ou cliquer pour ajouter
                                </>
                              )}
                            </label>

                            {errors[`medias.${category.id}`] && (
                              <p className="text-xs text-danger-600">{errors[`medias.${category.id}`]}</p>
                            )}

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                              {category.media.map((mediaItem, mediaIndex) => (
                                <div
                                  key={mediaItem.id}
                                  className="group relative h-32 overflow-hidden rounded-lg border border-gray-200"
                                  draggable
                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = 'move';
                                    event.dataTransfer.setData(
                                      'application/json',
                                      JSON.stringify({ categoryId: category.id, index: mediaIndex })
                                    );
                                  }}
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    const data = event.dataTransfer.getData('application/json');
                                    if (!data) {
                                      return;
                                    }
                                    try {
                                      const parsed = JSON.parse(data);
                                      if (!parsed || parsed.index === undefined) {
                                        return;
                                      }
                                      if (parsed.categoryId === category.id) {
                                        handleMediaReorder(category.id, parsed.index, mediaIndex);
                                      } else {
                                        moveMediaBetweenCategories(parsed.categoryId, category.id, parsed.index, mediaIndex);
                                      }
                                    } catch (error) {
                                      console.error('Drop error:', error);
                                    }
                                  }}
                                >
                                  {mediaItem.url ? (
                                    <Image
                                      src={mediaItem.thumbnailUrl || mediaItem.url}
                                      alt={mediaItem.alt || ''}
                                      fill
                                      className="object-cover"
                                      sizes="120px"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                                      Aucun aperçu
                                    </div>
                                  )}

                                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-black/60 p-2 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={mediaItem.isHero}
                                        onChange={() => handleToggleFlag(category.id, mediaItem.id, 'isHero')}
                                      />
                                      Prioritaire (hero)
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={mediaItem.isCover}
                                        onChange={() => handleToggleFlag(category.id, mediaItem.id, 'isCover')}
                                      />
                                      Image de couverture
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={mediaItem.hidden}
                                        onChange={() => handleToggleFlag(category.id, mediaItem.id, 'hidden')}
                                      />
                                      Masquer
                                    </label>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(category.id, mediaItem.id, mediaItem.publicId)}
                                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-danger-600"
                                  >
                                    {removingMediaIds[mediaItem.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                  </button>
                                </div>
                              ))}
                            </div>

                            {category.media.map((mediaItem, mediaIndex) => (
                              <div key={`${mediaItem.id}-meta`} className="rounded-lg border border-gray-200 bg-white p-3 text-xs">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block font-medium text-gray-700">Texte alternatif *</label>
                                    <input
                                      value={mediaItem.alt}
                                      onChange={(event) => updateField(`medias.categories.${index}.media.${mediaIndex}.alt`, event.target.value)}
                                      className={`form-input text-xs ${errors[`medias.${category.id}.${mediaItem.id}.alt`] ? 'border-danger-500' : ''}`}
                                    />
                                    {errors[`medias.${category.id}.${mediaItem.id}.alt`] && (
                                      <p className="mt-1 text-[10px] text-danger-600">{errors[`medias.${category.id}.${mediaItem.id}.alt`]}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="mb-1 block font-medium text-gray-700">Crédit photo</label>
                                    <input
                                      value={mediaItem.credit || ''}
                                      onChange={(event) => updateField(`medias.categories.${index}.media.${mediaIndex}.credit`, event.target.value)}
                                      className="form-input text-xs"
                                      placeholder="Nom du photographe"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allImages.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="text-sm font-medium text-gray-800">Sélection OG image</h4>
                      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {allImages.map((image) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => updateField('seo.ogImageId', image.id)}
                            className={`relative h-28 overflow-hidden rounded-lg border ${formData.seo.ogImageId === image.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'}`}
                          >
                            <Image
                              src={image.thumbnailUrl || image.url}
                              alt={image.alt || ''}
                              fill
                              className="object-cover"
                              sizes="120px"
                              unoptimized
                            />
                            {formData.seo.ogImageId === image.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-primary-600/60 text-white">
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section: Règles & opérations */}
            <section className="rounded-lg border border-gray-200">
              <header
                className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                onClick={() => setActiveSection(activeSection === 'operations' ? '' : 'operations')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Key className="h-4 w-4 text-primary-500" /> Règles & opérations
                </div>
                {activeSection === 'operations' ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </header>
              {activeSection === 'operations' && (
                <div className="space-y-4 px-4 py-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-3 text-sm font-semibold text-gray-800">Check-in</h4>
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={formData.operations.checkInTime}
                          onChange={(event) => updateField('operations.checkInTime', event.target.value)}
                          className="form-input"
                        />
                        <select
                          value={formData.operations.checkInMode}
                          onChange={(event) => updateField('operations.checkInMode', event.target.value)}
                          className="form-select"
                        >
                          {CHECK_MODES.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-3 text-sm font-semibold text-gray-800">Check-out</h4>
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={formData.operations.checkOutTime}
                          onChange={(event) => updateField('operations.checkOutTime', event.target.value)}
                          className="form-input"
                        />
                        <select
                          value={formData.operations.checkOutMode}
                          onChange={(event) => updateField('operations.checkOutMode', event.target.value)}
                          className="form-select"
                        >
                          {CHECK_MODES.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-3 text-sm font-semibold text-gray-800">Caution</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="deposit-type"
                              value="fixed"
                              checked={formData.operations.deposit.type === 'fixed'}
                              onChange={() => updateField('operations.deposit.type', 'fixed')}
                            />
                            Montant fixe
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="deposit-type"
                              value="range"
                              checked={formData.operations.deposit.type === 'range'}
                              onChange={() => updateField('operations.deposit.type', 'range')}
                            />
                            Fourchette
                          </label>
                        </div>

                        {formData.operations.deposit.type === 'fixed' ? (
                          <input
                            type="number"
                            min={0}
                            value={formData.operations.deposit.amount}
                            onChange={(event) => updateField('operations.deposit.amount', Number(event.target.value))}
                            className={`form-input ${errors['operations.deposit.amount'] ? 'border-danger-500' : ''}`}
                            placeholder="Ex. 500"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={0}
                              value={formData.operations.deposit.min}
                              onChange={(event) => updateField('operations.deposit.min', event.target.value)}
                              className={`form-input ${errors['operations.deposit.min'] ? 'border-danger-500' : ''}`}
                              placeholder="Min"
                            />
                            <input
                              type="number"
                              min={0}
                              value={formData.operations.deposit.max}
                              onChange={(event) => updateField('operations.deposit.max', event.target.value)}
                              className={`form-input ${errors['operations.deposit.max'] ? 'border-danger-500' : ''}`}
                              placeholder="Max"
                            />
                          </div>
                        )}
                        {errors['operations.deposit.amount'] && (
                          <p className="text-xs text-danger-600">{errors['operations.deposit.amount']}</p>
                        )}
                        {errors['operations.deposit.min'] && (
                          <p className="text-xs text-danger-600">{errors['operations.deposit.min']}</p>
                        )}
                        {errors['operations.deposit.max'] && (
                          <p className="text-xs text-danger-600">{errors['operations.deposit.max']}</p>
                        )}

                        <select
                          value={formData.operations.deposit.method}
                          onChange={(event) => updateField('operations.deposit.method', event.target.value)}
                          className="form-select"
                        >
                          {DEPOSIT_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-3 text-sm font-semibold text-gray-800">Règles</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.operations.smokingAllowed}
                            onChange={() => updateField('operations.smokingAllowed', !formData.operations.smokingAllowed)}
                          />
                          Fumeurs acceptés
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.operations.petsAllowed}
                            onChange={() => updateField('operations.petsAllowed', !formData.operations.petsAllowed)}
                          />
                          Animaux acceptés
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.operations.partiesAllowed}
                            onChange={() => updateField('operations.partiesAllowed', !formData.operations.partiesAllowed)}
                          />
                          Fêtes autorisées
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-800">Équipements</h4>
                    <div className="flex flex-wrap gap-2">
                      {EQUIPMENT_OPTIONS.map((equipment) => {
                        const selected = formData.operations.equipments.includes(equipment);
                        return (
                          <button
                            key={equipment}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => {
                                const equipments = selected
                                  ? prev.operations.equipments.filter((item) => item !== equipment)
                                  : [...prev.operations.equipments, equipment];
                                const updated = {
                                  ...prev,
                                  operations: {
                                    ...prev.operations,
                                    equipments
                                  }
                                };
                                scheduleAutosave(updated);
                                return updated;
                              });
                            }}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                              selected
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                            }`}
                          >
                            {equipment}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-800">Taxe de séjour</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="form-label">Commune</label>
                        <input
                          value={formData.operations.cityTax.municipality}
                          onChange={(event) => updateField('operations.cityTax.municipality', event.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">Catégorie meublé</label>
                        <input
                          value={formData.operations.cityTax.classification}
                          onChange={(event) => updateField('operations.cityTax.classification', event.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">N° d'enregistrement</label>
                        <input
                          value={formData.operations.cityTax.registrationNumber}
                          onChange={(event) => updateField('operations.cityTax.registrationNumber', event.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Section: SEO & partage */}
            <section className="rounded-lg border border-gray-200">
              <header
                className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                onClick={() => setActiveSection(activeSection === 'seo' ? '' : 'seo')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Globe className="h-4 w-4 text-primary-500" /> SEO & partage
                </div>
                {activeSection === 'seo' ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </header>
              {activeSection === 'seo' && (
                <div className="space-y-4 px-4 py-4">
                  <div>
                    <label className="form-label">Meta title</label>
                    <input
                      value={formData.seo.metaTitle}
                      onChange={(event) => updateField('seo.metaTitle', event.target.value)}
                      className={`form-input ${errors['seo.metaTitle'] ? 'border-danger-500' : ''}`}
                      maxLength={70}
                    />
                    <p className="mt-1 text-xs text-gray-500">Auto-généré depuis Nom + Ville. Modifiable.</p>
                    {errors['seo.metaTitle'] && <p className="mt-1 text-xs text-danger-600">{errors['seo.metaTitle']}</p>}
                  </div>
                  <div>
                    <label className="form-label">Meta description</label>
                    <textarea
                      value={formData.seo.metaDescription}
                      onChange={(event) => updateField('seo.metaDescription', event.target.value)}
                      className={`form-textarea ${errors['seo.metaDescription'] ? 'border-danger-500' : ''}`}
                      maxLength={160}
                    />
                    <span className="mt-1 block text-xs text-gray-400">{formData.seo.metaDescription.length}/160</span>
                    {errors['seo.metaDescription'] && <p className="mt-1 text-xs text-danger-600">{errors['seo.metaDescription']}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Image OG sélectionnée : {formData.seo.ogImageId ? 'Oui' : 'Non'}</p>
                    {selectedOgImage && (
                      <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                          <Image
                            src={selectedOgImage.thumbnailUrl || selectedOgImage.url}
                            alt={selectedOgImage.alt || ''}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>{selectedOgImage.alt}</p>
                          <p className="text-gray-400">ID : {formData.seo.ogImageId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <footer className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AlertTriangle className="h-4 w-4 text-warning-500" />
              Les changements sont auto-enregistrés. Pensez à sauvegarder pour publier.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {property ? 'Mettre à jour' : 'Créer la propriété'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}


