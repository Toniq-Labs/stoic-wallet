import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from 'react-bootstrap/Button';

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {children}
    &#x25bc;
  </a>
));
function fallbackCopyTextToClipboard(text) {
  
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}
var _wfn;
export default (props) => {
  const [warningDialog, _warningDialog] = useState(false);
  const [warningText, _warningText] = useState('');
  
  function copyPrincipal(){
    copyTextToClipboard(props.principal);
  }
  function compressPrincipal(p){
    if (!p) return "";
    var pp = p.split("-");
    if (pp.length <= 4) return p;
    else {
      return pp[0] + "-" + pp[1].substr(0, 3) + "..." + pp[pp.length-3].substr(2) + "-" + pp[pp.length-2] + "-" + pp[pp.length-1];
    }
  }
  function warning(t, f){
    _warningText(t);
    _wfn = f;
    _warningDialog(true)
  }
  function wdfn(){
    _wfn();
    _warningDialog(false)
  }
  return (
    <>
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
          <a className="navbar-brand ps-3"  target="_blank" href="https://toniqlabs.com">Elastic Wallet <small>by Toniq Labs</small></a>
          <button className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#!"><FontAwesomeIcon icon={faBars} /></button> 
          <ul className="navbar-nav ms-auto me-0 me-md-3 my-2 my-md-0">
              <li className="nav-item dropdown">
                  <Dropdown alignRight>
                    <Dropdown.Toggle as={CustomToggle}menuAlign="right">
                      Logged in as {compressPrincipal(props.principal)}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item onClick={copyPrincipal}>Copy Principal</Dropdown.Item>
                      <Dropdown.Item onClick={() => warning("Locking your wallet can help to stop unauthorized access, but private details regarding your account will still be stored on this device. If you connected using a mnenomic phrase, an ecrypted version will remain on this device.", props.lockWallet)}>Lock Wallet</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => warning("This will clear all data from this device, including any names you have given your accounts. All balances will remain and this wallet can be restored in future if you have the corresponding seed/access devices", props.clearWallet)}>Clear Wallet</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
              </li>
          </ul>
      </nav>      
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
    </>
  );
}
