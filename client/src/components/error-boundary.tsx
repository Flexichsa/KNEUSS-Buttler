import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Lightweight error boundary for individual widgets
interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widgetName?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  public state: WidgetErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Widget error${this.props.widgetName ? ` (${this.props.widgetName})` : ""}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Widget-Fehler</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4">
            <h1 className="text-xl font-semibold text-destructive">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-muted-foreground">
              Die Anwendung ist auf einen Fehler gestoßen. Bitte lade die Seite neu.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
