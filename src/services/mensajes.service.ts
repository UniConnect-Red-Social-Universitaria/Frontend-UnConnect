import AsyncStorage from "@react-native-async-storage/async-storage";
import { resolverApiBaseUrl } from "../utils/apiConfig";

const API_URL = `${resolverApiBaseUrl()}/api`;

const getToken = async () => await AsyncStorage.getItem("userToken");

export const obtenerHistorialMensajes = async (contactoId: string) => {
  const token = await getToken();
  if (!token) throw new Error("No se encontró el token.");

  const res = await fetch(`${API_URL}/mensajes/${contactoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const enviarNuevoMensaje = async (
  contactoId: string,
  contenido: string,
) => {
  const token = await getToken();
  if (!token) throw new Error("No autenticado.");

  const res = await fetch(`${API_URL}/mensajes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receptorId: contactoId,
      contenido,
    }),
  });
  return res.json();
};
