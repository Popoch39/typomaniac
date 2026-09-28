import { useQuery } from "@tanstack/react-query";
import type { Form } from "api";
import type { Rank, Stake, Tier } from "ranked";

import { meQueryOptions } from "@/api/me";
import { FaceOffPanel } from "@/components/face-off/face-off-panel";
import { FaceOffStake } from "@/components/face-off/face-off-stake";
import { FaceOffStanding } from "@/components/face-off/face-off-standing";

type FaceOffSelfProps = {
  ornament: Tier | null;
  rank: Rank | null;
  form: Form | null;
  stake: Stake | null;
};

// This User's side of the Face-off, on the left: their avatar and Handle, read without ever
// holding up the overlay, their Ornament, then their rank at the pairing (or « Challenge ») and
// their Form, and, in a ranked Duel past Placement, their Stake.
export const FaceOffSelf = ({ ornament, rank, form, stake }: FaceOffSelfProps) => {
  const { data: me } = useQuery(meQueryOptions);

  return (
    <FaceOffPanel
      side="own"
      handle={me?.handle ?? null}
      image={me?.image ?? null}
      ornament={ornament}
    >
      <FaceOffStanding rank={rank} form={form} reversed={false} />
      <FaceOffStake rank={rank} stake={stake} />
    </FaceOffPanel>
  );
};
