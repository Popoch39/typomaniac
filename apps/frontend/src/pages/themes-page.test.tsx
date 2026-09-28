import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { DocumentTheme } from "@/components/theme/document-theme";
import { ThemesPage } from "@/pages/themes-page";
import { useThemeStore } from "@/stores/theme-store";

const storageKey = "typomaniac-theme";

// Every test starts on a first visit: nothing stored, no Theme on the page yet.
beforeEach(() => {
  localStorage.clear();
  useThemeStore.setState(useThemeStore.getInitialState());
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// The page, and the root's effect that puts the Theme on <html>, the way the app mounts them.
const renderPage = () => {
  render(
    <>
      <DocumentTheme />
      <ThemesPage />
    </>,
  );

  return userEvent.setup();
};

// Reloads the page: the store starts over from its defaults, then reads what is stored. Resetting
// the store writes its defaults down, so what was stored is put back first.
const reload = async () => {
  cleanup();

  const stored = localStorage.getItem(storageKey);

  useThemeStore.setState(useThemeStore.getInitialState());
  delete document.documentElement.dataset.theme;

  if (stored !== null) {
    localStorage.setItem(storageKey, stored);
  }

  await useThemeStore.persist.rehydrate();

  return renderPage();
};

// Blocked site data: any access to the storage throws.
const unavailable = () => {
  throw new DOMException("Blocked", "SecurityError");
};

const store = (value: string) => localStorage.setItem(storageKey, value);

const pageTheme = () => document.documentElement.dataset.theme;

// The header's reminder of the Theme in use, not the badge on its card.
const activeChip = () =>
  screen.getByText((_, element) => element?.textContent?.startsWith("Actif ") ?? false, {
    selector: "p",
  });

describe("the Themes page", () => {
  test("offers the seven Themes, Corail on a first visit", () => {
    renderPage();

    const picker = screen.getByRole("group", { name: "Theme" });

    expect(within(picker).getAllByRole("radio")).toHaveLength(7);

    for (const name of ["Corail", "Lagon", "Matcha", "Lilas", "Sakura", "Arcade", "Craie"]) {
      expect(within(picker).getByRole("radio", { name })).toBeInTheDocument();
    }

    expect(screen.getByRole("radio", { name: "Corail" })).toBeChecked();
    expect(pageTheme()).toBe("corail");
    expect(activeChip()).toHaveTextContent("Actif Corail");
  });

  test("describes each Theme under its name", () => {
    renderPage();

    expect(screen.getByRole("radio", { name: "Lagon" })).toHaveAccessibleDescription(
      "Bleu du large. Les rôles s'inversent : l'adversaire passe au corail.",
    );
  });

  test("a Theme chosen applies to the whole page at once, and is stored", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("radio", { name: "Lagon" }));

    expect(screen.getByRole("radio", { name: "Lagon" })).toBeChecked();
    expect(pageTheme()).toBe("lagon");
    expect(activeChip()).toHaveTextContent("Actif Lagon");
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "null")).toEqual({
      state: { theme: "lagon" },
      version: 1,
    });
  });

  test("the arrow keys go from one Theme to the next", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("radio", { name: "Corail" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "Lagon" })).toBeChecked();
    expect(pageTheme()).toBe("lagon");
  });

  test("the Theme chosen comes back on this browser", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("radio", { name: "Craie" }));
    await reload();

    expect(screen.getByRole("radio", { name: "Craie" })).toBeChecked();
    expect(pageTheme()).toBe("craie");
  });

  test("a stored Theme is the one on the page from the start", async () => {
    store(JSON.stringify({ state: { theme: "matcha" }, version: 1 }));
    await reload();

    expect(screen.getByRole("radio", { name: "Matcha" })).toBeChecked();
    expect(pageTheme()).toBe("matcha");
  });

  test.each([
    ["an unknown Theme", JSON.stringify({ state: { theme: "neon" }, version: 1 })],
    ["a missing Theme", JSON.stringify({ state: {}, version: 1 })],
    ["unreadable JSON", "{not json"],
  ])("%s stored gives Corail back", async (_, value) => {
    store(value);
    await reload();

    expect(screen.getByRole("radio", { name: "Corail" })).toBeChecked();
    expect(pageTheme()).toBe("corail");
  });

  test("without a storage, Corail, and a Theme chosen still applies for the visit", async () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(unavailable);
    vi.spyOn(localStorage, "setItem").mockImplementation(unavailable);
    await useThemeStore.persist.rehydrate();

    const user = renderPage();

    expect(screen.getByRole("radio", { name: "Corail" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Arcade" }));
    expect(pageTheme()).toBe("arcade");
  });

  test("says what a Theme changes", () => {
    renderPage();

    const section = screen.getByRole("region", { name: "Ce que change un Theme" });

    expect(section).toHaveTextContent("Fond et surfaces");
    expect(section).toHaveTextContent("Accent");
    expect(section).toHaveTextContent("Adversaire");
    expect(section).toHaveTextContent("Tiers");
  });
});
