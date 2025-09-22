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
    amenities
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

  return {
    normalizedData: {
      name: name.trim(),
      address: address.trim(),
      description: description?.trim() || '',
      type,
      maxGuests: maxGuestsValue,
      bedrooms: bedroomsValue ?? 1,
      bathrooms: bathroomsValue ?? 1,
      amenities: Array.isArray(amenities) ? amenities : []
    }
  };
}
