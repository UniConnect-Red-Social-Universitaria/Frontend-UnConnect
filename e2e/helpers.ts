import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export function getToken(): string | null {
  const storageState = JSON.parse(
    fs.readFileSync(path.join(__dirname, '.auth/user.json'), 'utf-8')
  );
  return storageState.origins?.[0]?.localStorage?.find(
    (item: any) => item.name === 'userToken'
  )?.value ?? null;
}

export async function crearGrupoAPI(nombre: string, materiaId: string, token: string): Promise<string> {
  const api = await request.newContext();
  const res = await api.post(`${process.env.API_URL}/api/grupos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { nombre, materiaId },
  });
  const body = await res.json();
  await api.dispose();
  return body.data?.id ?? body.id;
}

export async function eliminarGrupoAPI(grupoId: string, token: string): Promise<void> {
  const api = await request.newContext();
  await api.delete(`${process.env.API_URL}/api/grupos/${grupoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await api.dispose();
}