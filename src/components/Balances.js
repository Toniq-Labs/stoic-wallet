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
  const [showToken, _showToken] = useState(false);
  const [tokenId, _tokenId] = useState("");
  function error(t){
    props.error(t);
    _showToken(false);
    _tokenId("");
  }
  function addToken(){
    //Hard card only HZLD for now
    if (tokenId != "qz7gu-giaaa-aaaaf-qaaka-cai") return error("Sorry, this token is not compatiable at this time");
    _showToken(false);
    _tokenId("");
    //In future we will pull down metadata
    props.addToken("HZLD", "HZLD", 0, tokenId);
  }
  return (
    <div className="row">
      {props.balances.map((b, i) => {     
         return (<Balance key={i} token={i} data={b} clickEv={props.changeToken} selected={(props.currentToken === i)} />) 
      })}
      <div key={100} className="col accountCards" style={{display:'flex'}}>
        <div onClick={()=> _showToken(true)} className="card bg-secondary text-white mb-3 text-center">
            <div className="card-body">
              Add Token<br />
              <FontAwesomeIcon icon={faPlus} />
            </div>
        </div>
      </div>
      <Dialog open={showToken} aria-labelledby="form-dialog-title">
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
            value={tokenId} 
            onChange={event => _tokenId(event.target.value)} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {_showToken(false); _tokenId("");}} variant="secondary">
            Cancel
          </Button>
          <Button onClick={addToken} variant="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
