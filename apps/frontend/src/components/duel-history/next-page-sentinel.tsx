type NextPageSentinelProps = {
  // Called whenever the sentinel comes into view, and at once if it already is.
  onVisible: () => void;
};

// An empty line at the bottom of a list: seeing it asks for the next page.
export const NextPageSentinel = ({ onVisible }: NextPageSentinelProps) => {
  const observe = (node: HTMLDivElement) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onVisible();
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  };

  return <div ref={observe} aria-hidden="true" className="h-px" />;
};
