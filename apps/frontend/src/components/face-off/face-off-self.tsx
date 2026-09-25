import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { FaceOffPanel } from "@/components/face-off/face-off-panel";

// This User's side of the Face-off, on the left: their avatar and Handle, read without ever
// holding up the overlay.
export const FaceOffSelf = () => {
  const { data: me } = useQuery(meQueryOptions);

  return <FaceOffPanel side="own" handle={me?.handle ?? null} image={me?.image ?? null} />;
};
