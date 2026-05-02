import { Component, type ReactNode } from 'react';

interface Props {
  /** Rendered when the boundary's subtree throws. Defaults to a tiny notice. */
  fallback?: ReactNode;
  /** Surfaced to console + main-process log so the user can copy/paste. */
  context?: string;
  children: ReactNode;
}

interface State {
  err: Error | null;
}

/**
 * Catches render-time errors in a subtree so a single misbehaving dialog
 * (e.g. ExportDialog) can't unmount the whole renderer and leave the user
 * staring at the Electron window's bare background colour. The boundary
 * logs the error and shows a small inline notice; the rest of the app
 * keeps working.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  override componentDidCatch(err: Error, info: { componentStack?: string }): void {
    // eslint-disable-next-line no-console
    console.error(
      `[ErrorBoundary${this.props.context ? `:${this.props.context}` : ''}]`,
      err,
      info.componentStack,
    );
  }

  reset = (): void => {
    this.setState({ err: null });
  };

  override render(): ReactNode {
    const { err } = this.state;
    if (!err) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className="fixed inset-x-0 top-2 z-[60] mx-auto w-fit max-w-[90vw] rounded border border-red-700/60 bg-red-950/90 px-3 py-2 text-[12px] text-red-200 shadow-lg">
        <div className="font-semibold">Something broke in this panel.</div>
        <div className="mt-0.5 truncate font-mono text-[11px] text-red-300">{err.message}</div>
        <button
          type="button"
          onClick={this.reset}
          className="mt-1 rounded border border-red-700/60 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-900/50"
        >
          Dismiss
        </button>
      </div>
    );
  }
}
