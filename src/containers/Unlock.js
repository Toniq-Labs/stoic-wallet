import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import TextField from '@material-ui/core/TextField';
import {StoicIdentity} from '../ic/identity.js';
import { useSelector, useDispatch } from 'react-redux'
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Blockie from '../components/Blockie';
import { identityTypes } from '../utils';

function Unlock(props) {
  const principals = useSelector(state => state.principals)
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}))
  const [open, setOpen] = React.useState(true);
  const [changeDialog, setChangeDialog] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const dispatch = useDispatch()
  const error = (e) => {
    props.alert("There was an error", e);
  }
  const clear = () => {
    props.confirm("Please confirm", "You are about to clear your wallet, which will remove all data from this device. Are you sure you want to continue?").then(v => {
      if (v) props.remove();
    });
  };
  const changePrincipal = (p) => {
    dispatch({ type: 'currentPrincipal', payload : {index : p}});
    setChangeDialog(false);
  };
  const change = () => {
    setChangeDialog(true);
  };
  const loginPassword = () => {
    if (!StoicIdentity.validatePassword(password)) return error("Password is invalid, please try again");
    props.loader(true);
    setOpen(false);
    
    StoicIdentity.unlock(identity, {password : password}).then(r => {
      props.login();
    }).catch(e => {
      setPassword('');
      return error("You entered an incorrect password");
    }).finally(() => {
      setOpen(true)
      props.loader(false)
    });
  }
  const pemLogin = () => {
    
  }
  const iiLogin = () => {
    props.loader(true);
    setOpen(false);
    
    StoicIdentity.unlock(identity).then(r => {
      props.login();
    }).catch(e => {
      console.log(e);
    }).finally(() => {
      setOpen(true)
      props.loader(false)
    });
  };
  return (
    <>
    {changeDialog ?
      <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Select a Principal</DialogTitle>
        <DialogContent>
          <List
            component="nav"
            aria-labelledby="settings-list"
          >
            {principals.map((principal, i) => {
              return (
              <ListItem key={principal.identity.principal} button onClick={() => changePrincipal(i)}>
                <ListItemAvatar>
                  <Avatar>
                    <Blockie address={principal.identity.principal ?? ''} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primaryTypographyProps={{noWrap:true}} 
                  primary={principal.identity.principal}
                  secondary={
                    <>
                      <>{identityTypes[principal.identity.type]}</>
                    </>
                  } />
              </ListItem>) 
            })}
          </List>
            
        </DialogContent>
      </Dialog>
    :
    <>
      {identity.type == 'ii' ?
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Unlock your Wallet</DialogTitle>
          <DialogContent>
            <List component="nav" aria-label="secondary add principal">
              <ListItem button onClick={iiLogin}>
                <ListItemIcon>
                  <AllInclusiveIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Re-authenticate" 
                  secondary="We need to authenticate your Internet Identity" 
                />
              </ListItem>
            </List> 
              
          </DialogContent>
          <DialogActions>
            { principals.length > 1 ? <Button onClick={change} color="primary">Change Account</Button> : "" }
            <Button onClick={clear} color="primary">Clear Wallet</Button>
          </DialogActions>
        </Dialog>: ""}
        {identity.type == 'pem' ?
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Unlock your Wallet</DialogTitle>
          <DialogContent>
            <List component="nav" aria-label="secondary add principal">
              <ListItem button onClick={pemLogin}>
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Select your PEM file to access your wallet" 
                  secondary="We need to authenticate your PEM file" 
                />
              </ListItem>
            </List> 
              
          </DialogContent>
          <DialogActions>
            { principals.length > 1 ? <Button onClick={change} color="primary">Change Account</Button> : "" }
            <Button onClick={clear} color="primary">Clear Wallet</Button>
          </DialogActions>
        </Dialog>: ""}
        {identity.type == 'private' ?
          <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
            <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Unlock your Wallet</DialogTitle>
            <DialogContent>
              <p><strong>Enter your password to unlock your wallet.</strong></p>
              <TextField
                id="standard-textarea"
                label="Enter Password"
                fullWidth
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              { principals.length > 1 ? <Button onClick={change} color="primary">Change Account</Button> : "" }
              <Button onClick={clear} color="primary">Clear Wallet</Button>
              <Button onClick={loginPassword} color="primary">Unlock</Button>
            </DialogActions>
          </Dialog>
        : ""}
      </> }
    </>
  );
}

export default Unlock;
