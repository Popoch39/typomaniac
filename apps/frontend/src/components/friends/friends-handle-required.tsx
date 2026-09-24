import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

// The Friends go by their Handle: without one of their own, a User cannot look for others yet.
export const FriendsHandleRequired = () => {
  const setHandleChoiceDeferred = useAuthStore((state) => state.setHandleChoiceDeferred);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-muted-foreground">
        Les Friends se trouvent par leur Handle : choisis le tien pour chercher les autres.
      </p>
      <Button onClick={() => setHandleChoiceDeferred(false)}>Choisir mon Handle</Button>
    </div>
  );
};
