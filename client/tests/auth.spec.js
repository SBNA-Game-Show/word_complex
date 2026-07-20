import { expect, test } from "@playwright/test";

import {
  E2E_AUTH_ACTIONS,
  configureE2EAuth,
  mockSharedPlatformApis,
  readE2EAuthCalls,
  selectStoryAndOpenLauncher,
} from "./helpers/app-fixtures.js";

async function openLoginPage(page, authOptions = {}) {
  await configureE2EAuth(page, authOptions);
  await page.goto("/");

  await expect(page.getByTestId("login-page")).toBeVisible();
}

async function expectSingleAuthCall(page, action, payload) {
  await expect
    .poll(() => readE2EAuthCalls(page))
    .toEqual([
      {
        action,
        payload,
      },
    ]);
}

test.describe("Authentication flows", () => {
  test("renders every sign-in method and switches modes safely", async ({
    page,
  }) => {
    await openLoginPage(page);

    await expect(
      page.getByRole("heading", {
        name: "Sign in",
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByTestId("google-login-button")).toBeVisible();

    await expect(page.getByTestId("guest-login-button")).toBeVisible();

    const signInMode = page.getByTestId("auth-mode-signin");

    const signUpMode = page.getByTestId("auth-mode-signup");

    await expect(signInMode).toHaveAttribute("aria-pressed", "true");

    await expect(signUpMode).toHaveAttribute("aria-pressed", "false");

    await page.getByTestId("email-input").fill("temporary@example.test");

    await page.getByTestId("password-input").fill("temporary-password");

    await signUpMode.click();

    await expect(signUpMode).toHaveAttribute("aria-pressed", "true");

    await expect(
      page.getByRole("heading", {
        name: "Sign up",
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByTestId("name-input")).toBeVisible();

    await expect(page.getByTestId("email-input")).toHaveValue("");

    await expect(page.getByTestId("password-input")).toHaveValue("");

    await expect(page.getByTestId("login-button")).toContainText(
      "Create account",
    );

    await signInMode.click();

    await expect(page.getByTestId("name-input")).toHaveCount(0);
  });

  test("email sign-in reaches the Story Picker with the mapped user", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);

    await openLoginPage(page, {
      userByAction: {
        [E2E_AUTH_ACTIONS.EMAIL_SIGN_IN]: {
          id: "email-reader-1",
          name: "Amina Reader",
          nickname: "Amina",
          username: "amina@example.test",
          role: "Reader",
          isGuest: false,
        },
      },
    });

    await page.getByTestId("email-input").fill("amina@example.test");

    await page.getByTestId("password-input").fill("correct-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(page.getByTestId("user-badge-name")).toContainText("Amina");

    await expect(page.getByTestId("user-badge-role")).toContainText("Reader");

    await expectSingleAuthCall(page, E2E_AUTH_ACTIONS.EMAIL_SIGN_IN, {
      email: "amina@example.test",
      password: "correct-password",
    });
  });

  test("email sign-up submits name and credentials and enters the Story Picker", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);

    await openLoginPage(page, {
      userByAction: {
        [E2E_AUTH_ACTIONS.EMAIL_SIGN_UP]: {
          id: "new-reader-1",
          name: "Maya Reader",
          nickname: "Maya",
          username: "maya@example.test",
          role: "Reader",
          isGuest: false,
        },
      },
    });

    await page.getByTestId("auth-mode-signup").click();

    await page.getByTestId("name-input").fill("Maya Reader");

    await page.getByTestId("email-input").fill("maya@example.test");

    await page.getByTestId("password-input").fill("signup-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(page.getByTestId("user-badge-name")).toContainText("Maya");

    await expectSingleAuthCall(page, E2E_AUTH_ACTIONS.EMAIL_SIGN_UP, {
      name: "Maya Reader",
      email: "maya@example.test",
      password: "signup-password",
    });
  });

  test("Google sign-in reaches the Story Picker without opening Firebase", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);

    await openLoginPage(page, {
      userByAction: {
        [E2E_AUTH_ACTIONS.GOOGLE_SIGN_IN]: {
          id: "google-reader-1",
          name: "Gita Reader",
          nickname: "Gita",
          username: "gita@example.test",
          role: "Reader",
          isGuest: false,
        },
      },
    });

    await page.getByTestId("google-login-button").click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(page.getByTestId("user-badge-name")).toContainText("Gita");

    await expectSingleAuthCall(page, E2E_AUTH_ACTIONS.GOOGLE_SIGN_IN, {});
  });

  test("invalid email credentials show the friendly message and mode switching clears it", async ({
    page,
  }) => {
    await openLoginPage(page, {
      failureByAction: {
        [E2E_AUTH_ACTIONS.EMAIL_SIGN_IN]: {
          code: "auth/invalid-credential",
        },
      },
    });

    await page.getByTestId("email-input").fill("wrong@example.test");

    await page.getByTestId("password-input").fill("wrong-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("login-error")).toContainText(
      "That email or password doesn't match. Try again.",
    );

    await expect(page.getByTestId("login-page")).toBeVisible();

    await expect(page.getByTestId("login-button")).toBeEnabled();

    await page.getByTestId("auth-mode-signup").click();

    await expect(page.getByTestId("login-error")).toHaveCount(0);

    await expect(page.getByTestId("email-input")).toHaveValue("");
  });

  test("duplicate email sign-up displays the friendly account-exists error", async ({
    page,
  }) => {
    await openLoginPage(page, {
      failureByAction: {
        [E2E_AUTH_ACTIONS.EMAIL_SIGN_UP]: {
          code: "auth/email-already-in-use",
        },
      },
    });

    await page.getByTestId("auth-mode-signup").click();

    await page.getByTestId("name-input").fill("Existing Reader");

    await page.getByTestId("email-input").fill("existing@example.test");

    await page.getByTestId("password-input").fill("existing-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("login-error")).toContainText(
      "An account with that email already exists. Try signing in.",
    );

    await expect(page.getByTestId("story-picker-page")).toHaveCount(0);
  });

  test("closed Google popup displays the friendly retry message", async ({
    page,
  }) => {
    await openLoginPage(page, {
      failureByAction: {
        [E2E_AUTH_ACTIONS.GOOGLE_SIGN_IN]: {
          code: "auth/popup-closed-by-user",
        },
      },
    });

    await page.getByTestId("google-login-button").click();

    await expect(page.getByTestId("login-error")).toContainText(
      "The Google sign-in window closed before finishing.",
    );

    await expect(page.getByTestId("login-page")).toBeVisible();
  });

  test("pending email sign-in disables actions and shows the loading label", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);

    await openLoginPage(page, {
      delayMsByAction: {
        [E2E_AUTH_ACTIONS.EMAIL_SIGN_IN]: 1_000,
      },
    });

    await page.getByTestId("email-input").fill("slow@example.test");

    await page.getByTestId("password-input").fill("slow-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("login-form")).toHaveAttribute(
      "aria-busy",
      "true",
    );

    await expect(page.getByTestId("login-button")).toBeDisabled();

    await expect(page.getByTestId("login-button")).toContainText("Checking...");

    await expect(page.getByTestId("google-login-button")).toBeDisabled();

    await expect(page.getByTestId("guest-login-button")).toBeDisabled();

    await expect(page.getByTestId("story-picker-page")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("email-authenticated logout returns to login and restores the story gate", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openLoginPage(page);

    await page.getByTestId("email-input").fill("logout@example.test");

    await page.getByTestId("password-input").fill("logout-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await selectStoryAndOpenLauncher(page);

    await page.getByTestId("logout-button").click();

    await expect(page.getByTestId("login-page")).toBeVisible();

    await page.getByTestId("email-input").fill("logout@example.test");

    await page.getByTestId("password-input").fill("logout-password");

    await page.getByTestId("login-button").click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(page.getByTestId("launcher-page")).toHaveCount(0);
  });
});
