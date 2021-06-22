import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import GetAppIcon from '@material-ui/icons/GetApp';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import UsbIcon from '@material-ui/icons/Usb';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import TextField from '@material-ui/core/TextField';
import {StoicIdentity} from '../ic/identity.js';

const tips = [
  "When accessing this wallet, always type the URL into the browser address bar yourself or use a bookmark that you yourself created. Never trust links posted on social media, in search results, sent in emails or listed on other websites.",
  "If your browser gives you any sort of security warning about this web wallet, get in touch with us and report it. Do not ignore the warning nor enter your mnemonic secret!",
  "Only use your own devices when accessing your accounts. Do not enter your mnemonic secret on untrustworthy devices (public computers, friends computers/phones, etc) as they might be littered with malware and keyloggers.",
  "Always keep your operating system, anti-virus software and browser up to date with latest security updates.",
  "If possible, prefer hardware wallets over mnemonic secret for storing larger amounts of RISE.",
];
var type = '';
export default function WalletDialog(props) {
  const [route, setRoute] = React.useState(props.initialRoute);
  const [newMnemonic, setNewMnemonic] = React.useState('');
  const [mnemonic, setMnemonic] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [tipsIndex, setTipsIndex] = React.useState(1);
  React.useEffect(() => {
    setRoute(props.initialRoute);
  }, [props.initialRoute]);
  
  const cancel = () => {
    type = '';
    setTipsIndex(1);
    setRoute("");
    setNewMnemonic("");
    setMnemonic("");
    setPassword("");
    setPassword2("");
    setAddress("");
    props.cancel();
  }
  const error = (e) => {
    props.alert("There was an error", e);
  }
  const showNewMnemonic = () => {
    setTipsIndex(1);
    setRoute("newMnemonic");
    type = 'create';
    setNewMnemonic(StoicIdentity.generateMnemonic());
  }
  const showRecoverMnemonic = () => {
    setRoute("confirmMnemonic");
    type = 'import';
  }  
  const showAddress = () => {
    setRoute("address");
    type = 'watch';
  }
  
  const confirmAddress = () => {
    if (!StoicIdentity.validatePrincipal(address)) return error("Please enter a valid principal");
    submit();
  }
  const confirmMnemonic = () => {
    if (!StoicIdentity.validateMnemonic(mnemonic)) return error("The mnemonic you entered is not valid"); //show error
    if (type == 'create' && mnemonic !== newMnemonic) return error("The mnemonic you entered does not match the one displayed"); //show error
    setRoute("passwords");
  };
  const confirmPasswords = () => {
    if (password !== password2) return error("Your passwords do not match");
    if (!StoicIdentity.validatePassword(password)) return error("Password is invalid, please try again");
    submit();
  }
  const submit = () => {
    var od = {}, t = '';
    switch(type) {
      case "create":
      case "import":
        t = 'private';
        od.mnemonic = mnemonic;
        od.password = password;
      break;
      case "watch":
        t = 'watch';
        od.principal = address;
      break;
    };
    props.submit(t,od);
    //Clear
    type = '';
    setTipsIndex(1);
    setRoute("");
    setNewMnemonic("");
    setMnemonic("");
    setPassword("");
    setPassword2("");
    setAddress("");
  };
  
  return (
    <>
      { route == 'tips' ?
      <>
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Security Tips</DialogTitle>
          <DialogContent>
            <p><strong>Things to keep in mind to increase the security of your funds:</strong></p>
            <ul>
            {tips.map( (t,i) => {
              if (i >= tipsIndex) return "";
              return(<li key={i}>{t}</li>)
            })}
            </ul>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">Cancel</Button>
            {tipsIndex < tips.length ?
            <Button onClick={() => setTipsIndex(tipsIndex+1)} color="primary">Next Tip</Button>
            :
            <Button onClick={showNewMnemonic} color="primary">Continue</Button> }
          </DialogActions> 
        </Dialog>
      </>:""}
      { route == 'import' ?
      <>
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Select Import Type</DialogTitle>
          <DialogContent>
            <List component="nav" aria-label="secondary add principal">
              <ListItem button onClick={showRecoverMnemonic}>
                <ListItemIcon>
                  <VpnKeyIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Import using a seed phrase" 
                  secondary="Enter your mnemonic seed to recover full access to your wallet" 
                />
                
              </ListItem>
              <ListItem button onClick={showAddress}>
                <ListItemIcon>
                  <VisibilityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Read only account" 
                  secondary="Enter the address of a wallet you would like to add, but not spend from"
                />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">Cancel</Button>
          </DialogActions> 
        </Dialog>
      </>:""}
      { route == 'newMnemonic' ?
      <>
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Write down your seed phrase</DialogTitle>
          <DialogContent>
            <p><strong>This is your 12 word seed phrase:</strong></p>
            <div style={{textAlign:'center'}}>
              {newMnemonic.split(" ").map((w, i) => {
                return (<span key={i} style={{fontSize:'large', display:'inline-block', padding:'5px 15px'}}>{w}{i < 11 ? <>&nbsp;</> : ""}</span>);
              })}
            </div>
            <p>Write your mnemonic down on a physical piece of paper and store it somewhere safe and private. Anyone who knows this can transfer funds out of your account.</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">Cancel</Button>
            <Button onClick={() =>  setRoute("confirmMnemonic")} color="primary">Continue</Button>
          </DialogActions> 
        </Dialog>
      </>:""}
      { route == 'confirmMnemonic' ?
      <>
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Confirm your mnemonic seed</DialogTitle>
          <DialogContent>
            <p><strong>Please confirm your 12 word seed phrase:</strong></p>
            <TextField
              id="standard-textarea"
              label="Confirm Mnemonic Seed"
              multiline
              fullWidth
              value={mnemonic}
              rows={2}
              onChange={(e) => setMnemonic(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">Cancel</Button>
            <Button onClick={confirmMnemonic} color="primary">Continue</Button>
          </DialogActions>
        </Dialog>
      </>:""}
      { route == 'address' ?
      <>
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Enter the Principal to watch</DialogTitle>
          <DialogContent>
            <p><strong>Please enter a valid Principal (e.g. 4opr7-aaepd-uw2ok...)</strong></p>
            <TextField
              id="standard-textarea"
              label="Principal"
              fullWidth
              value={address}
              required
              onChange={(e) => setAddress(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">Cancel</Button>
            <Button onClick={confirmAddress} color="primary">Continue</Button>
          </DialogActions>
        </Dialog>
      </>:""}
      { route == 'passwords' ?
      <>
        <Dialog hideBackdrop maxWidth={'sm'} fullWidth open>
          <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Enter a password</DialogTitle>
          <DialogContent>
            <p><strong>This password is used to further encrypt your private data on your device.</strong></p>
            <TextField
              id="standard-textarea"
              label="Enter Password"
              fullWidth
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{marginBottom: 20}}
            />
            <TextField
              id="standard-textarea"
              label="Confirm Password"
              fullWidth
              required
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">Cancel</Button>
            <Button onClick={confirmPasswords} color="primary">Continue</Button>
          </DialogActions>
        </Dialog>
      </>:""}
      
    </>
  );
}

