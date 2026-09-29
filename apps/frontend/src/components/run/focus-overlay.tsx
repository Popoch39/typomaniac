import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Blurs the Text while the typing input has lost the focus. A click on it gives the focus back.
export const FocusOverlay = ({ onResume }: { onResume: () => void }) => {
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={onResume}
      className="absolute inset-0 flex cursor-default items-center justify-center rounded-card text-lg font-semibold backdrop-blur-sm"
    >
      {m.run_resume({}, { locale })}
    </button>
  );
};
