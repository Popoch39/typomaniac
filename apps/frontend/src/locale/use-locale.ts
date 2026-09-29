import { useLocaleStore } from "@/stores/locale-store";

// The Locale shown, for a component that says anything: it passes it to each message
// (`m.key(inputs, { locale })`) and formatter, and re-renders when the Locale switches. A message
// called without it would keep the text memoized by the React Compiler.
export const useLocale = () => useLocaleStore((store) => store.locale);
