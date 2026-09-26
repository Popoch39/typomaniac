import { Dialog } from "@base-ui/react/dialog";
import { SwordsIcon } from "lucide-react";

// The top of the dialog: the Duel's format, then what the stage says.
export const MatchProposalHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex flex-col items-center gap-2.5 text-center">
    <span className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[0.8125rem] font-semibold text-muted-foreground">
      <SwordsIcon aria-hidden className="size-3.5" strokeWidth={2.2} />
      Duel classé · 30 s · anglais
    </span>
    <Dialog.Title className="text-4xl font-extrabold tracking-[-0.02em]">{title}</Dialog.Title>
    <Dialog.Description className="text-base text-muted-foreground">{subtitle}</Dialog.Description>
  </div>
);
