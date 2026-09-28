import type { Form } from "api";
import { cn } from "cn";
import type { Rank } from "ranked";

import { FaceOffForm } from "@/components/face-off/face-off-form";
import { FaceOffRank } from "@/components/face-off/face-off-rank";

type FaceOffStandingProps = {
  rank: Rank | null;
  form: Form | null;
  // The opponent's side mirrors this User's: their rank on the outer edge, on the right.
  reversed: boolean;
};

// A player's rank and Form on one line under their Handle, the rank on the screen's edge.
export const FaceOffStanding = ({ rank, form, reversed }: FaceOffStandingProps) => (
  <div className={cn("flex items-center gap-6", reversed ? "flex-row-reverse" : null)}>
    <FaceOffRank rank={rank} />
    <FaceOffForm form={form} />
  </div>
);
