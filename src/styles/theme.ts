const colors = {
  primary: '#003e70', // Azul institucional (primario)
  primaryDark: '#00284d', // Azul secundario / contraste
  primaryMid: '#045389', // Azul secundario claro
  gold: '#d5bb87', // Dorado institucional
  goldLight: '#efd9af', // Dorado claro
  goldDark: '#b5a27c', // Dorado oscuro
  white: '#ffffff',
  black: '#000000',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const radius = {
  sm: 4,
  md: 8,
  lg: 12,
};

const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  },
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
};

const theme = { colors, spacing, radius, typography };

export { colors, spacing, radius, typography };
export default theme;
