type RankedRuleProps = { term: string; value: string };

// One rule of the ladder: what, then how much, in Martian Mono.
export const RankedRule = ({ term, value }: RankedRuleProps) => (
  <div className="flex justify-between gap-4 border-t border-secondary py-3.5">
    <dt className="text-muted-foreground">{term}</dt>
    <dd className="font-mono text-[13px]">{value}</dd>
  </div>
);
