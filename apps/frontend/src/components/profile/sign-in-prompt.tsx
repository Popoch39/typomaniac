import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

// Why a page is for signed-in Users only, and a way in: the sign-in dialog.
export const SignInPrompt = ({ reason }: { reason: string }) => {
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-muted-foreground">{reason}</p>
      <Button onClick={() => setSignInOpen(true)}>Se connecter</Button>
    </div>
  );
};
