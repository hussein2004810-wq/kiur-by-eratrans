import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './RealAppV2';
import './styles.css';
import './theme.css';
import './stitch/stitch.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('KIUR Application Error:', error, errorInfo);
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('dynamically imported module') || msg.includes('loading chunk') || msg.includes('failed to fetch')) {
      const hasReloaded = sessionStorage.getItem('kiur_chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('kiur_chunk_reload', '1');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('kiur_chunk_reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--stitch-bg, #080d1a)',
          color: 'var(--stitch-text-primary, #f8fafc)',
          fontFamily: "var(--stitch-font-family, 'Noto Sans Arabic', sans-serif)",
          direction: 'rtl',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            background: 'var(--stitch-bg-surface, #0f182e)',
            border: '1px solid var(--stitch-border, rgba(148, 163, 184, 0.2))',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0d9488, #1e3a8a)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '28px'
            }}>
              ⚕️
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>تحديث بيئة التعلم السريري</h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--stitch-text-secondary, #cbd5e1)', lineHeight: 1.6 }}>
              تم إطلاق تحديث جديد للواجهة أو حدث انقطاع مؤقت في الاتصال. اضغط على الزر أدناه لإعادة تحميل المنصة بأحدث إصدار.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                marginTop: '8px',
                padding: '12px 28px',
                borderRadius: '10px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)'
              }}
            >
              تحديث الصفحة الآن ↻
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);
