import { Link } from "@tanstack/react-router";

// No User holds this Handle: never taken, or given up.
export const UserProfileNotFoundPage = () => (
  <section className="mx-auto flex w-full max-w-sm flex-col gap-4 py-12">
    <h1 className="text-lg font-bold">User introuvable</h1>
    <p className="text-muted-foreground">Aucun User ne porte ce Handle.</p>
    <Link to="/" className="text-sm underline">
      Retour à l'accueil
    </Link>
  </section>
);
