import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { DocumentTheme } from "@/components/theme/document-theme";
import { ThemesPage } from "@/pages/themes-page";
import { useThemeStore } from "@/stores/theme-store";

const storageKey = "typomaniac-theme";

// The meta of index.html that tells the browser whether its native controls are dark or light.
const schemeMeta = () => {
  const meta = document.querySelector('meta[name="color-scheme"]');

  if (meta === null) {
    throw new Error("No color-scheme meta");
  }

  return meta;
};

// The tab's icon of index.html.
const pageIcon = () => document.querySelector('link[rel="icon"]')?.getAttribute("href");

// The head as index.html writes it: Coral's icon, dark native controls.
const firstHead =
  '<link rel="icon" type="image/svg+xml" href="/favicons/coral.svg" /><meta name="color-scheme" content="dark" />';

// Every test starts on a first visit: nothing stored, no Theme on the page yet, the page's head
// as index.html writes it.
beforeEach(() => {
  localStorage.clear();
  useThemeStore.setState(useThemeStore.getInitialState());
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = firstHead;
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
  test("offers the eight Themes, Coral on a first visit", () => {
    renderPage();

    const picker = screen.getByRole("group", { name: "Theme" });

    expect(within(picker).getAllByRole("radio")).toHaveLength(8);

    for (const name of [
      "Corail",
      "Lagon",
      "Matcha",
      "Lilas",
      "Sakura",
      "Arcade",
      "Craie",
      "Papier",
    ]) {
      expect(within(picker).getByRole("radio", { name })).toBeInTheDocument();
    }

    expect(screen.getByRole("radio", { name: "Corail" })).toBeChecked();
    expect(pageTheme()).toBe("coral");
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
    expect(pageTheme()).toBe("lagoon");
    expect(activeChip()).toHaveTextContent("Actif Lagon");
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "null")).toEqual({
      state: { theme: "lagoon" },
      version: 2,
    });
  });

  test("the arrow keys go from one Theme to the next", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("radio", { name: "Corail" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "Lagon" })).toBeChecked();
    expect(pageTheme()).toBe("lagoon");
  });

  test("Paper, the light one, turns the browser's native controls light, and back", async () => {
    const user = renderPage();

    expect(screen.getByRole("radio", { name: "Papier" })).toHaveAccessibleDescription(
      "Le seul clair : encre sur papier, pour taper en plein jour.",
    );
    expect(schemeMeta()).toHaveAttribute("content", "dark");

    await user.click(screen.getByRole("radio", { name: "Papier" }));

    expect(pageTheme()).toBe("paper");
    expect(activeChip()).toHaveTextContent("Actif Papier");
    expect(schemeMeta()).toHaveAttribute("content", "light");

    await user.click(screen.getByRole("radio", { name: "Craie" }));

    expect(schemeMeta()).toHaveAttribute("content", "dark");
  });

  test("Paper chosen comes back on this browser, light from the start", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("radio", { name: "Papier" }));
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "null")).toEqual({
      state: { theme: "paper" },
      version: 2,
    });

    document.head.innerHTML = firstHead;
    await reload();

    expect(screen.getByRole("radio", { name: "Papier" })).toBeChecked();
    expect(pageTheme()).toBe("paper");
    expect(schemeMeta()).toHaveAttribute("content", "light");
  });

  test("a Theme chosen puts its own icon in the tab", async () => {
    const user = renderPage();

    expect(pageIcon()).toBe("/favicons/coral.svg");

    await user.click(screen.getByRole("radio", { name: "Papier" }));

    expect(pageIcon()).toBe("/favicons/paper.svg");

    await user.click(screen.getByRole("radio", { name: "Sakura" }));

    expect(pageIcon()).toBe("/favicons/sakura.svg");
  });

  test("the Theme chosen comes back on this browser", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("radio", { name: "Craie" }));
    await reload();

    expect(screen.getByRole("radio", { name: "Craie" })).toBeChecked();
    expect(pageTheme()).toBe("chalk");
  });

  test("a stored Theme is the one on the page from the start", async () => {
    store(JSON.stringify({ state: { theme: "matcha" }, version: 2 }));
    await reload();

    expect(screen.getByRole("radio", { name: "Matcha" })).toBeChecked();
    expect(pageTheme()).toBe("matcha");
  });

  test("a Theme kept under its former id comes back under its new one", async () => {
    store(JSON.stringify({ state: { theme: "lagon" }, version: 1 }));
    await reload();

    expect(screen.getByRole("radio", { name: "Lagon" })).toBeChecked();
    expect(pageTheme()).toBe("lagoon");
    expect(pageIcon()).toBe("/favicons/lagoon.svg");
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "null")).toEqual({
      state: { theme: "lagoon" },
      version: 2,
    });
  });

  test.each([
    ["an unknown Theme", JSON.stringify({ state: { theme: "neon" }, version: 2 })],
    ["a missing Theme", JSON.stringify({ state: {}, version: 2 })],
    ["unreadable JSON", "{not json"],
  ])("%s stored gives Coral back", async (_, value) => {
    store(value);
    await reload();

    expect(screen.getByRole("radio", { name: "Corail" })).toBeChecked();
    expect(pageTheme()).toBe("coral");
  });

  test("without a storage, Coral, and a Theme chosen still applies for the visit", async () => {
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
    expect(section).toHaveTextContent("sur Papier, elle est assombrie pour rester lisible");
  });
});
