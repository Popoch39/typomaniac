import { Kbd } from "@/components/ui/kbd";

// At the foot of the page: the keys to Suivant, Tab then Enter, from the typing input or the Result.
export const NextRunKeys = () => (
  <p className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
    <Kbd>tab</Kbd> puis <Kbd>entrée</Kbd> : Suivant
  </p>
);
