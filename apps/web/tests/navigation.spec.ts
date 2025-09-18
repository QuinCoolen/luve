import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('http://localhost:3000');
  });

  test('should navigate to auctions page', async ({ page }) => {
    // Click on the "Auctions" link in the header navigation (more specific selector)
    await page.locator('nav a[href="/auctions"]').first().click();

    // Verify we're on the auctions page
    await expect(page).toHaveURL('http://localhost:3000/auctions');

    // Verify the page title and heading
    await expect(page.getByRole('heading', { name: 'Auctions' })).toBeVisible();

    // Verify the page description is present
    await expect(page.getByText('Browse through our latest auctions and find your next favorite item.')).toBeVisible();

    // Verify the category filter dropdown is present
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByText('Select a category')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on the "Sign Up" button in the header
    await page.click('text=Sign Up');

    // Verify we're on the register page
    await expect(page).toHaveURL('http://localhost:3000/register');

    // Verify the page title using first() to avoid strict mode violation
    await expect(page.getByText('Register').first()).toBeVisible();

    // Verify the registration form is present
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Verify all required form fields are present
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Confirm Password', { exact: true })).toBeVisible();

    // Verify the register button is present
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click on the "Log In" button in the header
    await page.click('text=Log In');

    // Verify we're on the login page
    await expect(page).toHaveURL('http://localhost:3000/login');

    // Verify the page title using first() to avoid strict mode violation
    await expect(page.getByText('Login').first()).toBeVisible();

    // Verify the login form is present
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Verify all required form fields are present
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();

    // Verify the login button is present
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should navigate to auctions from home page hero section', async ({ page }) => {
    // Click on the "Explore Auctions" button in the hero section
    await page.click('text=Explore Auctions');

    // Verify we're on the auctions page
    await expect(page).toHaveURL('http://localhost:3000/auctions');

    // Verify the auctions page content
    await expect(page.getByRole('heading', { name: 'Auctions' })).toBeVisible();
  });

  test('should maintain navigation state when switching between pages', async ({ page }) => {
    // Navigate to auctions page using specific header link
    await page.locator('nav a[href="/auctions"]').first().click();
    await expect(page).toHaveURL('http://localhost:3000/auctions');

    // Navigate to register page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('http://localhost:3000/register');

    // Navigate to login page
    await page.click('text=Log In');
    await expect(page).toHaveURL('http://localhost:3000/login');

    // Navigate back to home using specific header link
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL('http://localhost:3000');

    // Verify we're back on the home page with the hero section
    await expect(page.getByRole('heading', { name: /Discover Rare Treasures/ })).toBeVisible();
  });

  test('should have proper navigation links in header', async ({ page }) => {
    // Verify all navigation links are present in the header using more specific selectors
    await expect(page.locator('nav a[href="/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/auctions"]')).toBeVisible();
    await expect(page.locator('nav a[href="/how-it-works"]')).toBeVisible();
    await expect(page.locator('nav a[href="/about-us"]')).toBeVisible();

    // Verify authentication buttons are present (when not logged in)
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();

    // Verify the logo/brand is present in the header specifically
    await expect(page.locator('header span:has-text("GoonAuctions")')).toBeVisible();
  });
});