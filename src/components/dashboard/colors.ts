/**
 * Brandix Color System - Uses CSS Variables from index.css
 * All colors are centrally managed in index.css for easy theming.
 * Using var() strings allows colors to react to theme changes (light/dark) automatically.
 */

export const STATUS_COLORS = {
    total: 'var(--status-total)',
    initiated: 'var(--status-initiated)',
    inProgress: 'var(--status-in-progress)',
    succeeded: 'var(--status-succeeded)',
    failed: 'var(--status-failed)',
};

export const STATUS_BG_COLORS = {
    total: 'var(--status-total-bg)',
    initiated: 'var(--status-initiated-bg)',
    inProgress: 'var(--status-in-progress-bg)',
    succeeded: 'var(--status-succeeded-bg)',
    failed: 'var(--status-failed-bg)',
};

export const CHART_UI = {
    grid: 'var(--chart-grid)',
    axis: 'var(--chart-axis)',
    tooltipBg: 'var(--chart-tooltip-bg)',
    tooltipText: 'var(--chart-tooltip-text)',
};

export const MACHINE_COLORS = [
    '#ec4899', // Hot Pink
    '#84cc16', // Lime Green
    '#6366f1', // Indigo Blue
    '#d946ef', // Fuchsia
    '#0ea5e9', // Sky Blue
    '#fbbf24', // Amber Light
    '#4ade80', // Green Light

];

/**
 * Deterministically assigns a color to a machine name.
 * This ensures the same machine always has the same color across different charts.
 */
export const getMachineColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return MACHINE_COLORS[Math.abs(hash) % MACHINE_COLORS.length];
};
