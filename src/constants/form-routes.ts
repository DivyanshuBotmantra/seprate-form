/**
 * Valid form routes for bot trigger forms
 * Add new routes here when creating new trigger form components
 */
export const VALID_FORM_ROUTES = [
  '/bot-trigger',           // Single file upload form (BotTrigger)
  '/multiple-form', // Multiple file upload form (BotTrigger2)
  '/static-trigger', // Static trigger form (StaticTrigger)
] as const;

export type FormRoute = typeof VALID_FORM_ROUTES[number];
