import { MIN_SENT_SIDE } from "@/components/photo/photo-crop";
import type { PhotoSource } from "@/components/photo/photo-tools";
import { usePhotoTools } from "@/components/photo/photo-tools-context";
import { toast } from "@/lib/toast";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The formats the API takes: a GIF would lose its animation.
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const PHOTO_ACCEPT = [...ACCEPTED_TYPES].join(",");

// The file the User may choose: the square sent is far lighter, cropped and encoded by the browser.
const MAX_CHOSEN_BYTES = 5 * 1024 * 1024;

// Reads the image the User chose, by the file picker or a drop, and hands it to frame: refused at
// once, with the reason, when the API would refuse it.
export const useChoosePhoto = (onChosen: (source: PhotoSource) => void) => {
  const locale = useLocale();
  const tools = usePhotoTools();

  return async (file: File) => {
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error(m.photo_refused_type({}, { locale }));

      return;
    }

    if (file.size > MAX_CHOSEN_BYTES) {
      toast.error(m.photo_refused_heavy({}, { locale }));

      return;
    }

    const source = await tools.load(file);

    if (source === null) {
      toast.error(m.photo_refused_type({}, { locale }));

      return;
    }

    if (Math.min(source.width, source.height) < MIN_SENT_SIDE) {
      source.release();
      toast.error(m.photo_refused_small({}, { locale }));

      return;
    }

    onChosen(source);
  };
};
