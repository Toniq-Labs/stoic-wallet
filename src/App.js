import React, {Suspense} from 'react';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import {useSelector, useDispatch} from 'react-redux';
import {makeStyles} from '@material-ui/core/styles';
import {StoicIdentity} from './ic/identity.js';
import extjs from './ic/extjs.js';
import AlertDialog from './components/AlertDialog';
import ConfirmDialog from './components/ConfirmDialog';
const Wallet = React.lazy(() => import('./containers/Wallet'));
const Connect = React.lazy(() => import('./containers/Connect'));
const Unlock = React.lazy(() => import('./containers/Unlock'));

const useStyles = makeStyles(theme => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));
const emptyAlert = {
  title: '',
  message: '',
};
export default function App() {
  const classes = useStyles();
  const [loaderOpen, setLoaderOpen] = React.useState(false);
  const [appState, setAppState] = React.useState(false); //0 = nologin, 1 = locked, 2 = unlocked
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const dispatch = useDispatch();
  const [loaderText, setLoaderText] = React.useState('');
  const [alertData, setAlertData] = React.useState(emptyAlert);
  const [confirmData, setConfirmData] = React.useState(emptyAlert);
  const [showAlert, setShowAlert] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const remove = () => {
    loader(true);
    StoicIdentity.clear(principals[currentPrincipal].identity).then(r => {
      setAppState(0);
      loader(false);
      setTimeout(() => {
        dispatch({type: 'removewallet'});
      }, 1000); //hack in timeout to clear views...
    });
  };
  const login = () => {
    if (principals.length === 0) {
      setAppState(0);
    } else {
      loader(true);
      StoicIdentity.load(principals[currentPrincipal].identity)
        .then(i => {
          extjs.connect(
            'https://icp0.io/',
            StoicIdentity.getIdentity(principals[currentPrincipal].identity.principal),
          );
          setAppState(2);
        })
        .catch(e => {
          setAppState(1);
        })
        .finally(() => loader(false));
    }
  };
  const logout = () => {
    loader(true);
    StoicIdentity.lock(principals[currentPrincipal].identity)
      .then(r => {
        setAppState(1);
        login();
      })
      .finally(() => {
        loader(false);
      });
  };

  const alert = (title, message, buttonLabel) => {
    return new Promise(async (resolve, reject) => {
      setAlertData({
        title: title,
        message: message,
        buttonLabel: buttonLabel,
        handler: () => {
          setShowAlert(false);
          resolve(true);
          setTimeout(() => setAlertData(emptyAlert), 100);
        },
      });
      setShowAlert(true);
    });
  };

  const confirm = (title, message, buttonCancel, buttonConfirm) => {
    return new Promise(async (resolve, reject) => {
      setConfirmData({
        title: title,
        message: message,
        buttonCancel: buttonCancel,
        buttonConfirm: buttonConfirm,
        handler: v => {
          setShowConfirm(false);
          resolve(v);
          setTimeout(() => setConfirmData(emptyAlert), 100);
        },
      });
      setShowConfirm(true);
    });
  };

  React.useEffect(() => {
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrincipal, principals]);
  // Auto-lock the wallet after a period of inactivity (security).
  // Configurable via localStorage 'stoic-autolock' (minutes; 0 disables). Default 15.
  React.useEffect(() => {
    if (appState !== 2) return;
    const minutes = parseInt(localStorage.getItem('stoic-autolock') || '15', 10);
    if (!minutes || minutes <= 0) return;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { logout(); }, minutes * 60 * 1000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, {passive: true}));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const loader = (l, t) => {
    setLoaderText(t);
    setLoaderOpen(l);
    if (!l) {
      setLoaderText('');
    }
  };

  return (
    <>
      <Suspense
        fallback={
          <Backdrop className={classes.backdrop} open={true}>
            <CircularProgress color="inherit" />
          </Backdrop>
        }
      >
      {appState === 0 ? (
        <Connect alert={alert} confirm={confirm} login={login} loader={loader} />
      ) : (
        ''
      )}
      {appState === 1 ? (
        <Unlock alert={alert} confirm={confirm} login={login} remove={remove} loader={loader} />
      ) : (
        ''
      )}
      {appState === 2 ? (
        <>
          <Wallet alert={alert} confirm={confirm} logout={logout} remove={remove} loader={loader} />
        </>
      ) : (
        ''
      )}
      </Suspense>
      <Backdrop className={classes.backdrop} open={loaderOpen} role="status" aria-live="polite">
        <CircularProgress color="inherit" />
        <h2 style={{position: 'absolute', marginTop: '120px'}}>{loaderText ?? 'Loading...'}</h2>
      </Backdrop>
      <AlertDialog
        open={showAlert}
        title={alertData.title}
        message={alertData.message}
        buttonLabel={alertData.buttonLabel}
        handler={alertData.handler}
      />
      <ConfirmDialog
        open={showConfirm}
        title={confirmData.title}
        message={confirmData.message}
        buttonCancel={confirmData.buttonCancel}
        buttonConfirm={confirmData.buttonConfirm}
        handler={confirmData.handler}
      />
    </>
  );
}
