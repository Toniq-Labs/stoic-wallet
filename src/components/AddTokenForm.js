import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

export default function AddTokenForm(props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(props.defaultValue ?? "");
  const [tabValue, setTabValue] = React.useState("add");

  const submit = () => {
    if (typeof props.onClick != 'undefined') props.onClick(value, tabValue);
    setOpen(false);
    setValue(props.defaultValue ?? "");
    setTabValue("add");
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
      <Dialog maxWidth={'xs'} fullWidth open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogContent>
          <div style={{marginBottom:"20px"}}>
            <Tabs
              value={tabValue}
              indicatorColor="primary"
              textColor="primary"
              onChange={(e,v) => setTabValue(v)}
              aria-label="disabled tabs example"
            >
              <Tab value="add" label="Add Token" />
              <Tab value="find" label="Find Tokens" />
            </Tabs>
          </div>
          { tabValue === "add" ? 
          <div>
            <DialogContentText>Add the Canister ID/Token ID for the token you wish to add</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Canister/Token ID"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="text"
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </div> :
          <div>
            <DialogContentText>Enter the Canister ID of an NFT or Multi-token canister to attempt to find your tokens. You can enter an existing NFT Token ID to discover others from the same collection (if auto-discover is supported)</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Canister/Token ID"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="text"
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </div> }
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
