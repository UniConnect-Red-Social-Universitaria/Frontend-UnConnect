const BACKEND_PRODUCTION_URL = 'https://uniconnect-backend.fly.dev';

function limpiarUrl(valor: string): string {
    return valor.trim().replace(/\/+$/, '');
}

function esDesarrolloLocal(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const hostname = window.location.hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function resolverApiBaseUrl(): string {
    const apiUrlConfigurada = limpiarUrl((import.meta as any).env?.VITE_API_URL ?? '');
    if (apiUrlConfigurada) {
        return apiUrlConfigurada;
    }

    if (esDesarrolloLocal()) {
        return 'http://localhost:3000';
    }

    return BACKEND_PRODUCTION_URL;
}