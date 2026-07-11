import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import ConnectList from '../components/ConnectList';
import WalletDialog from '../components/WalletDialog';
import {StoicIdentity} from '../ic/identity.js';
import {useDispatch} from 'react-redux';
import {useTheme} from '@material-ui/core/styles';
import useIsMobile from '../useIsMobile';

function Connect(props) {
  const theme = useTheme();
  const fullScreen = useIsMobile();
  const [open, setOpen] = React.useState(true);
  const [initialRoute, setInitialRoute] = React.useState('');
  const dispatch = useDispatch();
  const submit = (type, optdata) => {
    props.loader(true);
    StoicIdentity.setup(type, optdata)
      .then(identity => {
        dispatch({type: 'createwallet', payload: {identity: identity}});
        props.login();
      })
      .catch(e => {
        console.error(e);
      })
      .finally(() => {
        setTimeout(() => {
          setOpen(true);
          props.loader(false);
        }, 2000);
      });
  };
  const error = e => {
    props.alert('There was an error', e);
  };
  const cancel = t => {
    setInitialRoute('');
    setOpen(true);
  };
  const handleClick = t => {
    setOpen(false);
    switch (t) {
      case 'create':
        setInitialRoute('tips');
        break;
      case 'import':
        setInitialRoute('import');
        break;
      case '3party':
        setInitialRoute('3party');
        break;
      case 'link':
        props.loader(true);
        StoicIdentity.setup('ii')
          .then(identity => {
            dispatch({type: 'createwallet', payload: {identity: identity}});
            props.login();
            props.loader(false);
            setOpen(true);
          })
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            setOpen(true);
            props.loader(false);
          });
        break;
      case 'ledger':
        if (!(window.navigator && window.navigator.hid)) {
          error(
            'Your browser does not support WebHID. Please use Chrome, Edge or Brave to connect a Ledger device.',
          );
          setOpen(true);
          break;
        }
        props.alert(
          'Connect your Ledger',
          'Plug in your Ledger, unlock it and open the Internet Computer app, then confirm the connection on the device.',
        );
        props.loader(true);
        StoicIdentity.setup('ledger')
          .then(identity => {
            dispatch({type: 'createwallet', payload: {identity: identity}});
            props.login();
          })
          .catch(e => {
            console.error(e);
            error(e && e.message ? e.message : 'Could not connect to your Ledger device');
          })
          .finally(() => {
            setOpen(true);
            props.loader(false);
          });
        break;
      default:
        break;
    }
  };
  return (
    <>
      <Dialog hideBackdrop maxWidth={'sm'} fullWidth fullScreen={fullScreen} open={open}>
        <DialogTitle id="form-dialog-title" style={{textAlign: 'center'}}>
          <img
            style={{
              maxHeight: '80px',
              marginTop: '5px',
              ...(theme.palette.type === 'dark'
                ? {backgroundColor: '#fff', padding: '4px 10px', borderRadius: 6}
                : {}),
            }}
            alt="Stoic Wallet by Toniq Labs"
            src="logo.png"
          />
        </DialogTitle>
        <DialogContent>
          <p style={{textAlign: 'center', marginTop: 0, color: '#777', fontSize: '0.95em'}}>
            A non-custodial wallet for the Internet Computer.
            <br />
            Your keys are encrypted and never leave your device.
          </p>
          <ConnectList handler={handleClick} />
        </DialogContent>
      </Dialog>
      <WalletDialog
        hideBackdrop
        alert={props.alert}
        initialRoute={initialRoute}
        cancel={cancel}
        submit={submit}
      />
    </>
  );
}

export default Connect;
