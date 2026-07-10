import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import {QRCodeCanvas} from 'qrcode.react';
import SnackbarButton from './SnackbarButton';
import {clipboardCopy} from '../utils';
import useIsMobile from '../useIsMobile';

// A dedicated "Receive" dialog: scannable QR of the account address, the full
// address, and a copy button. Wraps its child element and opens on click.
export default function ReceiveDialog(props) {
  const [open, setOpen] = React.useState(false);
  const fullScreen = useIsMobile();
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      {React.cloneElement(props.children, {onClick: handleOpen})}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
        <DialogTitle style={{textAlign: 'center'}}>Receive</DialogTitle>
        <DialogContent style={{textAlign: 'center'}}>
          <div style={{padding: '8px 0'}}>
            <QRCodeCanvas value={props.address ?? ''} size={200} includeMargin />
          </div>
          <Typography variant="body2" color="textSecondary">
            Send ICP and tokens to this address
          </Typography>
          <div
            style={{
              wordBreak: 'break-all',
              fontSize: '0.85em',
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span>{props.address}</span>
            <SnackbarButton
              message="Address Copied"
              anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
              onClick={() => clipboardCopy(props.address)}
            >
              <IconButton size="small" aria-label="copy address">
                <FileCopyIcon style={{fontSize: 18}} />
              </IconButton>
            </SnackbarButton>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
