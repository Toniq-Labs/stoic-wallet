import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Alert from '@material-ui/lab/Alert';
import CropFreeIcon from '@material-ui/icons/CropFree';
import {Principal} from '@dfinity/principal';
import {validateAddress} from '../ic/format.js';

// Validate a principal the same way ic/utils.js does, but import the deps
// directly (format.js + @dfinity/principal) instead of through ic/utils.js,
// which pulls in the heavy @dfinity/identity stack and so can't be unit tested.
const validatePrincipal = p => {
  try {
    return p === Principal.fromText(p).toText();
  } catch (e) {
    return false;
  }
};

// Parse a raw QR payload into an IC account ID or principal. ReceiveDialog
// encodes the bare address, but we also tolerate a URI scheme prefix
// (e.g. "icp:<address>") and surrounding whitespace. Returns the address
// string if it is a valid principal or account ID, otherwise null.
export const parseScannedAddress = raw => {
  if (!raw) return null;
  let value = String(raw).trim();
  const schemeMatch = value.match(/^[a-z]+:(.+)$/i);
  if (schemeMatch && !validateAddress(value) && !validatePrincipal(value)) {
    value = schemeMatch[1].trim();
  }
  if (validateAddress(value) || validatePrincipal(value)) return value;
  return null;
};

// A camera-icon button that opens a modal QR scanner. On a successful scan of
// an IC address or principal it calls onScan(value) and closes. Uses the
// browser BarcodeDetector API and surfaces a friendly message when the camera
// is unavailable or permission is denied.
export default function QrScannerDialog({onScan}) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const rafRef = React.useRef(null);

  const stop = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = () => {
    stop();
    setOpen(false);
    setError('');
  };
  const handleOpen = () => {
    setError('');
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const start = async () => {
      if (typeof window === 'undefined' || !window.BarcodeDetector) {
        setError('QR scanning is not supported in this browser.');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('No camera is available on this device.');
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {facingMode: 'environment'},
        });
      } catch (e) {
        if (cancelled) return;
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
          setError('Camera permission was denied. Please allow camera access and try again.');
        } else if (e && e.name === 'NotFoundError') {
          setError('No camera was found on this device.');
        } else {
          setError('Unable to access the camera.');
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch (e) {}
      }
      const detector = new window.BarcodeDetector({formats: ['qr_code']});
      const scan = async () => {
        if (cancelled || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          for (const code of codes) {
            const address = parseScannedAddress(code.rawValue);
            if (address) {
              onScan(address);
              handleClose();
              return;
            }
          }
        } catch (e) {}
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    };

    start();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Tooltip title="Scan QR code">
        <IconButton size="small" aria-label="scan qr code" onClick={handleOpen}>
          <CropFreeIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle style={{textAlign: 'center'}}>Scan QR Code</DialogTitle>
        <DialogContent style={{textAlign: 'center'}}>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <DialogContentText style={{fontSize: 'small'}}>
                Point your camera at a QR code containing an address or principal.
              </DialogContentText>
              <video ref={videoRef} style={{width: '100%', borderRadius: 4}} muted playsInline />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
