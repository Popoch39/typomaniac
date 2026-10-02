import { useMutation } from "@tanstack/react-query";

import { removePhoto } from "@/api/photo";
import { useAvatarSaved } from "@/components/photo/use-avatar-saved";
import { toast } from "@/lib/toast";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Removes the User's Photo: their provider's image, or their initials, are their Avatar again.
export const useRemovePhoto = () => {
  const locale = useLocale();
  const avatarSaved = useAvatarSaved();

  return useMutation({
    mutationFn: removePhoto,
    onSuccess: (me) => {
      avatarSaved(me);
      toast.success(m.photo_removed({}, { locale }));
    },
    onError: () => {
      toast.error(m.photo_remove_failed({}, { locale }));
    },
  });
};
