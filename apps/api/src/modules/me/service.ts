import { type DuelStore, readRankAndOrnament } from "../duel/store";
import type { Me } from "./model";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  handle?: string | null;
};

export const meOf = async (store: DuelStore, user: SessionUser): Promise<Me> => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
  handle: user.handle ?? null,
  ...(await readRankAndOrnament(store, user.id)),
});
