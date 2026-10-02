import { ApiError, refusalAt } from "@/api/client";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What the User reads when the API turned their Photo down: why, when it says so, `fallback`
// otherwise.
export const photoFailure = (error: Error, locale: Locale, fallback: string) => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  if (error.code === "TOO_MANY_REQUESTS") {
    return m.photo_too_many({}, { locale });
  }

  if (error.code === "SERVICE_UNAVAILABLE") {
    return m.photo_unavailable({}, { locale });
  }

  const refusal = refusalAt(error, "/photo");

  if (refusal === "not-an-image") {
    return m.photo_refused_type({}, { locale });
  }

  return refusal === "too-small" ? m.photo_refused_small({}, { locale }) : fallback;
};
