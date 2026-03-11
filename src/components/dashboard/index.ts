/**
 * Dashboard Utilities - Centralized Exports
 * This file provides a single source for all dashboard utilities.
 * Import from this file instead of individual modules for better maintainability.
 */

// Export all color constants
export { STATUS_COLORS, STATUS_BG_COLORS, CHART_UI } from './colors';

// Export date filter component
export { default as DateFilter } from './date-filter';

// Export dashboard export utility
export { exportDashboardExcel } from './exportDashboard';
