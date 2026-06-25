import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('flags hasError from getDerivedStateFromError', () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error('boom'))).toEqual({hasError: true});
  });
  it('initializes without an error state', () => {
    const eb = new ErrorBoundary({});
    expect(eb.state).toEqual({hasError: false});
  });
});
