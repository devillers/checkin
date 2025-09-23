import { z } from 'zod';

export const GUEST_ACCOUNT_STATUS = {
  INVITED: 'invited',
  ACTIVE: 'active',
  EXPIRED: 'expired'
};

export const GUEST_DEPOSIT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded'
};

const nameSchema = z.string().trim().min(1);
const emailSchema = z.string().trim().toLowerCase().email();
const phoneSchema = z.string().trim().optional().default('');

const addressSchema = z
  .object({
    street: z.string().trim().default(''),
    city: z.string().trim().default(''),
    zipCode: z.string().trim().default(''),
    country: z.string().trim().default('')
  })
  .nullable();

const emergencyContactSchema = z
  .object({
    name: z.string().trim().default(''),
    phone: z.string().trim().default(''),
    relation: z.string().trim().default('')
  })
  .nullable();

const preferencesSchema = z.object({
  communication: z.enum(['email', 'sms']).default('email'),
  notifications: z.boolean().default(true)
});

const statsSchema = z.object({
  totalStays: z.number().int().nonnegative().default(0),
  totalSpent: z.number().nonnegative().default(0),
  averageRating: z.number().min(0).max(5).default(0),
  lastStay: z.date().nullable().default(null)
});

const accountSchema = z.object({
  email: emailSchema,
  passwordHash: z.string().nullable().default(null),
  status: z.enum(Object.values(GUEST_ACCOUNT_STATUS)).default(GUEST_ACCOUNT_STATUS.INVITED),
  expiresAt: z.date().nullable().default(null),
  activationToken: z.string().nullable().default(null),
  lastLoginAt: z.date().nullable().default(null)
});

const guidebookSchema = z.object({
  guidebookId: z.string().nullable().default(null),
  lastViewedAt: z.date().nullable().default(null),
  viewCount: z.number().int().nonnegative().default(0)
});

const depositSchema = z.object({
  status: z.enum(Object.values(GUEST_DEPOSIT_STATUS)).default(GUEST_DEPOSIT_STATUS.PENDING),
  amount: z.number().nonnegative().default(0),
  currency: z.string().default('EUR'),
  paidAt: z.date().nullable().default(null),
  paymentIntentId: z.string().nullable().default(null)
});

export const GuestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  language: z.string().default('fr'),
  nationality: z.string().trim().optional().nullable().default(null),
  dateOfBirth: z.date().nullable().default(null),
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  accessCode: z.string().length(6),
  status: z.enum(['active', 'inactive']).default('active'),
  account: accountSchema,
  guidebook: guidebookSchema,
  deposit: depositSchema,
  preferences: preferencesSchema,
  stats: statsSchema,
  notes: z.string().trim().default(''),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date()
});

export function buildGuestDocument({
  id,
  userId,
  firstName,
  lastName,
  email,
  phone = '',
  language = 'fr',
  nationality,
  dateOfBirth,
  address,
  emergencyContact,
  accessCode,
  status = 'active',
  account,
  guidebook,
  deposit,
  preferences,
  stats,
  notes = '',
  tags = [],
  createdAt,
  updatedAt
}) {
  const now = new Date();
  const normalizedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  const normalizedExpiresAt = account?.expiresAt ? new Date(account.expiresAt) : null;
  const normalizedPaidAt = deposit?.paidAt ? new Date(deposit.paidAt) : null;
  const normalizedLastStay = stats?.lastStay ? new Date(stats.lastStay) : null;
  const normalizedLastViewedAt = guidebook?.lastViewedAt ? new Date(guidebook.lastViewedAt) : null;
  const normalizedLastLoginAt = account?.lastLoginAt ? new Date(account.lastLoginAt) : null;

  const parsed = GuestSchema.parse({
    id,
    userId,
    firstName,
    lastName,
    email,
    phone,
    language,
    nationality: nationality?.trim?.() || null,
    dateOfBirth: normalizedDateOfBirth,
    address: address
      ? {
          street: address.street?.trim() || '',
          city: address.city?.trim() || '',
          zipCode: address.zipCode?.trim() || '',
          country: address.country?.trim() || ''
        }
      : null,
    emergencyContact: emergencyContact
      ? {
          name: emergencyContact.name?.trim() || '',
          phone: emergencyContact.phone?.trim() || '',
          relation: emergencyContact.relation?.trim() || ''
        }
      : null,
    accessCode,
    status,
    account: {
      email: (account?.email || email).toLowerCase().trim(),
      passwordHash: account?.passwordHash || null,
      status: account?.status || (account?.passwordHash ? GUEST_ACCOUNT_STATUS.ACTIVE : GUEST_ACCOUNT_STATUS.INVITED),
      expiresAt: normalizedExpiresAt,
      activationToken: account?.activationToken || null,
      lastLoginAt: normalizedLastLoginAt
    },
    guidebook: {
      guidebookId: guidebook?.guidebookId || null,
      lastViewedAt: normalizedLastViewedAt,
      viewCount: guidebook?.viewCount ?? 0
    },
    deposit: {
      status: deposit?.status || GUEST_DEPOSIT_STATUS.PENDING,
      amount: deposit?.amount ?? 0,
      currency: deposit?.currency || 'EUR',
      paidAt: normalizedPaidAt,
      paymentIntentId: deposit?.paymentIntentId || null
    },
    preferences: {
      communication: preferences?.communication || 'email',
      notifications: preferences?.notifications ?? true
    },
    stats: {
      totalStays: stats?.totalStays ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      averageRating: stats?.averageRating ?? 0,
      lastStay: normalizedLastStay
    },
    notes,
    tags,
    createdAt: createdAt ? new Date(createdAt) : now,
    updatedAt: updatedAt ? new Date(updatedAt) : now
  });

  return parsed;
}
