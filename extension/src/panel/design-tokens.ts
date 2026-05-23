export const colors = {
  bg: {
    primary: '#121212',
    secondary: '#181818',
    tertiary: '#202020',
    surface: 'rgba(255, 255, 255, 0.055)',
    field: 'rgba(255, 255, 255, 0.085)',
    fieldHover: 'rgba(255, 255, 255, 0.11)',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(226, 232, 240, 0.82)',
    tertiary: 'rgba(148, 163, 184, 0.78)',
  },
  accent: {
    primary: '#5b6cff',
    secondary: '#9aa4ff',
    hover: '#6b7aff',
    soft: 'rgba(91, 108, 255, 0.16)',
    fill: '#5b6cff',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  overlay: {
    selected: 'rgba(255, 45, 85, 0.14)',
    selectedBorder: '#ff2d55',
    measurement: 'rgba(239, 68, 68, 0.1)',
    measurementBorder: '#ef4444',
    similar: 'rgba(251, 113, 133, 0.14)',
    similarBorder: '#fb7185',
  },
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.18)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
};

export const typography = {
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
  h1: { size: '20px', lineHeight: '1.4', weight: '600' },
  h2: { size: '16px', lineHeight: '1.4', weight: '600' },
  body: { size: '14px', lineHeight: '1.5', weight: '400' },
  caption: { size: '12px', lineHeight: '1.4', weight: '400' },
  code: { size: '13px', lineHeight: '1.4', weight: '400' },
};

export const surface = {
  background: 'rgba(255, 255, 255, 0.055)',
  fieldBackground: 'rgba(255, 255, 255, 0.085)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  boxShadow: 'none',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '180ms ease-out',
  slow: '200ms ease-out',
};
