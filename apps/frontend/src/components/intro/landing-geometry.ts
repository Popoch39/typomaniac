// Where the Intro lands, as board F computes it: read from the real sidebar as the landing starts,
// every measure at once, before anything is written.

// The lockup lands at the size of the brand's: 100.8 / 2.8 = 36 px, 56 / 2.8 = 20 px,
// 16.8 / 2.8 = 6 px.
export const DIVE_SCALE = 1 / 2.8;

// Around the brand's footprint as the sidebar grows from it: air around the Logo, a little more
// right of the word; its corners, then the sidebar's own once whole.
const AIR_PX = 6;

const AIR_RIGHT_PX = 8;

const FOOTPRINT_RADIUS_PX = 14;

const SIDEBAR_RADIUS_PX = 28;

type Box = { left: number; top: number; width: number; height: number };

export type LandingMeasures = {
  // The lockup's box before its transform, in the window.
  lockup: { left: number; top: number };
  // How low its Logo sits inside it.
  logoTop: number;
  // The sidebar, its brand's Logo and its word, in the window; no word in the Rail.
  sidebar: Box;
  brandLogo: Box;
  brandWord: Box | null;
};

export type Landing = ReturnType<typeof landingGeometry>;

// The lockup's dive, scaled from its top left corner, down onto the brand's Logo; and the
// sidebar's clip, from the brand's footprint to the whole sidebar. In the Rail, the footprint is
// the Logo's alone.
export const landingGeometry = ({
  lockup,
  logoTop,
  sidebar,
  brandLogo,
  brandWord,
}: LandingMeasures) => {
  const top = brandLogo.top - sidebar.top - AIR_PX;
  const left = brandLogo.left - sidebar.left - AIR_PX;

  const rightEdge =
    brandWord === null
      ? brandLogo.left + brandLogo.width + AIR_PX
      : brandWord.left + brandWord.width + AIR_RIGHT_PX;

  const right = sidebar.width - (rightEdge - sidebar.left);
  const bottom = sidebar.height - (brandLogo.top - sidebar.top + brandLogo.height + AIR_PX);

  return {
    dive: {
      x: brandLogo.left - lockup.left,
      y: brandLogo.top - lockup.top - logoTop * DIVE_SCALE,
    },
    clipFrom: `inset(${top}px ${right}px ${bottom}px ${left}px round ${FOOTPRINT_RADIUS_PX}px)`,
    clipTo: `inset(0px 0px 0px 0px round ${SIDEBAR_RADIUS_PX}px)`,
  };
};
