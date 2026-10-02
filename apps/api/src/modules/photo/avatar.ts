import { API_PREFIX } from "../../lib/api-prefix";

// Under createApp's prefix: the route of src/modules/photo/index.ts.
export const PHOTOS_ROUTE = "/photos";

// The Photo's public URL, served by the API: on the API's own public URL, the front is elsewhere.
export type PhotoUrl = (key: string) => string;

// `baseUrl` is the API's public URL (BETTER_AUTH_URL).
export const photoUrlOn =
  (baseUrl: string): PhotoUrl =>
  (key) =>
    new URL(`${API_PREFIX}${PHOTOS_ROUTE}/${key}`, baseUrl).href;

type AvatarSource = { image?: string | null; photo?: string | null };

// A User's Avatar as the API shows it: their Photo, otherwise their provider's image, null for the
// initials of their Handle.
export const avatarOf = (photoUrl: PhotoUrl, { image, photo }: AvatarSource) =>
  photo ? photoUrl(photo) : (image ?? null);
