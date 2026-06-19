'use client';
import React, { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
interface DiagramErrorBoundaryProps {
  children: ReactNode;
  diagramName?: string;
}
interface DiagramErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
export class DiagramErrorBoundary extends Component<DiagramErrorBoundaryProps, DiagramErrorBoundaryState> {
  constructor(props: DiagramErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): DiagramErrorBoundaryState {
    return { hasError: true, error };
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 bg-neutral rounded-[var(--border-radius-apple)] border border-neutral-dark">
          <AlertTriangle className="w-12 h-12 text-secondary" />
          <h3 className="text-lg font-semibold text-text">
            {this.props.diagramName ? `${this.props.diagramName} encountered an error` : 'Something went wrong'}
          </h3>
          <p className="text-sm text-text/60 max-w-md text-center">
            {this.state.error?.message || 'An unexpected error occurred while rendering this diagram.'}
          </p>
          <Button onClick={this.handleReset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}