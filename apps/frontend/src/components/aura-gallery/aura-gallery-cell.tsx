import { cn } from "cn";
import type { ReactNode } from "react";

type AuraGalleryCellProps = { where: string; box: string; children: ReactNode };

// One size of the gallery: the drawing centred in its box, named after where the app shows it.
export const AuraGalleryCell = ({ where, box, children }: AuraGalleryCellProps) => (
  <figure className="flex flex-col items-center gap-2">
    <div className={cn("grid place-items-center", box)}>{children}</div>
    <figcaption className="text-xs text-muted-foreground">{where}</figcaption>
  </figure>
);
