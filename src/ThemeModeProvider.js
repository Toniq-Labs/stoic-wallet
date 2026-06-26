import React from 'react';
import { ThemeProvider } from '@material-ui/core/styles';
import { makeTheme } from './theme';

export const ThemeModeContext = React.createContext({ mode: 'light', toggle: () => {} });

// Holds the light/dark preference (persisted to localStorage) and supplies the
// matching MUI theme to the whole app.
export default function ThemeModeProvider({ children }) {
  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem('stoic-theme') || 'light'; } catch (e) { return 'light'; }
  });
  const toggle = React.useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('stoic-theme', next); } catch (e) {}
      return next;
    });
  }, []);
  const theme = React.useMemo(() => makeTheme(mode), [mode]);
  return (
    <ThemeModeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
