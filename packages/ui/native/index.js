import React from 'react';
import { StyleSheet, View, Text as RNText, TouchableOpacity } from 'react-native';
import theme from '@uniconnect/theme';

export function Screen({ style, children }) {
	return React.createElement(View, { style: [styles.screen, style] }, children);
}

export function Header({ title, right, style }) {
	return React.createElement(
		View,
		{ style: [styles.header, style] },
		React.createElement(RNText, { style: styles.headerTitle }, title),
		right || null
	);
}

export function Container({ style, children }) {
	return React.createElement(View, { style: [styles.container, style] }, children);
}

export function Card({ style, children }) {
	return React.createElement(View, { style: [styles.card, style] }, children);
}

export function Title({ style, children }) {
	return React.createElement(RNText, { style: [styles.title, style] }, children);
}

export function Text({ style, children }) {
	return React.createElement(RNText, { style: [styles.text, style] }, children);
}

export function MutedText({ style, children }) {
	return React.createElement(RNText, { style: [styles.muted, style] }, children);
}

export function PrimaryButton({
	title,
	children,
	onPress,
	onPressIn,
	onPressOut,
	style,
	disabled,
}) {
	const content =
		children ?? React.createElement(RNText, { style: styles.buttonText }, title);

	return React.createElement(
		TouchableOpacity,
		{
			style: [styles.button, disabled && styles.buttonDisabled, style],
			onPress,
			onPressIn,
			onPressOut,
			disabled: !!disabled,
		},
		content
	);
}

export function SecondaryButton({
	title,
	children,
	onPress,
	onPressIn,
	onPressOut,
	style,
	disabled,
}) {
	const content =
		children ?? React.createElement(RNText, { style: styles.buttonSecondaryText }, title);

	return React.createElement(
		TouchableOpacity,
		{
			style: [styles.buttonSecondary, disabled && styles.buttonDisabled, style],
			onPress,
			onPressIn,
			onPressOut,
			disabled: !!disabled,
		},
		content
	);
}

const styles = StyleSheet.create({
	screen: {
		minHeight: '100%',
		flex: 1,
		backgroundColor: theme.colors.white,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: {
		color: theme.colors.gold,
		fontSize: theme.typography.fontSize.lg,
		fontWeight: '700',
	},
	container: {
		flex: 1,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.white,
	},
	card: {
		backgroundColor: theme.colors.goldLight,
		borderRadius: theme.radius.md,
		padding: theme.spacing.md,
	},
	title: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.lg,
		fontWeight: '700',
		marginBottom: theme.spacing.sm,
	},
	text: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.md,
		marginBottom: theme.spacing.sm,
	},
	muted: {
		color: theme.colors.primaryMid,
		fontSize: theme.typography.fontSize.sm,
	},
	button: {
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.radius.md,
		alignItems: 'center',
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: theme.colors.white,
		fontSize: theme.typography.fontSize.md,
		fontWeight: '600',
	},
	buttonSecondary: {
		backgroundColor: theme.colors.gold,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.radius.md,
		alignItems: 'center',
	},
	buttonSecondaryText: {
		color: theme.colors.primaryDark,
		fontSize: theme.typography.fontSize.md,
		fontWeight: '700',
	},
});
