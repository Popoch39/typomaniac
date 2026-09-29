import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";

type IntroDevSettingProps<T> = {
  label: string;
  options: readonly SettingOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

// One option of /dev/intro, as pills, its name in sight beside them.
export const IntroDevSetting = <T extends string | number>({
  label,
  options,
  value,
  onChange,
}: IntroDevSettingProps<T>) => (
  <div className="flex items-center gap-4">
    <span aria-hidden="true" className="w-24 text-sm font-semibold text-muted-foreground">
      {label}
    </span>
    <SettingGroup label={label} options={options} value={value} onChange={onChange} />
  </div>
);
