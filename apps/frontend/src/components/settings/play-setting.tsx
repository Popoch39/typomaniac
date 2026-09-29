import { useInDuel } from "@/components/duel/use-in-duel";
import { useChooseDuel } from "@/components/duel/use-choose-duel";
import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { type Play, usePlayStore } from "@/stores/play-store";

// Solo or Duel. A Duel needs an account: a Visitor who picks it is asked to sign in instead.
export const PlaySetting = () => {
  const locale = useLocale();
  const inDuel = useInDuel();
  const setPlay = usePlayStore((state) => state.setPlay);
  const chooseDuel = useChooseDuel();

  const plays: readonly SettingOption<Play>[] = [
    { value: "solo", label: m.settings_play_solo({}, { locale }) },
    { value: "duel", label: m.settings_play_duel({}, { locale }) },
  ];

  const choose = (play: Play) => {
    if (play === "duel") {
      chooseDuel();

      return;
    }

    setPlay(play);
  };

  return (
    <SettingGroup
      label={m.settings_play({}, { locale })}
      options={plays}
      value={inDuel ? "duel" : "solo"}
      onChange={choose}
    />
  );
};
