import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// The curve of the board's CSS transitions, which name none: CSS's `ease`.
export const BOARD_EASE = CustomEase.create("duel-board-ease", "0.25,0.1,0.25,1");
