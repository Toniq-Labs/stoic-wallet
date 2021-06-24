import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import ConnectList from '../components/ConnectList';
import WalletDialog from '../components/WalletDialog';
import {StoicIdentity} from '../ic/identity.js';
import { useSelector, useDispatch } from 'react-redux'

function Connect(props) {
  const [open, setOpen] = React.useState(true);
  const [initialRoute, setInitialRoute] = React.useState('');
  const dispatch = useDispatch()
  const submit = (type, optdata) => {
    props.loader(true);
    StoicIdentity.setup(type, optdata).then(identity => {
      dispatch({ type: 'createwallet', payload : {identity : identity}});
      props.loader(false);
      setOpen(true)
      props.login();
    }).catch(e => {
      props.loader(false);
      setOpen(true)
    }).finally(() => {
      setOpen(true)
      props.loader(false)
    });
  };
  const error = (e) => {
    props.alert("There was an error", e);
  }
  const cancel = (t) => {
    setInitialRoute('');
    setOpen(true);
  };
  const handleClick = (t) => {
    setOpen(false);
    switch(t) {
      case "create":
        setInitialRoute('tips');
      break;
      case "import":
        setInitialRoute('import');
      break;
      case "link":
        props.loader(true);
        StoicIdentity.setup("ii").then(identity => {
          dispatch({ type: 'createwallet', payload : {identity : identity}});
          props.loader(false);
          setOpen(true)
          props.login();
        }).catch(e => {
          props.loader(false);
          setOpen(true)
        }).finally(() => {
          setOpen(true)
          props.loader(false)
        });
      break;
      case "connect":
        //Show error
        error("Hardware wallet support is coming soon!")
        setOpen(true)
      break;
    }
  };
  return (
    <>
      <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Stoic Wallet</DialogTitle>
        <DialogContent>
          <ConnectList handler={handleClick} />
        </DialogContent>
      </Dialog>
      <WalletDialog hideBackdrop alert={props.alert} initialRoute={initialRoute} cancel={cancel} submit={submit} />
    </>
  );
}

export default Connect;
