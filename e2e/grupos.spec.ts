import { test, expect, request } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const NOMBRE_GRUPO = `Grupo E2E ${Date.now()}`;

test.describe("Módulo de Grupos de Estudio - UniConnect", () => {
  test("Criterio 2: Crear un nuevo grupo, verificarlo en la lista y confirmar rol de administrador", async ({
    page,
  }) => {
    let grupoId: string | null = null;

    try {
      // 1. Cargar la app desde raíz
      await page.goto("/");
      await page.waitForURL("**/principal", { timeout: 15_000 });

      // 2. Navegar a grupos haciendo clic en el menú
      await page.getByRole("link", { name: /grupos/i }).click();
      await page.waitForURL("**/grupos", { timeout: 10_000 });
      await expect(page.getByText("Mis Grupos")).toBeVisible({
        timeout: 10_000,
      });

      // 3. Abrir modal de crear grupo
      await page.getByRole("button", { name: "+ Crear grupo" }).click();
      await expect(page.getByText("➕ Crear grupo")).toBeVisible();

      // 4. Llenar nombre y materia
      await page.fill("input.uc-form-input", NOMBRE_GRUPO);
      const select = page.locator("select.uc-form-input");
      await select.selectOption({ index: 1 });

      // 5. Crear
      await page.getByRole("button", { name: "Crear grupo" }).last().click();
      await expect(page.getByText("Grupo creado exitosamente")).toBeVisible({
        timeout: 10_000,
      });

      // 6. Verificar que aparece en la lista
      await expect(page.getByText(NOMBRE_GRUPO)).toBeVisible({
        timeout: 10_000,
      });

      // 7. Entrar al grupo haciendo clic
      await page.getByText(NOMBRE_GRUPO).click();
      await page.waitForURL("**/grupos/**", { timeout: 10_000 });

      // 8. Capturar ID desde la URL
      grupoId = page.url().split("/grupos/")[1];

      // 9. Verificar botones de administrador
      await expect(page.getByRole("button", { name: "+ Invitar" })).toBeVisible(
        { timeout: 10_000 },
      );
      await expect(
        page.getByRole("button", { name: "Nominar candidato" }),
      ).toBeVisible();
    } finally {
      // 10. Limpieza — salir del grupo por la UI
      if (grupoId) {
        await page.goto('/');
        await page.waitForURL('**/principal', { timeout: 60_000 });

        await page.getByRole('link', { name: /grupos/i }).click();
        await page.waitForURL('**/grupos', { timeout: 60_000 });

        await page.getByText(NOMBRE_GRUPO).click();
        await page.waitForURL('**/grupos/**', { timeout: 60_000 });

        await page.getByRole('button', { name: 'Salir del Grupo' }).waitFor({ state: 'visible', timeout: 60_000 });
        await page.getByRole('button', { name: 'Salir del Grupo' }).click();

        await page.getByRole('button', { name: 'Aceptar' }).waitFor({ state: 'visible', timeout: 60_000 });
        await page.getByRole('button', { name: 'Aceptar' }).click();

        await page.waitForURL('**/grupos', { timeout: 60_000 });
      }
    }
  });
});
