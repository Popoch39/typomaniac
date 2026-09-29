import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

type SliderValue = number | readonly number[];

// One thumb per value: a single number has one, no value at all gives a range of two.
const thumbCount = (value: SliderValue | undefined) => {
  if (Array.isArray(value)) {
    return value.length;
  }

  return value === undefined ? 2 : 1;
};

// `lg` for a slider alone in its card, like the time bar of the Replay: a thicker track, a thumb in
// the accent ringed with the card's colour, 44 px to hit.
const sizes = {
  default: {
    control: "",
    track: "bg-muted data-horizontal:h-1",
    thumb: "size-3 border border-ring bg-foreground",
  },
  lg: {
    control: "h-11",
    track: "bg-surface-2 data-horizontal:h-2",
    thumb: "size-5.5 border-4 border-card bg-primary",
  },
};

type SliderProps<Value extends SliderValue> = SliderPrimitive.Root.Props<Value> &
  Pick<SliderPrimitive.Thumb.Props, "getAriaValueText"> & { size?: keyof typeof sizes };

// Generic on the value, so a single-number slider hands a number to its callbacks.
// `getAriaValueText` goes to each thumb: what a screen reader says of its value.
function Slider<Value extends SliderValue>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  getAriaValueText,
  size = "default",
  ...props
}: SliderProps<Value>) {
  const thumbs = thumbCount(value ?? defaultValue);
  const look = sizes[size];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
          look.control,
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full select-none data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
            look.track,
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbs }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            getAriaValueText={getAriaValueText}
            className={cn(
              "relative block shrink-0 rounded-full ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-1 focus-visible:ring-1 focus-visible:outline-hidden active:ring-1 disabled:pointer-events-none disabled:opacity-50",
              look.thumb,
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
