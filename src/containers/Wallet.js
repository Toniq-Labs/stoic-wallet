import React from 'react';
import {useDispatch} from 'react-redux';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import AccountDrawer from '../components/AccountDrawer';
import ScrollTop from '../components/ScrollTop';
import {BalanceVisibilityContext} from '../balanceVisibility';
import {ThemeModeContext} from '../ThemeModeProvider';

import AccountDetail from '../views/AccountDetail';
import AddressBook from '../views/AddressBook';
import Neurons from '../views/Neurons';
import Applications from '../views/Applications';
import Settings from '../views/Settings';

import {makeStyles} from '@material-ui/core/styles';

const drawerWidth = 300;
const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  toolbarButtons: {
    marginLeft: 'auto',
    display: 'flex',
    // Keep the action icons on a single row; let the title ellipsize instead
    // of the icons wrapping when the page title is long on narrow screens.
    flexShrink: 0,
  },
  content: {
    flexGrow: 1,
  },
}));

const routes = {
  accountDetail: {
    title: 'Account Details',
    view: AccountDetail,
  },
  neurons: {
    title: 'Neuron Management',
    view: Neurons,
  },
  applications: {
    title: 'Applications',
    view: Applications,
  },
  addressBook: {
    title: 'Address Book',
    view: AddressBook,
  },
  settings: {
    title: 'Settings',
    view: Settings,
  },
};
//Helpers

function Wallet(props) {
  const classes = useStyles();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [route, setRoute] = React.useState(() => {
    try {
      const saved = localStorage.getItem('stoic-route');
      return saved && routes[saved] ? saved : 'accountDetail';
    } catch (e) {
      return 'accountDetail';
    }
  });
  const [toolbarTitle, setToolbarTitle] = React.useState(routes[route].title);
  const dispatch = useDispatch();

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const renderView = r => {
    switch (r) {
      case 'settings':
        return React.createElement(routes[r].view, {
          alert: props.alert,
          confirm: props.confirm,
          loader: props.loader,
          clearWallet: clearWallet,
          lockWallet: lockWallet,
        });
      case 'accountDetail':
      case 'neurons':
      case 'applications':
        return React.createElement(routes[r].view, {
          alert: props.alert,
          confirm: props.confirm,
          loader: props.loader,
        });
      default:
        return React.createElement(routes[r].view, {alert: props.alert, confirm: props.confirm});
    }
  };
  const changeRoute = (r, i) => {
    setToolbarTitle(routes[r].title);
    setRoute(r);
    try {
      localStorage.setItem('stoic-route', r);
    } catch (e) {}
    if (typeof i !== 'undefined') dispatch({type: 'currentAccount', payload: {index: i}});
  };

  const lockWallet = () => {
    props.logout();
  };
  const clearWallet = () => {
    props.remove();
  };
  const [hideBalances, setHideBalances] = React.useState(false);
  const {mode, toggle} = React.useContext(ThemeModeContext);
  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={classes.appBar}
        style={mode === 'dark' ? {backgroundColor: '#13242b', color: '#fff'} : undefined}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Toggle navigation menu"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap style={{minWidth: 0}}>
            {toolbarTitle}
          </Typography>
          <div className={classes.toolbarButtons}>
            <IconButton color="inherit" aria-label="Toggle dark mode" onClick={toggle}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton
              color="inherit"
              aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
              onClick={() => setHideBalances(v => !v)}
            >
              {hideBalances ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
            <IconButton
              color="inherit"
              edge="end"
              aria-label="Settings"
              onClick={() => changeRoute('settings')}
            >
              <AccountCircleIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      <AccountDrawer
        route={route}
        lockWallet={lockWallet}
        changeRoute={changeRoute}
        onClose={handleDrawerClose}
        open={mobileOpen}
      />
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <BalanceVisibilityContext.Provider value={hideBalances}>
          {renderView(route)}
        </BalanceVisibilityContext.Provider>
      </main>
      <ScrollTop />
    </div>
  );
}

export default Wallet;
