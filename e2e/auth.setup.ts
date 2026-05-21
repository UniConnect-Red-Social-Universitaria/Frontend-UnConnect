import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup() {
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Ir a la página principal
  await page.goto('https://uniconnect-frontend-staging.fly.dev/');

  // 2. Clic en "Iniciar Sesión"
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // 3. Esperar a que aparezca el formulario
  await page.waitForSelector('#correo', { timeout: 15_000 });

  // 4. Llenar credenciales
  await page.fill('#correo', process.env.TEST_USER_EMAIL!);
  await page.fill('#contrasena', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');

  // 5. Esperar redirección
  await page.waitForURL('**/principal', { timeout: 15_000 });

  // 6. Guardar sesión
  await page.context().storageState({
    path: path.join(__dirname, '.auth/user.json'),
  });

  await browser.close();
}

export default globalSetup;