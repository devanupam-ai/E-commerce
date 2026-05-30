export const COLORS = {
  // Primary - Blinkit/Zepto style vibrant green
  primary: '#0C831F',
  primaryDark: '#0A6E1A',
  primaryLight: '#E8F5E9',
  primaryLighter: '#F1F8F2',

  // Accent
  secondary: '#FF6B35',
  secondaryLight: '#FFF3E0',

  // Backgrounds
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#4A4A68',
  textTertiary: '#8E8EA9',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E8E8EE',
  divider: '#F0F0F5',

  // Status
  success: '#0C831F',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF8E1',
  error: '#E53935',
  errorLight: '#FFEBEE',
  info: '#1976D2',
  infoLight: '#E3F2FD',

  // Legacy compat
  white: '#FFFFFF',
  black: '#1A1A2E',
  gray: '#8E8EA9',
  lightGray: '#E8E8EE',
  red: '#E53935',
  yellow: '#FF9800',
};

export const FONTS = {
  regular: { fontFamily: 'System' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semiBold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  extraBold: { fontFamily: 'System', fontWeight: '800' },
};

export const SIZES = {
  // Font sizes
  xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32,

  // Spacing
  padding: 16, paddingXL: 20, paddingXS: 10,
  margin: 16,

  // Border radius
  radius: 12, radiusXL: 16, radiusXXL: 20, radiusFull: 999,

  // Input
  inputHeight: 52,
  buttonHeight: 52,

  // Shadows
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// Reusable style presets
export const PRESETS = {
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusXL,
    padding: SIZES.padding,
    ...SIZES.shadow.small,
  },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  buttonPrimary: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    ...SIZES.shadow.medium,
  },
  buttonSecondary: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusXL,
    padding: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 12,
    ...SIZES.shadow.small,
  },
};
