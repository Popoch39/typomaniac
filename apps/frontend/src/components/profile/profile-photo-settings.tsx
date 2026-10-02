import { useState } from "react";

import type { Me } from "@/api/me";
import { PhotoChooser } from "@/components/photo/photo-chooser";
import { PhotoCropper } from "@/components/photo/photo-cropper";
import type { PhotoSource } from "@/components/photo/photo-tools";

// The User's Photo, in the settings of `/profile`: chosen, then framed in place of the setting, and
// back to it once sent or cancelled, the image chosen let go then. Even without a Handle.
export const ProfilePhotoSettings = ({ me }: { me: Me }) => {
  const [chosen, setChosen] = useState<PhotoSource | null>(null);

  return chosen === null ? (
    <PhotoChooser me={me} onChosen={setChosen} />
  ) : (
    <PhotoCropper
      source={chosen}
      onDone={() => {
        chosen.release();
        setChosen(null);
      }}
    />
  );
};
