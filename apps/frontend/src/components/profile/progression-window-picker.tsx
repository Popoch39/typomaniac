import { PROGRESSION_WINDOWS, type ProgressionWindow } from "@/api/profile";
import { Button } from "@/components/ui/button";

const LABELS: Record<ProgressionWindow, string> = {
  "50": "50 derniers",
  "200": "200 derniers",
  all: "tous",
};

// Which of their last Duels the Progression shows.
export const ProgressionWindowPicker = ({
  span,
  onChange,
}: {
  span: ProgressionWindow;
  onChange: (span: ProgressionWindow) => void;
}) => (
  <fieldset className="flex gap-1">
    <legend className="sr-only">Fenêtre de la Progression</legend>
    {PROGRESSION_WINDOWS.map((option) => (
      <Button
        key={option}
        size="sm"
        variant={option === span ? "default" : "outline"}
        aria-pressed={option === span}
        onClick={() => onChange(option)}
      >
        {LABELS[option]}
      </Button>
    ))}
  </fieldset>
);
