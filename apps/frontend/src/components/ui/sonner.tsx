import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/components/theme-context";

// Sonner's own CSS variables are not in React's CSSProperties type.
type SonnerStyle = CSSProperties & {
  "--normal-bg": string;
  "--normal-text": string;
  "--normal-border": string;
  "--border-radius": string;
};

const style: SonnerStyle = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "0",
};

const icons = {
  success: <CircleCheckIcon className="size-4" />,
  info: <InfoIcon className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
  error: <OctagonXIcon className="size-4" />,
  loading: <Loader2Icon className="size-4 animate-spin" />,
};

const toastOptions = { classNames: { toast: "cn-toast" } };

// Follows the app theme (theme-context) instead of next-themes, which the shadcn template assumes.
export const Toaster = (props: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={icons}
      style={style}
      toastOptions={toastOptions}
      {...props}
    />
  );
};
