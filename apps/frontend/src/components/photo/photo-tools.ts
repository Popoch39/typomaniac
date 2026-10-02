import type { PhotoCrop, PhotoSize } from "@/components/photo/photo-crop";

// An image the User chose, measured: shown in the frame by its `src`, exported once framed.
// `release` frees its `src` once the User is done with it, from an event (Cancel, saved): never from
// an effect's cleanup, which React runs and runs again in development.
export type PhotoSource = PhotoSize & {
  src: string;
  // The framed square, as an image to send: null when the browser cannot draw it.
  exportCrop: (crop: PhotoCrop) => Promise<Blob | null>;
  release: () => void;
};

// Reads the image chosen: null when the browser cannot decode it.
export type PhotoTools = { load: (file: File) => Promise<PhotoSource | null> };

const EXPORT_QUALITY = 0.92;

// The framed square drawn on a canvas of `output` px, from the file decoded again (nothing decoded
// is held between the choice and the export). In WebP; Safari encodes none and hands back a PNG,
// too heavy at 1024 px: a JPEG then. The API encodes it again either way.
const exportOf =
  (file: File) =>
  async ({ x, y, side, output }: PhotoCrop) => {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(output, output);
    const context = canvas.getContext("2d");

    if (context === null) {
      bitmap.close();

      return null;
    }

    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, x, y, side, side, 0, 0, output, output);
    bitmap.close();

    const webp = await canvas.convertToBlob({ type: "image/webp", quality: EXPORT_QUALITY });

    return webp.type === "image/webp"
      ? webp
      : canvas.convertToBlob({ type: "image/jpeg", quality: EXPORT_QUALITY });
  };

// The browser's own decoding: `createImageBitmap` turns the photo upright (EXIF), like the `<img>`
// of the frame does.
export const browserPhotoTools: PhotoTools = {
  load: async (file) => {
    const bitmap = await createImageBitmap(file).catch(() => null);

    if (bitmap === null) {
      return null;
    }

    const { width, height } = bitmap;
    const src = URL.createObjectURL(file);
    const exportCrop = exportOf(file);

    bitmap.close();

    return {
      width,
      height,
      src,
      exportCrop: (crop) => exportCrop(crop).catch(() => null),
      release: () => URL.revokeObjectURL(src),
    };
  },
};
