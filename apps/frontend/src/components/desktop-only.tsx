import { StackedLogo } from "@/components/brand/stacked-logo";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The narrowest screen typomaniac is played on, the `lg` breakpoint: a width in pixels, written
// without a thousands separator in every Locale.
const DESKTOP_WIDTH = 1024;

// Below 1024 px, in place of the whole app (ADR 0009): typomaniac is played on a physical
// keyboard, there is no mobile layout. Pure CSS: nothing to measure, nothing flashes.
export const DesktopOnly = () => {
  const locale = useLocale();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-4 text-center lg:hidden">
      <StackedLogo />
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-2xl font-extrabold">{m.desktop_only_title({}, { locale })}</h1>
        <p className="text-muted-foreground">
          {m.desktop_only_text(
            { width: numberFormat(locale, { useGrouping: false }).format(DESKTOP_WIDTH) },
            { locale },
          )}
        </p>
      </div>
    </div>
  );
};
