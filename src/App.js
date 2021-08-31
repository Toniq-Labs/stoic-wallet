import React from 'react';
import Wallet from './containers/Wallet';
import Connect from './containers/Connect';
import Unlock from './containers/Unlock';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles';
import {StoicIdentity} from './ic/identity.js';
import AlertDialog from './components/AlertDialog';
import ConfirmDialog from './components/ConfirmDialog';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));
const emptyAlert = {
  title : "",
  message : "",
};
export default function App() {
  const classes = useStyles();
  const [loaderOpen, setLoaderOpen] = React.useState(false);
  const [appState, setAppState] = React.useState(false); //0 = nologin, 1 = locked, 2 = unlocked
  const principals = useSelector(state => state.principals)
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const dispatch = useDispatch()
  const [loaderText, setLoaderText] = React.useState(""); 
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
        dispatch({ type: 'removewallet'})
      }, 1000);//hack in timeout to clear views...
    })
  };
  const login = () => {
    if (principals.length === 0) {
      setAppState(0);
    } else {
      loader(true);
      StoicIdentity.load(principals[currentPrincipal].identity).then(i => {
        setAppState(2);
      }).catch(e => {
        setAppState(1);
      }).finally(() => loader(false));
    }    
  };
  const logout = () => {
    loader(true);
    StoicIdentity.lock(principals[currentPrincipal].identity).then(r => {
      setAppState(1);
      login();
    }).finally(() => {
      loader(false);
    });
  };
  
  const alert = (title, message, buttonLabel) => {
    return new Promise(async (resolve, reject) => {
      setAlertData({
        title : title,
        message : message,
        buttonLabel : buttonLabel,
        handler :  () => {
          setShowAlert(false);
          resolve(true);
          setTimeout(() => setAlertData(emptyAlert), 100);
        },
      });
      setShowAlert(true);
    })
  };
  
  const confirm = (title, message, buttonCancel, buttonConfirm) => {
    return new Promise(async (resolve, reject) => {
      setConfirmData({
        title : title,
        message : message,
        buttonCancel : buttonCancel,
        buttonConfirm : buttonConfirm,
        handler : (v) => {
          setShowConfirm(false);
          resolve(v);
          setTimeout(() => setConfirmData(emptyAlert), 100);
        },
      });
      setShowConfirm(true);
    })
  };
  
  React.useEffect(() => {
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrincipal, principals]);
  
  const loader = (l, t) => {
    setLoaderText(t);
    setLoaderOpen(l);
    if (!l) {  
      setLoaderText("");
    }
  };
  
  return (
    <>
      {appState === 0 ?
      <Connect alert={alert} confirm={confirm} login={login} loader={loader} /> : "" }
      {appState === 1 ?
      <Unlock alert={alert} confirm={confirm} login={login} remove={remove} loader={loader} /> : ""}
      {appState === 2 ?
      <Wallet alert={alert} confirm={confirm} logout={logout} remove={remove} loader={loader} /> : ""}
      <Backdrop className={classes.backdrop} open={loaderOpen}>
        <CircularProgress color="inherit" />
        <h2 style={{position:"absolute", marginTop:"120px"}}>{loaderText ?? "Loading..."}</h2>
      </Backdrop>
      <AlertDialog open={showAlert} title={alertData.title} message={alertData.message} buttonLabel={alertData.buttonLabel} handler={alertData.handler} />
      <ConfirmDialog open={showConfirm} title={confirmData.title} message={confirmData.message} buttonCancel={confirmData.buttonCancel} buttonConfirm={confirmData.buttonConfirm} handler={confirmData.handler} />
    </>
  );
}