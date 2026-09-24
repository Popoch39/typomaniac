import { Component, type ReactNode } from "react";

// Renders nothing in place of its children once they throw: an extra that may fail without
// taking what surrounds it along.
export class NothingOnError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
