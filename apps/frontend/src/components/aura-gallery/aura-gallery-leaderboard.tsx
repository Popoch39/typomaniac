import { fakeLeaderboard } from "@/components/aura-gallery/fake-leaderboard";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";

const ENTRIES = fakeLeaderboard();

// A full Classement of fake Users, drawn by the Classement's own rows, to scroll with the frame
// rate in sight.
export const AuraGalleryLeaderboard = () => (
  <section className="flex flex-col gap-4">
    <h2 className="text-lg font-extrabold">Faux Classement</h2>
    <ol className="flex flex-col gap-2" aria-label="Faux Classement">
      {ENTRIES.map((entry) => (
        <LeaderboardRow key={entry.place} entry={entry} mine={false} />
      ))}
    </ol>
  </section>
);
