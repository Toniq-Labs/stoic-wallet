/* global BigInt */
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal, NNS_CANISTER_ID} from '../ic/utils.js';
import {compressAddress} from '../utils.js';
import { useSelector } from 'react-redux'

export default function TopupForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [balance, setBalance] = React.useState(false);
  const [rate, setRate] = React.useState(0);

  const [amount, setAmount] = React.useState(0);
  const [to, setTo] = React.useState('');
    
  //cold API
  const fee = 0.0002;
  const api = extjs.connect("https://boundary.ic0.app/");

  const error = (e) => {
    props.error(e);
  }
  const review = () => {
    console.log(amount, fee, amount+fee, (Number(amount)+Number(fee)))
    if (isNaN(amount)) return error("Please enter a valid amount to send");
    if (!validatePrincipal(to)) return error("Please enter a valid canister ID");      
    if ((Number(amount)+Number(fee)) > balance)  return error("You have insufficient ICP"); 
    setStep(1);
  }
  const submit = () => {
    //Submit to blockchain here
    var _from_principal = identity.principal;
    var _from_sa = currentAccount;
    var _canister = to;
    var _amount = BigInt(amount*(10**8));
    var _fee = BigInt(0.0001*(10**8));
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    
    props.loader(true);
    handleClose();
    
    //hot api, will sign as identity - BE CAREFUL
    extjs.connect("https://boundary.ic0.app/", id).token().mintCycles(_from_principal, _from_sa, _canister, _amount, _fee).then(r => {
      return props.alert("Transaction complete", "Your cycles have been minted and sent to your canister");
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
    setBalance(false);
    setTo('');
  };
  React.useEffect(() => {
    api.canister("rkp4c-7iaaa-aaaaa-aaaca-cai").get_icp_xdr_conversion_rate().then(b => {
      setRate(Number(b.data.xdr_permyriad_per_icp)/10000);
    });
    
    api.token().getBalance(props.address, identity.principal).then(b => {
      setBalance(Number(b)/(10**8));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data.id, open]);

  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog open={open} onClose={handleClose}  maxWidth={'sm'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Top-up your canister</DialogTitle>
        {step === 0 ?
          <DialogContent>
            <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Please enter the Canister ID and the amount of ICP you would like converted to cycles and added to the canister</DialogContentText>
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Canister ID"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                type="text"
                style={{width:'49%', marginRight:'2%'}}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                style={{width:'49%'}}
                margin="dense"
                label={"Amount of ICP to Send"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <DialogContentText style={{fontSize:'small',textAlign:'center', marginTop:"20px"}}>
                { balance !== false ? "Balance: "+balance+" "+props.data.symbol +" ": ""}
                Min Fee: 0.0002<br />
                <strong style={{color:"#00b894"}}>1ICP converts to ~{rate}T Cycles</strong>
              </DialogContentText>
            </>
          </DialogContent>
        :
          <DialogContent>
            <DialogContentText style={{textAlign:'center'}}>
            Please confirm that you are about to send <strong style={{color:'red'}}>{amount} ICP</strong><br /> 
            from <strong style={{color:'red'}}>{compressAddress(props.address)}</strong><br />
            to add ~{Math.round(rate*amount*100, 2)/100}T Cycles to <strong style={{color:'red'}}>{compressAddress(to)}</strong><br />
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
