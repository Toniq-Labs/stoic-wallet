import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from 'react-bootstrap/Button';
import {ICPLedger} from '../ic/ledger.js';
import Alert from 'react-bootstrap/Alert';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from 'react-bootstrap/FormControl'
import Form from 'react-bootstrap/Form'
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import iiimage from '../img/ii.png';
import pkimage from '../img/pk.png';

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

export default (props) => {
  const [showIIDialog, _showIIDialog] = useState(false);
  const [showPKDialog, _showPKDialog] = useState(false);
  const [dmnemonic, _dmnemonic] = useState(ICPLedger.generateMnemonic(256));
  const [mnemonic, _mnemonic] = useState("");
  const [password, _password] = useState("");
  const [cpassword, _cpassword] = useState("");
  const [key, setKey] = useState('new');
  const [stage, _stage] = useState(0);
  const classes = useStyles();
  function error(e){
    props.error(e);
  }
  function iiLogin(){
    _showIIDialog(false)
    props.loader(true, () => {      
      var ll = ICPLedger.setup({
        type : 'ii'
      });
      props.login(ll);
    });
  }
  function pkLogin(){
    if (stage === 0){
      if (mnemonic !== dmnemonic && key === 'new') return error("Mnemonic's do not match, try again");
      if (mnemonic === "") return error("Please enter a Mnemonic");
      if (!ICPLedger.validateMnemonic(mnemonic))  return error("Invalid mnemonic");
      _stage(1);
    } else if (stage === 1){
      if (password.length < 8) return error("Please enter a password with at least 8 characters");
      if (password != cpassword) return error("Your passwords do not match");
      _showPKDialog(false)
      props.loader(true, () => {
        var ll = ICPLedger.setup({
          type : 'private',
          mnemonic : mnemonic,
          password : password
        });
        _stage(0);
        _mnemonic("");
        _dmnemonic("");
        _password("");
        _cpassword("");
        props.login(ll);
      });
    }
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
                <p><strong>How do you want to connect to your wallet?</strong></p>
                <hr />
                <Alert variant={"info"}>
                  Hardware wallets are coming soon!
                </Alert>
                <div className="loginOption" onClick={() => _showIIDialog(true)}>
                  <img src={iiimage} />
                  <span>Internet Identity</span>
                </div>
                <div className="loginOption" onClick={() => _showPKDialog(true)}>
                  <img src={pkimage} />
                  <span>Mnemonic</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showIIDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Login using Internet Identity</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to connect using your Internet Identity by Dfinity?</DialogContentText>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => _showIIDialog(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={iiLogin} variant="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showPKDialog} aria-labelledby="form-dialog-title">
        <DialogTitle style={{width:"600px"}} id="form-dialog-title">Connect using a mnemonic phrase</DialogTitle>
        <DialogContent>
        { stage === 0 ?
          <>
            <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
              <Tab eventKey="new" title="New">
                
                <Alert className="mt-4" variant={"danger"}>
                  If you lose this mnemonic phrase, or it becomes compromised, you will lose all of your stored tokens
                </Alert>
                <p className="mnemonic" >{dmnemonic}</p>
                <hr />
                <DialogContentText>Please copy the above phrase in the box below to verify</DialogContentText>
              </Tab>
              <Tab eventKey="recover" title="Recover">
                <DialogContentText className="mt-4" >Please enter your recovery seed below</DialogContentText>
              </Tab>
            </Tabs>
            <FormControl style={{height:"100px"}} value={mnemonic} onChange={event => _mnemonic(event.target.value)} as="textarea"  />
          </>
        : 
          <>
            <Alert className="mt-4" variant={"danger"}>
              Please enter a password to encrypt your seed phrase. This can be used to unlock your wallet on this device
            </Alert>
            <Form.Group>
              <Form.Label>Enter Password</Form.Label>
              <Form.Control type="password" value={password} onChange={event => _password(event.target.value)} placeholder="" />
              
              <Form.Label>Enter Password Again</Form.Label>
              <Form.Control type="password" value={cpassword} onChange={event => _cpassword(event.target.value)} placeholder="" />
              <Form.Text className="text-muted">
                Ensure passwords are at least 8 characters long.
              </Form.Text>
            </Form.Group>
          </>
        }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => _showPKDialog(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={pkLogin} variant="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
