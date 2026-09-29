import { DuelScreen } from "@/components/duel/duel-screen";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Duel's page, as tall as the window: in the Duel's scene from its Countdown to its end, then
// its end screen.
export const DuelPage = () => {
  const locale = useLocale();

  return (
    <section className="flex flex-1 flex-col gap-4 duel-scene:gap-0">
      <h1 className="sr-only">{m.duel_title({}, { locale })}</h1>
      <DuelScreen />
    </section>
  );
};
