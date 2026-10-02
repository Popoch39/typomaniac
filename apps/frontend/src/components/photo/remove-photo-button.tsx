import { useRemovePhoto } from "@/components/photo/use-remove-photo";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Removes the User's Photo, shown only when they have one.
export const RemovePhotoButton = () => {
  const locale = useLocale();
  const remove = useRemovePhoto();

  return (
    <Button variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}>
      {m.photo_remove({}, { locale })}
    </Button>
  );
};
