import { useSuspenseQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { ApiError } from "@/api/client";
import { healthQueryOptions } from "@/api/health";
import { Button } from "@/components/ui/button";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

export const HealthPage = () => {
  const { data } = useSuspenseQuery(healthQueryOptions);
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-6">
      <h1 className="font-heading text-2xl font-bold">{m.health_title({}, { locale })}</h1>
      <p className="text-muted-foreground">
        {withSlots((marks) => m.health_status(marks, { locale }), {
          status: <span className="font-mono font-semibold text-foreground">{data.status}</span>,
        })}
      </p>
    </section>
  );
};

export const HealthError = ({ error, reset }: ErrorComponentProps) => {
  const locale = useLocale();

  return (
    <section role="alert" className="flex flex-col items-start gap-4 rounded-card bg-card p-6">
      <h1 className="font-heading text-2xl font-bold text-destructive">
        {m.health_error_title({}, { locale })}
      </h1>
      <p className="text-muted-foreground">{m.health_error_happened({}, { locale })}</p>
      {error instanceof ApiError && error.requestId !== null ? (
        <p className="text-sm text-muted-foreground">
          {withSlots((marks) => m.health_error_reference(marks, { locale }), {
            id: <span className="font-mono">{error.requestId}</span>,
          })}
        </p>
      ) : null}
      <Button variant="outline" onClick={reset}>
        {m.health_error_retry({}, { locale })}
      </Button>
    </section>
  );
};
