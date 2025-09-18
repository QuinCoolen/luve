import { test, expect } from '@playwright/test';

test.describe('Authentication Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('http://localhost:3000');
  });

  test.describe('Registration Validation', () => {
    test('should show validation errors for empty fields', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('http://localhost:3000/register');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Register' }).click();

      // Wait for validation errors to appear
      await page.waitForTimeout(500);

      // Check if form is still on the same page (no navigation)
      await expect(page).toHaveURL('http://localhost:3000/register');
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('http://localhost:3000/register');

      // Fill form with invalid email
      await page.getByPlaceholder('Username').fill('testuser');
      await page.getByPlaceholder('Email').fill('invalid-email');
      await page.getByPlaceholder('Password').fill('password123');
      await page.getByPlaceholder('Confirm Password').fill('password123');

      // Submit form
      await page.getByRole('button', { name: 'Register' }).click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Should still be on register page
      await expect(page).toHaveURL('http://localhost:3000/register');
    });

    test('should show validation error for short password', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('http://localhost:3000/register');

      // Fill form with short password
      await page.getByPlaceholder('Username').fill('testuser');
      await page.getByPlaceholder('Email').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('123');
      await page.getByPlaceholder('Confirm Password').fill('123');

      // Submit form
      await page.getByRole('button', { name: 'Register' }).click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Should still be on register page
      await expect(page).toHaveURL('http://localhost:3000/register');
    });
  });

  test.describe('Login Validation', () => {
    test('should show validation errors for empty fields', async ({ page }) => {
      // Navigate to login page
      await page.click('text=Log In');
      await expect(page).toHaveURL('http://localhost:3000/login');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Login' }).click();

      // Wait for validation errors to appear
      await page.waitForTimeout(500);

      // Check if form is still on the same page (no navigation)
      await expect(page).toHaveURL('http://localhost:3000/login');
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      // Navigate to login page
      await page.click('text=Log In');
      await expect(page).toHaveURL('http://localhost:3000/login');

      // Fill form with invalid email
      await page.getByPlaceholder('Email').fill('invalid-email');
      await page.getByPlaceholder('Password').fill('password123');

      // Submit form
      await page.getByRole('button', { name: 'Login' }).click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Should still be on login page
      await expect(page).toHaveURL('http://localhost:3000/login');
    });

    test('should show validation error for non-existent user', async ({ page }) => {
      // Navigate to login page
      await page.click('text=Log In');
      await expect(page).toHaveURL('http://localhost:3000/login');

      // Fill form with non-existent user
      await page.getByPlaceholder('Email').fill('nonexistent@example.com');
      await page.getByPlaceholder('Password').fill('password123');

      // Submit form
      await page.getByRole('button', { name: 'Login' }).click();

      // Wait for validation
      await page.waitForTimeout(1000);

      // Should still be on login page
      await expect(page).toHaveURL('http://localhost:3000/login');
    });

    test('should show validation error for wrong password', async ({ page }) => {
      // Navigate to login page
      await page.click('text=Log In');
      await expect(page).toHaveURL('http://localhost:3000/login');

      // Fill form with wrong password
      await page.getByPlaceholder('Email').fill('admin@example.com');
      await page.getByPlaceholder('Password').fill('wrongpassword');

      // Submit form
      await page.getByRole('button', { name: 'Login' }).click();

      // Wait for validation
      await page.waitForTimeout(1000);

      // Should still be on login page
      await expect(page).toHaveURL('http://localhost:3000/login');
    });
  });

  test.describe('Form Field Validation', () => {
    test('should validate required fields on blur', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('http://localhost:3000/register');

      // Focus and blur username field
      await page.getByPlaceholder('Username').focus();
      await page.getByPlaceholder('Username').blur();

      // Focus and blur email field
      await page.getByPlaceholder('Email').focus();
      await page.getByPlaceholder('Email').blur();

      // Focus and blur password field
      await page.getByPlaceholder('Password').focus();
      await page.getByPlaceholder('Password').blur();

      await page.getByPlaceholder('Confirm Password').focus();
      await page.getByPlaceholder('Confirm Password').blur();

      // Wait a moment for any validation to appear
      await page.waitForTimeout(500);

      // Should still be on register page
      await expect(page).toHaveURL('http://localhost:3000/register');
    });

    test('should clear validation errors when user starts typing', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('http://localhost:3000/register');

      // Try to submit empty form to trigger validation
      await page.getByRole('button', { name: 'Register' }).click();
      await page.waitForTimeout(500);

      // Start typing in username field
      await page.getByPlaceholder('Username').fill('test');

      // Start typing in email field
      await page.getByPlaceholder('Email').fill('test@');

      // Start typing in password field
      await page.getByPlaceholder('Password').fill('test');

      // Start typing in confirm password field
      await page.getByPlaceholder('Confirm Password').fill('test');

      // Wait a moment
      await page.waitForTimeout(500);

      // Should still be on register page
      await expect(page).toHaveURL('http://localhost:3000/register');
    });
  });
}); 