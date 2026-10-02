import { PencilIcon } from "lucide-react";

import type { Me } from "@/api/me";
import { OrnamentPicker } from "@/components/ornament/ornament-picker";
import { ProfileHandleSettings } from "@/components/profile/profile-handle-settings";
import { ProfilePhotoSettings } from "@/components/profile/profile-photo-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « Modifier le profil », at the right of the header of `/profile`: the User's settings in a dialog
// over the page, their Photo, their Handle (changed at will, or chosen at last), then the Ornament
// they wear, which only a User with a Handle wears. It stays open once the Handle is saved: the Ornament is
// still to choose.
export const ProfileEditDialog = ({ me }: { me: Me }) => {
  const locale = useLocale();
  const title = m.profile_edit({}, { locale });

  return (
    <Dialog>
      {/* Positioned: drawn over the avatar's Ornament where it overflows, never under it. */}
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            className="relative rounded-full pr-5 text-[15px] has-data-[icon=inline-start]:pl-4"
          />
        }
      >
        <PencilIcon aria-hidden data-icon="inline-start" className="size-4.5" />
        {title}
      </DialogTrigger>
      {/* Scrolled within the window: the framing of a Photo makes the settings taller than 900 px. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <ProfilePhotoSettings me={me} />
        <ProfileHandleSettings me={me} />
        {me.handle === null ? null : <OrnamentPicker me={me} handle={me.handle} />}
      </DialogContent>
    </Dialog>
  );
};
