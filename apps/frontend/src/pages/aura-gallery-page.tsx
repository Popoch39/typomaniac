import { AuraGalleryLeaderboard } from "@/components/aura-gallery/aura-gallery-leaderboard";
import { AuraGalleryTiers } from "@/components/aura-gallery/aura-gallery-tiers";
import { FpsCounter } from "@/components/aura-gallery/fps-counter";

// Out of the production build: the seven Tiers' Ornaments and Blasons at the app's real sizes,
// then a full fake Classement, the frame rate always in sight. To tune the Aura and hold it to
// its budget.
export const AuraGalleryPage = () => (
  <div className="flex flex-col gap-8 py-8">
    <h1 className="text-2xl font-extrabold">Galerie de l'Aura</h1>
    <AuraGalleryTiers />
    <AuraGalleryLeaderboard />
    <FpsCounter />
  </div>
);
