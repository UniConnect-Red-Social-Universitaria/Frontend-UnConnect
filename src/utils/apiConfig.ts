import { Platform } from "react-native";
import Constants from "expo-constants";

function extraerHostDesdeHostUri(hostUri: string): string | null {
  const valor = hostUri.trim();
  if (!valor) return null;
  if (/^[a-z]+:\/\//i.test(valor)) {
    try {
      return new URL(valor).hostname || null;
    } catch {
      return null;
    }
  }
  if (valor.startsWith("[")) {
    const fin = valor.indexOf("]");
    return fin > 1 ? valor.slice(1, fin) : null;
  }
  const partes = valor.split(":");
  if (partes.length >= 2) return partes[0] || null;
  return valor;
}

function esHostLanValido(host: string): boolean {
  const hostNormalizado = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostNormalizado === "localhost" || hostNormalizado.endsWith(".local"))
    return true;
  const matchIpv4 = hostNormalizado.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
  );
  if (!matchIpv4) return false;
  const octetos = matchIpv4.slice(1).map(Number);
  if (
    octetos.some((octeto) => Number.isNaN(octeto) || octeto < 0 || octeto > 255)
  )
    return false;
  const [a, b] = octetos;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function obtenerHostExpo(): string | null {
  const configExpo = Constants.expoConfig as { hostUri?: string } | null;
  if (configExpo?.hostUri) return configExpo.hostUri;
  const constantsConManifest = Constants as unknown as {
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };
  return constantsConManifest.manifest2?.extra?.expoClient?.hostUri ?? null;
}

// Exportamos esta función principal para poder usarla en cualquier parte de la app
export function resolverApiBaseUrl(): string {
  const apiUrlConfiguradaRaw = process.env.EXPO_PUBLIC_API_URL;
  const apiUrlConfigurada =
    apiUrlConfiguradaRaw?.trim().replace(/\/+$/, "") ?? "";
  if (apiUrlConfigurada) return apiUrlConfigurada;
  const hostUriExpo = obtenerHostExpo();
  if (hostUriExpo) {
    const hostDetectado = extraerHostDesdeHostUri(hostUriExpo);
    if (hostDetectado && esHostLanValido(hostDetectado)) {
      const hostNormalizado = hostDetectado.includes(":")
        ? `[${hostDetectado}]`
        : hostDetectado;
      return `http://${hostNormalizado}:3000`;
    }
  }
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}