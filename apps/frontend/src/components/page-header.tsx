import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  // What the page is for, in a sentence.
  subtitle: ReactNode;
  // At the right of the title, where a page has some.
  actions?: ReactNode;
};

// The top of every page, the same everywhere: its title, what it is for, then its actions.
export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header className="flex items-end justify-between gap-6">
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[34px] leading-tight font-extrabold tracking-[-0.02em]">{title}</h1>
      <p className="max-w-155 text-[15px] leading-normal text-muted-foreground">{subtitle}</p>
    </div>
    {actions}
  </header>
);
