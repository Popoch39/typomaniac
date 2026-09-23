// Blurs the Text while the typing input has lost the focus. A click on it gives the focus back.
export const FocusOverlay = ({ onResume }: { onResume: () => void }) => (
  <button
    type="button"
    onClick={onResume}
    className="absolute inset-0 flex cursor-default items-center justify-center text-lg backdrop-blur-sm"
  >
    clique ou tape pour reprendre
  </button>
);
