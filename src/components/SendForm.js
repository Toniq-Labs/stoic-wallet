/* global BigInt */
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal, validateAddress} from '../ic/utils.js';
import {compressAddress} from '../utils.js';
import { useSelector } from 'react-redux'

export default function SendForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [balance, setBalance] = React.useState(false);

  const [amount, setAmount] = React.useState(0);
  const [minFee, setMinFee] = React.useState(0);
  const [fee, setFee] = React.useState(0);
  const [to, setTo] = React.useState('');
  
  const [advanced, setAdvanced] = React.useState(false);
  const [memo, setMemo] = React.useState('');
  const [notify, setNotify] = React.useState(false);
  
  //cold API
  const api = extjs.connect("https://boundary.ic0.app/");

  const error = (e) => {
    props.error(e);
  }
  const review = () => {
    if (isNaN(amount)) return error("Please enter a valid amount to send");
    if (isNaN(fee)) return error("Please enter a valid fee to use");
    if (fee !== minFee) return error("The fee must be " + minFee);
    switch(props.data.symbol){
      case "ICP":
        if (!validateAddress(to)) return error("Please enter a valid address");      
      break;
      case "HZLD":
        if (!validatePrincipal(to)) return error("Please enter a valid principal to send to");      
      break;
      default:
        if (!validateAddress(to) && !validatePrincipal(to)) return error("Please enter a valid address to send to");      
      break;
    }
    if ((Number(amount)+Number(fee)) > balance)  return error("You have insufficient " + props.data.symbol); 
    setStep(1);
  }
  const submit = () => {
    //Submit to blockchain here
    var _from_principal = identity.principal;
    var _from_sa = currentAccount;
    var _to_user = to;
    var _amount = BigInt(amount*(10**props.data.decimals));
    var _fee = BigInt(fee*(10**props.data.decimals));
    var _memo = memo;
    var _notify = notify;
    
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    
    props.loader(true);
    handleClose();
    
    //hot api, will sign as identity - BE CAREFUL
    extjs.connect("https://boundary.ic0.app/", id).token(props.data.id).transfer(_from_principal, _from_sa, _to_user, _amount, _fee, _memo, _notify).then(r => {
      if (r) {
        return props.alert("Transaction complete", "Your transfer was sent successfully");
      } else {        
        return error("Something went wrong with this transfer");
      }
    }).catch(e => {
      return error("There was an error: " + e);
    }).finally(() => {
      props.loader(false);
    });
  };
  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setStep(0);
    setAmount(0);
    setMinFee(0);
    setFee(0);
    setBalance(false);
    setTo('');
    setAdvanced(false);
    setMemo('');
    setNotify(false);
  };
  React.useEffect(() => {
    api.token(props.data.id).fee().then(f => {
      setMinFee(f/10**(props.data.decimals));
      setFee(f/10**(props.data.decimals));
    });
    api.token(props.data.id).getBalance(props.address, identity.principal).then(b => {
      setBalance(Number(b)/(10**props.data.decimals));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data.id, open]);

  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog open={open} onClose={handleClose}  maxWidth={'sm'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Send {props.data.name} Tokens ({props.data.symbol})</DialogTitle>
        {step === 0 ?
          <DialogContent>
            <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Please enter the recipient address and amount that you wish to send below.</DialogContentText>
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Address of the Recipient"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                style={{width:'49%', marginRight:'2%'}}
                margin="dense"
                label={"Amount of " + props.data.symbol + " to Send"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              { minFee > 0 ?
              <TextField
                style={{width:'49%'}}
                margin="dense"
                label="Fee"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
              /> : "" }
              <DialogContentText style={{fontSize:'small',textAlign:'center', marginTop:"20px"}}>
                { balance !== false ? "Balance: "+balance+" "+props.data.symbol +" ": ""}
                { minFee > 0 ? "Min Fee: "+minFee+" "+props.data.symbol : ""}
              </DialogContentText>
              { advanced ?
                <p style={{cursor: 'pointer', fontWeight:'bold'}} onClick={() => setAdvanced(false)}>Hide Advanced Options</p>
              :
                <p href="#" style={{cursor: 'pointer', fontWeight:'bold'}} onClick={() => setAdvanced(true)}>Show Advanced Options</p>
              }
            </>
            { advanced ?
            <>
              <TextField
                margin="dense"
                multiline
                rows='2'
                rowsMax='4'
                label="Optional Memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <FormControlLabel
                control={<Switch checked={notify} onChange={(event) => setNotify(event.target.checked)} name="notify" />}
                label="Notify receiver?"
              />
            </> : "" }
          </DialogContent>
        :
          <DialogContent>
            <DialogContentText style={{textAlign:'center'}}>
            Please confirm that you are about to send <br />
            <strong style={{color:'red'}}>{amount} {props.data.symbol}</strong><br /> 
            from <strong style={{color:'red'}}>{compressAddress(props.address)}</strong><br />
            to <strong style={{color:'red'}}>{compressAddress(to)}</strong><br />
            { fee > 0 ? " using a fee of " + fee : ""} 
            </DialogContentText>
            <DialogContentText style={{textAlign:'center'}}>
              <strong>All transactions are irreversible, so ensure the above details are correct before you continue.</strong>
            </DialogContentText>
          </DialogContent>
        }
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          {step === 0 ?
            <Button onClick={review} color="primary">Review Transaction</Button>
            :
            <Button onClick={submit} color="primary">Confirm Transaction</Button>
          }
        </DialogActions>
      </Dialog>
    </>
  );
}
