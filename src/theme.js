import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#003240',
    },
    secondary: {
      main: '#00b894',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fafafa',
    },
  },
  overrides: {
    MuiIconButton: {
      label : {
        color : "#00b894"
      }
    },
    MuiAvatar: {
      colorDefault: {
        backgroundColor : '#00b894',
        color : 'white'
      },
    },
    MuiListItemIcon: {
      root: {
        color : '#00b894'
      },
    },
  },
});

export default theme;