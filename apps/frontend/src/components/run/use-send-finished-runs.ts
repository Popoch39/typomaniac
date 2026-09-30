import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import type { Keystroke, RunConfig } from "typing-engine";

import { bestRunQueryOptions, type RunSetting, runSettingOf, sendRun } from "@/api/best-run";
import { meQueryOptions } from "@/api/me";
import { useRunStore } from "@/stores/run-store";

type FinishedRun = { setting: RunSetting; config: RunConfig; keystrokes: readonly Keystroke[] };

// Sends each Run a User finishes, once, the moment it ends (ADR 0016); a Visitor's never leaves
// the tab. The end screen never waits for it, and a failure stays silent: the Best Run of the
// setting is only written once the API answers.
export const useSendFinishedRuns = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: ({ setting, config, keystrokes }: FinishedRun) =>
      sendRun(setting, config, keystrokes),
    onSuccess: (bestRun, { setting }) => {
      queryClient.setQueryData(bestRunQueryOptions(setting).queryKey, bestRun);
    },
  });

  const finished = useEffectEvent((config: RunConfig, keystrokes: readonly Keystroke[]) => {
    const setting = runSettingOf(config);

    if (me !== null && setting !== null) {
      mutate({ setting, config, keystrokes });
    }
  });

  // The Run ends when its Result appears, once per Run.
  useEffect(
    () =>
      useRunStore.subscribe((state, previous) => {
        if (state.result !== null && previous.result === null) {
          finished(state.run.config, state.keystrokes);
        }
      }),
    [],
  );
};
