import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const PROPERTY_TYPES = new Set([
  'apartment',
  'house',
  'studio',
  'villa',
  'loft',
  'chalet',
  'bungalow',
  'room'
]);

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '');

const toPositiveInteger = (value, { min = 0, fallback = 0 } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed < min ? min : parsed;
};

const toPositiveFloat = (value, { min = 0, fallback = null } = {}) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  if (parsed < min) {
    return min;
  }
  return parsed;
};

const formatAddress = (address) => {
  const parts = [
    [address.streetNumber, address.street].filter(Boolean).join(' '),
    address.complement,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country
  ].filter(Boolean);

  return parts.join(', ');
};

const normalizeUrl = (value, { allowEmpty = true, pattern, message = 'URL invalide' } = {}) => {
  const trimmed = safeTrim(value);

  if (!trimmed) {
    if (allowEmpty) {
      return '';
    }
    throw new ValidationError(message);
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (error) {
    throw new ValidationError(message);
  }

  if (!/^https?:/.test(parsed.protocol)) {
    throw new ValidationError(message);
  }

  if (pattern && !pattern.test(trimmed)) {
    throw new ValidationError(message);
  }

  return trimmed;
};

export function validateAndNormalizePropertyPayload(data = {}) {
  try {
    const general = data.general || {};
    const address = data.address || {};
    const onlinePresence = data.onlinePresence || {};
    const medias = data.medias || {};
    const operations = data.operations || {};
    const seo = data.seo || {};

    const name = safeTrim(general.name);
    if (!name) {
      throw new ValidationError('Le nom du logement est requis');
    }

    const type = general.type || 'apartment';
    if (!PROPERTY_TYPES.has(type)) {
      throw new ValidationError('Type de logement invalide');
    }

    const shortDescription = safeTrim(general.shortDescription);
    if (!shortDescription || shortDescription.length > 160) {
      throw new ValidationError('La description courte est requise (≤ 160 caractères)');
    }

    const longDescription = safeTrim(general.longDescription);

    const wifiName = safeTrim(general.wifiName ?? general.wifi?.name);
    if (wifiName.length > 120) {
      throw new ValidationError('Le nom du réseau Wi-Fi doit contenir 120 caractères maximum');
    }

    const wifiPassword = safeTrim(general.wifiPassword ?? general.wifi?.password);
    if (wifiPassword.length > 120) {
      throw new ValidationError('Le mot de passe Wi-Fi doit contenir 120 caractères maximum');
    }

    const capacityAdults = toPositiveInteger(general.capacity?.adults ?? general.adults, { min: 1, fallback: 1 });
    const capacityChildren = toPositiveInteger(general.capacity?.children ?? general.children, { min: 0, fallback: 0 });

    const bedrooms = toPositiveInteger(general.bedrooms ?? general.rooms, { min: 0, fallback: 0 });
    const beds = toPositiveInteger(general.beds ?? bedrooms, { min: 0, fallback: bedrooms });
    const bathrooms = toPositiveInteger(general.bathrooms, { min: 0, fallback: 0 });
    const surface = toPositiveFloat(general.surface, { min: 0, fallback: null });

    const street = safeTrim(address.street);
    if (!street) {
      throw new ValidationError('Le type et nom de voie sont requis');
    }

    const postalCode = safeTrim(address.postalCode);
    if (!/^\d{5}$/.test(postalCode)) {
      throw new ValidationError('Le code postal doit comporter 5 chiffres');
    }

    const city = safeTrim(address.city);
    if (!city) {
      throw new ValidationError('La ville est requise');
    }

    const country = safeTrim(address.country) || 'France';
    const streetNumber = safeTrim(address.streetNumber);
    const complement = safeTrim(address.complement);

    const latitude = address.latitude === null || address.latitude === undefined
      ? null
      : Number(address.latitude);
    const longitude = address.longitude === null || address.longitude === undefined
      ? null
      : Number(address.longitude);

    if (latitude !== null && Number.isNaN(latitude)) {
      throw new ValidationError('Latitude invalide');
    }

    if (longitude !== null && Number.isNaN(longitude)) {
      throw new ValidationError('Longitude invalide');
    }

    const formattedAddress = formatAddress({ streetNumber, street, complement, postalCode, city, country });

    const airbnbUrl = normalizeUrl(onlinePresence.airbnbUrl, {
      allowEmpty: true,
      pattern: /^https?:\/\/(www\.)?airbnb\.(fr|com)\/h\//,
      message: 'Lien Airbnb invalide (format attendu airbnb.fr/com/h/...)'
    });

    const bookingUrl = normalizeUrl(onlinePresence.bookingUrl, {
      allowEmpty: true,
      pattern: /^https?:\/\/(www\.)?booking\.com\//,
      message: 'Lien Booking invalide'
    });

    const slug = safeTrim(onlinePresence.slug);
    if (!slug || !SLUG_REGEX.test(slug)) {
      throw new ValidationError('Slug invalide (caractères autorisés : lettres, chiffres, tirets)');
    }

    const categoryInput = Array.isArray(medias.categories) ? medias.categories : [];
    const normalizedCategories = [];
    const flattenedMedia = [];

    for (let index = 0; index < categoryInput.length; index += 1) {
      const category = categoryInput[index] || {};
      const categoryId = typeof category.id === 'string' && category.id.trim() ? category.id.trim() : uuidv4();
      const label = safeTrim(category.label) || `Catégorie ${index + 1}`;
      const title = safeTrim(category.title);
      const shortCatDescription = safeTrim(category.shortDescription);
      const isCoverCategory = Boolean(category.isCoverCategory);
      const order = Number.isFinite(category.order) ? Number(category.order) : index * 10;
      let videoUrl = '';
      try {
        videoUrl = normalizeUrl(category.videoUrl, { allowEmpty: true, message: 'Lien vidéo invalide' });
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ValidationError(`Catégorie "${label}": ${error.message}`);
        }
        throw error;
      }

      const mediaInput = Array.isArray(category.media) ? category.media : [];
      const media = [];

      for (let mediaIndex = 0; mediaIndex < mediaInput.length; mediaIndex += 1) {
        const item = mediaInput[mediaIndex] || {};
        const mediaId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : uuidv4();
        const url = normalizeUrl(item.url, { allowEmpty: false, message: `URL média invalide pour ${label}` });
        const alt = safeTrim(item.alt);
        if (!alt) {
          throw new ValidationError(`Le texte alternatif est requis pour les médias de la catégorie "${label}"`);
        }

        let thumbnailUrl = '';
        try {
          thumbnailUrl = normalizeUrl(item.thumbnailUrl, { allowEmpty: true, message: `URL de miniature invalide pour ${label}` });
        } catch (error) {
          if (error instanceof ValidationError) {
            throw new ValidationError(`Catégorie "${label}": ${error.message}`);
          }
          throw error;
        }

        const credit = safeTrim(item.credit);
        const isHero = Boolean(item.isHero);
        const hidden = Boolean(item.hidden);
        const isCover = Boolean(item.isCover);
        const mediaOrder = Number.isFinite(item.order) ? Number(item.order) : mediaIndex * 10;

        const normalizedMedia = {
          id: mediaId,
          url,
          thumbnailUrl: thumbnailUrl || undefined,
          alt,
          credit,
          isHero,
          hidden,
          isCover,
          order: mediaOrder
        };

        media.push(normalizedMedia);
        flattenedMedia.push({ ...normalizedMedia, categoryId });
      }

      normalizedCategories.push({
        id: categoryId,
        key: safeTrim(category.key) || categoryId,
        label,
        title,
        shortDescription: shortCatDescription,
        isCoverCategory,
        order,
        videoUrl,
        media
      });
    }

    const depositInput = operations.deposit || {};
    const depositType = depositInput.type === 'range' ? 'range' : 'fixed';
    const depositAmount = depositType === 'fixed'
      ? toPositiveFloat(depositInput.amount, { min: 0, fallback: 0 })
      : null;
    const depositMin = depositType === 'range'
      ? toPositiveFloat(depositInput.min, { min: 0, fallback: null })
      : null;
    const depositMax = depositType === 'range'
      ? toPositiveFloat(depositInput.max, { min: 0, fallback: null })
      : null;

    if (depositType === 'range' && (depositMin === null || depositMax === null)) {
      throw new ValidationError('Les montants minimum et maximum de la caution sont requis');
    }

    if (depositType === 'range' && depositMin > depositMax) {
      throw new ValidationError('Le montant maximum de la caution doit être supérieur ou égal au minimum');
    }

    const depositMethod = depositInput.method === 'virement' ? 'virement' : 'empreinte';

    const equipments = Array.isArray(operations.equipments)
      ? operations.equipments.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
      : [];

    const cityTax = operations.cityTax || {};

    const normalizedOperations = {
      checkInTime: safeTrim(operations.checkInTime) || '15:00',
      checkInMode: operations.checkInMode === 'in_person' ? 'in_person' : 'self',
      checkOutTime: safeTrim(operations.checkOutTime) || '11:00',
      checkOutMode: operations.checkOutMode === 'self' ? 'self' : 'in_person',
      deposit: {
        type: depositType,
        amount: depositAmount,
        min: depositMin,
        max: depositMax,
        method: depositMethod
      },
      smokingAllowed: Boolean(operations.smokingAllowed),
      petsAllowed: Boolean(operations.petsAllowed),
      partiesAllowed: Boolean(operations.partiesAllowed),
      equipments,
      cityTax: {
        municipality: safeTrim(cityTax.municipality),
        classification: safeTrim(cityTax.classification),
        registrationNumber: safeTrim(cityTax.registrationNumber)
      }
    };

    const metaTitle = safeTrim(seo.metaTitle);
    if (metaTitle && metaTitle.length > 70) {
      throw new ValidationError('Le meta title doit contenir 70 caractères maximum');
    }
    const metaDescription = safeTrim(seo.metaDescription);
    if (metaDescription && metaDescription.length > 160) {
      throw new ValidationError('La meta description doit contenir 160 caractères maximum');
    }

    const normalizedSeo = {
      metaTitle,
      metaDescription,
      ogImageId: safeTrim(seo.ogImageId)
    };

    const heroImage = flattenedMedia.find((item) => item.isHero) || flattenedMedia[0];
    const profilePhoto = heroImage
      ? {
          url: heroImage.url,
          thumbnailUrl: heroImage.thumbnailUrl,
          alt: heroImage.alt,
          credit: heroImage.credit,
          isHero: heroImage.isHero,
          isCover: heroImage.isCover,
          categoryId: heroImage.categoryId
        }
      : null;

    const descriptionPhotos = flattenedMedia.map((item) => ({
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      alt: item.alt,
      credit: item.credit,
      categoryId: item.categoryId,
      isHero: item.isHero,
      isCover: item.isCover
    }));

    const normalizedAddress = {
      streetNumber,
      street,
      complement,
      postalCode,
      city,
      country,
      latitude,
      longitude,
      formatted: formattedAddress
    };

    const normalizedData = {
      name,
      type,
      general: {
        name,
        type,
        capacity: {
          adults: capacityAdults,
          children: capacityChildren
        },
        bedrooms,
        beds,
        bathrooms,
        surface,
        shortDescription,
        longDescription,
        wifi: {
          name: wifiName,
          password: wifiPassword
        }
      },
      address: normalizedAddress,
      formattedAddress,
      onlinePresence: {
        airbnbUrl,
        bookingUrl,
        slug
      },
      medias: {
        categories: normalizedCategories
      },
      operations: normalizedOperations,
      seo: normalizedSeo,
      capacity: {
        adults: capacityAdults,
        children: capacityChildren
      },
      bedrooms,
      beds,
      bathrooms,
      surface,
      shortDescription,
      description: longDescription,
      maxGuests: capacityAdults + capacityChildren,
      amenities: equipments,
      airbnbUrl,
      bookingUrl,
      slug,
      profilePhoto,
      descriptionPhotos,
      addressLabel: formattedAddress,
      wifi: {
        name: wifiName,
        password: wifiPassword
      },
      wifiName,
      wifiPassword
    };

    return { normalizedData };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        errorResponse: NextResponse.json({ message: error.message }, { status: error.status })
      };
    }

    throw error;
  }
}
