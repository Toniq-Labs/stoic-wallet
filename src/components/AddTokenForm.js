import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
const standards = [
  ["ext", "EXT"],
  ["icrc", "ICRC"],
  ["dip20", "DIP20"],
  ["drc20", "DRC20"],
  ["ledger", "ICP Ledger"],
];
export default function AddTokenForm(props) {
  const [open, setOpen] = React.useState(false);
  const [canisterId, setCanisterId] = React.useState("");
  const [standard, setStandard] = React.useState("ext");

  const submit = async () => {
    if (typeof props.onClick != 'undefined') {
      props.loader("Loading token data...")
      setOpen(false);
      try{
        await props.onClick(canisterId, standard);
      } catch(e){
        console.log(e);
        props.alert("Error adding token", e.message);
      } finally {
        props.loader(false);
        setCanisterId("");
        setStandard("ext");
      }
    };
  };
  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog maxWidth={'sm'} fullWidth open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogContent>
          <h3>Add Token</h3>
          <div>
            <DialogContentText>Add the Canister ID and the Token Standard for the token you wish to add</DialogContentText>
            <FormControl style={{width:'49%',top:0, marginRight:5}}>
              <TextField
                autoFocus
                margin="dense"
                label="Canister ID"
                value={canisterId}
                onChange={(e) => setCanisterId(e.target.value)}
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
            <FormControl style={{width:'49%',top:5}}>
              <InputLabel shrink id="">Standard</InputLabel>
              <Select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
              >
                {standards.map((s, i) => (
                  <MenuItem key={i} value={s[0]}>{s[1]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={submit} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
