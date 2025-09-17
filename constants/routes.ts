export const Routes = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  // Private
  // BUDGETS: '/budgets',
  // CATEGORIES: '/categories',
  // CRUD Budgets
  // BUDGET_CREATE: '/budget',
  // BUDGET_EDIT: '/budget/:id',
  // EVENT_EMAIL: '/budget/email',
  // EVENT_CREATE: '/budget/event',
  // EVENT_CREATE_MODAL: '/budget/event/:id',
  // BUDGET_SCHEDULE: '/budgetView/:id',
  // PROFILE: '/profile',
  // CRUD Charges
  // CHARGES: '/charges',
  // CATEGORY_FORM: '/category/:id',
  // CHARGE_CREATE: '/charge',
  // CHARGE_EDIT: '/charge/:id',
  // DEBTOR_CREATE_MODAL: '/charge/debtor/:id',
  // Charge view (no create or edit)
  // CHARGE_VIEW: '/chargeView/:id',
  // DEBTOR_VIEW: '/chargeView/:chargeId/:debtorId',

  SEARCH: '/search',
  PLAYLISTS: '/playlists',
  SONGS: '/songs',
  SONG: '/song/:id',
  SETTINGS: '/settings',
};

export type RoutesType = (typeof Routes)[keyof typeof Routes];
