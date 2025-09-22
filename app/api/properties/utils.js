import { NextResponse } from 'next/server';

export function validateAndNormalizePropertyPayload(data) {
  const {
    name,
    address,
    description,
    type,
    maxGuests,
    bedrooms,
    bathrooms,
    amenities,
    airbnbUrl,
    bookingUrl,
    profilePhoto,
    descriptionPhotos
  } = data || {};

  if (!name || !name.trim() || !address || !address.trim() || !type || maxGuests === undefined || maxGuests === null) {
    return {
      errorResponse: NextResponse.json(
        { message: "Nom, adresse, type et nombre max d'invités sont requis" },
        { status: 400 }
      )
    };
  }

  const maxGuestsValue = parseInt(maxGuests);
  const bedroomsValue = bedrooms !== undefined ? parseInt(bedrooms) : undefined;
  const bathroomsValue = bathrooms !== undefined ? parseInt(bathrooms) : undefined;

  if (Number.isNaN(maxGuestsValue) || maxGuestsValue < 1) {
    return {
      errorResponse: NextResponse.json(
        { message: "Le nombre maximum d'invités doit être un nombre positif" },
        { status: 400 }
      )
    };
  }

  if (bedroomsValue !== undefined && bedroomsValue < 0) {
    return {
      errorResponse: NextResponse.json(
        { message: 'Le nombre de chambres doit être supérieur ou égal à 0' },
        { status: 400 }
      )
    };
  }

  if (bathroomsValue !== undefined && bathroomsValue < 1) {
    return {
      errorResponse: NextResponse.json(
        { message: 'Le nombre de salles de bain doit être supérieur ou égal à 1' },
        { status: 400 }
      )
    };
  }

  const normalizeUrl = (value) => {
    if (!value || typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    try {
      const url = new URL(trimmed);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid protocol');
      }
      return trimmed;
    } catch (error) {
      throw new Error('Invalid URL');
    }
  };

  let normalizedAirbnbUrl = '';
  let normalizedBookingUrl = '';
  let normalizedProfilePhoto = '';

  try {
    normalizedAirbnbUrl = normalizeUrl(airbnbUrl);
  } catch (error) {
    return {
      errorResponse: NextResponse.json(
        { message: 'Lien Airbnb invalide' },
        { status: 400 }
      )
    };
  }

  try {
    normalizedBookingUrl = normalizeUrl(bookingUrl);
  } catch (error) {
    return {
      errorResponse: NextResponse.json(
        { message: 'Lien Booking invalide' },
        { status: 400 }
      )
    };
  }

  try {
    normalizedProfilePhoto = normalizeUrl(profilePhoto);
  } catch (error) {
    return {
      errorResponse: NextResponse.json(
        { message: 'URL de photo de profil invalide' },
        { status: 400 }
      )
    };
  }

  let normalizedDescriptionPhotos = [];

  if (descriptionPhotos !== undefined) {
    if (!Array.isArray(descriptionPhotos)) {
      return {
        errorResponse: NextResponse.json(
          { message: 'Les photos de description doivent être une liste' },
          { status: 400 }
        )
      };
    }

    try {
      normalizedDescriptionPhotos = descriptionPhotos
        .map((photo) => normalizeUrl(photo))
        .filter(Boolean);
    } catch (error) {
      return {
        errorResponse: NextResponse.json(
          { message: 'Une ou plusieurs URLs de photos de description sont invalides' },
          { status: 400 }
        )
      };
    }
  }

  return {
    normalizedData: {
      name: name.trim(),
      address: address.trim(),
      description: description?.trim() || '',
      type,
      maxGuests: maxGuestsValue,
      bedrooms: bedroomsValue ?? 1,
      bathrooms: bathroomsValue ?? 1,
      amenities: Array.isArray(amenities) ? amenities : [],
      airbnbUrl: normalizedAirbnbUrl,
      bookingUrl: normalizedBookingUrl,
      profilePhoto: normalizedProfilePhoto,
      descriptionPhotos: normalizedDescriptionPhotos
    }
  };
}
