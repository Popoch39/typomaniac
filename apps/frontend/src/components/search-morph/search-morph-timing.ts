import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// The storyboard's times, in seconds (board « L'animation, pas à pas »): the shape that leaves
// fades out first, the search's surface and its ring move to their new place, then the content of
// the shape that arrives fades in.
export const CONTENT_OUT_SECONDS = 0.2;

export const MORPH_SECONDS = 0.65;

export const CONTENT_IN_AT = 0.5;

export const CONTENT_IN_SECONDS = 0.3;

// The storyboard's curve, cubic-bezier(.7, 0, .2, 1).
export const MORPH_EASE = CustomEase.create("search-morph", "0.7,0,0.2,1");

// Annuler from the Queue pill: it fades out where it is.
export const PILL_CANCEL_SECONDS = 0.22;

// The Match proposal: the pill turns to the accent, the card takes its accent outline.
export const ACCENT_SECONDS = 0.35;
