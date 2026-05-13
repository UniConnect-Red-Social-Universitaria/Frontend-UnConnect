import type * as React from 'react';
import type { Encuesta } from '@uniconnect/api-types';

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

export type PollCreatePayload = {
    question: string;
    options: string[];
    autoCloseAt: string | null;
};

export type PollCreateModalProps = {
    visible: boolean;
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    cancelLabel?: string;
    initialQuestion?: string;
    onClose: () => void;
    onSubmit: (payload: PollCreatePayload) => void | Promise<void>;
};

export type PollCardProps = {
    encuesta: Encuesta;
    onVote?: (encuestaId: string, optionId: string) => void | Promise<void>;
    voting?: boolean;
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
export declare function PollCard(props: PollCardProps): React.ReactElement;
export declare function PollCreateModal(props: PollCreateModalProps): React.ReactElement | null;
