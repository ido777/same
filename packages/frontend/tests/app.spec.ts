import { test, expect } from '@playwright/test';

// Basic end‑to‑end test for the React app.  It verifies that the form
// renders and that we can fill out the inputs.  Actual API calls may
// fail during CI if the backend server isn’t running; to enable end‑to‑end
// testing, run the backend server on port 3000 before executing
// `npm run test` in the frontend.

test('home page renders form inputs and performs a search', async ({ page }) => {
  // Visit the preview server.  The CI workflow starts the preview on port 4173.
  await page.goto('http://localhost:4173');

  // Ensure the form elements are visible.
  await expect(page.getByText('Same Address Finder')).toBeVisible();
  const cityInput = page.locator('label:has-text("City") input');
  const streetInput = page.locator('label:has-text("Street") input');
  const houseInput = page.locator('label:has-text("House number") input');
  await expect(cityInput).toBeVisible();
  await expect(streetInput).toBeVisible();
  await expect(houseInput).toBeVisible();

  // Fill in Hebrew values for city, street and house number.
  await cityInput.fill('הרצליה');
  await streetInput.fill('החרושת');
  await houseInput.fill('1');

  // Submit the form.
  await page.locator('button[type="submit"]').click();

  // The results section should eventually appear with coordinates and lists.
  await expect(page.getByText('Coordinates:')).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Same Location Addresses')).toBeVisible();
  await expect(page.getByText('Adjacent Addresses')).toBeVisible();
});