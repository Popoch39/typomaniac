import { cn } from "cn";
import type { ComponentProps } from "react";

type LoadingRegionProps = ComponentProps<"output"> & { label: string };

// Wraps the Skeletons of what loads (an <output>, role status): screen readers hear the label,
// nobody reads « Chargement… ».
export const LoadingRegion = ({ label, className, ...props }: LoadingRegionProps) => (
  <output
    aria-label={label}
    aria-busy
    className={cn("flex flex-col gap-3", className)}
    {...props}
  />
);
