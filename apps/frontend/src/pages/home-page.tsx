import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/stores/demo-store";

export const HomePage = () => {
  const clicks = useDemoStore((state) => state.clicks);
  const increment = useDemoStore((state) => state.increment);
  const reset = useDemoStore((state) => state.reset);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold">typomaniac</h1>
      <p>Clics (store Zustand de démo) : {clicks}</p>
      <div className="flex gap-2">
        <Button onClick={increment}>+1</Button>
        <Button variant="outline" onClick={reset}>
          Remettre à zéro
        </Button>
      </div>
    </section>
  );
};
