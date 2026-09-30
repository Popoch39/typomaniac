import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { recordSearchForm } from "@/components/search-morph/search-form";

// Before each navigation, while the page is still the one left, records the search's form it
// shows, if any: the search's card folds into the Queue pill of the next page, the Queue pill
// unfolds into the card on Jouer.
export const SearchFormRecorder = () => {
  const router = useRouter();

  useEffect(() => router.subscribe("onBeforeNavigate", recordSearchForm), [router]);

  return null;
};
