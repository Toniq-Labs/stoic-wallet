import React, { useState } from 'react';
import Balance from './Balance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import Button from 'react-bootstrap/Button';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default (props) => {
  const [show, setShow] = useState(false);
  const [showToken, _showToken] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  function addToken(i){
    handleShow();
    //props.addToken();
  }
  return (
    <div className="row">
      {props.balances.map((b, i) => {     
         return (<Balance key={i} token={i} data={b} clickEv={props.changeToken} selected={(props.currentToken === i)} />) 
      })}
      <div key={100} className="col accountCards" style={{display:'flex'}}>
        <div onClick={addToken} className="card bg-secondary text-white mb-3 text-center">
            <div className="card-body">
              Add Token<br />
              <FontAwesomeIcon icon={faPlus} />
            </div>
        </div>
      </div>
      <Dialog open={show} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add token</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter the Canister ID for the token you wish to add.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Canister ID"
            type="text"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={() => {
            setShow(false);
            _showToken(true);
          }} variant="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showToken}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Coming soon!"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This feature is currently being worked on. Please check back in future.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => _showToken(false)} variant="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
