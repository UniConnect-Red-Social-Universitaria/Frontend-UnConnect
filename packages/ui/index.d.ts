import type * as React from 'react';

export type StylePropAny = any;

export type ScreenProps = {
    style?: StylePropAny;
    children?: React.ReactNode;
};

export type HeaderProps = {
    title: string;
    right?: React.ReactNode;
    style?: StylePropAny;
};

export type ContainerProps = {
    style?: StylePropAny;
    children?: React.ReactNode;
};

export type CardProps = {
    style?: StylePropAny;
    children?: React.ReactNode;
};

export type TitleProps = {
    style?: StylePropAny;
    children?: React.ReactNode;
};

export type TextProps = {
    style?: StylePropAny;
    children?: React.ReactNode;
};

export type MutedTextProps = {
    style?: StylePropAny;
    children?: React.ReactNode;
};

export type PrimaryButtonProps = {
    title?: string;
    children?: React.ReactNode;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    disabled?: boolean;
    style?: StylePropAny;
};

export type SecondaryButtonProps = {
    title?: string;
    children?: React.ReactNode;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    disabled?: boolean;
    style?: StylePropAny;
};

export declare function Screen(props: ScreenProps): React.ReactElement;
export declare function Header(props: HeaderProps): React.ReactElement;
export declare function Container(props: ContainerProps): React.ReactElement;
export declare function Card(props: CardProps): React.ReactElement;
export declare function Title(props: TitleProps): React.ReactElement;
export declare function Text(props: TextProps): React.ReactElement;
export declare function MutedText(props: MutedTextProps): React.ReactElement;
export declare function PrimaryButton(props: PrimaryButtonProps): React.ReactElement;
export declare function SecondaryButton(props: SecondaryButtonProps): React.ReactElement;
