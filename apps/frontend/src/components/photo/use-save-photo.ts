import { useMutation } from "@tanstack/react-query";

import { savePhoto } from "@/api/photo";
import { photoFailure } from "@/components/photo/photo-failure";
import { useAvatarSaved } from "@/components/photo/use-avatar-saved";
import { toast } from "@/lib/toast";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Sends the framed Photo; `onSaved` once it is the User's Avatar.
export const useSavePhoto = (onSaved: () => void) => {
  const locale = useLocale();
  const avatarSaved = useAvatarSaved();

  return useMutation({
    mutationFn: savePhoto,
    onSuccess: (me) => {
      avatarSaved(me);
      toast.success(m.photo_saved({}, { locale }));
      onSaved();
    },
    onError: (error) => {
      toast.error(photoFailure(error, locale, m.photo_save_failed({}, { locale })));
    },
  });
};
