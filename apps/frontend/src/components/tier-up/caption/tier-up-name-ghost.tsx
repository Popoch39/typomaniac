type TierUpNameGhostProps = {
  side: "left" | "right";
  name: string;
  color: string;
  // The name's letter spacing (em), kept on its left too: the ghost lies right over it.
  tracking: number;
};

// A ghost of the name on one side, in a single colour, lighting what it passes over: laid exactly
// over the name, unseen until it slides into it. Only seen: the title reads the name.
export const TierUpNameGhost = ({ side, name, color, tracking }: TierUpNameGhostProps) => (
  <span
    aria-hidden
    data-tier-up={`ghost-${side}`}
    className="absolute inset-0 flex justify-center opacity-0 mix-blend-screen"
    style={{ color, paddingLeft: `${tracking}em` }}
  >
    {name}
  </span>
);
