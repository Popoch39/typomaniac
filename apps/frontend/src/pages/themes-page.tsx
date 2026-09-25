import { EmptyState } from "@/components/ui/empty-state";

// The choice of the accent: its place is ready, the themes come later.
export const ThemesPage = () => (
  <section className="flex flex-col gap-5">
    <h1 className="text-2xl font-extrabold">Thèmes</h1>
    <EmptyState
      title="Les thèmes arrivent bientôt"
      reason="Pour l'instant, typomaniac n'a qu'un thème : l'accent corail sur fond encre."
    />
  </section>
);
