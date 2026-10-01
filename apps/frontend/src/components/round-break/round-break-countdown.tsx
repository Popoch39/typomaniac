import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const FIGURE = "absolute top-1/2 left-1/2 -translate-1/2 opacity-0 leading-none";

// The 3-2-1, then the GO, played on the next Round's card: each figure comes and goes on the Round
// break's timeline, the GO on the next Round's start.
export const RoundBreakCountdown = () => {
  const locale = useLocale();

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {[3, 2, 1].map((figure) => (
        <span
          key={figure}
          data-rb={`count-${figure}`}
          className={`${FIGURE} font-text text-[150px] font-extrabold`}
        >
          {figure}
        </span>
      ))}
      <span data-rb="go" className={`${FIGURE} font-display text-8xl font-black text-brand`}>
        {m.face_off_go({}, { locale })}
      </span>
    </div>
  );
};
