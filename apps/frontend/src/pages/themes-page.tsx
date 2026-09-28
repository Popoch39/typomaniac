import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

// The choice of the Theme: its place is ready, the Themes come later.
export const ThemesPage = () => (
  <section className="flex flex-col gap-6">
    <PageHeader
      title="Thèmes"
      subtitle="Choisis tes couleurs. Un thème change le fond, l'accent et la couleur de l'adversaire, jamais la place des choses."
    />
    <div className="w-full max-w-2xl">
      <EmptyState
        title="Les thèmes arrivent bientôt"
        reason="Pour l'instant, typomaniac n'a qu'un thème : l'accent corail sur fond encre."
      />
    </div>
  </section>
);
