import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faCopy } from '@fortawesome/free-solid-svg-icons'
import Button from 'react-bootstrap/Button';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Dropdown } from 'react-bootstrap';

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
export default (props) => {
  const [accountName, _accountName] = useState(props.currentAccountName);
  useEffect(() => {
     _accountName(props.currentAccountName);
   }, [props.currentAccountName]);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  function updateName(){
    props.updateName(accountName);
    setShow(false);
  }
  function copyAddress(){
    copyTextToClipboard(props.accounts[props.currentAccount].address);
  }
  function explorerLink(){
    //Switch token type to present different links on a per token basis
    return "https://dashboard.internetcomputer.org/account/" + props.accounts[props.currentAccount].address;
  }

  function addToken(){
    handleShow();
    props.addToken();
  }
  return (
    <>
      <h1 className="mt-4 accountHeader">
        
          {props.accounts[props.currentAccount].name}                    
      </h1>
      <h3 className="accountAddress">
        <span>{props.accounts[props.currentAccount].address}</span>
        <OverlayTrigger trigger="click" rootClose placement="top" delay={{ show: 250, hide: 400 }} overlay={<Tooltip id="tooltip-disabled">Copied!</Tooltip>}>
          <FontAwesomeIcon icon={faCopy} onClick={copyAddress} />
        </OverlayTrigger>
        
        <Dropdown alignRight align="end">
          <Dropdown.Toggle as={CustomToggle} >
            <FontAwesomeIcon icon={faEllipsisV} />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={handleShow}>Change Name</Dropdown.Item>
            <Dropdown.Item target="_blank" href={explorerLink()}>View in Explorer</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </h3>
      <Dialog open={show} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Change Account Name</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter a new friendly name for this account.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Account Name"
            type="text"
            fullWidth
            onChange={event => _accountName(event.target.value)}
            value={accountName}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={updateName} variant="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
    </>
  );
}
