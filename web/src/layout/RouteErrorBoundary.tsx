import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  label: string;
  retryLabel: string;
}

interface RouteErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches a failed dynamic import (a new deploy invalidating a chunk) or a
 * render error inside a page, so the shell keeps its navigation instead of
 * going blank.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("FloodSight route error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-xl bg-surface-container-lowest p-5 text-center shadow-card">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-container text-warning-text">
          <TriangleAlert className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-body-sm text-on-surface-variant">{this.props.label}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-4 text-label-lg text-on-primary"
        >
          <RotateCw className="h-4 w-4" aria-hidden />
          {this.props.retryLabel}
        </button>
      </div>
    );
  }
}
