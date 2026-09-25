import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

type SignInInvitationProps = { title: string; reason: string };

// In place of a page only signed-in Users see (a Profile, the Classement): why, and a way in.
export const SignInInvitation = ({ title, reason }: SignInInvitationProps) => {
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-4 py-12">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-muted-foreground">{reason}</p>
      <Button className="self-start" onClick={() => setSignInOpen(true)}>
        Se connecter
      </Button>
    </section>
  );
};
