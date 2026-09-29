import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";

// At the bottom of a Visitor's sidebar, in place of the User's card: what a Session opens, and the
// way to the sign-in dialog.
export const VisitorCard = () => {
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-sidebar-accent p-4">
      <p className="text-[13px] leading-[1.45] text-muted-foreground">
        {m.sidebar_visitor_pitch({}, { locale })}
      </p>
      <Button className="rounded-[14px] font-bold" onClick={() => setSignInOpen(true)}>
        {m.sidebar_visitor_sign_in({}, { locale })}
      </Button>
    </div>
  );
};
