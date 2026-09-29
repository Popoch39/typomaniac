// What kind of Duel it was, in words: Ranked (Placement included) or a Challenge. A Duel played
// before the ranked is a Challenge too.
export const duelKind = (ranked: boolean) => (ranked ? "Duel classé" : "Challenge");
