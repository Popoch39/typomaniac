import { KeyboardIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

// Below 1024 px, in place of the whole app (ADR 0009): typomaniac is played on a physical
// keyboard, there is no mobile layout. Pure CSS: nothing to measure, nothing flashes.
export const DesktopOnly = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-4 text-center lg:hidden">
    <BrandMark />
    <KeyboardIcon aria-hidden className="size-12 text-primary" />
    <div className="flex max-w-sm flex-col gap-2">
      <h1 className="text-2xl font-extrabold">Passe sur ordinateur</h1>
      <p className="text-muted-foreground">
        typomaniac se joue au clavier, sur un écran d'au moins 1024 px de large. Ouvre-le sur ton
        ordinateur pour taper.
      </p>
    </div>
  </div>
);
