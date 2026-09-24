import { Link } from "@tanstack/react-router";

// The Duel cannot be read: it does not exist, or the User did not play it (the API says 404 for
// both), or the request failed.
export const ReplayErrorPage = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-12">
    <h1 className="text-lg font-bold">Duel introuvable</h1>
    <p className="text-muted-foreground">Ce Duel n'existe pas, ou tu ne l'as pas joué.</p>
    <Link to="/duels" className="text-sm underline">
      Retour à la Duel history
    </Link>
  </section>
);
