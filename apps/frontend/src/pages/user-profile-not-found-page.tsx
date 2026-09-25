import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

// No User holds this Handle: never taken, or given up.
export const UserProfileNotFoundPage = () => (
  <section className="mx-auto flex w-full max-w-sm flex-col py-12">
    <ErrorState
      title="User introuvable"
      happened="Aucun User ne porte ce Handle : il n'a jamais été pris, ou il a été changé."
      cost="Pas de Profile à montrer ici ; cherche le User par son Handle actuel."
      action={
        <Button variant="outline" nativeButton={false} render={<Link to="/friends" />}>
          Chercher un User
        </Button>
      }
    />
  </section>
);
