import { useQuery } from "@tanstack/react-query";
import type { Form } from "api";
import type { Rank, Stake } from "ranked";

import { meQueryOptions } from "@/api/me";
import { FaceOffForm } from "@/components/face-off/face-off-form";
import { FaceOffPanel } from "@/components/face-off/face-off-panel";
import { FaceOffRank } from "@/components/face-off/face-off-rank";
import { FaceOffStake } from "@/components/face-off/face-off-stake";

type FaceOffSelfProps = { rank: Rank | null; form: Form | null; stake: Stake | null };

// This User's side of the Face-off, on the left: their avatar and Handle, read without ever
// holding up the overlay, then their rank at the pairing (or the Challenge badge), their Form and,
// in a ranked Duel past Placement, their Stake.
export const FaceOffSelf = ({ rank, form, stake }: FaceOffSelfProps) => {
  const { data: me } = useQuery(meQueryOptions);

  return (
    <FaceOffPanel side="own" handle={me?.handle ?? null} image={me?.image ?? null}>
      <FaceOffRank rank={rank} />
      <FaceOffForm form={form} />
      <FaceOffStake rank={rank} stake={stake} />
    </FaceOffPanel>
  );
};
