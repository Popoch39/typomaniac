import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { suggestHandle } from "handle";
import { Suspense } from "react";
import { toast } from "sonner";

import { meQueryOptions } from "@/api/me";
import { HandleForm } from "@/components/handle/handle-form";
import { ProfileStats } from "@/components/profile/profile-stats";
import { atHandle } from "@/lib/at-handle";

const onSaved = () => toast.success("Handle enregistré");

// The signed-in User's profile: their Handle, changed at will, then their Stats. The previous
// Handle is freed at once; their Duels stay theirs.
export const ProfilePage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  // The route sends a Visitor away; signing out here leaves an empty page until they leave.
  if (me === null) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold">Profil</h1>
        <p className="text-muted-foreground">
          {me.handle === null
            ? "Tu n'as pas encore de Handle : sans lui, pas de Duel."
            : `Les autres te voient en ${atHandle(me.handle)}.`}
        </p>
      </div>
      <HandleForm
        initial={me.handle ?? suggestHandle(me.name)}
        current={me.handle}
        submitLabel="Enregistrer"
        onSaved={onSaved}
      />
      <p className="text-[0.7rem] text-muted-foreground">
        Changer de Handle libère l'ancien aussitôt. Ton historique de Duels te suit.
      </p>
      {me.handle === null ? null : (
        <>
          <Link to="/u/$handle" params={{ handle: me.handle }} className="text-sm underline">
            Voir mon Profile public
          </Link>
          {/* A new Handle reads the Stats again: the form above stays while they load. */}
          <Suspense fallback={null}>
            <ProfileStats
              handle={me.handle}
              emptyNotice="Pas encore de Duel : joue ton premier pour voir tes Stats."
            />
          </Suspense>
        </>
      )}
    </section>
  );
};
