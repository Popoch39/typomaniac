import { useId } from "react";

import type { Me } from "@/api/me";
import { PhotoAvatarInput } from "@/components/photo/photo-avatar-input";
import type { PhotoSource } from "@/components/photo/photo-tools";
import { RemovePhotoButton } from "@/components/photo/remove-photo-button";
import { useChoosePhoto } from "@/components/photo/use-choose-photo";
import { SMALL_TITLE_PAINT } from "@/components/small-title-paint";
import { buttonVariants } from "@/components/ui/button-variants";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

type PhotoChooserProps = { me: Me; onChosen: (source: PhotoSource) => void };

// The User's Avatar as it is, with the image to choose for it (dropped on the Avatar, or picked by
// the button, a label of the same input), and the Photo to remove when they have one.
export const PhotoChooser = ({ me, onChosen }: PhotoChooserProps) => {
  const locale = useLocale();
  const inputId = useId();
  const choose = useChoosePhoto(onChosen);
  const label = me.hasPhoto ? m.photo_change({}, { locale }) : m.photo_choose({}, { locale });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={cn("mb-3", SMALL_TITLE_PAINT)}>{m.photo_title({}, { locale })}</legend>
      <div className="flex items-center gap-4">
        <PhotoAvatarInput id={inputId} label={label} me={me} onFile={choose} />
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={inputId}
            className={cn(buttonVariants({ variant: "secondary" }), "cursor-pointer")}
          >
            {label}
          </label>
          {me.hasPhoto ? <RemovePhotoButton /> : null}
        </div>
      </div>
      <p className="text-xs leading-normal text-muted-foreground">{m.photo_hint({}, { locale })}</p>
    </fieldset>
  );
};
