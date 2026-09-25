import { PROGRESSION_WINDOWS, type ProgressionWindow } from "@/api/profile";
import { SettingGroup } from "@/components/settings/setting-group";

const LABELS: Record<ProgressionWindow, string> = {
  "50": "50 derniers",
  "200": "200 derniers",
  all: "tous",
};

const OPTIONS = PROGRESSION_WINDOWS.map((value) => ({ value, label: LABELS[value] }));

// Which of their last Duels the Progression shows, as segmented pills.
export const ProgressionWindowPicker = ({
  span,
  onChange,
}: {
  span: ProgressionWindow;
  onChange: (span: ProgressionWindow) => void;
}) => (
  <SettingGroup
    label="Fenêtre de la Progression"
    options={OPTIONS}
    value={span}
    onChange={onChange}
  />
);
