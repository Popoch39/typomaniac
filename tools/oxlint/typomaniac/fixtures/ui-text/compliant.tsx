const m = {
  sidebar_title: () => "Sidebar",
};

export const Compliant = ({ wpm, handle }: { wpm: number; handle: string }) => (
  <section aria-label={m.sidebar_title()} className="flex gap-2" data-state="open">
    <h1>typomaniac</h1>
    <p>{wpm} wpm · 1 284 TP · 97 % · #1 — (+12) / 3.1 → ?!</p>
    <p>Google, GitHub & Discord</p>
    <p>{handle}</p>
    <p>{`@${handle}`}</p>
    <p>{wpm > 100 ? "🔥" : "…"}</p>
    <button type="button" title={m.sidebar_title()} aria-label={handle}>
      ×
    </button>
    <img src="/crest.svg" alt="" />
  </section>
);
