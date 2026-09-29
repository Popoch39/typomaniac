import { LogoSymbol } from "@/components/brand/logo-symbol";

// The Logo stacked, where it stands alone ("Passe sur ordinateur"): the symbol above the word. Not a
// link: it would only lead back to the same screen.
export const StackedLogo = () => (
  <div className="flex flex-col items-center gap-0.5 text-[22px] leading-[normal] font-extrabold tracking-[-0.03em]">
    <LogoSymbol className="size-15" />
    typomaniac
  </div>
);
