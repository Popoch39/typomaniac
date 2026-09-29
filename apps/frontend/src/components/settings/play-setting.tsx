import { useInDuel } from "@/components/duel/use-in-duel";
import { useChooseDuel } from "@/components/duel/use-choose-duel";
import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { type Play, usePlayStore } from "@/stores/play-store";

const plays: readonly SettingOption<Play>[] = [
  { value: "solo", label: "solo" },
  { value: "duel", label: "duel" },
];

// Solo or Duel. A Duel needs an account: a Visitor who picks it is asked to sign in instead.
export const PlaySetting = () => {
  const inDuel = useInDuel();
  const setPlay = usePlayStore((state) => state.setPlay);
  const chooseDuel = useChooseDuel();

  const choose = (play: Play) => {
    if (play === "duel") {
      chooseDuel();

      return;
    }

    setPlay(play);
  };

  return (
    <SettingGroup label="Jeu" options={plays} value={inDuel ? "duel" : "solo"} onChange={choose} />
  );
};
