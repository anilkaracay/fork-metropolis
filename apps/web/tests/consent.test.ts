import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONSENT_WINDOW_MS,
  grantConsent,
  takeConsent,
} from "../src/lib/consent";

const trusted = { isTrusted: true },
  scripted = { isTrusted: false };
describe("signing consent", () => {
  it("lets a trusted click sign exactly once, for its own action", () => {
    grantConsent("back", trusted, 1000);
    expect(() => takeConsent("back", 1500)).not.toThrow();
    expect(() => takeConsent("back", 1600)).toThrow("Nothing was signed.");
  });
  it("refuses without a click, after a scripted event, for another action, or too late", () => {
    expect(() => takeConsent("publish")).toThrow("Nothing was signed.");
    grantConsent("withdraw", scripted);
    expect(() => takeConsent("withdraw")).toThrow("Nothing was signed.");
    grantConsent("withdraw", trusted, 0);
    expect(() => takeConsent("back", 10)).toThrow("Nothing was signed.");
    grantConsent("publish", trusted, 0);
    expect(() => takeConsent("publish", CONSENT_WINDOW_MS + 1)).toThrow(
      "Nothing was signed.",
    );
  });
});

const src = path.join(import.meta.dirname, "../src");
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(dir, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [path.join(dir, entry.name)]
        : [],
  );
const read = (file: string) => readFileSync(path.join(src, file), "utf8");
describe("where signing can start", () => {
  it("grants consent only from the four consent buttons", () => {
    const granting = files(src)
      .filter((file) => /grantConsent\(/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(src, file))
      .sort();
    expect(granting).toEqual([
      "components/social/back-sheet.tsx",
      "components/social/composer.tsx",
      "components/social/withdraw.ts",
      "lib/consent.ts",
    ]);
    // Withdraw's consent comes from its two buttons' click handlers.
    for (const file of [
      "components/app-shell.tsx",
      "components/social/profile-screen.tsx",
    ])
      expect(read(file)).toContain("withdraw(event.nativeEvent)");
  });
  it("takes consent before every transaction the wallet is asked to sign", () => {
    for (const file of [
      "components/social/privy-session.tsx",
      "components/social/session.tsx",
    ]) {
      const text = read(file);
      for (const [method, action] of [
        ["submit", "publish"],
        ["back", "back"],
        ["withdraw", "withdraw"],
      ]) {
        const body = text.slice(text.indexOf(`    ${method}: async`));
        expect(body.split("\n")[1]?.trim(), `${file} ${method}`).toBe(
          `takeConsent("${action}");`,
        );
      }
    }
  });
  it("keeps Privy's own transaction screens off", () => {
    expect(read("components/social/privy-session.tsx")).toContain(
      "showWalletUIs: false",
    );
  });
});
