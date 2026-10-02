// The framing of a Photo before it is sent: a square of the photo, chosen by dragging and zooming
// in a square frame. Pure: the cropper draws and exports what it says.

// The sides the API takes (apps/api/src/modules/photo/service.ts): the square sent is scaled into
// them, it keeps 512 px.
export const MIN_SENT_SIDE = 128;

export const MAX_SENT_SIDE = 1024;

export const MAX_ZOOM = 4;

export type PhotoSize = { width: number; height: number };

// The zoom (1: the photo's whole short side in the frame) and the point of the photo at the centre
// of the frame, in the photo's pixels.
export type Framing = { zoom: number; x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// The side of the photo the frame shows, in the photo's pixels.
const shownSide = ({ width, height }: PhotoSize, zoom: number) => Math.min(width, height) / zoom;

// The centre moved back where the frame stays inside the photo.
const inside = (framing: Framing, photo: PhotoSize): Framing => {
  const half = shownSide(photo, framing.zoom) / 2;

  return {
    zoom: framing.zoom,
    x: clamp(framing.x, half, photo.width - half),
    y: clamp(framing.y, half, photo.height - half),
  };
};

export const initialFraming = ({ width, height }: PhotoSize): Framing => ({
  zoom: 1,
  x: width / 2,
  y: height / 2,
});

// Dragged by `dx`, `dy` pixels of a frame of `frameSide`: the photo follows the pointer.
export const moved = (
  framing: Framing,
  photo: PhotoSize,
  frameSide: number,
  { dx, dy }: { dx: number; dy: number },
): Framing => {
  const photoPixelsPerFramePixel = shownSide(photo, framing.zoom) / frameSide;

  return inside(
    {
      zoom: framing.zoom,
      x: framing.x - dx * photoPixelsPerFramePixel,
      y: framing.y - dy * photoPixelsPerFramePixel,
    },
    photo,
  );
};

// Zoomed on the centre of the frame, between 1 and MAX_ZOOM.
export const zoomed = (framing: Framing, photo: PhotoSize, zoom: number): Framing =>
  inside({ ...framing, zoom: clamp(zoom, 1, MAX_ZOOM) }, photo);

// Where the photo is drawn in a frame of `frameSide`, in the frame's pixels.
export const frameView = (framing: Framing, photo: PhotoSize, frameSide: number) => {
  const scale = frameSide / shownSide(photo, framing.zoom);

  return {
    width: photo.width * scale,
    height: photo.height * scale,
    left: frameSide / 2 - framing.x * scale,
    top: frameSide / 2 - framing.y * scale,
  };
};

// The square of the photo to send, in its pixels, and the side it is exported at.
export const cropOf = (framing: Framing, photo: PhotoSize) => {
  const side = shownSide(photo, framing.zoom);

  return {
    x: framing.x - side / 2,
    y: framing.y - side / 2,
    side,
    output: clamp(Math.round(side), MIN_SENT_SIDE, MAX_SENT_SIDE),
  };
};

export type PhotoCrop = ReturnType<typeof cropOf>;
