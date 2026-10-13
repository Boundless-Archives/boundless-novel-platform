/*
 * The one definition of an acceptable username. Mirrors the
 * username_is_valid() function in the database, which is the
 * final enforcer. Keep the two in step if you ever change this.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "staff",
  "support",
  "help",
  "moderator",
  "mod",
  "editor",
  "system",
  "boundless",
  "official",
  "root",
  "null",
  "undefined",
  "series", // /author/series is a real page
  "api",
  "auth",
  "login",
  "signup",
  "new",
]);

export const USERNAME_RULES_TEXT =
  "3–20 characters: lowercase letters, numbers and underscores only. No spaces.";

const INVALID_USERNAME_MESSAGE = `Usernames must be ${USERNAME_RULES_TEXT}`;

/* Returns an error message, or null if the username is fine. */
export function validateUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return INVALID_USERNAME_MESSAGE;
  }

  if (RESERVED_USERNAMES.has(username)) {
    return "That username isn't available.";
  }

  return null;
}

/* Turns typed input into something that can only be valid characters. */
export function cleanUsernameInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}