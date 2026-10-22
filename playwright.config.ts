import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Tests navigateur (tests/e2e) : l'application en production (`next build` au préalable) sur le port 3217,
 * branchée sur la base de test DATABASE_URL_TEST (jamais la base de développement), sans e-mails ni fournisseurs externes.
 */
const baseTest = process.env.DATABASE_URL_TEST;
if (!baseTest) throw new Error("DATABASE_URL_TEST est requise pour les tests navigateur (voir .env.example).");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Les scénarios partagent une base : un seul à la fois.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3217",
    locale: "fr-FR",
    timezoneId: "Indian/Antananarivo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3217",
    url: "http://localhost:3217/connexion",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: baseTest,
      APP_URL: "http://localhost:3217",
      // Pas d'envoi d'e-mail ni de connexion Google pendant les tests.
      RESEND_API_KEY: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
