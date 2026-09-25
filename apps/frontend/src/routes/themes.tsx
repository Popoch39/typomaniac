import { createFileRoute } from "@tanstack/react-router";

import { ThemesPage } from "@/pages/themes-page";

export const Route = createFileRoute("/themes")({
  component: ThemesPage,
});
