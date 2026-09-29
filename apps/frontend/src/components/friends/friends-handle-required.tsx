import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";

// The Friends go by their Handle: without one of their own, a User cannot look for others yet.
export const FriendsHandleRequired = () => {
  const setHandleChoiceDeferred = useAuthStore((state) => state.setHandleChoiceDeferred);
  const locale = useLocale();

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-muted-foreground">{m.friends_handle_required({}, { locale })}</p>
      <Button onClick={() => setHandleChoiceDeferred(false)}>
        {m.friends_handle_choose({}, { locale })}
      </Button>
    </div>
  );
};
