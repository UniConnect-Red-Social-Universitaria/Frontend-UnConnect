export type ThemeColors = {
    primary: string;
    primaryDark: string;
    primaryMid: string;
    gold: string;
    goldLight: string;
    goldDark: string;
    white: string;
    black: string;
};

export type ThemeSpacing = {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
};

export type ThemeRadius = {
    sm: number;
    md: number;
    lg: number;
};

export type ThemeTypography = {
    fontSize: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
    };
    fontFamily: {
        regular: string;
        medium: string;
        bold: string;
    };
};

export type Theme = {
    colors: ThemeColors;
    spacing: ThemeSpacing;
    radius: ThemeRadius;
    typography: ThemeTypography;
};

export declare const colors: ThemeColors;
export declare const spacing: ThemeSpacing;
export declare const radius: ThemeRadius;
export declare const typography: ThemeTypography;

declare const theme: Theme;
export default theme;
