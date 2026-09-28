import { SignInPrompt } from "@/components/profile/sign-in-prompt";

type SignInInvitationProps = { title: string; reason: string };

// In place of a page only signed-in Users see (a Profile): its title, why, and a way in.
export const SignInInvitation = ({ title, reason }: SignInInvitationProps) => (
  <section className="mx-auto flex w-full max-w-sm flex-col gap-4 py-12">
    <h1 className="text-lg font-bold">{title}</h1>
    <SignInPrompt reason={reason} />
  </section>
);
