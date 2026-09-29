import { ArrowLeftIcon } from "lucide-react";

// Under the search: the Friends online are in the sidebar, to challenge while the User waits.
export const QueueTip = () => (
  <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
    <ArrowLeftIcon aria-hidden className="size-4.5" />
    En attendant, défie un Friend en ligne : le premier Duel qui aboutit l'emporte.
  </p>
);
