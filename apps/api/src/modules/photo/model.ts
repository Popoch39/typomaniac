import { t } from "elysia";

// A Photo's key in the PhotoStore, `<userId>/<file>`: under its User's id (their files found
// together), a random UUID new at every sending, then its format.
const USER_ID_PATTERN = "^[A-Za-z0-9_-]{1,64}$";

const PHOTO_FILE_PATTERN = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.webp$";

export const PhotoModel = {
  // The square the User framed, cropped by the browser: any format, the service reads the bytes.
  input: t.Object({ photo: t.File() }),
  key: t.Object({
    userId: t.String({ pattern: USER_ID_PATTERN }),
    file: t.String({ pattern: PHOTO_FILE_PATTERN }),
  }),
  photo: t.File({ type: "image/webp" }),
};
