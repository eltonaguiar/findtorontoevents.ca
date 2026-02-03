/**
 * UPDATE #7: Error Boundary Component
 * Catches React errors and shows fallback UI
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        this.setState({ error, errorInfo });

        // Log to analytics/monitoring service
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <h2>🎬 Oops! Something went wrong</h2>
                        <p>We're having trouble loading MovieShows.</p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null });
                                window.location.reload();
                            }}
                        >
                            Reload Page
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                                <summary>Error Details (Dev Only)</summary>
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                    {this.state.error && this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const errorBoundaryStyles = `
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
  color: white;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.error-content button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.error-content button:hover {
  transform: scale(1.05);
}
`;
