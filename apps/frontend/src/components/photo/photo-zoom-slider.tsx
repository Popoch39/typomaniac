import { useId } from "react";

import { MAX_ZOOM } from "@/components/photo/photo-crop";
import { Slider } from "@/components/ui/slider";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type PhotoZoomSliderProps = { zoom: number; onZoom: (zoom: number) => void };

// The framing's zoom, from the photo's whole short side (1 ×) to a quarter of it.
export const PhotoZoomSlider = ({ zoom, onZoom }: PhotoZoomSliderProps) => {
  const locale = useLocale();
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-xs text-muted-foreground">
        {m.photo_zoom({}, { locale })}
      </span>
      <Slider
        aria-labelledby={labelId}
        min={1}
        max={MAX_ZOOM}
        step={0.01}
        value={zoom}
        onValueChange={onZoom}
        getAriaValueText={(_formatted, value) =>
          m.photo_zoom_value(
            { zoom: numberFormat(locale, { maximumFractionDigits: 1 }).format(value) },
            { locale },
          )
        }
      />
    </div>
  );
};
