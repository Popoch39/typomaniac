import type { OrnamentChoice } from "ranked";

import { api, unwrap } from "@/api/client";

// Chooses the Ornament the User wears: the updated User, as /api/me gives them. The API refuses an
// Ornament the User may not wear (403).
export const saveOrnament = async (choice: OrnamentChoice) =>
  unwrap(await api.me.ornament.put({ choice }));
