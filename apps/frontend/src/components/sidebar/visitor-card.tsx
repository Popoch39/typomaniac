import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

// At the bottom of a Visitor's sidebar, in place of the User's card: what a Session opens, and the
// way to the sign-in dialog.
export const VisitorCard = () => {
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-sidebar-accent p-4">
      <p className="text-[13px] leading-[1.45] text-muted-foreground">
        Connecte-toi pour jouer en Duel, entrer au Classement et défier tes Friends.
      </p>
      <Button className="rounded-[14px] font-bold" onClick={() => setSignInOpen(true)}>
        Se connecter
      </Button>
    </div>
  );
};
