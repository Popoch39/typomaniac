import { useState } from "react";

import { cropOf, initialFraming, moved, zoomed } from "@/components/photo/photo-crop";
import { FRAME_SIDE, PhotoFrame } from "@/components/photo/photo-frame";
import type { PhotoSource } from "@/components/photo/photo-tools";
import { PhotoZoomSlider } from "@/components/photo/photo-zoom-slider";
import { useSavePhoto } from "@/components/photo/use-save-photo";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type PhotoCropperProps = { source: PhotoSource; onDone: () => void };

// The image chosen, framed by the User then sent: `onDone` once it is their Photo, or on Cancel.
export const PhotoCropper = ({ source, onDone }: PhotoCropperProps) => {
  const locale = useLocale();
  const [framing, setFraming] = useState(() => initialFraming(source));
  const save = useSavePhoto(onDone);
  const [exporting, setExporting] = useState(false);

  const sendFraming = async () => {
    setExporting(true);

    const photo = await source.exportCrop(cropOf(framing, source));

    setExporting(false);

    if (photo === null) {
      toast.error(m.photo_save_failed({}, { locale }));
    } else {
      save.mutate(photo);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PhotoFrame
        source={source}
        framing={framing}
        onMove={(delta) => setFraming((current) => moved(current, source, FRAME_SIDE, delta))}
        onZoomBy={(step) => setFraming((current) => zoomed(current, source, current.zoom + step))}
      />
      <PhotoZoomSlider
        zoom={framing.zoom}
        onZoom={(zoom) => setFraming((current) => zoomed(current, source, zoom))}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          {m.photo_cancel({}, { locale })}
        </Button>
        <Button disabled={exporting || save.isPending} onClick={sendFraming}>
          {m.photo_save({}, { locale })}
        </Button>
      </div>
    </div>
  );
};
