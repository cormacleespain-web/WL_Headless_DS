import React from 'react';

export class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 600 }}>
          <h1 style={{ color: '#c00' }}>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ fontSize: 12, color: '#666' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
