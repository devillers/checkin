'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Play,
  Pencil,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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

const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url ?? '');

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
  const [isEditingShortDescription, setIsEditingShortDescription] = useState(false);
  const [isEditingLongDescription, setIsEditingLongDescription] = useState(false);
  const [shortDescriptionDraft, setShortDescriptionDraft] = useState('');
  const [longDescriptionDraft, setLongDescriptionDraft] = useState('');
  const [isSavingShortDescription, setIsSavingShortDescription] = useState(false);
  const [isSavingLongDescription, setIsSavingLongDescription] = useState(false);
  const [shortDescriptionError, setShortDescriptionError] = useState(null);
  const [longDescriptionError, setLongDescriptionError] = useState(null);
  const [isEditingMainInfo, setIsEditingMainInfo] = useState(false);
  const [mainInfoDraft, setMainInfoDraft] = useState({
    streetNumber: '',
    street: '',
    complement: '',
    postalCode: '',
    city: '',
    country: 'France',
    formatted: '',
    adults: '1',
    children: '0',
    bedrooms: '0',
    beds: '0',
    bathrooms: '0'
  });
  const [isSavingMainInfo, setIsSavingMainInfo] = useState(false);
  const [mainInfoError, setMainInfoError] = useState(null);
  const [isEditingQuickSettings, setIsEditingQuickSettings] = useState(false);
  const [quickSettingsDraft, setQuickSettingsDraft] = useState({
    checkInTime: '15:00',
    checkInMode: 'self',
    checkOutTime: '11:00',
    checkOutMode: 'self',
    accessCode: '',
    depositType: 'none',
    depositAmount: '',
    depositMin: '',
    depositMax: '',
    depositMethod: 'empreinte',
    cleaningFee: '',
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false
  });
  const [isSavingQuickSettings, setIsSavingQuickSettings] = useState(false);
  const [quickSettingsError, setQuickSettingsError] = useState(null);
  const [isEditingAmenities, setIsEditingAmenities] = useState(false);
  const [amenitiesDraft, setAmenitiesDraft] = useState('');
  const [isSavingAmenities, setIsSavingAmenities] = useState(false);
  const [amenitiesError, setAmenitiesError] = useState(null);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [photosDraft, setPhotosDraft] = useState([]);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState(null);

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

  useEffect(() => {
    if (!property) {
      return;
    }

    const shortValue = property.shortDescription
      || property.general?.shortDescription
      || property.description
      || '';
    const longValue = property.description
      || property.general?.longDescription
      || '';

    if (!isEditingShortDescription) {
      setShortDescriptionDraft(shortValue);
    }

    if (!isEditingLongDescription) {
      setLongDescriptionDraft(longValue);
    }

    if (!isEditingMainInfo) {
      const baseAddress = typeof property.address === 'object' && property.address !== null
        ? property.address
        : {
            streetNumber: '',
            street: property.formattedAddress || '',
            complement: '',
            postalCode: '',
            city: '',
            country: 'France',
            formatted: property.formattedAddress || ''
          };
      const baseCapacity = property.general?.capacity || property.capacity || {};
      const adultsValue = Number(baseCapacity.adults ?? property.maxGuests ?? 1);
      const childrenValue = Number(baseCapacity.children ?? 0);
      const bedroomsValue = Number(property.general?.bedrooms ?? property.bedrooms ?? 0);
      const bedsValue = Number(property.general?.beds ?? property.beds ?? property.bedrooms ?? 0);
      const bathroomsValue = Number(property.general?.bathrooms ?? property.bathrooms ?? 0);

      setMainInfoDraft({
        streetNumber: baseAddress.streetNumber ?? '',
        street: baseAddress.street ?? '',
        complement: baseAddress.complement ?? '',
        postalCode: baseAddress.postalCode ?? '',
        city: baseAddress.city ?? '',
        country: baseAddress.country ?? 'France',
        formatted: baseAddress.formatted ?? property.formattedAddress ?? '',
        adults: Number.isFinite(adultsValue) ? String(adultsValue) : '1',
        children: Number.isFinite(childrenValue) ? String(childrenValue) : '0',
        bedrooms: Number.isFinite(bedroomsValue) ? String(bedroomsValue) : '0',
        beds: Number.isFinite(bedsValue) ? String(bedsValue) : '0',
        bathrooms: Number.isFinite(bathroomsValue) ? String(bathroomsValue) : '0'
      });
    }

    if (!isEditingQuickSettings) {
      const operationsData = property.operations || {};
      const settingsData = property.settings || {};
      const depositData = operationsData.deposit || {};
      const activeDepositType = depositData.type && depositData.type !== 'none'
        ? depositData.type
        : settingsData.requireDeposit
          ? 'fixed'
          : 'none';

      setQuickSettingsDraft({
        checkInTime: operationsData.checkInTime || settingsData.checkInTime || '15:00',
        checkInMode: operationsData.checkInMode || 'self',
        checkOutTime: operationsData.checkOutTime || settingsData.checkOutTime || '11:00',
        checkOutMode: operationsData.checkOutMode || 'in_person',
        accessCode: settingsData.accessCode || '',
        depositType: activeDepositType,
        depositAmount: depositData.amount != null
          ? String(depositData.amount)
          : settingsData.depositAmount != null
            ? String(settingsData.depositAmount)
            : '',
        depositMin: depositData.min != null ? String(depositData.min) : '',
        depositMax: depositData.max != null ? String(depositData.max) : '',
        depositMethod: depositData.method || 'empreinte',
        cleaningFee: settingsData.cleaningFee != null ? String(settingsData.cleaningFee) : '',
        smokingAllowed: Boolean(operationsData.smokingAllowed),
        petsAllowed: Boolean(operationsData.petsAllowed),
        partiesAllowed: Boolean(operationsData.partiesAllowed)
      });
    }

    if (!isEditingAmenities) {
      const equipments = Array.isArray(property.amenities)
        ? property.amenities
        : Array.isArray(property.operations?.equipments)
          ? property.operations.equipments
          : [];
      setAmenitiesDraft(equipments.join('\n'));
    }

    if (!isEditingPhotos) {
      const categories = Array.isArray(property.medias?.categories)
        ? property.medias.categories.map((category) => ({
            ...category,
            media: Array.isArray(category.media)
              ? category.media.map((item) => ({ ...item }))
              : []
          }))
        : [];
      setPhotosDraft(categories);
    }
  }, [
    property,
    isEditingShortDescription,
    isEditingLongDescription,
    isEditingMainInfo,
    isEditingQuickSettings,
    isEditingAmenities,
    isEditingPhotos
  ]);

  const buildUpdatePayload = useCallback((overrides = {}) => {
    if (!property) {
      return null;
    }

    const ensureNumber = (value, fallback) => {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
      return fallback;
    };

    const baseGeneral = property.general || {};
    const baseCapacity = baseGeneral.capacity || property.capacity || {};
    const baseShort = baseGeneral.shortDescription ?? property.shortDescription ?? '';
    const baseLong = baseGeneral.longDescription ?? property.description ?? '';

    const capacityAdults = ensureNumber(
      overrides.general?.capacity?.adults
        ?? baseCapacity.adults
        ?? property.maxGuests
        ?? 1,
      1
    );
    const capacityChildren = ensureNumber(
      overrides.general?.capacity?.children
        ?? baseCapacity.children
        ?? 0,
      0
    );

    const bedrooms = ensureNumber(
      overrides.general?.bedrooms
        ?? baseGeneral.bedrooms
        ?? property.bedrooms
        ?? 0,
      0
    );
    const beds = ensureNumber(
      overrides.general?.beds
        ?? baseGeneral.beds
        ?? property.beds
        ?? baseGeneral.bedrooms
        ?? property.bedrooms
        ?? 0,
      0
    );
    const bathrooms = ensureNumber(
      overrides.general?.bathrooms
        ?? baseGeneral.bathrooms
        ?? property.bathrooms
        ?? 0,
      0
    );

    const generalOverrides = overrides.general || {};
    const general = {
      name: generalOverrides.name ?? baseGeneral.name ?? property.name ?? '',
      type: generalOverrides.type ?? baseGeneral.type ?? property.type ?? 'apartment',
      capacity: {
        adults: capacityAdults,
        children: capacityChildren
      },
      bedrooms,
      beds,
      bathrooms,
      surface: generalOverrides.surface ?? baseGeneral.surface ?? property.surface ?? null,
      shortDescription: (generalOverrides.shortDescription ?? baseShort)?.trim?.() ?? '',
      longDescription: (generalOverrides.longDescription ?? baseLong)?.trim?.() ?? ''
    };

    let address;
    if (typeof property.address === 'object' && property.address !== null) {
      address = {
        streetNumber: property.address.streetNumber ?? '',
        street: property.address.street ?? '',
        complement: property.address.complement ?? '',
        postalCode: property.address.postalCode ?? '',
        city: property.address.city ?? '',
        country: property.address.country ?? 'France',
        latitude: property.address.latitude ?? null,
        longitude: property.address.longitude ?? null,
        formatted: property.address.formatted ?? property.formattedAddress ?? ''
      };
    } else {
      address = {
        streetNumber: '',
        street: property.formattedAddress || '',
        complement: '',
        postalCode: '',
        city: '',
        country: 'France',
        latitude: null,
        longitude: null,
        formatted: property.formattedAddress || ''
      };
    }

    const addressOverrides = overrides.address || {};
    address = { ...address, ...addressOverrides };

    const onlinePresence = {
      airbnbUrl: property.onlinePresence?.airbnbUrl ?? property.airbnbUrl ?? '',
      bookingUrl: property.onlinePresence?.bookingUrl ?? property.bookingUrl ?? '',
      slug: property.onlinePresence?.slug ?? property.slug ?? ''
    };

    const mediasCategories = Array.isArray(property.medias?.categories)
      ? property.medias.categories.map((category) => ({
        ...category,
        media: Array.isArray(category.media)
          ? category.media.map((item) => ({ ...item }))
          : []
      }))
      : [];

    const operationsBase = property.operations
      ? {
        ...property.operations,
        deposit: property.operations.deposit
          ? { ...property.operations.deposit }
          : undefined,
        cityTax: property.operations.cityTax
          ? { ...property.operations.cityTax }
          : undefined,
        equipments: Array.isArray(property.operations.equipments)
          ? [...property.operations.equipments]
          : undefined
      }
      : {};

    if (!operationsBase.deposit) {
      delete operationsBase.deposit;
    }
    if (!operationsBase.cityTax) {
      delete operationsBase.cityTax;
    }
    if (!operationsBase.equipments) {
      delete operationsBase.equipments;
    }

    const operationsOverrides = overrides.operations || {};
    let operations = { ...operationsBase, ...operationsOverrides };

    if (operationsOverrides.deposit === null) {
      delete operations.deposit;
    } else if (operationsOverrides.deposit) {
      operations = {
        ...operations,
        deposit: {
          ...(operationsBase.deposit || {}),
          ...operationsOverrides.deposit
        }
      };
    }

    if (operationsOverrides.cityTax === null) {
      delete operations.cityTax;
    }

    if (operationsOverrides.equipments) {
      operations = {
        ...operations,
        equipments: Array.isArray(operationsOverrides.equipments)
          ? operationsOverrides.equipments
          : []
      };
    }

    const baseSettings = property.settings
      ? { ...property.settings }
      : {
        autoCheckIn: true,
        requireDeposit: false,
        depositAmount: 0,
        cleaningFee: 0,
        accessCode: '',
        checkInTime: '15:00',
        checkOutTime: '11:00'
      };

    const settingsOverrides = overrides.settings || {};
    const normalizedSettings = {
      ...baseSettings,
      ...settingsOverrides,
      autoCheckIn: Boolean(settingsOverrides.autoCheckIn ?? baseSettings.autoCheckIn),
      requireDeposit: Boolean(settingsOverrides.requireDeposit ?? baseSettings.requireDeposit),
      depositAmount: ensureNumber(
        settingsOverrides.depositAmount ?? baseSettings.depositAmount ?? 0,
        0
      ),
      cleaningFee: ensureNumber(
        settingsOverrides.cleaningFee ?? baseSettings.cleaningFee ?? 0,
        0
      )
    };

    if (!normalizedSettings.requireDeposit) {
      normalizedSettings.depositAmount = 0;
    }

    const baseAmenities = Array.isArray(property.amenities)
      ? [...property.amenities]
      : Array.isArray(property.operations?.equipments)
        ? [...property.operations.equipments]
        : [];
    const amenities = Array.isArray(overrides.amenities)
      ? overrides.amenities
      : baseAmenities;

    const seo = {
      metaTitle: property.seo?.metaTitle ?? '',
      metaDescription: property.seo?.metaDescription ?? '',
      ogImageId: property.seo?.ogImageId ?? ''
    };

    return {
      general,
      address,
      onlinePresence: { ...onlinePresence, ...(overrides.onlinePresence || {}) },
      medias: { categories: overrides.medias?.categories ?? mediasCategories },
      operations,
      settings: normalizedSettings,
      amenities,
      seo: { ...seo, ...(overrides.seo || {}) }
    };
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

  const handleStartShortDescriptionEdit = () => {
    if (!property) {
      return;
    }
    setShortDescriptionDraft(
      property.shortDescription
        || property.general?.shortDescription
        || property.description
        || ''
    );
    setShortDescriptionError(null);
    setIsEditingShortDescription(true);
  };

  const handleCancelShortDescriptionEdit = () => {
    if (!property) {
      setIsEditingShortDescription(false);
      return;
    }
    setShortDescriptionDraft(
      property.shortDescription
        || property.general?.shortDescription
        || property.description
        || ''
    );
    setShortDescriptionError(null);
    setIsEditingShortDescription(false);
  };

  const handleSaveShortDescription = async () => {
    if (!property) {
      return;
    }

    const trimmed = shortDescriptionDraft.trim();

    if (!trimmed) {
      setShortDescriptionError('La description courte est obligatoire.');
      return;
    }

    if (trimmed.length > 160) {
      setShortDescriptionError('La description courte doit contenir 160 caractères maximum.');
      return;
    }

    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    try {
      setIsSavingShortDescription(true);
      setShortDescriptionError(null);

      const payload = buildUpdatePayload({
        general: {
          shortDescription: trimmed,
          longDescription: property.general?.longDescription
            ?? property.description
            ?? ''
        }
      });

      if (!payload) {
        throw new Error('Impossible de préparer la mise à jour.');
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Impossible de sauvegarder la description courte');
      }

      const updated = await response.json();
      setProperty(updated);
      setShortDescriptionDraft(
        updated.shortDescription
          || updated.general?.shortDescription
          || trimmed
      );
      setLongDescriptionDraft(
        updated.description
          || updated.general?.longDescription
          || longDescriptionDraft
      );
      setIsEditingShortDescription(false);
    } catch (error) {
      console.error('Error saving short description:', error);
      setShortDescriptionError(error.message || 'Impossible de sauvegarder la description courte');
    } finally {
      setIsSavingShortDescription(false);
    }
  };

  const handleStartLongDescriptionEdit = () => {
    if (!property) {
      return;
    }
    setLongDescriptionDraft(
      property.description
        || property.general?.longDescription
        || ''
    );
    setLongDescriptionError(null);
    setIsEditingLongDescription(true);
  };

  const handleCancelLongDescriptionEdit = () => {
    if (!property) {
      setIsEditingLongDescription(false);
      return;
    }
    setLongDescriptionDraft(
      property.description
        || property.general?.longDescription
        || ''
    );
    setLongDescriptionError(null);
    setIsEditingLongDescription(false);
  };

  const handleSaveLongDescription = async () => {
    if (!property) {
      return;
    }

    const trimmed = longDescriptionDraft.trim();
    const currentShort = property.shortDescription
      || property.general?.shortDescription
      || '';

    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    try {
      setIsSavingLongDescription(true);
      setLongDescriptionError(null);

      const payload = buildUpdatePayload({
        general: {
          shortDescription: currentShort,
          longDescription: trimmed
        }
      });

      if (!payload) {
        throw new Error('Impossible de préparer la mise à jour.');
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Impossible de sauvegarder la description longue');
      }

      const updated = await response.json();
      setProperty(updated);
      setLongDescriptionDraft(
        updated.description
          || updated.general?.longDescription
          || trimmed
      );
      setShortDescriptionDraft(
        updated.shortDescription
          || updated.general?.shortDescription
          || shortDescriptionDraft
      );
      setIsEditingLongDescription(false);
    } catch (error) {
      console.error('Error saving long description:', error);
      setLongDescriptionError(error.message || 'Impossible de sauvegarder la description longue');
    } finally {
      setIsSavingLongDescription(false);
    }
  };

  const handleStartMainInfoEdit = () => {
    if (!property) {
      return;
    }
    setMainInfoError(null);
    setIsEditingMainInfo(true);
  };

  const handleCancelMainInfoEdit = () => {
    setIsEditingMainInfo(false);
    setMainInfoError(null);
  };

  const handleMainInfoChange = (field, value) => {
    setMainInfoDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleSaveMainInfo = async () => {
    if (!property) {
      return;
    }

    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const parseInteger = (value, { fallback = 0, min = 0 } = {}) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.max(value, min) : fallback;
      }
      const parsed = Number.parseInt(String(value).trim(), 10);
      if (Number.isFinite(parsed)) {
        return Math.max(parsed, min);
      }
      return fallback;
    };

    const adults = parseInteger(mainInfoDraft.adults, { fallback: 1, min: 1 });
    const children = parseInteger(mainInfoDraft.children, { fallback: 0, min: 0 });
    const bedrooms = parseInteger(mainInfoDraft.bedrooms, { fallback: 0, min: 0 });
    const beds = parseInteger(mainInfoDraft.beds, { fallback: bedrooms, min: 0 });
    const bathrooms = parseInteger(mainInfoDraft.bathrooms, { fallback: 0, min: 0 });

    if (!Number.isFinite(adults) || adults <= 0) {
      setMainInfoError('La capacité adultes doit être supérieure ou égale à 1.');
      return;
    }

    setIsSavingMainInfo(true);
    setMainInfoError(null);

    const addressOverride = {
      streetNumber: mainInfoDraft.streetNumber?.trim?.() ?? '',
      street: mainInfoDraft.street?.trim?.() ?? '',
      complement: mainInfoDraft.complement?.trim?.() ?? '',
      postalCode: mainInfoDraft.postalCode?.trim?.() ?? '',
      city: mainInfoDraft.city?.trim?.() ?? '',
      country: mainInfoDraft.country?.trim?.() || 'France',
      formatted: mainInfoDraft.formatted?.trim?.() || `${mainInfoDraft.streetNumber ? `${mainInfoDraft.streetNumber} ` : ''}${mainInfoDraft.street || ''}`.trim()
    };

    try {
      const payload = buildUpdatePayload({
        general: {
          capacity: {
            adults,
            children
          },
          bedrooms,
          beds,
          bathrooms
        },
        address: addressOverride
      });

      if (!payload) {
        throw new Error('Impossible de préparer la mise à jour.');
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Impossible de sauvegarder les informations principales');
      }

      const updated = await response.json();
      setProperty(updated);
      setIsEditingMainInfo(false);
    } catch (error) {
      console.error('Error saving main information:', error);
      setMainInfoError(error.message || 'Impossible de sauvegarder les informations principales');
    } finally {
      setIsSavingMainInfo(false);
    }
  };

  const handleStartQuickSettingsEdit = () => {
    if (!property) {
      return;
    }
    setQuickSettingsError(null);
    setIsEditingQuickSettings(true);
  };

  const handleCancelQuickSettingsEdit = () => {
    setIsEditingQuickSettings(false);
    setQuickSettingsError(null);
  };

  const handleQuickSettingsChange = (field, value) => {
    setQuickSettingsDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleSaveQuickSettings = async () => {
    if (!property) {
      return;
    }

    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const parsePositiveFloat = (value, fallback = null) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) && value >= 0 ? value : fallback;
      }
      const parsed = Number.parseFloat(String(value).trim());
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
      return fallback;
    };

    const depositType = quickSettingsDraft.depositType || 'none';
    const depositMethod = quickSettingsDraft.depositMethod === 'virement' ? 'virement' : 'empreinte';
    const depositAmount = parsePositiveFloat(quickSettingsDraft.depositAmount, null);
    const depositMin = parsePositiveFloat(quickSettingsDraft.depositMin, null);
    const depositMax = parsePositiveFloat(quickSettingsDraft.depositMax, null);
    const cleaningFee = parsePositiveFloat(quickSettingsDraft.cleaningFee, 0);

    if (depositType === 'fixed' && (depositAmount === null || depositAmount === undefined)) {
      setQuickSettingsError('Indiquez un montant de caution valide.');
      return;
    }

    if (depositType === 'range') {
      if (depositMin === null || depositMax === null) {
        setQuickSettingsError('Indiquez les montants minimum et maximum de la caution.');
        return;
      }
      if (depositMin > depositMax) {
        setQuickSettingsError('Le montant maximum doit être supérieur ou égal au minimum.');
        return;
      }
    }

    setIsSavingQuickSettings(true);
    setQuickSettingsError(null);

    const operationsOverrides = {
      checkInTime: quickSettingsDraft.checkInTime?.trim?.() || '15:00',
      checkInMode: quickSettingsDraft.checkInMode === 'in_person' ? 'in_person' : 'self',
      checkOutTime: quickSettingsDraft.checkOutTime?.trim?.() || '11:00',
      checkOutMode: quickSettingsDraft.checkOutMode === 'self' ? 'self' : 'in_person',
      smokingAllowed: Boolean(quickSettingsDraft.smokingAllowed),
      petsAllowed: Boolean(quickSettingsDraft.petsAllowed),
      partiesAllowed: Boolean(quickSettingsDraft.partiesAllowed)
    };

    if (depositType === 'none') {
      operationsOverrides.deposit = null;
    } else if (depositType === 'fixed') {
      operationsOverrides.deposit = {
        type: 'fixed',
        amount: depositAmount ?? 0,
        method: depositMethod
      };
    } else {
      operationsOverrides.deposit = {
        type: 'range',
        min: depositMin ?? 0,
        max: depositMax ?? 0,
        method: depositMethod
      };
    }

    const settingsOverrides = {
      accessCode: quickSettingsDraft.accessCode?.trim?.() ?? '',
      cleaningFee: cleaningFee ?? 0,
      requireDeposit: depositType !== 'none',
      depositAmount: depositType === 'fixed' ? (depositAmount ?? 0) : 0,
      checkInTime: operationsOverrides.checkInTime,
      checkOutTime: operationsOverrides.checkOutTime
    };

    try {
      const payload = buildUpdatePayload({
        operations: operationsOverrides,
        settings: settingsOverrides
      });

      if (!payload) {
        throw new Error('Impossible de préparer la mise à jour.');
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Impossible de sauvegarder les paramètres rapides');
      }

      const updated = await response.json();
      setProperty(updated);
      setIsEditingQuickSettings(false);
    } catch (error) {
      console.error('Error saving quick settings:', error);
      setQuickSettingsError(error.message || 'Impossible de sauvegarder les paramètres rapides');
    } finally {
      setIsSavingQuickSettings(false);
    }
  };

  const handleStartAmenitiesEdit = () => {
    setAmenitiesError(null);
    setIsEditingAmenities(true);
  };

  const handleCancelAmenitiesEdit = () => {
    setIsEditingAmenities(false);
    setAmenitiesError(null);
  };

  const handleSaveAmenities = async () => {
    if (!property) {
      return;
    }

    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const equipments = amenitiesDraft
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    setIsSavingAmenities(true);
    setAmenitiesError(null);

    try {
      const payload = buildUpdatePayload({
        amenities: equipments,
        operations: {
          equipments
        }
      });

      if (!payload) {
        throw new Error('Impossible de préparer la mise à jour.');
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Impossible de sauvegarder les équipements');
      }

      const updated = await response.json();
      setProperty(updated);
      setIsEditingAmenities(false);
    } catch (error) {
      console.error('Error saving amenities:', error);
      setAmenitiesError(error.message || 'Impossible de sauvegarder les équipements');
    } finally {
      setIsSavingAmenities(false);
    }
  };

  const handleStartPhotosEdit = () => {
    setPhotosError(null);
    setIsEditingPhotos(true);
  };

  const handleCancelPhotosEdit = () => {
    setIsEditingPhotos(false);
    setPhotosError(null);
  };

  const handlePhotoCategoryChange = (index, field, value) => {
    setPhotosDraft((previous) => {
      const next = previous.map((category, categoryIndex) => {
        if (categoryIndex !== index) {
          return category;
        }
        return {
          ...category,
          [field]: value
        };
      });
      return next;
    });
  };

  const handlePhotoMediaChange = (categoryIndex, mediaIndex, field, value) => {
    setPhotosDraft((previous) => {
      const next = previous.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) {
          return category;
        }

        const mediaList = Array.isArray(category.media) ? category.media : [];
        const updatedMedia = mediaList.map((mediaItem, currentMediaIndex) => {
          if (currentMediaIndex !== mediaIndex) {
            return mediaItem;
          }

          return {
            ...mediaItem,
            [field]: value
          };
        });

        return {
          ...category,
          media: updatedMedia
        };
      });

      return next;
    });
  };

  const handleSavePhotos = async () => {
    if (!property) {
      return;
    }

    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const sanitizedCategories = photosDraft.map((category) => ({
      ...category,
      label: category.label?.trim?.() ?? '',
      title: category.title?.trim?.() ?? '',
      shortDescription: category.shortDescription?.trim?.() ?? '',
      videoUrl: category.videoUrl?.trim?.() ?? category.videoUrl ?? '',
      media: Array.isArray(category.media)
        ? category.media.map((mediaItem) => ({
            ...mediaItem,
            alt: mediaItem.alt?.trim?.() ?? '',
            credit: mediaItem.credit?.trim?.() ?? '',
            hidden: Boolean(mediaItem.hidden),
            isCover: Boolean(mediaItem.isCover),
            isHero: Boolean(mediaItem.isHero)
          }))
        : []
    }));

    setIsSavingPhotos(true);
    setPhotosError(null);

    try {
      const payload = buildUpdatePayload({
        medias: {
          categories: sanitizedCategories
        }
      });

      if (!payload) {
        throw new Error('Impossible de préparer la mise à jour.');
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Impossible de sauvegarder les médias');
      }

      const updated = await response.json();
      setProperty(updated);
      setIsEditingPhotos(false);
    } catch (error) {
      console.error('Error saving medias:', error);
      setPhotosError(error.message || 'Impossible de sauvegarder les médias');
    } finally {
      setIsSavingPhotos(false);
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Description courte</h2>
                    <p className="text-sm text-gray-500">
                      Partagez une accroche percutante (160 caractères max).
                    </p>
                  </div>
                  {!isEditingShortDescription && (
                    <button
                      type="button"
                      onClick={handleStartShortDescriptionEdit}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingShortDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={shortDescriptionDraft}
                      onChange={(event) => setShortDescriptionDraft(event.target.value)}
                      maxLength={160}
                      rows={4}
                      className={`form-textarea ${shortDescriptionError ? 'border-danger-500' : ''}`}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{shortDescriptionDraft.length}/160 caractères</span>
                      {shortDescriptionError && (
                        <span className="text-danger-600">{shortDescriptionError}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelShortDescriptionEdit}
                        className="btn-secondary"
                        disabled={isSavingShortDescription}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveShortDescription}
                        className="btn-primary inline-flex items-center"
                        disabled={isSavingShortDescription}
                      >
                        {isSavingShortDescription && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {property.shortDescription
                      || property.general?.shortDescription
                      || 'Ajoutez une description courte pour présenter rapidement votre logement.'}
                  </p>
                )}
              </div>

              <div className="card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Description longue</h2>
                    <p className="text-sm text-gray-500">
                      Décrivez en détail l&apos;expérience proposée dans le logement.
                    </p>
                  </div>
                  {!isEditingLongDescription && (
                    <button
                      type="button"
                      onClick={handleStartLongDescriptionEdit}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingLongDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={longDescriptionDraft}
                      onChange={(event) => setLongDescriptionDraft(event.target.value)}
                      rows={8}
                      className={`form-textarea ${longDescriptionError ? 'border-danger-500' : ''}`}
                    />
                    {longDescriptionError && (
                      <p className="text-xs text-danger-600">{longDescriptionError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelLongDescriptionEdit}
                        className="btn-secondary"
                        disabled={isSavingLongDescription}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLongDescription}
                        className="btn-primary inline-flex items-center"
                        disabled={isSavingLongDescription}
                      >
                        {isSavingLongDescription && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {property.description
                      || property.general?.longDescription
                      || 'Ajoutez une description détaillée pour donner envie à vos voyageurs.'}
                  </p>
                )}
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Informations principales</h2>
                    <p className="text-sm text-gray-500">
                      Adresse et capacité affichées sur vos supports.
                    </p>
                  </div>
                  {!isEditingMainInfo && (
                    <button
                      type="button"
                      onClick={handleStartMainInfoEdit}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingMainInfo ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-gray-700">N°</label>
                        <input
                          type="text"
                          value={mainInfoDraft.streetNumber}
                          onChange={(event) => handleMainInfoChange('streetNumber', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-sm font-medium text-gray-700">Rue</label>
                        <input
                          type="text"
                          value={mainInfoDraft.street}
                          onChange={(event) => handleMainInfoChange('street', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Complément</label>
                      <input
                        type="text"
                        value={mainInfoDraft.complement}
                        onChange={(event) => handleMainInfoChange('complement', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-5">
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Code postal</label>
                        <input
                          type="text"
                          value={mainInfoDraft.postalCode}
                          onChange={(event) => handleMainInfoChange('postalCode', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-gray-700">Ville</label>
                        <input
                          type="text"
                          value={mainInfoDraft.city}
                          onChange={(event) => handleMainInfoChange('city', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pays</label>
                      <input
                        type="text"
                        value={mainInfoDraft.country}
                        onChange={(event) => handleMainInfoChange('country', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Adresse formatée</label>
                      <input
                        type="text"
                        value={mainInfoDraft.formatted}
                        onChange={(event) => handleMainInfoChange('formatted', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Adultes</label>
                        <input
                          type="number"
                          min={1}
                          value={mainInfoDraft.adults}
                          onChange={(event) => handleMainInfoChange('adults', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enfants</label>
                        <input
                          type="number"
                          min={0}
                          value={mainInfoDraft.children}
                          onChange={(event) => handleMainInfoChange('children', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Chambres</label>
                        <input
                          type="number"
                          min={0}
                          value={mainInfoDraft.bedrooms}
                          onChange={(event) => handleMainInfoChange('bedrooms', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Lits</label>
                        <input
                          type="number"
                          min={0}
                          value={mainInfoDraft.beds}
                          onChange={(event) => handleMainInfoChange('beds', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Salles de bain</label>
                        <input
                          type="number"
                          min={0}
                          value={mainInfoDraft.bathrooms}
                          onChange={(event) => handleMainInfoChange('bathrooms', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {mainInfoError && (
                      <p className="text-sm text-danger-600">{mainInfoError}</p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancelMainInfoEdit}
                        className="btn-secondary"
                        disabled={isSavingMainInfo}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMainInfo}
                        className="btn-primary inline-flex items-center"
                        disabled={isSavingMainInfo}
                      >
                        {isSavingMainInfo && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>

              <div className="card space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Paramètres rapides</h2>
                    <p className="text-sm text-gray-500">
                      Gérez les règles d&apos;accueil et vos frais annexes.
                    </p>
                  </div>
                  {!isEditingQuickSettings && (
                    <button
                      type="button"
                      onClick={handleStartQuickSettingsEdit}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingQuickSettings ? (
                  <div className="space-y-4 text-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Heure de check-in</label>
                        <input
                          type="time"
                          value={quickSettingsDraft.checkInTime}
                          onChange={(event) => handleQuickSettingsChange('checkInTime', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mode d&apos;arrivée</label>
                        <select
                          value={quickSettingsDraft.checkInMode}
                          onChange={(event) => handleQuickSettingsChange('checkInMode', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="self">Autonome</option>
                          <option value="in_person">En personne</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Heure de check-out</label>
                        <input
                          type="time"
                          value={quickSettingsDraft.checkOutTime}
                          onChange={(event) => handleQuickSettingsChange('checkOutTime', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mode de départ</label>
                        <select
                          value={quickSettingsDraft.checkOutMode}
                          onChange={(event) => handleQuickSettingsChange('checkOutMode', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="self">Autonome</option>
                          <option value="in_person">En personne</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Code d&apos;accès</label>
                      <input
                        type="text"
                        value={quickSettingsDraft.accessCode}
                        onChange={(event) => handleQuickSettingsChange('accessCode', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Type de caution</label>
                        <select
                          value={quickSettingsDraft.depositType}
                          onChange={(event) => handleQuickSettingsChange('depositType', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="none">Aucune</option>
                          <option value="fixed">Montant fixe</option>
                          <option value="range">Fourchette</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Méthode</label>
                        <select
                          value={quickSettingsDraft.depositMethod}
                          onChange={(event) => handleQuickSettingsChange('depositMethod', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          disabled={quickSettingsDraft.depositType === 'none'}
                        >
                          <option value="empreinte">Empreinte</option>
                          <option value="virement">Virement</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Frais de ménage (€)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={quickSettingsDraft.cleaningFee}
                          onChange={(event) => handleQuickSettingsChange('cleaningFee', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {quickSettingsDraft.depositType === 'fixed' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Montant de la caution (€)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={quickSettingsDraft.depositAmount}
                          onChange={(event) => handleQuickSettingsChange('depositAmount', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    )}
                    {quickSettingsDraft.depositType === 'range' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Caution minimum (€)</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={quickSettingsDraft.depositMin}
                            onChange={(event) => handleQuickSettingsChange('depositMin', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Caution maximum (€)</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={quickSettingsDraft.depositMax}
                            onChange={(event) => handleQuickSettingsChange('depositMax', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={quickSettingsDraft.smokingAllowed}
                          onChange={(event) => handleQuickSettingsChange('smokingAllowed', event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Fumeurs acceptés
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={quickSettingsDraft.petsAllowed}
                          onChange={(event) => handleQuickSettingsChange('petsAllowed', event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Animaux acceptés
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={quickSettingsDraft.partiesAllowed}
                          onChange={(event) => handleQuickSettingsChange('partiesAllowed', event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Fêtes autorisées
                      </label>
                    </div>
                    {quickSettingsError && (
                      <p className="text-sm text-danger-600">{quickSettingsError}</p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancelQuickSettingsEdit}
                        className="btn-secondary"
                        disabled={isSavingQuickSettings}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveQuickSettings}
                        className="btn-primary inline-flex items-center"
                        disabled={isSavingQuickSettings}
                      >
                        {isSavingQuickSettings && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Équipements</h2>
                  <p className="text-sm text-gray-500">Renseignez les équipements disponibles pour vos voyageurs.</p>
                </div>
                {!isEditingAmenities && (
                  <button
                    type="button"
                    onClick={handleStartAmenitiesEdit}
                    className="btn-secondary inline-flex items-center"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </button>
                )}
              </div>
              {isEditingAmenities ? (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    value={amenitiesDraft}
                    onChange={(event) => setAmenitiesDraft(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Wi-Fi\nClimatisation\nMachine à café"
                  />
                  <p className="text-xs text-gray-500">Saisissez un équipement par ligne ou séparez-les par une virgule.</p>
                  {amenitiesError && (
                    <p className="text-sm text-danger-600">{amenitiesError}</p>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancelAmenitiesEdit}
                      className="btn-secondary"
                      disabled={isSavingAmenities}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAmenities}
                      className="btn-primary inline-flex items-center"
                      disabled={isSavingAmenities}
                    >
                      {isSavingAmenities && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : property.amenities?.length ? (
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun équipement renseigné pour le moment.</p>
              )}
            </div>

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

            {(sortedCategories.length > 0 || isEditingPhotos) && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Galeries photos par catégorie</h2>
                    <p className="text-sm text-gray-600">
                      Retrouvez toutes les photos classées par univers pour mettre en valeur votre bien et partager une expérience immersive avec vos voyageurs.
                    </p>
                  </div>
                  {!isEditingPhotos ? (
                    <button
                      type="button"
                      onClick={handleStartPhotosEdit}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        type="button"
                        onClick={handleCancelPhotosEdit}
                        className="btn-secondary"
                        disabled={isSavingPhotos}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePhotos}
                        className="btn-primary inline-flex items-center"
                        disabled={isSavingPhotos}
                      >
                        {isSavingPhotos && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>
                {photosError && <p className="text-sm text-danger-600">{photosError}</p>}
                {isEditingPhotos ? (
                  photosDraft.length > 0 ? (
                    <div className="space-y-6">
                      {photosDraft.map((category, categoryIndex) => (
                        <div key={category.id || category.key || categoryIndex} className="card space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Libellé</label>
                              <input
                                type="text"
                                value={category.label || ''}
                                onChange={(event) => handlePhotoCategoryChange(categoryIndex, 'label', event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Titre</label>
                              <input
                                type="text"
                                value={category.title || ''}
                                onChange={(event) => handlePhotoCategoryChange(categoryIndex, 'title', event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Description courte</label>
                            <textarea
                              rows={3}
                              value={category.shortDescription || ''}
                              onChange={(event) => handlePhotoCategoryChange(categoryIndex, 'shortDescription', event.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Lien vidéo</label>
                            <input
                              type="url"
                              value={category.videoUrl || ''}
                              onChange={(event) => handlePhotoCategoryChange(categoryIndex, 'videoUrl', event.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-4">
                            {Array.isArray(category.media) && category.media.length > 0 ? (
                              category.media.map((mediaItem, mediaIndex) => (
                                <div
                                  key={mediaItem.id || mediaItem.url || mediaIndex}
                                  className="grid gap-4 sm:grid-cols-[180px_1fr]"
                                >
                                  <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
                                    {mediaItem.url ? (
                                      <Image
                                        src={mediaItem.url}
                                        alt={mediaItem.alt || `Photo ${mediaIndex + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="180px"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                                        Aucune image
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Texte alternatif</label>
                                      <input
                                        type="text"
                                        value={mediaItem.alt || ''}
                                        onChange={(event) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'alt', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Crédit photo</label>
                                      <input
                                        type="text"
                                        value={mediaItem.credit || ''}
                                        onChange={(event) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'credit', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(mediaItem.isCover)}
                                          onChange={(event) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'isCover', event.target.checked)}
                                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Photo de couverture
                                      </label>
                                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(mediaItem.isHero)}
                                          onChange={(event) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'isHero', event.target.checked)}
                                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Image héro
                                      </label>
                                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(mediaItem.hidden)}
                                          onChange={(event) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'hidden', event.target.checked)}
                                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Masquer
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">Aucune photo dans cette catégorie.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune galerie disponible pour le moment.</p>
                  )
                ) : (
                  <div className="space-y-6">
                    {sortedCategories.map((category) => {
                      const visibleMedia = category.media.filter((media) => media?.url && !media.hidden);
                      const videoPreviewUrl = category.videoPreview?.url
                        || category.videoPreviewUrl
                        || category.previewImage?.url
                        || category.previewUrl
                        || visibleMedia[0]?.thumbnailUrl
                        || visibleMedia[0]?.url
                        || null;

                      if (visibleMedia.length === 0 && !category.videoUrl) {
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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-3 rounded-full border border-primary-200 px-3 py-1 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                                  >
                                    <div className="relative h-10 w-16 overflow-hidden rounded-md bg-black/10">
                                      {videoPreviewUrl ? (
                                        <Image
                                          src={videoPreviewUrl}
                                          alt={`Aperçu vidéo ${category.label}`}
                                          fill
                                          className="object-cover"
                                          sizes="64px"
                                          unoptimized
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-primary-600">
                                          <Play className="h-5 w-5" />
                                        </div>
                                      )}
                                    </div>
                                    Voir la vidéo
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:p-0">
                                  <div className="overflow-hidden rounded-2xl bg-black">
                                    <AspectRatio ratio={16 / 9}>
                                      {isDirectVideoUrl(category.videoUrl) ? (
                                        <video
                                          src={category.videoUrl}
                                          controls
                                          autoPlay
                                          className="h-full w-full object-contain"
                                        />
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
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                          {visibleMedia.length > 0 && (
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

