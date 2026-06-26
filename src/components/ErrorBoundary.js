import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null, showDetails: false};
  }
  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }
  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const details =
        (this.state.error && (this.state.error.stack || this.state.error.message)) || 'Unknown error';
      return (
        <div style={{maxWidth: 560, margin: '60px auto', padding: 24, textAlign: 'center', fontFamily: 'Roboto, sans-serif'}}>
          <h2 style={{color: '#003240'}}>Something went wrong</h2>
          <p>
            The app hit an unexpected error. Reloading usually fixes it. If it keeps happening,
            contact <a href="mailto:support@toniqlabs.com">support@toniqlabs.com</a>.
          </p>
          <div style={{margin: '16px 0'}}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{padding: '10px 22px', background: '#00b894', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16}}
            >
              Reload
            </button>
          </div>
          <button
            type="button"
            onClick={() => this.setState((s) => ({showDetails: !s.showDetails}))}
            style={{background: 'none', border: 'none', color: '#00b894', cursor: 'pointer', textDecoration: 'underline'}}
          >
            {this.state.showDetails ? 'Hide' : 'Show'} technical details
          </button>
          {this.state.showDetails ? (
            <pre style={{textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f5f5f5', color: '#333', padding: 12, borderRadius: 4, fontSize: 12, marginTop: 12, maxHeight: 220, overflow: 'auto'}}>
              {details}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
