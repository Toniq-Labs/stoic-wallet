/* global BigInt */
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Autocomplete from '@material-ui/lab/Autocomplete';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {compressAddress} from '../utils.js';
import { useSelector } from 'react-redux'

export default function SendNFTForm(props) {
  const addresses = useSelector(state => state.addresses);
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [step, setStep] = React.useState(0);

  const [to, setTo] = React.useState('');
  const [toOption, setToOption] = React.useState('');
    
  const [contacts, setContacts] = React.useState([]);
  
  const error = (e) => {
    props.error(e);
  }
  const review = () => {
    setStep(1);
  }
  const submit = () => {
    //Submit to blockchain here
    var _from_principal = identity.principal;
    var _from_sa = currentAccount;
    var _to_user = to;
    var _amount = BigInt(1);
    var _fee = BigInt(0);
    var _memo = "";
    var _notify = false;
    
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    
    props.loader(true);
    handleClose();
    
    //hot api, will sign as identity - BE CAREFUL
    console.log(props.nft);
    extjs.connect("https://boundary.ic0.app/", id).token(props.nft).transfer(_from_principal, _from_sa, _to_user, _amount, _fee, _memo, _notify).then(r => {
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
  const handleClose = () => {
    setStep(0);
    setTo('');
    setToOption('');
    props.close()
  };
  React.useEffect(() => {
    var contacts = [];
    addresses.forEach(el => {
      contacts.push({
        group : "Address Book",
        name : el.name,
        address : el.address,
      });
    });
    principals.forEach(p => {
      p.accounts.forEach(a => {
        contacts.push({
          group : p.identity.principal,
          name : a.name,
          address : a.address,
        });
      });
    });
    setContacts(contacts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.nft]);

  return (
    <>
      <Dialog open={props.open} onClose={handleClose} maxWidth={'sm'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Send NFT</DialogTitle>
        {step === 0 ?
          <DialogContent>
            <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Please enter the recipient address and amount that you wish to send below.</DialogContentText>
              <Autocomplete
                freeSolo
                value={toOption}
                onChange={(e,v) => { if (v) {
                    setTo(v.address) 
                    setToOption(v.address) 
                  }
                }}
                inputValue={to}
                onInputChange={(e,v) => setTo(v)}
                getOptionLabel={contact => contact.name || contact}
                groupBy={(contact) => contact.group}
                options={contacts}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    autoFocus
                    margin="dense"
                    label="Address of the Recipient"
                    type="text"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
          </DialogContent>
        :
          <DialogContent>
            <DialogContentText style={{textAlign:'center'}}>
            Please confirm that you are about to send NFT <br />
            <strong style={{color:'red'}}>{props.nft}</strong><br /> 
            to <strong style={{color:'red'}}>{compressAddress(to)}</strong>
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
