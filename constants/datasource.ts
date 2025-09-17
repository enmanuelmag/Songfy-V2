export type AuthMethodType = 'email' | 'google' | 'apple' | 'anonymous';

export const AUTH_METHODS: Record<string, AuthMethodType> = {
  email: 'email',
  google: 'google',
  apple: 'apple',
  anonymous: 'anonymous',
};

export const AUTH_METHOD_KEY = 'auth-method';

export const CHECK_BIOMETRIC = 'check-biometric';

export const FIREBASE_ID_TOKEN = 'firebase-id-token';

export const SECRET_EMAIL = 'secret-email';

export const SECRET_PASSWORD = 'secret-password';

export const BUDGETS_COLLECTION = 'budgets-v3';

export const AI_EVENTS_COLLECTION = 'ai-events-v1';

export const CATEGORIES_COLLECTION = 'categories-v3';

export const CHARGES_COLLECTION = 'charges-v3';

export const DEBTORS_COLLECTION = 'debtors-v3';

export const PAYMENTS_COLLECTION = 'payments-v3';

export const USERS_COLLECTION = 'users-v3';

export const SPOTIFY_AUTH = 'spotify-auth';
