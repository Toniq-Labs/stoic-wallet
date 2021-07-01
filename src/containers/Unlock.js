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
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Blockie from '../components/Blockie';
import TwitterIcon from '@material-ui/icons/Twitter';
import MailIcon from '@material-ui/icons/Mail';
import FacebookIcon from '@material-ui/icons/Facebook';
import GitHubIcon from '@material-ui/icons/GitHub';
import { useFilePicker } from 'use-file-picker';
import { identityTypes } from '../utils';

function Unlock(props) {
  const principals = useSelector(state => state.principals)
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}))
  const [open, setOpen] = React.useState(true);
  const [changeDialog, setChangeDialog] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const dispatch = useDispatch()
  const [openFileSelector, fsobj] = useFilePicker({
    accept: '.pem',
    multiple: false,
  });
  React.useEffect(() => {
    if (fsobj.filesContent.length > 0) {
      var od = {
        pem : fsobj.filesContent[0].content
      }
      fsobj.clear();
      StoicIdentity.unlock(identity, od).then(r => {
        props.login();
      }).catch(e => {
        console.log(e);
      }).finally(() => {
        setOpen(true)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsobj.filesContent]);
  const error = (e) => {
    props.alert("There was an error", e);
  }
  const clear = () => {
    props.confirm("Please confirm", "You are about to clear your wallet, which will remove all data from this device. Are you sure you want to continue?").then(v => {
      if (v) {
        setOpen(false);
        props.remove();
      }
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
    openFileSelector();
    
  }
  const iiLogin = () => {
    props.loader(true);
    setOpen(false);
    StoicIdentity.unlock(identity).then(r => {
      props.login();
    }).catch(e => {
    }).finally(() => {
      setTimeout(() => {
        setOpen(true)
        props.loader(false)
      }, 2000);
    });
  };
  const capitalizeFirstLetter = ([ first, ...rest ], locale = navigator.language) =>
  first.toLocaleUpperCase(locale) + rest.join('')
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
      {identity.type === 'ii' ?
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Unlock your Wallet</DialogTitle>
          <DialogContent>
            <List component="nav" aria-label="secondary add principal">
              <ListItem button onClick={iiLogin}>
                <ListItemIcon>
                  <AllInclusiveIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Re-authenticate your Internet Identity" 
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
        {identity.type === 'pem' ?
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
        {identity.type === 'private' ?
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
        {['google', 'twitter', 'facebook', 'github'].indexOf(identity.type) >= 0 ?
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open={open}>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Unlock your Wallet</DialogTitle>
          <DialogContent>
            <List component="nav" aria-label="secondary add principal">
              <ListItem button onClick={iiLogin}>
                <ListItemIcon>
                  {identity.type === 'google' ? <MailIcon /> : ""}
                  {identity.type === 'twitter' ? <TwitterIcon /> : ""}
                  {identity.type === 'facebook' ? <FacebookIcon /> : ""}
                  {identity.type === 'github' ? <GitHubIcon /> : ""}
                </ListItemIcon>
                <ListItemText 
                  primary={"Login to your " + capitalizeFirstLetter(identity.type) + " account"} 
                  secondary="We need to authenticate your account to continue" 
                />
              </ListItem>
            </List> 
              
          </DialogContent>
          <DialogActions>
            { principals.length > 1 ? <Button onClick={change} color="primary">Change Account</Button> : "" }
            <Button onClick={clear} color="primary">Clear Wallet</Button>
          </DialogActions>
        </Dialog>: ""}
      </> }
    </>
  );
}

export default Unlock;
