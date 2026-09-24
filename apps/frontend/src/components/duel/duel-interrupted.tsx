import { Button } from "@/components/ui/button";
import { useDuelStore } from "@/stores/duel-store";

// The socket is closed: another tab took the place, or the server is out of reach. Reconnecting
// here takes the place back and joins the Queue again.
export const DuelInterrupted = ({ message }: { message: string }) => {
  const connect = useDuelStore((store) => store.connect);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <output className="text-muted-foreground">{message}</output>
      <Button variant="outline" onClick={connect}>
        Chercher un Duel ici
      </Button>
    </div>
  );
};
