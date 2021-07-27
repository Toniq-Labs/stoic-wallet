import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default function RegisterTokenForm(props) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [symbol, setSymbol] = React.useState('');
  const [decimals, setDecimals] = React.useState(2);
  const [supply, setSupply] = React.useState(100);
    
  const error = (e) => {
    props.error(e);
  }

  const submit = () => {
    if (name === "") return error("Please enter a valid name");
    if (symbol === "") return error("Please enter a valid symbol");
    if (isNaN(decimals)) return error("Please enter a valid number for decimal places");
    if (isNaN(supply)) return error("Please enter a valid number for initial supply");
    //Validate
    props.onSubmit(name, symbol, decimals, supply);
    handleClose();
  };
  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setDecimals(2);
    setSupply(100);
    setSymbol('');
    setName('');
  };
  
  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog open={open} onClose={handleClose}  maxWidth={'sm'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Create your own Token</DialogTitle>
        <DialogContent>
          <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Complete the form below to create your own token. The initial supply will be added to your Main account once minted.</DialogContentText>
          <>
            <TextField
              autoFocus
              margin="dense"
              label="Token Name e.g. Bitcoin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              style={{width:'49%', marginRight:'2%'}}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              style={{width:'49%'}}
              margin="dense"
              label={"Symbol e.g. BTC"}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              type="text"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              autoFocus
              margin="dense"
              label="Initial Supply"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              type="text"
              style={{width:'49%', marginRight:'2%'}}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              style={{width:'49%'}}
              margin="dense"
              label={"Decimals"}
              value={decimals}
              onChange={(e) => setDecimals(e.target.value)}
              type="text"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={submit} color="primary">Create Token</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
