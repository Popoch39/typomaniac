import type { Me } from "./model";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  handle?: string | null;
};

export const meOf = (user: SessionUser): Me => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
  handle: user.handle ?? null,
});
