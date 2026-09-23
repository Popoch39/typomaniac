import { useSuspenseQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { healthQueryOptions } from "@/api/health";
import { Button } from "@/components/ui/button";

export const HealthPage = () => {
  const { data } = useSuspenseQuery(healthQueryOptions);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold">Santé de l'API</h1>
      <p>Statut : {data.status}</p>
    </section>
  );
};

export const HealthError = ({ error, reset }: ErrorComponentProps) => (
  <section role="alert" className="flex flex-col items-start gap-4">
    <h1 className="font-heading text-2xl font-bold text-destructive">API injoignable</h1>
    <p>{error instanceof Error ? error.message : "Erreur inconnue"}</p>
    <Button variant="outline" onClick={reset}>
      Réessayer
    </Button>
  </section>
);
