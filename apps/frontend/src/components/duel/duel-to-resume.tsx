import { Navigate } from "@tanstack/react-router";

import { useNoDuelToResume } from "@/components/duel/use-no-duel-to-resume";

// On the Duel's URL, before any Duel: nothing while the server tells the User's place and the Duel
// is resumed, back to the play page once there is none.
export const DuelToResume = () => {
  const noDuel = useNoDuelToResume();

  return noDuel ? <Navigate to="/" replace /> : null;
};
