import type { ReactNode } from "react";

type NavPillsProps = {
  label: string;
  children: ReactNode;
};

// The Social style's segmented nav: pills side by side on one surface. The pills are NavPill links.
export const NavPills = ({ label, children }: NavPillsProps) => (
  <nav aria-label={label}>
    <ul className="flex flex-wrap items-center gap-1 rounded-full bg-card p-1">{children}</ul>
  </nav>
);
