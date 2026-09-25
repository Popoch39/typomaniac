import { Button } from "@/components/ui/button";
import { useDuelStore } from "@/stores/duel-store";

// Duel is not played here: another tab plays the place, or the Duel was lost with the connection.
// The button takes the place back here: the Duel resumed, or the Queue joined.
export const DuelInterrupted = ({ message, action }: { message: string; action: string }) => {
  const claim = useDuelStore((store) => store.claim);

  return (
    <div className="flex flex-col items-center gap-6 rounded-card bg-card px-8 py-12">
      <output className="text-muted-foreground">{message}</output>
      <Button variant="outline" onClick={claim}>
        {action}
      </Button>
    </div>
  );
};
