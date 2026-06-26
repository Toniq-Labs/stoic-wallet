import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('flags hasError and captures the error from getDerivedStateFromError', () => {
    const err = new Error('boom');
    const next = ErrorBoundary.getDerivedStateFromError(err);
    expect(next.hasError).toBe(true);
    expect(next.error).toBe(err);
  });
  it('initializes without an error state', () => {
    const eb = new ErrorBoundary({});
    expect(eb.state.hasError).toBe(false);
    expect(eb.state.error).toBeNull();
    expect(eb.state.showDetails).toBe(false);
  });
});
