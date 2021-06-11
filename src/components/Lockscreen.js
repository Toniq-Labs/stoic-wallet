import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from 'react-bootstrap/Button';
import {ICPLedger} from '../ic/ledger.js';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form'
import iiimage from '../img/ii.png';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});
var _wfn;
export default (props) => {
  const [password, _password] = useState("");

  const [warningDialog, _warningDialog] = useState(false);
  const [warningText, _warningText] = useState('');

  const classes = useStyles();
  function warning(t, f){
    _warningText(t);
    _wfn = f;
    _warningDialog(true)
  }
  function wdfn(){
    _wfn();
    _warningDialog(false)
  }
  
  function unlock(){
    var i = props.identity;
    props.loader(true, () => {
      switch(i.type){
        case "ii":
          var ll = ICPLedger.unlock(i);
          break;
        case "private":
          i.password = password;
          var ll = ICPLedger.unlock(i);
          break;
      }
      props.unlock(ll);
      ll.catch(e => {
        switch(i.type){
          case "ii":
            alert("Error with Identity portal");
            break;
          case "private":
            alert("Password incorrect or corrupted data");
            break;
        }
        props.loader(false);
      });
    });
  }
  return (
    <div>
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <a className="navbar-brand ps-3" target="_blank" href="https://toniqlabs.com" rel="noreferrer">Stoic Wallet <small>by Toniq Labs</small></a>
      </nav>
      <div className="container">
        <div className="row">
          <div className="col-md-4 offset-md-4 loginForm">
            <Card className={classes.root}>
              <CardContent className="text-center">
                <p><strong>Unlock your wallet</strong></p>
                <hr />
                {props.identity.type == 'ii' ? 
                  <>
                    <Alert variant={"info"}>
                      Please authenticate your identity to continue
                    </Alert>
                    <div className="loginOption" onClick={unlock}>
                      <img src={iiimage} />
                      <span>Internet Identity</span>
                    </div>
                  </>:
                  <>
                    <Alert variant={"info"}>
                      Please enter the password used when creating your wallet, not the mnemonic phrase. If you have lost the password, you can recover using your mnemonic phrase.
                    </Alert>
                    <Form.Group className="mb-4">
                      <Form.Label>Enter Password</Form.Label>
                      <Form.Control type="password" value={password} onChange={event => _password(event.target.value)} placeholder="" />
                    </Form.Group>
                    
                  </>
                }
                <hr />
                <Button onClick={() => warning("This will clear all data from this device, including any names you have given your accounts. All balances will remain and this wallet can be restored in future if you have the corresponding seed/access devices", props.clearWallet)} variant="danger">
                  Clear Wallet
                </Button>&nbsp;&nbsp;
                {props.identity.type == 'ii' ? "" :
                <Button onClick={unlock} variant="primary">
                  Unlock Wallet
                </Button> }
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={warningDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Please read first</DialogTitle>
        <DialogContent>
          <DialogContentText>{warningText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => _warningDialog(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={wdfn} variant="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
