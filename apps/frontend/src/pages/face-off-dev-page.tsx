import { FaceOffLab } from "@/components/face-off-lab/face-off-lab";

// Out of the production build: the Face-off played on demand, out of any Duel, on a clock that
// pauses, scrubs and slows down, for each pairing of ranks, Forms and Stake.
export const FaceOffDevPage = () => (
  <div className="flex flex-col gap-8 py-8">
    <h1 className="text-2xl font-extrabold">Face-off</h1>
    <FaceOffLab />
  </div>
);
