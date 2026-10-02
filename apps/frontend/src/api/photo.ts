import { api, unwrap } from "@/api/client";

// Sends the User's Photo, the square they framed: the updated User, as /api/me gives them. The API
// refuses what is not a square image of 128 to 1024 px (422, the reason at `/photo`).
export const savePhoto = async (photo: Blob) =>
  unwrap(await api.me.photo.put({ photo: new File([photo], "photo", { type: photo.type }) }));

// Removes the User's Photo: their Avatar is their provider's image again.
export const removePhoto = async () => unwrap(await api.me.photo.delete());
