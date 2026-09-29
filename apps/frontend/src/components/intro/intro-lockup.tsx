import { IntroLogo } from "@/components/intro/intro-logo";
import { IntroWord } from "@/components/intro/intro-word";

// The Logo and the word side by side (Onest 800, 56 px, −0.03 em, 16.8 px apart). Its left edge
// and top at the Logo's place in the middle of the screen: before anything is measured, the Logo
// is the boot Logo, and the word, still empty, starts right of it.
export const IntroLockup = () => (
  <div
    data-intro="lockup"
    className="absolute top-[calc(50%-50.4px)] left-[calc(50%-50.4px)] flex h-[100.8px] items-center gap-[16.8px] font-sans text-[56px] font-extrabold tracking-[-0.03em] whitespace-nowrap text-foreground"
  >
    <IntroLogo />
    <IntroWord />
  </div>
);
