import { expect, type Page, test } from "@playwright/test";

/**
 * Real end-to-end flows through the gateway: Next.js page → Traefik → the
 * auth and users services → Postgres (and RabbitMQ in between), with the
 * session in httpOnly cookies. Needs the stack running and the demo users
 * (`pnpm infra:up`, `pnpm dev`, `pnpm seed`).
 */
test.describe("authentication", () => {
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const user = { username: `pw_${id}`, email: `pw_${id}@luve.dev`, password: "Password123" };

  /** Step 1 of signing up: the account, on the auth service. */
  async function register(page: Page, email: string, password = user.password) {
    await page.goto("/register");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill(password);
    await page.getByPlaceholder("Confirm Password").fill(password);
    await page.getByRole("button", { name: "Register" }).click();
  }

  test("register, choose a username, sign out and sign back in", async ({ page }) => {
    await register(page, user.email);

    // Registering signs you in; step 2 is the username, on the users service.
    await expect(page).toHaveURL("/choose-username");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText(user.username)).toBeVisible();

    // The session survives a reload (it lives in cookies, not in memory).
    await page.reload();
    await expect(page.getByText(user.username)).toBeVisible();

    const cookies = await page.context().cookies();
    const jwt = cookies.find((cookie) => cookie.name === "jwt");
    expect(jwt?.httpOnly).toBe(true);

    await page.getByRole("button", { name: /log ?out/i }).click();
    await expect(page.getByText(user.username)).toBeHidden();

    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText(user.username)).toBeVisible();
  });

  test("shows the server's validation errors when registering", async ({ page }) => {
    await register(page, `short_${id}@luve.dev`, "short");
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
  });

  test("checks the username you choose", async ({ page }) => {
    await register(page, `choosy_${id}@luve.dev`);
    await expect(page).toHaveURL("/choose-username");

    await page.getByPlaceholder("Username").fill("x");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Username must be at least 3 characters.")).toBeVisible();

    await page.getByPlaceholder("Username").fill("alice");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("This username is taken.")).toBeVisible();
  });

  test("rejects a wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(`nobody_${id}@luve.dev`);
    await page.getByPlaceholder("Password").fill("Wrong12345");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("The email or password is incorrect.")).toBeVisible();
  });

  test.describe("with an expired access token", () => {
    // Simulates the 15-minute access token running out: drop the `jwt` cookie
    // and keep the refresh cookie (scoped to /api/v1/auth).
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill("alice@luve.dev");
      await page.getByPlaceholder("Password").fill("Password123");
      await page.getByRole("button", { name: "Login" }).click();
      await expect(page.getByTestId("signed-in-user")).toHaveText("alice");
      await page.context().clearCookies({ name: "jwt" });
    });

    test("refreshes silently in the browser", async ({ page }) => {
      await page.reload();
      await expect(page.getByTestId("signed-in-user")).toHaveText("alice");
      const names = (await page.context().cookies()).map((cookie) => cookie.name);
      expect(names).toContain("jwt");
    });

    test("recovers on a server-rendered page", async ({ page }) => {
      // SSR can't see the refresh cookie, so it sends us to /login?next=…,
      // which refreshes and comes straight back.
      await page.goto("/dashboard/bids");
      await expect(page).toHaveURL(/\/dashboard\/bids$/);
      await expect(page.getByTestId("signed-in-user")).toHaveText("alice");
    });
  });

  test("redirects signed-out visitors away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard/bids");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fbids/);
  });
});
