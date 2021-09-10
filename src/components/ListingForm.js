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
import { useSelector } from 'react-redux'

export default function ListingForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [price, setPrice] = React.useState(props.nft.price);
        
  const error = (e) => {
    props.error(e);
  }
  const cancel = () => {
    _submit(0);
  }
  const save = () => {
    if (price < 0.01) return error("Min sale amount is 0.01 ICP"); 
    _submit(BigInt(Math.floor(price*(10**8))));
  };
  const _submit = p => {
    //Submit to blockchain here
    var _from_sa = currentAccount;
    var _price = p;
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    props.loader(true);
    handleClose();
    extjs.connect("https://boundary.ic0.app/", id).token(props.nft.id).list(_from_sa, _price).then(r => {
      if (r) {
        props.handleRefresh();
        return props.alert("Transaction complete", "Your listing has been updated");
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
    setPrice(0);
    props.close()
  };
  React.useEffect(() => {
    setPrice(props.nft.price ? Number(props.nft.price)/100000000 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.nft]);

  return (
    <>
      <Dialog open={props.open} onClose={handleClose} maxWidth={'xs'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Marketplace Listing</DialogTitle>
        <DialogContent>
        {props.nft.price === 0 ?
        <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Please enter a price below to create a new marketplace listing. Once you save the listing, it becomes available to the public. There is a 1.5% commission fee on all sales</DialogContentText> : ""}
         {props.nft.price > 0 ?
        <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Use the form to update the price of your listing, or Cancel the listing below</DialogContentText> : ""}
          <TextField
            style={{width:'100%'}}
            margin="dense"
            label={"Listing price in ICP"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="text"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Back
          </Button>
          {props.nft.price > 0 ? <Button onClick={cancel} color="primary">Cancel Listing</Button> : ""}
          <Button onClick={save} color="primary">Save Listing</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
