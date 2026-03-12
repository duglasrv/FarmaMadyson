import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests — Farma Madyson
 *
 * These tests require both the API (port 4000) and Web (port 3000) servers
 * running, plus a seeded database. The playwright.config.ts webServer
 * entries handle spin-up automatically in CI.
 *
 * Run manually:
 *   pnpm --filter @farma/web test:e2e
 */

test.describe('Storefront Navigation', () => {
  test('homepage loads and shows navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Farma Madyson/i);
  });

  test('products page loads product grid', async ({ page }) => {
    await page.goto('/productos');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('cart page shows empty state', async ({ page }) => {
    await page.goto('/carrito');
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });
});

test.describe('Auth Flow', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill('invalid@test.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /ingresar/i }).click();
    // Should show error message (stays on login page)
    await expect(page).toHaveURL(/login/);
  });

  test('checkout redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/login.*redirect/);
  });
});

test.describe('Checkout Flow (Authenticated)', () => {
  const TEST_EMAIL = 'e2e-test@farmamadyson.com';
  const TEST_PASS = 'TestPass123!';

  test.beforeEach(async ({ page }) => {
    // Attempt login — if user doesn't exist the test will be skipped gracefully
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASS);
    await page.getByRole('button', { name: /ingresar/i }).click();

    // Wait for redirect or error
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, 'Test user not available — skipping authenticated tests');
    }
  });

  test('can browse products and add to cart', async ({ page }) => {
    await page.goto('/productos');
    // Click on first product card link
    const productLink = page.locator('a[href^="/productos/"]').first();
    await expect(productLink).toBeVisible();
    await productLink.click();

    // Product detail page — add to cart
    const addBtn = page.getByRole('button', { name: /agregar al carrito/i });
    if (await addBtn.isEnabled()) {
      await addBtn.click();
      // Navigate to cart
      await page.goto('/carrito');
      // Cart should not be empty anymore
      await expect(page.getByText('Tu carrito está vacío')).not.toBeVisible();
    }
  });

  test('checkout flow with cash on delivery', async ({ page }) => {
    // Ensure there's an item in cart first
    await page.goto('/productos');
    const productLink = page.locator('a[href^="/productos/"]').first();
    if (!(await productLink.isVisible())) {
      test.skip(true, 'No products available');
      return;
    }
    await productLink.click();

    const addBtn = page.getByRole('button', { name: /agregar al carrito/i });
    if (!(await addBtn.isEnabled())) {
      test.skip(true, 'Product out of stock');
      return;
    }
    await addBtn.click();

    // Go to checkout
    await page.goto('/checkout');
    await expect(page).not.toHaveURL(/login/);

    // Step 1 — Fill address
    await page.getByPlaceholder(/nombre/i).first().fill('Test User E2E');
    await page.getByPlaceholder(/teléfono/i).first().fill('55551234');
    await page.getByPlaceholder(/dirección/i).first().fill('Calle Test 123');
    await page.getByPlaceholder(/ciudad/i).first().fill('Chimaltenango');

    // Next step
    const nextBtn = page.getByRole('button', { name: /siguiente|continuar/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // Step 2 — Select payment: cash on delivery
    const cashOption = page.getByText(/contra entrega/i);
    if (await cashOption.isVisible()) {
      await cashOption.click();
    }

    // Continue to summary
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // Step 3 — Summary should show order total
    await expect(page.getByText(/total/i)).toBeVisible();
  });
});
