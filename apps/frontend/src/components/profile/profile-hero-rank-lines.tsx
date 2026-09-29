import { cn } from "cn";

type ProfileHeroRankLinesProps = { title: string; line: string; className?: string };

// The rank's two lines in the hero of `/profile`: its name, large (in `className`'s colour), then its
// figures in Martian Mono.
export const ProfileHeroRankLines = ({ title, line, className }: ProfileHeroRankLinesProps) => (
  <>
    <span className={cn("text-[22px] leading-tight font-extrabold", className)}>{title}</span>
    <span className="font-mono text-[13px] text-muted-foreground tabular-nums">{line}</span>
  </>
);
