import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  moduleName?: string;
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.warn(`[KIUR Admin] Module failed: ${this.props.moduleName || 'Unknown'}`);
    }
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.setState({ hasError: false });
      this.props.onRetry();
    } else if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <section className="panel moduleErrorFallback" role="alert" aria-live="assertive">
          <div className="moduleErrorContent">
            <span className="moduleErrorIcon" aria-hidden="true"><AlertCircle /></span>
            <div className="moduleErrorCopy">
              <h3>تعذر تحميل {this.props.moduleName || 'هذه الوحدة الإدارية'}</h3>
              <p>حدث خطأ أثناء تشغيل أداة الإدارة أو انقطع الاتصال بالخادم. يمكنك المحاولة مجددًا.</p>
            </div>
            <button type="button" className="solid retryButton" onClick={this.handleRetry}>
              <RotateCcw aria-hidden="true" size={16} />
              إعادة المحاولة
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
