import useMediaQuery from '@material-ui/core/useMediaQuery';
import {useTheme} from '@material-ui/core/styles';

// Shared responsive helper: true on phone-sized viewports (xs, < 600px).
// Used to switch dialogs to fullScreen and to relax desktop-only layout
// constraints (fixed table widths, etc.) so the wallet works on mobile.
export default function useIsMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('xs'));
}
