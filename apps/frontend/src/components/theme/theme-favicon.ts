import type { ThemeId } from "@/components/theme/themes";

// The tab's icon of a Theme: its Logo, one static file each in public/favicons/, painted in its
// colours (theme-boot.test.ts keeps them in step with the stylesheet). index.html's script names
// them the same way.
export const themeFavicon = (id: ThemeId) => `/favicons/${id}.svg`;
