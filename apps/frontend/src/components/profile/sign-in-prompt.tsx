import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";

// Why a page is for signed-in Users only, and a way in: the sign-in dialog.
export const SignInPrompt = ({ reason }: { reason: string }) => {
  const locale = useLocale();
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-muted-foreground">{reason}</p>
      <Button onClick={() => setSignInOpen(true)}>{m.profile_sign_in({}, { locale })}</Button>
    </div>
  );
};
