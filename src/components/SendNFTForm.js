/* global BigInt */
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Alert from '@material-ui/lab/Alert';
import DialogTitle from '@material-ui/core/DialogTitle';
import Autocomplete from '@material-ui/lab/Autocomplete';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {compressAddress} from '../utils.js';
import { useSelector, useDispatch } from 'react-redux'
import { Principal } from '@dfinity/principal';
import { getNFTActor } from '@psychedelic/dab-js'
import { HttpAgent } from '@dfinity/agent';

export default function SendNFTForm(props) {
  const addresses = useSelector(state => state.addresses);
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [step, setStep] = React.useState(0);

  const [to, setTo] = React.useState('');
  const [toOption, setToOption] = React.useState('');
  const [canister, setCanister] = React.useState('');
    
  const [contacts, setContacts] = React.useState([]);
  
  const dispatch = useDispatch()
  
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
    extjs.connect("https://boundary.ic0.app/", id).token(props.nft.id).transfer(_from_principal, _from_sa, _to_user, _amount, _fee, _memo, _notify).then(r => {
      if (r !== false) {
        if (r > 0n) {
          props.loadNfts();
          return props.alert("Transaction complete", "Your transfer was sent successfully");
        } else { 
          return props.alert("You were successful!", "You completed an advanced NFT action!");
        }
      } else {        
        return error("Something went wrong with this transfer");
      }
    }).catch(e => {
      return error("There was an error: " + e);
    }).finally(() => {
      props.loader(false);
    });
  };

  const submitToDab = async () => {
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id)
      return error("Something wrong with your wallet, try logging in again");

    const canisterId = props.nft.canister;
    const tokenIndex = props.nft.index;
    const standard = props.nft.standard;
    const _to_user = to;

    const agent = await Promise.resolve(
      new HttpAgent({ identity: id, host: "https://ic0.app" }),
    );
    const NFTActor = getNFTActor({ canisterId, agent, standard });

    props.loader(true);
    handleClose();

    try {
      await NFTActor.transfer(Principal.fromText(_to_user), tokenIndex);
      props.loader(false);
      return props.alert(
        "Transaction complete",
        "Your transfer was sent successfully",
      );
    } catch (e) {
      props.loader(false);
      console.error(e);
      return error("Something went wrong with this transfer");
    }
  };
  const handleClose = () => {
    setStep(0);
    setTo('');
    setToOption('');
    props.close()
  };
  React.useEffect(() => {
    if (props.nft && !props.nft.isDabToken) setCanister(extjs.decodeTokenId(props.nft.id).canister);
    else setCanister("");
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
          props.nft.isDabToken ? <DabDialogContent setTo={setTo} setToOption={setToOption} to={to} contacts={contacts} toOption={toOption} /> 
        : <DialogContent>
          { canister  === "bxdf4-baaaa-aaaah-qaruq-cai" ?
          <Alert severity="error">It looks like you are sending a <strong>Wrapped ICPunk</strong> - please note that some wallets (like Plug wallet) do not support Wrapped ICPunks. Please unwrap it first if this is the case.</Alert> : "" }
            <DialogContentText style={{textAlign:'center',fontWeight:'bold', marginTop:10}}>
            Please enter the recipient address and amount that you wish to send below.</DialogContentText>
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
            <strong style={{color:'red'}}>{props.nft.id}</strong><br /> 
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
            <Button onClick={props.nft.isDabToken? submitToDab : submit } color="primary">Confirm Transaction</Button>
          }
        </DialogActions>
      </Dialog>
    </>
  );
}

const DabDialogContent = ({ setTo, setToOption, to, contacts, toOption, }) => {
  return (
    <DialogContent>
      <Alert severity="warning">
        It looks like you are sending your NFT through <strong>DAB service</strong> - please
        note that you need to send it to a user Principal and NOT an address.
      </Alert>
      <DialogContentText
        style={{ textAlign: "center", fontWeight: "bold", marginTop: 10 }}
      >
        Please enter the recipient Principal that you wish to send to
        below.
      </DialogContentText>
      <Autocomplete
        freeSolo
        value={toOption}
        onChange={(e, v) => {
          if (v) {
            setTo(v.address);
            setToOption(v.address);
          }
        }}
        inputValue={to}
        onInputChange={(e, v) => setTo(v)}
        getOptionLabel={(contact) => contact.name || contact}
        groupBy={(contact) => contact.group}
        options={contacts}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            margin="dense"
            label="Principal of the Recipient"
            type="text"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        )}
      />
    </DialogContent>
  );
};
