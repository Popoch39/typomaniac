import { Kbd } from "@/components/ui/kbd";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// At the foot of the page: the keys to the next Run, Tab then Enter, from the typing input or the
// Result. « tab then enter: Next ».
export const NextRunKeys = () => {
  const locale = useLocale();

  return (
    <p className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
      <Kbd>{m.run_keys_tab({}, { locale })}</Kbd> {m.run_keys_then({}, { locale })}{" "}
      <Kbd>{m.run_keys_enter({}, { locale })}</Kbd>
      {m.run_keys_next({}, { locale })}
    </p>
  );
};
