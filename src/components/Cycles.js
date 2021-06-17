import React, { useState, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
const MINFEE = 0.0001;
const TOKENMINFEE = 1;
export default (props) => {
  const [canisterid, _canisterid] = useState("");
  const [amount, _amount] = useState(0);
  const [fee, _fee] = useState(MINFEE);
  const [showPopup, _showPopup] = useState(false);
  const [popupTitle, _popupTitle] = useState('');
  const [popupText, _popupText] = useState("");
  const [confirm, _confirm] = useState(false);
  function showLoader(){
    props.loader(true);
  }
  function hideLoader(){
    props.loader(false);
  }
  function compressPrincipal(p){
    if (!p) return "";
    var pp = p.split("-");
    if (pp.length <= 4) return p;
    else {
      return pp[0] + "-" + pp[1].substr(0, 3) + "..." + pp[pp.length-3].substr(2) + "-" + pp[pp.length-2] + "-" + pp[pp.length-1];
    }
  }
  function renderError(e){
    _popupTitle("Something went wrong");
    _popupText(e);
    _showPopup(true);
    hideLoader();
  }
  function renderSuccess(e){
    _popupTitle("It worked!");
    _popupText(e);
    _showPopup(true);
    hideLoader();
  }
  function validate(){
    if (!canisterid) return renderError("Please fill all fields");
    if (isNaN(amount)) return renderError("Invalid amount");
    if (amount <= 0) return renderError("Can't send 0");
    if (isNaN(fee)) return renderError("Invalid fee");
    if (fee < MINFEE) return renderError("Min ICP fee is 0.0001");
    if ((Number(amount) + Number(fee)) > props.currentBalance) return renderError("This exceeds your current balance");
    _confirm(true);
  }
  function send(){
    _confirm(false);
    showLoader();
    props.cycles(canisterid, Number(amount), Number(fee)).then(() => {
      _canisterid("");
      _amount(0);
      _fee(MINFEE);
      renderSuccess("Your transaction was sent successfully!");
    }).catch(renderError);
  }
  return (
    <div>
      <div className="row">
        <div className="col-md-6">        
          <Alert variant="warning">
            Only use this if you want to convert ICP to cycles and send it to a canister. You can also use <a href="https://dsneu-dyaaa-aaaad-qagwa-cai.ic.fleek.co/" target="_blank">WTC</a> to power your canisters!
          </Alert>
        </div>
      </div>
      <div className="row">
        <div className="col-md-4">
            <div className="form-group mb-4">
              <label htmlFor="canisterid">Canister ID (principal)</label>
              <input value={canisterid} onChange={(e) => _canisterid(e.target.value)} type="text" className="form-control" id="canisterid" placeholder="" />
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-4">
                  <label htmlFor="amount">Amount</label>
                  <input value={amount} onChange={(e) => _amount(e.target.value)} type="number" className="form-control" id="amount" placeholder="0" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-4">
                  <label htmlFor="fee">Fee</label>
                  <input value={fee} onChange={(e) => _fee(e.target.value)} type="number" className="form-control" id="fee"  />
                </div>
              </div>
            </div>
            <button onClick={validate} className="btn btn-primary">Convert and Send Cycles</button>
        </div>
      </div>
      <Dialog
        open={showPopup}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{popupTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          {popupText}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => _showPopup(false)} variant="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">Please confirm transaction</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          <>Are you sure you want to convert <strong>{amount}ICP</strong> to cycles and send it to <strong>{compressPrincipal(canisterid)}</strong> using a fee of {fee}?</>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => _confirm(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={send} variant="primary">
            Send Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
