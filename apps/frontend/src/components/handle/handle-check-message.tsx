import { cn } from "cn";

import { refusals } from "@/components/handle/handle-refusals";
import type { HandleStatus } from "@/components/handle/use-handle-check";

const messageOf = (status: HandleStatus) => {
  switch (status.kind) {
    case "refused":
      return refusals[status.reason];
    case "current":
      return "C'est ton Handle actuel.";
    case "checking":
      return "Vérification…";
    case "available":
      return "Disponible.";
    case "unknown":
      return "Impossible de vérifier pour l'instant.";
  }
};

const toneOf = (status: HandleStatus) => {
  switch (status.kind) {
    case "refused":
      return "text-destructive";
    case "available":
      return "text-caret";
    default:
      return "text-muted-foreground";
  }
};

// What the live check says of the Handle being typed, read out as it changes.
export const HandleCheckMessage = ({ id, status }: { id: string; status: HandleStatus }) => (
  <p id={id} aria-live="polite" className={cn("text-[0.7rem]", toneOf(status))}>
    {messageOf(status)}
  </p>
);
