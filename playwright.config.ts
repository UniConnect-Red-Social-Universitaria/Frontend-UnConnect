import { defineConfig, devices } from "@playwright/test";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,

  use: {
    baseURL: process.env.BASE_URL || "https://uniconnect-frontend-staging.fly.dev/",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Corre el setup de login ANTES que cualquier test
  globalSetup: "./e2e/auth.setup.ts",

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Todos los tests reutilizan la sesión guardada
        storageState: "./e2e/.auth/user.json",
      },
    },
  ],
});
