import { IntroDevControls } from "@/components/intro-dev/intro-dev-controls";

// Out of the production build: the Intro replayed on the real shell, without reloading the app, at
// the chosen speed, with the shell as late as chosen, under any Theme, the frame rate over it.
export const IntroDevPage = () => (
  <div className="flex flex-col gap-8 py-8">
    <h1 className="text-2xl font-extrabold">Intro</h1>
    <IntroDevControls />
  </div>
);
