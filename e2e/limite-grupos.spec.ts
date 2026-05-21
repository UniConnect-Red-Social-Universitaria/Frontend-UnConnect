import { test, expect, request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_NOMBRE = `Grupo Límite ${Date.now()}`;

test.describe('Módulo de Grupos de Estudio - UniConnect', () => {

  test('Criterio 3: El sistema rechaza crear un cuarto grupo para la misma materia', async ({ page }) => {
    test.setTimeout(120_000);
    const gruposCreados: string[] = [];

    const storageState = JSON.parse(
      fs.readFileSync(path.join(__dirname, '.auth/user.json'), 'utf-8')
    );
    const token = storageState.origins?.[0]?.localStorage?.find(
      (item: any) => item.name === 'userToken'
    )?.value;

    try {
      // 1. Obtener materias del usuario via API
      const apiPerfil = await request.newContext();
      const resPerfil = await apiPerfil.get(`${process.env.API_URL}api/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const perfil = await resPerfil.json();
      await apiPerfil.dispose();

      // 2. Obtener catálogo de materias via API
      const apiMaterias = await request.newContext();
      const resMaterias = await apiMaterias.get(`${process.env.API_URL}api/materias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const materias = await resMaterias.json();
      await apiMaterias.dispose();

      // 3. Encontrar la primera materia permitida
      const materiasUsuario: string[] = perfil.data?.materiasCursando ?? [];
      const todasMaterias: any[] = materias.data ?? materias;
      const materia = todasMaterias.find((m: any) =>
        materiasUsuario.includes(m.nombre) || materiasUsuario.includes(String(m.id))
      );
      expect(materia).not.toBeNull();
      const materiaId = String(materia.id);

      // 4. Crear 3 grupos via API
      for (let i = 1; i <= 3; i++) {
        const api = await request.newContext();
        const res = await api.post(`${process.env.API_URL}api/grupos`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { nombre: `${BASE_NOMBRE} ${i}`, materiaId },
        });
        const body = await res.json();
        gruposCreados.push(body.data?.id ?? body.id);
        await api.dispose();
      }

      // 5. Solo aquí usamos la UI — intentar el cuarto grupo y verificar el error
      await page.goto('/');
      await page.waitForURL('**/principal', { timeout: 60_000 });
      await page.getByRole('link', { name: /grupos/i }).click();
      await page.waitForURL('**/grupos', { timeout: 60_000 });

      await page.getByRole('button', { name: '+ Crear grupo' }).click();
      await expect(page.getByText('➕ Crear grupo')).toBeVisible();
      await page.fill('input.uc-form-input', `${BASE_NOMBRE} 4`);
      await page.locator('select.uc-form-input').selectOption({ value: materiaId });
      await page.getByRole('button', { name: 'Crear grupo' }).last().click();

      // 6. Verificar rechazo
      await expect(
        page.getByText('Ya hay 3 grupos para esta materia')
      ).toBeVisible({ timeout: 60_000 });

    } finally {
      // 7. Limpieza via API
      for (const grupoId of gruposCreados) {
        const api = await request.newContext();
        await api.delete(`${process.env.API_URL}api/grupos/${grupoId}/abandonar`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await api.dispose();
      }
    }
  });

});