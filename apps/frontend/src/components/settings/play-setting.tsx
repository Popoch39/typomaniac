import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useInDuel } from "@/components/duel/use-in-duel";
import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { useAuthStore } from "@/stores/auth-store";
import { type Play, usePlayStore } from "@/stores/play-store";

const plays: readonly SettingOption<Play>[] = [
  { value: "solo", label: "solo" },
  { value: "duel", label: "duel" },
];

// Solo or Duel. A Duel needs an account: a Visitor who picks it is asked to sign in instead.
export const PlaySetting = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const inDuel = useInDuel();
  const setPlay = usePlayStore((state) => state.setPlay);
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);

  const choose = (play: Play) => {
    if (play === "duel" && me === null) {
      setSignInOpen(true);

      return;
    }

    setPlay(play);
  };

  return (
    <SettingGroup label="Jeu" options={plays} value={inDuel ? "duel" : "solo"} onChange={choose} />
  );
};
