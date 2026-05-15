import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth.service';

interface AuthContextValue {
	isAuthenticated: boolean;
	isLoading: boolean;
	userId: string | null;
	/** Llama esto después de un login exitoso para actualizar el contexto */
	onLoginSuccess: () => Promise<void>;
	/** Llama esto al hacer logout */
	onLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);

	const syncAuthState = useCallback(async () => {
		try {
			const auth = await authService.isAuthenticated();
			setIsAuthenticated(auth);
			if (auth) {
				const id = await authService.obtenerIdUsuarioActual();
				setUserId(id);
			} else {
				setUserId(null);
			}
		} catch {
			setIsAuthenticated(false);
			setUserId(null);
		}
	}, []);

	useEffect(() => {
		let mounted = true;

		syncAuthState().finally(() => {
			if (mounted) setIsLoading(false);
		});

		return () => {
			mounted = false;
		};
	}, [syncAuthState]);

	const onLoginSuccess = useCallback(async () => {
		await syncAuthState();
	}, [syncAuthState]);

	const onLogout = useCallback(async () => {
		await authService.logout();
		setIsAuthenticated(false);
		setUserId(null);
	}, []);

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, isLoading, userId, onLoginSuccess, onLogout }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used inside <AuthProvider>');
	}
	return ctx;
}
