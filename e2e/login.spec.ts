import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('Criterio 1 — Login exitoso redirige a /principal', async ({ page }) => {

  // 1. Ir a la página principal
  await page.goto('/');

  // 2. Hacer clic en "Iniciar Sesión"
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // 3. Verificar que llegamos al login
  await expect(page.getByText('Bienvenido de nuevo')).toBeVisible();

  // 4. Llenar el formulario
  await page.fill('#correo', process.env.TEST_USER_EMAIL!);
  await page.fill('#contrasena', process.env.TEST_USER_PASSWORD!);

  // 5. Click en el botón de submit
  await page.click('button[type="submit"]');

  // 6. Esperar la redirección (le damos 15s porque se demora un poco)
  await page.waitForURL('**/principal', { timeout: 15_000 });
  expect(page.url()).toContain('/principal');
});