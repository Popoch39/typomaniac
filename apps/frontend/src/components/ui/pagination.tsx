import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon } from "lucide-react";
import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";

// shadcn's pagination, its words given by the caller (in the Locale) and its links any element
// rendered by Base UI: a router `Link` moves between pages without a reload.

const Pagination = ({ className, ...props }: ComponentProps<"nav"> & { "aria-label": string }) => (
  <nav data-slot="pagination" className={cn("flex w-full", className)} {...props} />
);

const PaginationContent = ({ className, ...props }: ComponentProps<"ul">) => (
  <ul
    data-slot="pagination-content"
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
);

const PaginationItem = (props: ComponentProps<"li">) => (
  <li data-slot="pagination-item" {...props} />
);

type PaginationLinkProps = {
  // The link to render, null at either end of the pages: a disabled button then.
  render: ReactElement | null;
  className?: string;
  children: ReactNode;
} & Pick<ComponentProps<typeof Button>, "size">;

// The link itself, styled as a ghost button but still a link for assistive tech: Base UI's
// `Button` would make it a `role="button"`.
const PaginationAnchor = ({
  render,
  size,
  className,
  children,
}: Omit<PaginationLinkProps, "render"> & { render: ReactElement }) =>
  useRender({
    render,
    props: {
      "data-slot": "pagination-link",
      className: cn(buttonVariants({ variant: "ghost", size }), className),
      children,
    },
  });

const PaginationLink = ({ render, size = "icon", className, children }: PaginationLinkProps) =>
  render === null ? (
    <Button variant="ghost" size={size} className={className} disabled>
      {children}
    </Button>
  ) : (
    <PaginationAnchor render={render} size={size} className={className}>
      {children}
    </PaginationAnchor>
  );

type PaginationStepProps = Omit<PaginationLinkProps, "children" | "size"> & { text: string };

const PaginationFirst = ({ className, text, ...props }: PaginationStepProps) => (
  <PaginationLink size="default" className={cn("pl-2.5", className)} {...props}>
    <ChevronsLeftIcon data-icon="inline-start" />
    {text}
  </PaginationLink>
);

const PaginationPrevious = ({ className, text, ...props }: PaginationStepProps) => (
  <PaginationLink size="default" className={cn("pl-2.5", className)} {...props}>
    <ChevronLeftIcon data-icon="inline-start" />
    {text}
  </PaginationLink>
);

const PaginationNext = ({ className, text, ...props }: PaginationStepProps) => (
  <PaginationLink size="default" className={cn("pr-2.5", className)} {...props}>
    {text}
    <ChevronRightIcon data-icon="inline-end" />
  </PaginationLink>
);

export {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
