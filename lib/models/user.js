import { z } from 'zod';

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

export const USER_STATUSES = {
  ACTIVE: 'active',
  INVITED: 'invited',
  SUSPENDED: 'suspended'
};

const emailSchema = z.string().trim().toLowerCase().email();
const nameSchema = z.string().trim().min(1);

const notificationsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean()
});

const profileSchema = z
  .object({
    phone: z.string().trim().max(50).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(2000).optional(),
    photoUrl: z.string().trim().url().optional()
  })
  .partial();

const settingsSchema = z.object({
  language: z.string().default('fr'),
  timezone: z.string().default('Europe/Paris'),
  currency: z.string().default('EUR'),
  notifications: notificationsSchema
});

const subscriptionSchema = z.object({
  plan: z.string(),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled']),
  trialEnds: z.date().nullable()
});

const permissionsSchema = z.object({
  canManageUsers: z.boolean(),
  canManageBilling: z.boolean(),
  canManageProperties: z.boolean(),
  canManageDeposits: z.boolean(),
  canManageGuidebooks: z.boolean()
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  passwordHash: z.string().min(1),
  role: z.enum(Object.values(USER_ROLES)),
  newsletter: z.boolean().default(false),
  isEmailVerified: z.boolean().default(false),
  status: z.enum(Object.values(USER_STATUSES)).default(USER_STATUSES.ACTIVE),
  permissions: permissionsSchema,
  subscription: subscriptionSchema,
  settings: settingsSchema,
  profile: profileSchema.optional(),
  stripeCustomerId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
  metadata: z.record(z.any()).optional()
});

const DEFAULT_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    canManageUsers: false,
    canManageBilling: true,
    canManageProperties: true,
    canManageDeposits: true,
    canManageGuidebooks: true
  },
  [USER_ROLES.SUPERADMIN]: {
    canManageUsers: true,
    canManageBilling: true,
    canManageProperties: true,
    canManageDeposits: true,
    canManageGuidebooks: true
  }
};

const DEFAULT_SETTINGS = {
  language: 'fr',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  notifications: {
    email: true,
    push: true,
    sms: false
  }
};

export function buildUserDocument({
  id,
  firstName,
  lastName,
  email,
  passwordHash,
  role,
  newsletter = false,
  isEmailVerified = false,
  status = USER_STATUSES.ACTIVE,
  permissions,
  subscription,
  settings,
  stripeCustomerId = null,
  createdAt,
  updatedAt,
  lastLoginAt,
  metadata,
  profile
}) {
  const now = new Date();
  const trialEnds = subscription?.trialEnds
    ? new Date(subscription.trialEnds)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sanitizedProfile = profile ? profileSchema.parse(profile) : undefined;

  const parsed = UserSchema.parse({
    id,
    firstName,
    lastName,
    email,
    passwordHash,
    role,
    newsletter,
    isEmailVerified,
    status,
    permissions: permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS[USER_ROLES.ADMIN],
    subscription: {
      plan: subscription?.plan || 'free',
      status: subscription?.status || 'active',
      trialEnds
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(settings?.notifications || {})
      }
    },
    stripeCustomerId,
    createdAt: createdAt ? new Date(createdAt) : now,
    updatedAt: updatedAt ? new Date(updatedAt) : now,
    lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : undefined,
    metadata: metadata || undefined,
    profile: sanitizedProfile
  });

  return parsed;
}

export function buildAdminUserDocument(data) {
  return buildUserDocument({
    ...data,
    role: USER_ROLES.ADMIN
  });
}

export function buildSuperAdminUserDocument(data) {
  return buildUserDocument({
    ...data,
    role: USER_ROLES.SUPERADMIN
  });
}
