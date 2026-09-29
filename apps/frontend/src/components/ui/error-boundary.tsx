import { Component, type ComponentType, type ReactNode } from "react";

type ErrorBoundaryProps = {
  // What shows in place of the children once they throw, given the way to try them again.
  fallback: ComponentType<{ onRetry: () => void }>;
  // Called before trying again: what the children read must be read anew (a Query to reset).
  onRetry: () => void;
  children: ReactNode;
};

// A part of a page that may fail on its own: its error takes its place, never the whole page's.
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => {
    this.props.onRetry();
    this.setState({ failed: false });
  };

  render() {
    const { fallback: Fallback, children } = this.props;

    return this.state.failed ? <Fallback onRetry={this.retry} /> : children;
  }
}
