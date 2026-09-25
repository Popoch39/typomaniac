import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

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
  "--border-radius": "16px",
};

const icons = {
  success: <CircleCheckIcon className="size-4" />,
  info: <InfoIcon className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
  error: <OctagonXIcon className="size-4" />,
  loading: <Loader2Icon className="size-4 animate-spin" />,
};

const toastOptions = { classNames: { toast: "cn-toast" } };

// The app is dark only (Social style), so the toasts are too.
export const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    icons={icons}
    style={style}
    toastOptions={toastOptions}
    {...props}
  />
);
