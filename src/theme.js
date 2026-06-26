import { red } from '@material-ui/core/colors';
import { createTheme } from '@material-ui/core/styles';

// Build the Stoic theme for a given mode ('light' | 'dark').
export const makeTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      type: mode,
      primary: { main: isDark ? '#00b894' : '#003240' },
      secondary: { main: '#00b894' },
      error: { main: red.A400 },
      background: {
        default: isDark ? '#0e1a1f' : '#fafafa',
        paper: isDark ? '#13242b' : '#ffffff',
      },
    },
    overrides: {
      MuiCssBaseline: {
        '@global': {
          body: isDark ? { backgroundImage: 'none' } : { backgroundImage: 'url(./bg.png)' },
          a: isDark ? { color: '#4dd0e1' } : {},
        },
      },
      MuiIconButton: { label: { color: '#00b894' } },
      MuiAvatar: { colorDefault: { backgroundColor: '#00b894', color: 'white' } },
      MuiListItemIcon: { root: { color: '#00b894' } },
    },
  });
};

const theme = makeTheme('light');
export default theme;
