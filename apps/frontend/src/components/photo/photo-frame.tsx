import { useId } from "react";

import { type Framing, frameView } from "@/components/photo/photo-crop";
import type { PhotoSource } from "@/components/photo/photo-tools";
import { usePhotoFrameGestures } from "@/components/photo/use-photo-frame-gestures";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The frame's side in px: the Avatar's shape, large enough to frame a face.
export const FRAME_SIDE = 256;

type PhotoFrameProps = {
  source: PhotoSource;
  framing: Framing;
  // By `dx`, `dy` px of the frame: the photo follows.
  onMove: (delta: { dx: number; dy: number }) => void;
  onZoomBy: (step: number) => void;
};

// The photo in a frame of the Avatar's shape, moved and zoomed by its gestures: what the frame
// shows is what is sent. A button: focusable and driven by the keyboard, as its hint says.
export const PhotoFrame = ({ source, framing, onMove, onZoomBy }: PhotoFrameProps) => {
  const locale = useLocale();
  const hintId = useId();
  const gestures = usePhotoFrameGestures({ onMove, onZoomBy });

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label={m.photo_frame({}, { locale })}
        aria-describedby={hintId}
        style={{ width: FRAME_SIDE, height: FRAME_SIDE }}
        className="relative cursor-grab touch-none overflow-hidden rounded-[33%] bg-muted outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        {...gestures}
      >
        <img
          src={source.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={frameView(framing, source, FRAME_SIDE)}
        />
      </button>
      <p id={hintId} className="text-center text-xs leading-normal text-muted-foreground">
        {m.photo_frame_hint({}, { locale })}
      </p>
    </div>
  );
};
