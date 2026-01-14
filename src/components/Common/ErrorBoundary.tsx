import React from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

type State = { hasError: boolean; error: Error | null };

interface ErrorInfo {
  componentStack?: string;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught error', error, { componentStack: info.componentStack });
    toast.error('An unexpected error occurred. We logged it.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="glass-card max-w-xl text-center p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">Try refreshing the page. If the issue persists, contact support.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

