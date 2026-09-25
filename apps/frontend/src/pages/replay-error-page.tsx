import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

// The Duel cannot be read: it does not exist, or the User did not play it (the API says 404 for
// both), or the request failed.
export const ReplayErrorPage = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-col py-12">
    <ErrorState
      title="Duel introuvable"
      happened="Ce Duel n'existe pas, ou tu ne l'as pas joué."
      cost="Son Replay ne peut pas se lire ; ta Duel history, elle, est intacte."
      action={
        <Button variant="outline" nativeButton={false} render={<Link to="/duels" />}>
          Retour à la Duel history
        </Button>
      }
    />
  </section>
);
