import { LogoSymbol } from "@/components/brand/logo-symbol";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A Theme in miniature, painted in the colours of the `data-theme` it sits under: the sidebar with
// its Logo and its nav, the Run settings, a Text with both carets, a Duel's band. A picture only:
// its words are the card's, its Text in the Locale.
export const ThemePreview = () => {
  const locale = useLocale();

  return (
    <span
      aria-hidden="true"
      className="flex h-37.5 gap-1.5 rounded-[18px] bg-background p-1.5 text-foreground"
    >
      <span className="flex w-11 shrink-0 flex-col gap-1.25 rounded-xl bg-card px-1.5 py-1.75">
        <LogoSymbol drawing="simplified" className="mb-1 size-3.5" />
        <span className="h-2 rounded-full bg-brand" />
        <span className="h-2 rounded-full bg-border" />
        <span className="h-2 rounded-full bg-border" />
        <span className="h-2 rounded-full bg-border" />
      </span>
      <span className="flex min-w-0 grow flex-col gap-1.5">
        <span className="flex justify-center gap-1 pt-0.5">
          <span className="h-2.25 w-5.5 rounded-full bg-brand" />
          <span className="h-2.25 w-5.5 rounded-full bg-card" />
          <span className="h-2.25 w-5.5 rounded-full bg-card" />
        </span>
        <span className="grow overflow-hidden rounded-xl bg-card px-2.5 py-2 font-mono text-[9.5px] leading-[17px] text-pending">
          <span className="text-foreground">{m.themes_preview_typed({}, { locale })}</span>
          {withSlots((marks) => m.themes_preview_pending(marks, { locale }), {
            caret: <span className="mx-px -mb-px inline-block h-2.75 w-0.5 bg-caret" />,
            opponent: <span className="mx-px -mb-px inline-block h-2.75 w-0.5 bg-opponent-caret" />,
          })}
        </span>
        <span className="flex h-6 overflow-hidden rounded-lg font-display text-[10px] font-extrabold">
          <span className="flex w-[56%] items-center bg-brand pl-2 text-on-brand">412</span>
          <span className="flex grow items-center justify-end bg-opponent pr-2 text-on-opponent">
            358
          </span>
        </span>
      </span>
    </span>
  );
};
