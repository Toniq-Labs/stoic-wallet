import React, { useState, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from 'react-bootstrap/Button';
const MINFEE = 0.0001;
export default (props) => {
  const [toaddress, _toaddress] = useState("");
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
  function compressAddress(a){
    return a.substr(0, 32) + "...";
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
    if (!toaddress) return renderError("Please fill all fields");
    if (toaddress.length != 64) return renderError("Invalid address");
    if (isNaN(amount)) return renderError("Invalid amount");
    if (isNaN(fee)) return renderError("Invalid fee");
    if (amount <= 0) return renderError("Can't send 0");
    if (fee < MINFEE) return renderError("Min ICP fee is 0.0001");
    if ((amount + fee) > props.currentBalance) return renderError("This exceeds your current balance");
    _confirm(true);
  }
  function send(){
    _confirm(false);
    showLoader();
    props.send(toaddress, amount, fee).then(() => {
      _toaddress("");
      _amount(0);
      _fee(MINFEE);
      renderSuccess("Your transaction was sent successfully!");
    }).catch(renderError);
  }
  return (
    <div>
      <div className="row">
        <div className="col-md-4">
            <div className="form-group mb-4">
              <label htmlFor="toaddress">To Address</label>
              <input value={toaddress} onChange={(e) => _toaddress(e.target.value)} type="text" className="form-control" id="toaddress" placeholder="" />
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
                  <input value={fee} onChange={(e) => _fee(e.target.value)} type="number" className="form-control" id="fee" placeholder="0.0001" />
                </div>
              </div>
            </div>
            <button onClick={validate} className="btn btn-primary">Send</button>
        </div>
      </div>
      <Dialog
        open={showPopup}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
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
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Please confirm transaction</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          Are you sure you want to send <strong>{amount}ICP</strong> to <strong>{compressAddress(toaddress)}</strong> using a fee of {fee}?
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
