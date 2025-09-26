'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Home,
  MapPin,
  Users,
  Bed,
  Bath,
  Calendar,
  Key,
  Globe,
  Link2,
  Copy,
  Play,
  Pencil,
  Loader2,
  Check,
  Info,
  Search,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Smartphone,
  Mail,
  Images
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { EQUIPMENT_GROUPS, EQUIPMENT_OPTION_MAP } from '@/lib/equipment-options';
import { PROPERTY_CALENDARS } from '@/lib/property-calendar-data';

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

const CALENDAR_WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const CALENDAR_STATUS_STYLES = {
  confirmed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  pending: 'border-amber-200 bg-amber-100 text-amber-700',
  maintenance: 'border-sky-200 bg-sky-100 text-sky-700',
  blocked: 'border-slate-200 bg-slate-100 text-slate-600'
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isDateWithinRange = (date, start, end) => {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return current >= start && current <= end;
};

const buildCalendarDays = (month) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const startDayOffset = (startOfMonth.getDay() + 6) % 7;
  const startDate = new Date(startOfMonth);
  startDate.setDate(startOfMonth.getDate() - startDayOffset);

  const totalDays = 42;
  const days = [];

  for (let i = 0; i < totalDays; i += 1) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    days.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === month.getMonth(),
      isToday: isSameDay(currentDate, new Date())
    });
  }

  return days;
};

const formatReservationDateRange = (startDate, endDate) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short'
  });

  return `${formatter.format(startDate)} → ${formatter.format(endDate)}`;
};

const formatReservationFullDate = (date) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);

const getReservationStyle = (status) => CALENDAR_STATUS_STYLES[status] ?? CALENDAR_STATUS_STYLES.confirmed;

const getReservationStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'maintenance':
      return 'Maintenance';
    case 'blocked':
      return 'Blocage';
    case 'confirmed':
    default:
      return 'Confirmée';
  }
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

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedReservation, setSelectedReservation] = useState(null);

  const [isEditingShortDescription, setIsEditingShortDescription] = useState(false);
  const [isEditingLongDescription, setIsEditingLongDescription] = useState(false);
  const [shortDescriptionDraft, setShortDescriptionDraft] = useState('');
  const [longDescriptionDraft, setLongDescriptionDraft] = useState('');
  const [isSavingShortDescription, setIsSavingShortDescription] = useState(false);
  const [isSavingLongDescription, setIsSavingLongDescription] = useState(false);
  const [shortDescriptionError, setShortDescriptionError] = useState(null);
  const [longDescriptionError, setLongDescriptionError] = useState(null);

  // blocs d'édition complémentaires
  const [isEditingMainInfo, setIsEditingMainInfo] = useState(false);
  const [mainInfoDraft, setMainInfoDraft] = useState({
    shortDescription: '',
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
  const [mainInfoFieldErrors, setMainInfoFieldErrors] = useState({});

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
  const [amenitiesDraft, setAmenitiesDraft] = useState([]);
  const [isSavingAmenities, setIsSavingAmenities] = useState(false);
  const [amenitiesError, setAmenitiesError] = useState(null);
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [photosDraft, setPhotosDraft] = useState([]);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState(null);

  useEffect(() => {
    if (!isEquipmentPickerOpen) {
      setEquipmentSearch('');
    }
  }, [isEquipmentPickerOpen]);

  const selectedHeroPosition = useMemo(() => {
    for (let categoryIndex = 0; categoryIndex < photosDraft.length; categoryIndex += 1) {
      const mediaList = Array.isArray(photosDraft[categoryIndex]?.media) ? photosDraft[categoryIndex].media : [];
      for (let mediaIndex = 0; mediaIndex < mediaList.length; mediaIndex += 1) {
        if (mediaList[mediaIndex]?.isHero) {
          return { categoryIndex, mediaIndex };
        }
      }
    }
    return null;
  }, [photosDraft]);

  const selectedCoverPosition = useMemo(() => {
    for (let categoryIndex = 0; categoryIndex < photosDraft.length; categoryIndex += 1) {
      const mediaList = Array.isArray(photosDraft[categoryIndex]?.media) ? photosDraft[categoryIndex].media : [];
      for (let mediaIndex = 0; mediaIndex < mediaList.length; mediaIndex += 1) {
        if (mediaList[mediaIndex]?.isCover) {
          return { categoryIndex, mediaIndex };
        }
      }
    }
    return null;
  }, [photosDraft]);

  const formattedAddress = useMemo(() => {
    if (!property) return '';

    if (typeof property.address === 'string') return property.address;
    if (property.formattedAddress) return property.formattedAddress;
    if (property.address?.formatted) return property.address.formatted;

    if (property.address && typeof property.address === 'object') {
      const { streetNumber, street, complement, postalCode, city, country } = property.address;
      return [
        [streetNumber, street].filter(Boolean).join(' '),
        complement,
        [postalCode, city].filter(Boolean).join(' '),
        country
      ]
        .filter(Boolean)
        .join(', ');
    }

    return '';
  }, [property]);

  const toPositiveNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const shortDescriptionValue =
    property?.shortDescription || property?.general?.shortDescription || property?.description || '';
  const capacityAdultsValue = toPositiveNumber(
    property?.general?.capacity?.adults ?? property?.capacity?.adults ?? property?.maxGuests ?? mainInfoDraft.adults,
    0
  );
  const capacityChildrenValue = toPositiveNumber(
    property?.general?.capacity?.children ?? property?.capacity?.children ?? mainInfoDraft.children,
    0
  );
  const bedroomsValue = toPositiveNumber(
    property?.general?.bedrooms ?? property?.bedrooms ?? mainInfoDraft.bedrooms,
    0
  );
  const bedsValue = toPositiveNumber(
    property?.general?.beds ?? property?.beds ?? property?.bedrooms ?? mainInfoDraft.beds,
    0
  );
  const bathroomsValue = toPositiveNumber(
    property?.general?.bathrooms ?? property?.bathrooms ?? mainInfoDraft.bathrooms,
    0
  );

  const operations = property?.operations || {};

  const depositText = useMemo(() => {
    if (!property) return 'Non défini';
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
  const checkInModeLabel =
    operations.checkInMode === 'self' ? 'Autonome' : operations.checkInMode === 'in_person' ? 'En personne' : null;
  const checkOutModeLabel =
    operations.checkOutMode === 'self' ? 'Autonome' : operations.checkOutMode === 'in_person' ? 'En personne' : null;

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;

      const token = localStorage.getItem('auth-token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const fetchOwner = async () => {
        try {
          const response = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
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
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
          router.replace('/auth/login');
          return;
        }

        if (!response.ok) {
          const message = response.status === 404 ? 'Propriété introuvable' : 'Impossible de charger la propriété';
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
      const publicBaseUrl = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://sejour.checkinly.fr').replace(
        /\/$/,
        ''
      );
      const slug = property.onlinePresence?.slug || property.slug || '';
      const propertySegment = slug || property.id;
      const originUrl = `${window.location.origin}/sejour/${property.userId}/${propertySegment}`;
      setMiniSiteUrl(originUrl);

      if (slug) {
        setMiniSiteDisplayUrl(`${publicBaseUrl}/${slug}`);
      } else {
        setMiniSiteDisplayUrl(`${publicBaseUrl}/${property.id}`);
      }
    }
  }, [property]);

  // Pré-remplissages des drafts quand la propriété change ou qu'on quitte un mode édition
  useEffect(() => {
    if (!property) return;

    const shortValue = property.shortDescription || property.general?.shortDescription || property.description || '';
    const longValue = property.description || property.general?.longDescription || '';

    if (!isEditingShortDescription) setShortDescriptionDraft(shortValue);
    if (!isEditingLongDescription) setLongDescriptionDraft(longValue);

    if (!isEditingMainInfo) {
      const baseAddress =
        typeof property.address === 'object' && property.address !== null
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
        shortDescription: shortValue?.slice(0, 160) ?? '',
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

      const activeDepositType =
        depositData.type && depositData.type !== 'none' ? depositData.type : settingsData.requireDeposit ? 'fixed' : 'none';

      setQuickSettingsDraft({
        checkInTime: operationsData.checkInTime || settingsData.checkInTime || '15:00',
        checkInMode: operationsData.checkInMode || 'self',
        checkOutTime: operationsData.checkOutTime || settingsData.checkOutTime || '11:00',
        checkOutMode: operationsData.checkOutMode || 'in_person',
        accessCode: settingsData.accessCode || '',
        depositType: activeDepositType,
        depositAmount:
          depositData.amount != null
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
      setAmenitiesDraft(
        equipments
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      );
    }

    if (!isEditingPhotos) {
      const categories = Array.isArray(property.medias?.categories)
        ? property.medias.categories.map((category) => ({
            ...category,
            media: Array.isArray(category.media) ? category.media.map((item) => ({ ...item })) : []
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

  const toggleEquipment = useCallback((value) => {
    setAmenitiesDraft((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(value)
        ? safePrev.filter((item) => item !== value)
        : [...safePrev, value];
    });
  }, []);

  const filteredEquipmentGroups = useMemo(() => {
    const term = equipmentSearch.trim().toLowerCase();
    if (!term) {
      return EQUIPMENT_GROUPS;
    }
    return EQUIPMENT_GROUPS.map((group) => {
      const options = group.options.filter((option) => {
        const searchable = [option.value, option.description, ...(option.keywords || [])]
          .join(' ')
          .toLowerCase();
        return searchable.includes(term);
      });
      return { ...group, options };
    }).filter((group) => group.options.length > 0);
  }, [equipmentSearch]);

  const renderSelectedEquipmentChips = useCallback(
    (withRemove = false) =>
      (Array.isArray(amenitiesDraft) ? amenitiesDraft : []).map((equipment) => {
        const option = EQUIPMENT_OPTION_MAP[equipment];
        const IconComponent = option?.icon || Info;
        return (
          <span
            key={`${equipment}-${withRemove ? 'editable' : 'readonly'}`}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
              withRemove
                ? 'border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
          >
            <IconComponent className="h-4 w-4" />
            <span>{equipment}</span>
            {withRemove && (
              <button
                type="button"
                onClick={() => toggleEquipment(equipment)}
                className="rounded-full p-0.5 text-primary-500 transition hover:bg-primary-100 hover:text-primary-700"
                aria-label={`Retirer ${equipment}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        );
      }),
    [amenitiesDraft, toggleEquipment]
  );

  const buildUpdatePayload = useCallback(
    (overrides = {}) => {
      if (!property) return null;

      const ensureNumber = (value, fallback) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const baseGeneral = property.general || {};
      const baseCapacity = baseGeneral.capacity || property.capacity || {};
      const baseShort = baseGeneral.shortDescription ?? property.shortDescription ?? '';
      const baseLong = baseGeneral.longDescription ?? property.description ?? '';

      const capacityAdults = ensureNumber(
        overrides.general?.capacity?.adults ?? baseCapacity.adults ?? property.maxGuests ?? 1,
        1
      );
      const capacityChildren = ensureNumber(overrides.general?.capacity?.children ?? baseCapacity.children ?? 0, 0);

      const bedrooms = ensureNumber(overrides.general?.bedrooms ?? baseGeneral.bedrooms ?? property.bedrooms ?? 0, 0);
      const beds = ensureNumber(
        overrides.general?.beds ?? baseGeneral.beds ?? property.beds ?? baseGeneral.bedrooms ?? property.bedrooms ?? 0,
        0
      );
      const bathrooms = ensureNumber(
        overrides.general?.bathrooms ?? baseGeneral.bathrooms ?? property.bathrooms ?? 0,
        0
      );

      const generalOverrides = overrides.general || {};
      const general = {
        name: generalOverrides.name ?? baseGeneral.name ?? property.name ?? '',
        type: generalOverrides.type ?? baseGeneral.type ?? property.type ?? 'apartment',
        capacity: { adults: capacityAdults, children: capacityChildren },
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
      address = { ...address, ...(overrides.address || {}) };

      const onlinePresence = {
        airbnbUrl: property.onlinePresence?.airbnbUrl ?? property.airbnbUrl ?? '',
        bookingUrl: property.onlinePresence?.bookingUrl ?? property.bookingUrl ?? '',
        slug: property.onlinePresence?.slug ?? property.slug ?? '',
        ...(overrides.onlinePresence || {})
      };

      const mediasCategories = Array.isArray(property.medias?.categories)
        ? property.medias.categories.map((category) => ({
            ...category,
            media: Array.isArray(category.media) ? category.media.map((item) => ({ ...item })) : []
          }))
        : [];

      // Normalisation des operations/settings
      const operationsBase = property.operations
        ? {
            ...property.operations,
            deposit: property.operations.deposit ? { ...property.operations.deposit } : undefined,
            cityTax: property.operations.cityTax ? { ...property.operations.cityTax } : undefined,
            equipments: Array.isArray(property.operations.equipments) ? [...property.operations.equipments] : undefined
          }
        : {};

      if (!operationsBase.deposit) delete operationsBase.deposit;
      if (!operationsBase.cityTax) delete operationsBase.cityTax;
      if (!operationsBase.equipments) delete operationsBase.equipments;

      const operationsOverrides = overrides.operations || {};
      let operationsNormalized = { ...operationsBase, ...operationsOverrides };

      if (operationsOverrides.deposit === null) {
        delete operationsNormalized.deposit;
      } else if (operationsOverrides.deposit) {
        operationsNormalized = {
          ...operationsNormalized,
          deposit: {
            ...(operationsBase.deposit || {}),
            ...operationsOverrides.deposit
          }
        };
      }

      if (operationsOverrides.cityTax === null) {
        delete operationsNormalized.cityTax;
      }

      if (operationsOverrides.equipments) {
        operationsNormalized = {
          ...operationsNormalized,
          equipments: Array.isArray(operationsOverrides.equipments) ? operationsOverrides.equipments : []
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
        depositAmount: ensureNumber(settingsOverrides.depositAmount ?? baseSettings.depositAmount ?? 0, 0),
        cleaningFee: ensureNumber(settingsOverrides.cleaningFee ?? baseSettings.cleaningFee ?? 0, 0)
      };
      if (!normalizedSettings.requireDeposit) normalizedSettings.depositAmount = 0;

      const baseAmenities = Array.isArray(property.amenities)
        ? [...property.amenities]
        : Array.isArray(property.operations?.equipments)
        ? [...property.operations.equipments]
        : [];
      const amenities = Array.isArray(overrides.amenities) ? overrides.amenities : baseAmenities;

      const seo = {
        metaTitle: property.seo?.metaTitle ?? '',
        metaDescription: property.seo?.metaDescription ?? '',
        ogImageId: property.seo?.ogImageId ?? '',
        ...(overrides.seo || {})
      };

      return {
        general,
        address,
        onlinePresence,
        medias: { categories: overrides.medias?.categories ?? mediasCategories },
        operations: operationsNormalized,
        settings: normalizedSettings,
        amenities,
        seo
      };
    },
    [property]
  );

  const heroPhoto = useMemo(() => {
    if (!property) return null;

    if (property.profilePhoto?.url) return property.profilePhoto;

    if (Array.isArray(property.descriptionPhotos)) {
      const heroInDescription = property.descriptionPhotos.find((photo) => photo?.isHero && photo?.url);
      if (heroInDescription) return heroInDescription;

      const firstDescriptionPhoto = property.descriptionPhotos.find((photo) => photo?.url);
      if (firstDescriptionPhoto) return firstDescriptionPhoto;
    }

    const categoryList = Array.isArray(property.medias?.categories) ? property.medias.categories : [];
    const firstCategoryWithMedia = categoryList.find(
      (category) => Array.isArray(category.media) && category.media.some((m) => m?.url)
    );
    if (firstCategoryWithMedia) {
      const firstVisibleMedia = firstCategoryWithMedia.media.find((m) => m?.url && !m.hidden);
      if (firstVisibleMedia) return firstVisibleMedia;
    }

    return null;
  }, [property]);

  const propertyCalendarData = useMemo(() => {
    if (!property) return null;

    const calendarFromMock = PROPERTY_CALENDARS.find((item) => item.id === property.id);
    if (calendarFromMock) return calendarFromMock;

    const locationParts = [property?.address?.city, property?.address?.country].filter(Boolean);

    const rawOccupancy =
      property?.operations?.metrics?.occupancyRate ??
      property?.operations?.occupancyRate ??
      property?.operations?.overview?.occupancyRate ??
      null;

    let occupancyRate = null;
    if (typeof rawOccupancy === 'number' && Number.isFinite(rawOccupancy)) {
      occupancyRate = Math.round(rawOccupancy);
    } else if (typeof rawOccupancy === 'string') {
      const parsed = Number.parseFloat(rawOccupancy);
      if (Number.isFinite(parsed)) occupancyRate = Math.round(parsed);
    }

    const reservations = Array.isArray(property?.operations?.calendar?.reservations)
      ? property.operations.calendar.reservations
      : [];

    const housekeepingPartner =
      property?.operations?.housekeeping?.partner ||
      property?.operations?.housekeeping?.provider ||
      property?.operations?.housekeeping?.company ||
      null;

    return {
      id: property.id,
      name: property.name || property.general?.name || 'Logement',
      location: locationParts.join(' • '),
      image: heroPhoto?.url ?? null,
      occupancyRate,
      housekeepingPartner,
      reservations
    };
  }, [heroPhoto?.url, property]);

  const reservationsWithDates = useMemo(() => {
    if (!propertyCalendarData) return [];

    return propertyCalendarData.reservations
      .map((reservation) => {
        if (!reservation) return null;
        const startDate =
          reservation.startDate instanceof Date
            ? reservation.startDate
            : new Date(reservation.startDate);
        const endDate =
          reservation.endDate instanceof Date ? reservation.endDate : new Date(reservation.endDate);

        if (Number.isNaN(startDate?.getTime()) || Number.isNaN(endDate?.getTime())) {
          return null;
        }

        return { ...reservation, startDate, endDate };
      })
      .filter(Boolean)
      .sort((a, b) => a.startDate - b.startDate);
  }, [propertyCalendarData]);

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric'
      }),
    []
  );
  const hasReservations = reservationsWithDates.length > 0;

  useEffect(() => {
    if (!hasReservations) {
      setSelectedReservation(null);
    }
  }, [hasReservations]);

  useEffect(() => {
    if (!property?.id) return;
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedReservation(null);
  }, [property?.id]);

  useEffect(() => {
    if (!isCalendarOpen) return;
    if (reservationsWithDates.length === 0) return;

    const earliestReservation = reservationsWithDates.reduce((earliest, current) =>
      current.startDate < earliest.startDate ? current : earliest
    );

    const target = new Date(
      earliestReservation.startDate.getFullYear(),
      earliestReservation.startDate.getMonth(),
      1
    );

    setCalendarMonth((prev) =>
      prev.getFullYear() === target.getFullYear() && prev.getMonth() === target.getMonth()
        ? prev
        : target
    );
  }, [isCalendarOpen, reservationsWithDates]);

  const sortedCategories = useMemo(() => {
    const categoryList = Array.isArray(property?.medias?.categories) ? property.medias.categories : [];
    if (!Array.isArray(categoryList)) return [];

    return [...categoryList]
      .map((category) => ({
        ...category,
        media: Array.isArray(category.media) ? [...category.media].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0)) : []
      }))
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
  }, [property]);

  const ownerName = useMemo(() => {
    if (!ownerProfile) return '';
    const parts = [ownerProfile.firstName, ownerProfile.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : ownerProfile.email;
  }, [ownerProfile]);

  const ownerInitials = useMemo(() => {
    if (!ownerProfile) return '';
    const initialsSource = ownerProfile.firstName || ownerProfile.lastName || ownerProfile.email || '';
    if (!initialsSource) return '';
    const matches = initialsSource
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase());
    return matches.length >= 2 ? `${matches[0]}${matches[1]}` : matches[0] || initialsSource.charAt(0).toUpperCase();
  }, [ownerProfile]);

  const handleGoBack = () => router.push('/dashboard/properties');
  const handleOpenSettings = () => property?.id && router.push(`/dashboard/properties/${property.id}/settings`);
  const handleOpenCalendar = () => {
    if (!property) return;
    setIsCalendarOpen(true);
  };
  const handleCalendarMonthChange = (direction) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction);
      return next;
    });
  };
  const handleCalendarDialogChange = (open) => {
    setIsCalendarOpen(open);
    if (!open) {
      setSelectedReservation(null);
    }
  };
  const handlePublish = () => miniSiteUrl && window.open(miniSiteUrl, '_blank', 'noopener,noreferrer');

  const handleCopyMiniSiteUrl = async () => {
    const urlToCopy = miniSiteDisplayUrl || miniSiteUrl;
    if (!urlToCopy || typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setIsMiniSiteCopied(true);
      setTimeout(() => setIsMiniSiteCopied(false), 2000);
    } catch (copyError) {
      console.error('Failed to copy mini site URL:', copyError);
    }
  };

  const displayMiniSiteUrl = miniSiteDisplayUrl || miniSiteUrl;

  // --- Short description
  const handleStartShortDescriptionEdit = () => {
    if (!property) return;
    setShortDescriptionDraft(property.shortDescription || property.general?.shortDescription || property.description || '');
    setShortDescriptionError(null);
    setIsEditingShortDescription(true);
  };

  const handleCancelShortDescriptionEdit = () => {
    if (!property) {
      setIsEditingShortDescription(false);
      return;
    }
    setShortDescriptionDraft(property.shortDescription || property.general?.shortDescription || property.description || '');
    setShortDescriptionError(null);
    setIsEditingShortDescription(false);
  };

  const handleSaveShortDescription = async () => {
    if (!property) return;

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
          longDescription: property.general?.longDescription ?? property.description ?? ''
        }
      });
      if (!payload) throw new Error('Impossible de préparer la mise à jour.');

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      setShortDescriptionDraft(updated.shortDescription || updated.general?.shortDescription || trimmed);
      setLongDescriptionDraft(updated.description || updated.general?.longDescription || longDescriptionDraft);
      setIsEditingShortDescription(false);
    } catch (e) {
      console.error('Error saving short description:', e);
      setShortDescriptionError(e.message || 'Impossible de sauvegarder la description courte');
    } finally {
      setIsSavingShortDescription(false);
    }
  };

  // --- Long description
  const handleStartLongDescriptionEdit = () => {
    if (!property) return;
    setLongDescriptionDraft(property.description || property.general?.longDescription || '');
    setLongDescriptionError(null);
    setIsEditingLongDescription(true);
  };

  const handleCancelLongDescriptionEdit = () => {
    if (!property) {
      setIsEditingLongDescription(false);
      return;
    }
    setLongDescriptionDraft(property.description || property.general?.longDescription || '');
    setLongDescriptionError(null);
    setIsEditingLongDescription(false);
  };

  const handleSaveLongDescription = async () => {
    if (!property) return;

    const trimmed = longDescriptionDraft.trim();
    const currentShort = property.shortDescription || property.general?.shortDescription || '';

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
      if (!payload) throw new Error('Impossible de préparer la mise à jour.');

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      setLongDescriptionDraft(updated.description || updated.general?.longDescription || trimmed);
      setShortDescriptionDraft(updated.shortDescription || updated.general?.shortDescription || shortDescriptionDraft);
      setIsEditingLongDescription(false);
    } catch (e) {
      console.error('Error saving long description:', e);
      setLongDescriptionError(e.message || 'Impossible de sauvegarder la description longue');
    } finally {
      setIsSavingLongDescription(false);
    }
  };

  // --- Main info (adresse/capacité)
  const handleStartMainInfoEdit = () => {
    if (!property) return;
    setMainInfoError(null);
    setMainInfoFieldErrors({});
    setIsEditingMainInfo(true);
  };
  const handleCancelMainInfoEdit = () => {
    setIsEditingMainInfo(false);
    setMainInfoError(null);
    setMainInfoFieldErrors({});
  };
  const handleMainInfoChange = (field, value) => {
    setMainInfoDraft((prev) => ({ ...prev, [field]: value }));
    setMainInfoFieldErrors((prev) => {
      if (!prev || !prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const handleSaveMainInfo = async () => {
    if (!property) return;

    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const parseInteger = (value, { fallback = 0, min = 0 } = {}) => {
      if (typeof value === 'number') return Number.isFinite(value) ? Math.max(value, min) : fallback;
      const parsed = Number.parseInt(String(value).trim(), 10);
      return Number.isFinite(parsed) ? Math.max(parsed, min) : fallback;
    };

    const trimmedShortDescription = mainInfoDraft.shortDescription?.toString().trim() ?? '';
    const trimmedStreetNumber = mainInfoDraft.streetNumber?.toString().trim() ?? '';
    const trimmedStreet = mainInfoDraft.street?.toString().trim() ?? '';
    const trimmedComplement = mainInfoDraft.complement?.toString().trim() ?? '';
    const trimmedPostalCode = mainInfoDraft.postalCode?.toString().trim() ?? '';
    const trimmedCity = mainInfoDraft.city?.toString().trim() ?? '';
    const trimmedCountry = mainInfoDraft.country?.toString().trim() || 'France';
    const trimmedFormatted =
      mainInfoDraft.formatted?.toString().trim() ||
      `${trimmedStreetNumber ? `${trimmedStreetNumber} ` : ''}${trimmedStreet}`.trim();

    const fieldErrors = {};

    if (!trimmedShortDescription) {
      fieldErrors.shortDescription = 'La description courte est requise (160 caractères max).';
    } else if (trimmedShortDescription.length > 160) {
      fieldErrors.shortDescription = 'La description courte doit contenir 160 caractères maximum.';
    }

    if (!trimmedStreet) {
      fieldErrors.street = 'Le type et nom de voie sont requis.';
    }
    if (!trimmedPostalCode) {
      fieldErrors.postalCode = 'Le code postal est requis.';
    } else if (!/^\d{5}$/.test(trimmedPostalCode)) {
      fieldErrors.postalCode = 'Le code postal doit comporter 5 chiffres.';
    }
    if (!trimmedCity) {
      fieldErrors.city = 'La ville est requise.';
    }

    const adults = parseInteger(mainInfoDraft.adults, { fallback: 1, min: 1 });
    const children = parseInteger(mainInfoDraft.children, { fallback: 0, min: 0 });
    const bedrooms = parseInteger(mainInfoDraft.bedrooms, { fallback: 0, min: 0 });
    const beds = parseInteger(mainInfoDraft.beds, { fallback: bedrooms, min: 0 });
    const bathrooms = parseInteger(mainInfoDraft.bathrooms, { fallback: 0, min: 0 });

    if (!Number.isFinite(adults) || adults <= 0) {
      fieldErrors.adults = 'La capacité adultes doit être supérieure ou égale à 1.';
    }
    if (!Number.isFinite(children) || children < 0) {
      fieldErrors.children = 'Le nombre d’enfants doit être supérieur ou égal à 0.';
    }
    if (!Number.isFinite(bedrooms) || bedrooms < 0) {
      fieldErrors.bedrooms = 'Le nombre de chambres doit être supérieur ou égal à 0.';
    }
    if (!Number.isFinite(beds) || beds < 0) {
      fieldErrors.beds = 'Le nombre de lits doit être supérieur ou égal à 0.';
    }
    if (!Number.isFinite(bathrooms) || bathrooms < 0) {
      fieldErrors.bathrooms = 'Le nombre de salles de bain doit être supérieur ou égal à 0.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setMainInfoFieldErrors(fieldErrors);
      setMainInfoError('Certaines informations sont manquantes ou invalides.');
      return;
    }

    setIsSavingMainInfo(true);
    setMainInfoError(null);
    setMainInfoFieldErrors({});

    const addressOverride = {
      streetNumber: trimmedStreetNumber,
      street: trimmedStreet,
      complement: trimmedComplement,
      postalCode: trimmedPostalCode,
      city: trimmedCity,
      country: trimmedCountry,
      formatted: trimmedFormatted
    };

    try {
      const payload = buildUpdatePayload({
        general: {
          shortDescription: trimmedShortDescription,
          capacity: { adults, children },
          bedrooms,
          beds,
          bathrooms
        },
        address: addressOverride
      });
      if (!payload) throw new Error('Impossible de préparer la mise à jour.');

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      setShortDescriptionDraft(
        updated.shortDescription || updated.general?.shortDescription || trimmedShortDescription || shortDescriptionDraft
      );
      setIsEditingMainInfo(false);
    } catch (e) {
      console.error('Error saving main information:', e);
      setMainInfoError(e.message || 'Impossible de sauvegarder les informations principales');
    } finally {
      setIsSavingMainInfo(false);
    }
  };

  // --- Quick settings
  const handleStartQuickSettingsEdit = () => {
    if (!property) return;
    setQuickSettingsError(null);
    setIsEditingQuickSettings(true);
  };
  const handleCancelQuickSettingsEdit = () => {
    setIsEditingQuickSettings(false);
    setQuickSettingsError(null);
  };
  const handleQuickSettingsChange = (field, value) => {
    setQuickSettingsDraft((prev) => ({ ...prev, [field]: value }));
  };
  const handleSaveQuickSettings = async () => {
    if (!property) return;

    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const parsePositiveFloat = (value, fallback = null) => {
      if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : fallback;
      const parsed = Number.parseFloat(String(value).trim());
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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
      operationsOverrides.deposit = { type: 'fixed', amount: depositAmount ?? 0, method: depositMethod };
    } else {
      operationsOverrides.deposit = { type: 'range', min: depositMin ?? 0, max: depositMax ?? 0, method: depositMethod };
    }

    const settingsOverrides = {
      accessCode: quickSettingsDraft.accessCode?.trim?.() ?? '',
      cleaningFee: cleaningFee ?? 0,
      requireDeposit: depositType !== 'none',
      depositAmount: depositType === 'fixed' ? depositAmount ?? 0 : 0,
      checkInTime: operationsOverrides.checkInTime,
      checkOutTime: operationsOverrides.checkOutTime
    };

    try {
      const payload = buildUpdatePayload({ operations: operationsOverrides, settings: settingsOverrides });
      if (!payload) throw new Error('Impossible de préparer la mise à jour.');

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    } catch (e) {
      console.error('Error saving quick settings:', e);
      setQuickSettingsError(e.message || 'Impossible de sauvegarder les paramètres rapides');
    } finally {
      setIsSavingQuickSettings(false);
    }
  };

  // --- Amenities
  const handleStartAmenitiesEdit = () => {
    setAmenitiesError(null);
    setIsEditingAmenities(true);
  };
  const handleCancelAmenitiesEdit = () => {
    setIsEditingAmenities(false);
    setAmenitiesError(null);
  };
  const handleSaveAmenities = async () => {
    if (!property) return;

    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const equipments = Array.from(
      new Set(
        (Array.isArray(amenitiesDraft) ? amenitiesDraft : [])
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      )
    );

    setIsSavingAmenities(true);
    setAmenitiesError(null);

    try {
      const payload = buildUpdatePayload({
        amenities: equipments,
        operations: { equipments }
      });
      if (!payload) throw new Error('Impossible de préparer la mise à jour.');

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    } catch (e) {
      console.error('Error saving amenities:', e);
      setAmenitiesError(e.message || 'Impossible de sauvegarder les équipements');
    } finally {
      setIsSavingAmenities(false);
    }
  };

  // --- Photos
  const handleStartPhotosEdit = () => {
    setPhotosError(null);
    setIsEditingPhotos(true);
  };
  const handleCancelPhotosEdit = () => {
    setIsEditingPhotos(false);
    setPhotosError(null);
  };
  const handlePhotoCategoryChange = (index, field, value) => {
    setPhotosDraft((prev) =>
      prev.map((category, i) => (i === index ? { ...category, [field]: value } : category))
    );
  };
  const handlePhotoMediaChange = (categoryIndex, mediaIndex, field, value) => {
    setPhotosDraft((prev) =>
      prev.map((category, i) => {
        const mediaList = Array.isArray(category.media) ? category.media : [];

        if (i === categoryIndex) {
          const updatedMedia = mediaList.map((mediaItem, j) => {
            if (j === mediaIndex) {
              return { ...mediaItem, [field]: value };
            }
            if (field === 'isHero' && value && mediaItem.isHero) {
              return { ...mediaItem, isHero: false };
            }
            if (field === 'isCover' && value && mediaItem.isCover) {
              return { ...mediaItem, isCover: false };
            }
            return mediaItem;
          });
          return { ...category, media: updatedMedia };
        }

        if (field === 'isHero' && value) {
          let hasChange = false;
          const updatedMedia = mediaList.map((mediaItem) => {
            if (mediaItem.isHero) {
              hasChange = true;
              return { ...mediaItem, isHero: false };
            }
            return mediaItem;
          });
          return hasChange ? { ...category, media: updatedMedia } : category;
        }

        if (field === 'isCover' && value) {
          let hasChange = false;
          const updatedMedia = mediaList.map((mediaItem) => {
            if (mediaItem.isCover) {
              hasChange = true;
              return { ...mediaItem, isCover: false };
            }
            return mediaItem;
          });
          return hasChange ? { ...category, media: updatedMedia } : category;
        }

        return category;
      })
    );
  };
  const handleSavePhotos = async () => {
    if (!property) return;

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
        ? category.media.map((item) => ({
            ...item,
            alt: item.alt?.trim?.() ?? '',
            credit: item.credit?.trim?.() ?? '',
            hidden: Boolean(item.hidden),
            isCover: Boolean(item.isCover),
            isHero: Boolean(item.isHero)
          }))
        : []
    }));

    setIsSavingPhotos(true);
    setPhotosError(null);

    try {
      const payload = buildUpdatePayload({ medias: { categories: sanitizedCategories } });
      if (!payload) throw new Error('Impossible de préparer la mise à jour.');

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    } catch (e) {
      console.error('Error saving medias:', e);
      setPhotosError(e.message || 'Impossible de sauvegarder les médias');
    } finally {
      setIsSavingPhotos(false);
    }
  };

  return (
    <>
      <Dialog open={isCalendarOpen} onOpenChange={handleCalendarDialogChange}>
        <DialogContent className="max-w-5xl overflow-hidden border-none bg-transparent p-0 shadow-none">
          {propertyCalendarData ? (
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="relative h-56 w-full bg-gray-100 sm:h-64">
                {propertyCalendarData.image ? (
                  <Image
                    src={propertyCalendarData.image}
                    alt={propertyCalendarData.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 60vw, 100vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 via-white to-primary-50 text-primary-600">
                    <Home className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 text-white sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-white/70">
                      Calendrier du logement
                    </p>
                    <h2 className="text-2xl font-semibold">{propertyCalendarData.name}</h2>
                    {propertyCalendarData.location && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
                        <MapPin className="h-4 w-4" />
                        {propertyCalendarData.location}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {typeof propertyCalendarData.occupancyRate === 'number' && (
                      <Badge className="bg-white/90 text-gray-900" variant="outline">
                        Taux d'occupation {propertyCalendarData.occupancyRate}%
                      </Badge>
                    )}
                    {propertyCalendarData.housekeepingPartner && (
                      <Badge className="bg-white/90 text-gray-900" variant="outline">
                        Ménage : {propertyCalendarData.housekeepingPartner}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
                      Planning des réservations
                    </p>
                    <h3 className="text-2xl font-semibold text-gray-900">{propertyCalendarData.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Mois affiché : {monthFormatter.format(calendarMonth)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleCalendarMonthChange(-1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      aria-label="Mois précédent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Mois</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {monthFormatter.format(calendarMonth)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCalendarMonthChange(1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      aria-label="Mois suivant"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Cliquer sur une réservation pour afficher le détail.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmée
                    </span>
                    <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> En attente
                    </span>
                    <span className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-100 px-2.5 py-0.5 font-medium text-sky-700">
                      <span className="h-2 w-2 rounded-full bg-sky-500" /> Maintenance
                    </span>
                    <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-slate-500" /> Blocage
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px rounded-xl bg-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {CALENDAR_WEEK_DAYS.map((day) => (
                    <div key={day} className="bg-white px-3 py-2 text-center">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-200">
                  {calendarDays.map(({ date, isCurrentMonth, isToday }) => {
                    const dayReservations = reservationsWithDates.filter((reservation) =>
                      isDateWithinRange(date, reservation.startDate, reservation.endDate)
                    );

                    const containerClasses = ['min-h-[110px]', 'bg-white', 'p-2', 'transition-colors'];
                    if (!isCurrentMonth) {
                      containerClasses.push('bg-slate-50', 'text-slate-300');
                    }
                    if (isToday) {
                      containerClasses.push('border-2', 'border-primary/60');
                    }

                    const dateClasses = ['text-sm'];
                    if (!isCurrentMonth) {
                      dateClasses.push('text-slate-300');
                    }

                    return (
                      <div key={date.toISOString()} className={containerClasses.join(' ')}>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span className={dateClasses.join(' ')}>{date.getDate()}</span>
                          {isToday && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                              Aujourd'hui
                            </span>
                          )}
                        </div>

                        <div className="mt-1 space-y-1">
                          {dayReservations.slice(0, 3).map((reservation) => (
                            <button
                              key={reservation.id}
                              type="button"
                              onClick={() => setSelectedReservation(reservation)}
                              className={`group flex w-full items-center justify-between rounded-md border px-2 py-1 text-left text-[11px] font-medium transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${getReservationStyle(reservation.status)}`}
                            >
                              <span className="truncate">{reservation.guestName}</span>
                              <span className="ml-2 flex items-center text-[10px] font-normal opacity-75">
                                <Clock className="mr-1 h-3 w-3" />
                                {reservation.checkInTime ?? '—'}
                              </span>
                            </button>
                          ))}
                          {dayReservations.length > 3 && (
                            <div className="text-[10px] text-slate-500">
                              +{dayReservations.length - 3} autres réservations
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!hasReservations ? (
                  <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    Aucune réservation enregistrée pour ce logement.
                  </div>
                ) : selectedReservation ? (
                  <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedReservation.guestName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatReservationDateRange(
                            selectedReservation.startDate,
                            selectedReservation.endDate
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Arrivée {formatReservationFullDate(selectedReservation.startDate)}
                        </p>
                      </div>
                      <Badge
                        className={`capitalize border ${getReservationStyle(selectedReservation.status)}`}
                        variant="outline"
                      >
                        {getReservationStatusLabel(selectedReservation.status)}
                      </Badge>
                    </div>
                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      {selectedReservation.channel && (
                        <p>
                          <span className="font-medium text-gray-900">Canal :</span>{' '}
                          {selectedReservation.channel}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        {selectedReservation.guests ?? 0} voyageurs
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        Check-in {selectedReservation.checkInTime ?? '—'} • Check-out{' '}
                        {selectedReservation.checkOutTime ?? '—'}
                      </p>
                      {selectedReservation.phone && (
                        <p className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-gray-500" />
                          {selectedReservation.phone}
                        </p>
                      )}
                      {selectedReservation.email && (
                        <p className="flex items-center gap-2 break-all">
                          <Mail className="h-4 w-4 text-gray-500" />
                          {selectedReservation.email}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-3">
                      <div
                        className={`rounded-md border p-2 ${
                          selectedReservation.depositPaid
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        Caution {selectedReservation.depositPaid ? 'encaissée' : 'en attente'}
                      </div>
                      <div
                        className={`rounded-md border p-2 ${
                          selectedReservation.inventorySigned
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        Inventaire {selectedReservation.inventorySigned ? 'signé' : 'non signé'}
                      </div>
                      <div
                        className={`rounded-md border p-2 ${
                          selectedReservation.welcomePack
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        Pack d'accueil {selectedReservation.welcomePack ? 'prêt' : 'à prévoir'}
                      </div>
                    </div>
                    {selectedReservation.notes && (
                      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Notes opérationnelles
                        </p>
                        <p className="mt-2 text-sm text-gray-700">{selectedReservation.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    Sélectionnez une réservation pour afficher ses détails.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900">Calendrier indisponible</h2>
              <p>Impossible de charger le calendrier pour ce logement.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="flex items-center gap-2">
              <button
                onClick={handlePublish}
                disabled={!miniSiteUrl}
                className="btn-icon border-primary-200 text-primary-700 hover:bg-primary-50"
                title="Voir le mini-site"
              >
                <Eye className="h-5 w-5" />
                <span className="sr-only">Voir le mini-site</span>
              </button>
              <button
                onClick={handleOpenCalendar}
                className="btn-icon"
                title="Ouvrir le calendrier"
              >
                <Calendar className="h-5 w-5" />
                <span className="sr-only">Calendrier</span>
              </button>
              <button
                onClick={handleOpenSettings}
                className="btn-icon bg-primary-600 text-white border-primary-600 hover:bg-primary-700"
                title="Modifier la propriété"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Modifier la propriété</span>
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
            {/* Hero */}
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
                    <p className="text-base font-semibold">{ownerName || 'Votre profil'}</p>
                    {ownerProfile?.profile?.jobTitle && (
                      <p className="text-xs text-white/70">{ownerProfile.profile.jobTitle}</p>
                    )}
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      property.status === 'inactive' ? 'bg-gray-200 text-gray-700' : 'bg-success-500/90 text-white'
                    }`}
                  >
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

            {/* Descriptions */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Courte */}
              <div className="card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Description courte</h2>
                    <p className="text-sm text-gray-500">Partagez une accroche percutante (160 caractères max).</p>
                  </div>
                  {!isEditingShortDescription && (
                    <button type="button" onClick={handleStartShortDescriptionEdit} className="btn-secondary inline-flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingShortDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={shortDescriptionDraft}
                      onChange={(e) => setShortDescriptionDraft(e.target.value)}
                      maxLength={160}
                      rows={4}
                      className={`form-textarea ${shortDescriptionError ? 'border-danger-500' : ''}`}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{shortDescriptionDraft.length}/160 caractères</span>
                      {shortDescriptionError && <span className="text-danger-600">{shortDescriptionError}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleCancelShortDescriptionEdit} className="btn-secondary" disabled={isSavingShortDescription}>
                        Annuler
                      </button>
                      <button type="button" onClick={handleSaveShortDescription} className="btn-primary inline-flex items-center" disabled={isSavingShortDescription}>
                        {isSavingShortDescription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {property.shortDescription || property.general?.shortDescription || 'Ajoutez une description courte pour présenter rapidement votre logement.'}
                  </p>
                )}
              </div>

              {/* Longue */}
              <div className="card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Description longue</h2>
                    <p className="text-sm text-gray-500">Décrivez en détail l&apos;expérience proposée dans le logement.</p>
                  </div>
                  {!isEditingLongDescription && (
                    <button type="button" onClick={handleStartLongDescriptionEdit} className="btn-secondary inline-flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingLongDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={longDescriptionDraft}
                      onChange={(e) => setLongDescriptionDraft(e.target.value)}
                      rows={8}
                      className={`form-textarea ${longDescriptionError ? 'border-danger-500' : ''}`}
                    />
                    {longDescriptionError && <p className="text-xs text-danger-600">{longDescriptionError}</p>}
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleCancelLongDescriptionEdit} className="btn-secondary" disabled={isSavingLongDescription}>
                        Annuler
                      </button>
                      <button type="button" onClick={handleSaveLongDescription} className="btn-primary inline-flex items-center" disabled={isSavingLongDescription}>
                        {isSavingLongDescription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {property.description || property.general?.longDescription || 'Ajoutez une description détaillée pour donner envie à vos voyageurs.'}
                  </p>
                )}
              </div>
            </div>

            {/* Mini-site */}
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
                      Ce lien ouvre un mini site inspiré d&apos;Airbnb, prêt à être partagé avec vos voyageurs. Il accueillera vos futures
                      synchronisations de calendriers (API ou lien iCal).
                    </p>
                  </div>
                  <div className="w-full max-w-md rounded-lg border border-primary-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Lien public</p>
                    <div className="mt-2 flex flex-col gap-2">
                      <code className="block truncate rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-800">
                        {displayMiniSiteUrl}
                      </code>
                      <div className="flex items-center gap-2">
                        <button onClick={handlePublish} className="btn-primary inline-flex flex-1 items-center justify-center">
                          <Globe className="mr-2 h-4 w-4" />
                          Ouvrir
                        </button>
                        <button type="button" onClick={handleCopyMiniSiteUrl} className="btn-secondary inline-flex items-center">
                          <Copy className="mr-2 h-4 w-4" />
                          {isMiniSiteCopied ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Infos principales & paramètres */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Main info */}
              <div className="card space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Informations principales</h2>
                    <p className="text-sm text-gray-500">Adresse et capacité affichées sur vos supports.</p>
                  </div>
                  {!isEditingMainInfo && (
                    <button type="button" onClick={handleStartMainInfoEdit} className="btn-secondary inline-flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {isEditingMainInfo ? (
                  <div className="space-y-6 text-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Accroche principale</h3>
                          <p className="mt-1 text-xs text-gray-500">
                            Ce texte est repris sur votre mini-site et vos fiches de présentation.
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">{mainInfoDraft.shortDescription?.length ?? 0}/160</span>
                      </div>
                      <textarea
                        value={mainInfoDraft.shortDescription}
                        onChange={(e) => handleMainInfoChange('shortDescription', e.target.value)}
                        maxLength={160}
                        rows={3}
                        disabled={isSavingMainInfo}
                        className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                          mainInfoFieldErrors.shortDescription
                            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                            : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      {mainInfoFieldErrors.shortDescription ? (
                        <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.shortDescription}</p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Donnez envie en 160 caractères maximum (ex: « Duplex cosy avec vue sur mer »).
                        </p>
                      )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Adresse du logement</h3>
                          <p className="mt-1 text-xs text-gray-500">Ces champs sont utilisés pour générer l&apos;adresse affichée.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-6">
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">N°</label>
                            <input
                              type="text"
                              value={mainInfoDraft.streetNumber}
                              onChange={(e) => handleMainInfoChange('streetNumber', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.street
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Rue</label>
                            <input
                              type="text"
                              value={mainInfoDraft.street}
                              onChange={(e) => handleMainInfoChange('street', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.street
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.street && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.street}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Complément</label>
                          <input
                            type="text"
                            value={mainInfoDraft.complement}
                            onChange={(e) => handleMainInfoChange('complement', e.target.value)}
                            disabled={isSavingMainInfo}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-5">
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Code postal</label>
                            <input
                              type="text"
                              value={mainInfoDraft.postalCode}
                              onChange={(e) => handleMainInfoChange('postalCode', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.postalCode
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.postalCode && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.postalCode}</p>
                            )}
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Ville</label>
                            <input
                              type="text"
                              value={mainInfoDraft.city}
                              onChange={(e) => handleMainInfoChange('city', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.city
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.city && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.city}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Pays</label>
                          <input
                            type="text"
                            value={mainInfoDraft.country}
                            onChange={(e) => handleMainInfoChange('country', e.target.value)}
                            disabled={isSavingMainInfo}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Adresse formatée</label>
                          <input
                            type="text"
                            value={mainInfoDraft.formatted}
                            onChange={(e) => handleMainInfoChange('formatted', e.target.value)}
                            disabled={isSavingMainInfo}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">Optionnel : personnalisez l&apos;affichage (email, PDF...)</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Capacité & pièces</h3>
                          <p className="mt-1 text-xs text-gray-500">Affichées aux voyageurs sur vos différents canaux.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Adultes</label>
                            <input
                              type="number"
                              min={1}
                              value={mainInfoDraft.adults}
                              onChange={(e) => handleMainInfoChange('adults', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.adults
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.adults && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.adults}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Enfants</label>
                            <input
                              type="number"
                              min={0}
                              value={mainInfoDraft.children}
                              onChange={(e) => handleMainInfoChange('children', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.children
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.children && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.children}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Chambres</label>
                            <input
                              type="number"
                              min={0}
                              value={mainInfoDraft.bedrooms}
                              onChange={(e) => handleMainInfoChange('bedrooms', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.bedrooms
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.bedrooms && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.bedrooms}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Lits</label>
                            <input
                              type="number"
                              min={0}
                              value={mainInfoDraft.beds}
                              onChange={(e) => handleMainInfoChange('beds', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.beds
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.beds && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.beds}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Salles de bain</label>
                            <input
                              type="number"
                              min={0}
                              value={mainInfoDraft.bathrooms}
                              onChange={(e) => handleMainInfoChange('bathrooms', e.target.value)}
                              disabled={isSavingMainInfo}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                                mainInfoFieldErrors.bathrooms
                                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                              }`}
                            />
                            {mainInfoFieldErrors.bathrooms && (
                              <p className="mt-1 text-xs text-danger-600">{mainInfoFieldErrors.bathrooms}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {mainInfoError && (
                      <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                        {mainInfoError}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button type="button" onClick={handleCancelMainInfoEdit} className="btn-secondary" disabled={isSavingMainInfo}>
                        Annuler
                      </button>
                      <button type="button" onClick={handleSaveMainInfo} className="btn-primary inline-flex items-center" disabled={isSavingMainInfo}>
                        {isSavingMainInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      {shortDescriptionValue ? (
                        <p className="whitespace-pre-line">{shortDescriptionValue}</p>
                      ) : (
                        <p className="text-gray-500">Ajoutez une description courte pour présenter rapidement votre logement.</p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <MapPin className="h-4 w-4 text-primary-600" />
                          Adresse complète
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>{formattedAddress || 'Adresse non renseignée'}</p>
                          {property?.address?.complement && (
                            <p className="text-gray-500">Complément : {property?.address?.complement}</p>
                          )}
                          {property?.address?.country && <p className="text-gray-500">{property?.address?.country}</p>}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <Home className="h-4 w-4 text-primary-600" />
                          Type de logement
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {PROPERTY_TYPE_LABELS[property?.type] || 'Type non renseigné'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Nom : {property?.name || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <Users className="h-4 w-4 text-primary-600" />
                          Capacité totale
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">{capacityAdultsValue + capacityChildrenValue}</p>
                        <p className="text-xs text-gray-500">
                          {capacityAdultsValue} adulte(s) · {capacityChildrenValue} enfant(s)
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <Bed className="h-4 w-4 text-primary-600" />
                          Chambres
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">{bedroomsValue}</p>
                        <p className="text-xs text-gray-500">Nombre de chambres disponibles</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <Home className="h-4 w-4 text-primary-600" />
                          Lits
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">{bedsValue}</p>
                        <p className="text-xs text-gray-500">Inclut canapés et couchages d&apos;appoint</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <Bath className="h-4 w-4 text-primary-600" />
                          Salles de bain
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">{bathroomsValue}</p>
                        <p className="text-xs text-gray-500">Douche et bain confondus</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick settings */}
              <div className="card space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Paramètres rapides</h2>
                    <p className="text-sm text-gray-500">Gérez les règles d&apos;accueil et vos frais annexes.</p>
                  </div>
                  {!isEditingQuickSettings && (
                    <button type="button" onClick={handleStartQuickSettingsEdit} className="btn-secondary inline-flex items-center">
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
                          onChange={(e) => handleQuickSettingsChange('checkInTime', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mode d&apos;arrivée</label>
                        <select
                          value={quickSettingsDraft.checkInMode}
                          onChange={(e) => handleQuickSettingsChange('checkInMode', e.target.value)}
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
                          onChange={(e) => handleQuickSettingsChange('checkOutTime', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mode de départ</label>
                        <select
                          value={quickSettingsDraft.checkOutMode}
                          onChange={(e) => handleQuickSettingsChange('checkOutMode', e.target.value)}
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
                        onChange={(e) => handleQuickSettingsChange('accessCode', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Type de caution</label>
                        <select
                          value={quickSettingsDraft.depositType}
                          onChange={(e) => handleQuickSettingsChange('depositType', e.target.value)}
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
                          onChange={(e) => handleQuickSettingsChange('depositMethod', e.target.value)}
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
                          onChange={(e) => handleQuickSettingsChange('cleaningFee', e.target.value)}
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
                          onChange={(e) => handleQuickSettingsChange('depositAmount', e.target.value)}
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
                            onChange={(e) => handleQuickSettingsChange('depositMin', e.target.value)}
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
                            onChange={(e) => handleQuickSettingsChange('depositMax', e.target.value)}
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
                          onChange={(e) => handleQuickSettingsChange('smokingAllowed', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Fumeurs acceptés
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={quickSettingsDraft.petsAllowed}
                          onChange={(e) => handleQuickSettingsChange('petsAllowed', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Animaux acceptés
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={quickSettingsDraft.partiesAllowed}
                          onChange={(e) => handleQuickSettingsChange('partiesAllowed', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Fêtes autorisées
                      </label>
                    </div>
                    {quickSettingsError && <p className="text-sm text-danger-600">{quickSettingsError}</p>}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button type="button" onClick={handleCancelQuickSettingsEdit} className="btn-secondary" disabled={isSavingQuickSettings}>
                        Annuler
                      </button>
                      <button type="button" onClick={handleSaveQuickSettings} className="btn-primary inline-flex items-center" disabled={isSavingQuickSettings}>
                        {isSavingQuickSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-gray-600">
                    <p>
                      <span className="font-medium text-gray-700">Check-in :</span> {checkInTime}
                      {checkInModeLabel && (
                        <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                          {checkInModeLabel}
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Check-out :</span> {checkOutTime}
                      {checkOutModeLabel && (
                        <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                          {checkOutModeLabel}
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary-600" />
                      <span>Code d&apos;accès : {property.settings?.accessCode || 'Non défini'}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Dépôt :</span> {depositText}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Frais de ménage :</span>{' '}
                      {property.settings?.cleaningFee != null ? `${property.settings.cleaningFee} €` : 'Non défini'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      <span className={`rounded-full px-3 py-1 font-medium ${operations.smokingAllowed ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                        {operations.smokingAllowed ? 'Fumeurs acceptés' : 'Non fumeurs'}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-medium ${operations.petsAllowed ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                        {operations.petsAllowed ? 'Animaux acceptés' : 'Animaux interdits'}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-medium ${operations.partiesAllowed ? 'bg-warning-100 text-warning-700' : 'bg-gray-100 text-gray-600'}`}>
                        {operations.partiesAllowed ? 'Fêtes autorisées' : 'Fêtes interdites'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Équipements */}
            <div className="card space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Équipements</h2>
                  <p className="text-sm text-gray-500">Renseignez les équipements disponibles pour vos voyageurs.</p>
                </div>
                {!isEditingAmenities && (
                  <button type="button" onClick={handleStartAmenitiesEdit} className="btn-secondary inline-flex items-center">
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </button>
                )}
              </div>
              {isEditingAmenities ? (
                <div className="space-y-4">
                  <div
                    className={`rounded-lg border ${
                      (amenitiesDraft?.length ?? 0) === 0
                        ? 'border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500'
                        : 'border-gray-200 bg-white p-4'
                    }`}
                  >
                    {(amenitiesDraft?.length ?? 0) === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-6 w-6 text-gray-400" />
                        <p>Ajoutez les équipements disponibles pour ce logement.</p>
                        <button
                          type="button"
                          onClick={() => setIsEquipmentPickerOpen(true)}
                          className="btn-secondary inline-flex items-center"
                        >
                          <Search className="mr-2 h-4 w-4" />
                          Parcourir les équipements
                        </button>
                        <p className="text-xs text-gray-400">
                          Ajoutez les services atypiques dans la description du logement.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">{renderSelectedEquipmentChips(true)}</div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsEquipmentPickerOpen(true)}
                            className="btn-secondary inline-flex items-center"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Ajouter un équipement
                          </button>
                          <span className="text-xs text-gray-500">
                            Ajoutez les services atypiques dans la description du logement.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {amenitiesError && <p className="text-sm text-danger-600">{amenitiesError}</p>}
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
                      {isSavingAmenities && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : property.amenities?.length ? (
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun équipement renseigné pour le moment.</p>
              )}
            </div>

            {/* Stats */}
            {property.stats && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Réservations</p>
                  <p className="text-2xl font-semibold text-gray-900">{property.stats.totalBookings ?? 0}</p>
                </div>
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Revenus</p>
                  <p className="text-2xl font-semibold text-gray-900">{property.stats.totalRevenue ?? 0} €</p>
                </div>
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-semibold text-gray-900">{property.stats.averageRating ?? 0} / 5</p>
                </div>
                <div className="card text-center">
                  <p className="text-sm font-medium text-gray-600">Taux d&apos;occupation</p>
                  <p className="text-2xl font-semibold text-gray-900">{property.stats.occupancyRate ?? 0}%</p>
                </div>
              </div>
            )}

            {/* Galeries */}
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
                    <button type="button" onClick={handleStartPhotosEdit} className="btn-secondary inline-flex items-center">
                      <Images className="mr-2 h-4 w-4" />
                      Modifier la galerie
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <button type="button" onClick={handleCancelPhotosEdit} className="btn-secondary" disabled={isSavingPhotos}>
                        Annuler
                      </button>
                      <button type="button" onClick={handleSavePhotos} className="btn-primary inline-flex items-center" disabled={isSavingPhotos}>
                        {isSavingPhotos && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>
                {photosError && <p className="text-sm text-danger-600">{photosError}</p>}

                {isEditingPhotos ? (
                  photosDraft.length > 0 ? (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-primary-100 bg-primary-50/60 px-4 py-3 text-xs text-primary-900">
                        <p>
                          <span className="font-semibold text-primary-800">Image héro</span> : photo principale affichée en tête du
                          mini-site et utilisée comme vignette du séjour.
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-primary-800">Photo de couverture</span> : image mise en avant dans les
                          galeries voyageurs et vos supports marketing.
                        </p>
                      </div>
                      {photosDraft.map((category, categoryIndex) => (
                        <div key={category.id || category.key || categoryIndex} className="card space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Libellé</label>
                              <input
                                type="text"
                                value={category.label || ''}
                                onChange={(e) => handlePhotoCategoryChange(categoryIndex, 'label', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Titre</label>
                              <input
                                type="text"
                                value={category.title || ''}
                                onChange={(e) => handlePhotoCategoryChange(categoryIndex, 'title', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Description courte</label>
                            <textarea
                              rows={3}
                              value={category.shortDescription || ''}
                              onChange={(e) => handlePhotoCategoryChange(categoryIndex, 'shortDescription', e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Lien vidéo</label>
                            <input
                              type="url"
                              value={category.videoUrl || ''}
                              onChange={(e) => handlePhotoCategoryChange(categoryIndex, 'videoUrl', e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="https://..."
                            />
                          </div>

                          <div className="space-y-4">
                            {Array.isArray(category.media) && category.media.length > 0 ? (
                              category.media.map((mediaItem, mediaIndex) => {
                                const heroOptionAvailable =
                                  !selectedHeroPosition ||
                                  (selectedHeroPosition.categoryIndex === categoryIndex &&
                                    selectedHeroPosition.mediaIndex === mediaIndex);
                                const coverOptionAvailable =
                                  !selectedCoverPosition ||
                                  (selectedCoverPosition.categoryIndex === categoryIndex &&
                                    selectedCoverPosition.mediaIndex === mediaIndex);

                                return (
                                  <div key={mediaItem.id || mediaItem.url || mediaIndex} className="grid gap-4 sm:grid-cols-[180px_1fr]">
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
                                        onChange={(e) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'alt', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Crédit photo</label>
                                      <input
                                        type="text"
                                        value={mediaItem.credit || ''}
                                        onChange={(e) => handlePhotoMediaChange(categoryIndex, mediaIndex, 'credit', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                      {coverOptionAvailable && (
                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(mediaItem.isCover)}
                                            onChange={(e) =>
                                              handlePhotoMediaChange(
                                                categoryIndex,
                                                mediaIndex,
                                                'isCover',
                                                e.target.checked
                                              )
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                          />
                                          Photo de couverture
                                        </label>
                                      )}
                                      {heroOptionAvailable && (
                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(mediaItem.isHero)}
                                            onChange={(e) =>
                                              handlePhotoMediaChange(
                                                categoryIndex,
                                                mediaIndex,
                                                'isHero',
                                                e.target.checked
                                              )
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                          />
                                          Image héro
                                        </label>
                                      )}
                                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(mediaItem.hidden)}
                                          onChange={(e) =>
                                            handlePhotoMediaChange(categoryIndex, mediaIndex, 'hidden', e.target.checked)
                                          }
                                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Masquer
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                );
                              })
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
                      const visibleMedia = category.media.filter((m) => m?.url && !m.hidden);
                      const videoPreviewUrl =
                        category.videoPreview?.url ||
                        category.videoPreviewUrl ||
                        category.previewImage?.url ||
                        category.previewUrl ||
                        visibleMedia[0]?.thumbnailUrl ||
                        visibleMedia[0]?.url ||
                        null;

                      if (visibleMedia.length === 0 && !category.videoUrl) return null;

                      return (
                        <div key={category.id || category.key} className="card space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{category.label}</p>
                              {category.title && <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>}
                              {category.shortDescription && <p className="mt-2 text-sm text-gray-600">{category.shortDescription}</p>}
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
                                        <video src={category.videoUrl} controls autoPlay className="h-full w-full object-contain" />
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
                                <figure key={media.id || media.url} className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
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
                                    {media.credit && <p className="mt-1 text-xs text-gray-500">© {media.credit}</p>}
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
    

      {isEquipmentPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sélection des équipements"
        >
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sélection des équipements</h3>
                <p className="text-sm text-gray-500">Recherchez un équipement ou parcourez les catégories.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEquipmentPickerOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fermer la sélection des équipements"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={equipmentSearch}
                  onChange={(event) => setEquipmentSearch(event.target.value)}
                  placeholder="Rechercher un équipement (sauna, jacuzzi, wifi...)"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {filteredEquipmentGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <Search className="h-10 w-10 text-gray-300" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aucun résultat</p>
                    <p className="text-xs text-gray-500">
                      Aucun équipement ne correspond à « {equipmentSearch} ».
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ajoutez les services atypiques dans la description du logement.
                  </p>
                </div>
              ) : (
                filteredEquipmentGroups.map((group) => (
                  <div key={group.key} className="mb-8 last:mb-0">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {group.options.map((option) => {
                        const selected = Array.isArray(amenitiesDraft)
                          ? amenitiesDraft.includes(option.value)
                          : false;
                        const IconComponent = option.icon || Info;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleEquipment(option.value)}
                            className={`group flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
                              selected
                                ? 'border-primary-400 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-primary-50/40'
                            }`}
                          >
                            <span
                              className={`mt-0.5 rounded-full border p-2 ${
                                selected
                                  ? 'border-primary-300 bg-white text-primary-600'
                                  : 'border-gray-200 bg-gray-50 text-gray-500 group-hover:border-primary-200 group-hover:text-primary-600'
                              }`}
                            >
                              <IconComponent className="h-4 w-4" />
                            </span>
                            <span className="flex-1 text-sm text-gray-700">
                              <span className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{option.value}</span>
                                {selected && <Check className="h-4 w-4 text-primary-600" />}
                              </span>
                              {option.description && (
                                <span className="mt-1 block text-xs text-gray-500">{option.description}</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-4">
              <span className="text-xs text-gray-500">
                {(amenitiesDraft?.length ?? 0)} équipement(s) sélectionné(s)
              </span>
              <button
                type="button"
                onClick={() => setIsEquipmentPickerOpen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-primary-700"
              >
                <Check className="h-4 w-4" />
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
