/**
 * @fileoverview Token di design di Instagram
 *
 * Colori, spaziature e valori di design esatti da Instagram web.
 * Questi token garantiscono coerenza pixel-perfect con l'originale.
 */

// ============================================================================
// COLORI
// ============================================================================

export const colors = {
  // Primari
  primary: '#0095F6', // Blu Instagram
  primaryHover: '#1877F2',
  primaryPressed: '#004C8B',

  // Testo
  textPrimary: '#262626', // Testo principale (modalità chiara)
  textSecondary: '#8E8E8E', // Testo secondario (modalità chiara)
  textTertiary: '#A8A8A8', // Testo terziario (modalità chiara)

  textPrimaryDark: '#FAFAFA', // Testo principale (modalità scura)
  textSecondaryDark: '#A8A8A8', // Testo secondario (modalità scura)

  // Sfondo
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FAFAFA',
  bgTertiary: '#F2F2F2',

  bgPrimaryDark: '#000000',
  bgSecondaryDark: '#0C1014',
  bgTertiaryDark: '#121212',

  // Bordi
  border: '#DBDBDB',
  borderDark: '#262626',

  // Interattivi
  like: '#ED4956', // Rosso cuore
  error: '#ED4956',
  success: '#00C26F',

  // Link
  link: '#00376B',
  linkHover: '#00376B',
} as const;

// ============================================================================
// SPAZIATURE
// ============================================================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
} as const;

// ============================================================================
// DIMENSIONI FONT
// ============================================================================

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '14px', // Base Instagram
  md: '16px',
  lg: '18px',
  xl: '24px',
  '2xl': '28px',
} as const;

// ============================================================================
// PESI FONT
// ============================================================================

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ============================================================================
// RAGGIO BORDI
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

// ============================================================================
// TRANSIZIONI
// ============================================================================

export const transition = {
  fast: '0.1s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  dropdown: 1000,
  modal: 1100,
  popover: 1200,
  tooltip: 1300,
} as const;

// ============================================================================
// BREAKPOINT
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// COMPONENTI SPECIFICI
// ============================================================================

export const components = {
  post: {
    maxWidth: '470px',
    imageAspectRatio: '1 / 1',
    borderRadius: borderRadius.md,
  },

  profile: {
    avatarSizeSmall: '32px',
    avatarSizeMedium: '56px',
    avatarSizeLarge: '150px',
  },

  button: {
    heightSmall: '28px',
    heightMedium: '32px',
    heightLarge: '40px',
    paddingX: '16px',
  },

  input: {
    height: '36px',
    borderRadius: borderRadius.sm,
  },

  sidebar: {
    width: '335px',
  },

  navbar: {
    height: '60px',
  },
} as const;
