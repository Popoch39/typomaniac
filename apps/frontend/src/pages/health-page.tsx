import { useSuspenseQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { ApiError } from "@/api/client";
import { healthQueryOptions } from "@/api/health";
import { Button } from "@/components/ui/button";

export const HealthPage = () => {
  const { data } = useSuspenseQuery(healthQueryOptions);

  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-6">
      <h1 className="font-heading text-2xl font-bold">Santé de l'API</h1>
      <p className="text-muted-foreground">
        Statut : <span className="font-mono font-semibold text-foreground">{data.status}</span>
      </p>
    </section>
  );
};

export const HealthError = ({ error, reset }: ErrorComponentProps) => (
  <section role="alert" className="flex flex-col items-start gap-4 rounded-card bg-card p-6">
    <h1 className="font-heading text-2xl font-bold text-destructive">API injoignable</h1>
    <p className="text-muted-foreground">La vérification de l'API a échoué.</p>
    {error instanceof ApiError && error.requestId !== null ? (
      <p className="text-sm text-muted-foreground">
        Référence : <span className="font-mono">{error.requestId}</span>
      </p>
    ) : null}
    <Button variant="outline" onClick={reset}>
      Réessayer
    </Button>
  </section>
);
