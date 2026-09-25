import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

// In place of a Profile for a Visitor: only signed-in Users see one another.
export const SignInInvitation = () => {
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-4 py-12">
      <h1 className="text-lg font-bold">Profile</h1>
      <p className="text-muted-foreground">Connecte-toi pour voir le Profile de ce User.</p>
      <Button className="self-start" onClick={() => setSignInOpen(true)}>
        Se connecter
      </Button>
    </section>
  );
};
