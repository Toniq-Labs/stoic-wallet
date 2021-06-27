/* global BigInt */
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal, validateAddress, principalToAccountIdentifier} from '../ic/utils.js';
import {compressAddress} from '../utils.js';
import { useSelector, useDispatch } from 'react-redux'
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import GetAppIcon from '@material-ui/icons/GetApp';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Blockie from '../components/Blockie';

const api = extjs.connect("https://boundary.ic0.app/");
export default function NeuronForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const accounts = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts : []))

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [balance, setBalance] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [subaccount, setSubaccount] = React.useState(0);
  
  React.useEffect(() => {
    if (subaccount !== false) {
      api.token().getBalance(principalToAccountIdentifier(identity.principal, subaccount), identity.principal).then(b => {
        setBalance(Number(b)/(10**8));
      });
    }
  }, [subaccount]);
  
  //cold API

  const error = (e) => {
    props.error(e);
  }
  const review = () => {
    if (isNaN(amount)) return error("Please enter a valid amount to send");
    if ((amount+0.0001) > balance)  return error("You have insufficient ICP"); 
    if (amount < 1)  return error("Min staking amount is 1 ICP"); 
    setStep(2);
  }
  const submit = () => {

  };
  const handleClick = () => {
    if (accounts.length == 1) setStep(1);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(0);
      setBalance(false);
      setAmount('');
      setSubaccount(0)
    }, 200);
  };
  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog open={open} onClose={handleClose}  maxWidth={'xs'} fullWidth >
        {step == 0 ?
          <>
            <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Choose an account to stake from</DialogTitle>
            <DialogContent>
              <List>
                {accounts.map((account, index) => {
                  return (
                      <ListItem key={index} button onClick={() => { setSubaccount(index); setStep(1); }}>
                        <ListItemAvatar>
                          <Avatar>
                            <Blockie address={account.address} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primaryTypographyProps={{noWrap:true}} 
                          secondaryTypographyProps={{noWrap:true}} 
                          primary={account.name}
                          secondary={account.address} />
                      </ListItem>
                  )
                })}
              </List>
            </DialogContent> 
          </>
        : "" }
        {step == 1 ?
          <>
            <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Set the amount you want to stake</DialogTitle>
            <DialogContent>
              <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>You can add more ICP to this neuron, or change neuron settings later.</DialogContentText>
              <>
                <TextField
                  fullWidth
                  margin="dense"
                  label={"Amount of ICP to Stake"}
                  value={amount}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  onChange={(e) => setAmount(e.target.value)}
                  type="text"
                />
                <DialogContentText style={{fontSize:'small',textAlign:'center', marginTop:"20px"}}>
                  { balance !== false ? "Balance: "+balance+" ICP ": ""}
                 Fee: 0.0001
                </DialogContentText>
              </>

            </DialogContent> 
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={review} color="primary">Review Transaction</Button>
            </DialogActions>
          </>
        : ""}
        {step == 2 ?
          <>
            <DialogContent>
              <DialogContentText style={{textAlign:'center'}}>
              Please confirm that you are about to send <br />
              <strong style={{color:'red'}}>{amount} ICP</strong><br /> 
              from <strong style={{color:'red'}}>{compressAddress(props.address)}</strong><br />
              using a fee of 0.0001
              </DialogContentText>
              <DialogContentText style={{textAlign:'center'}}>
                <strong>All transactions are irreversible, so ensure the above details are correct before you continue.</strong>
              </DialogContentText>
            </DialogContent> 
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={submit} color="primary">Confirm Transaction</Button>
            </DialogActions>
          </>
        : "" }
      </Dialog>
    </>
  );
}
