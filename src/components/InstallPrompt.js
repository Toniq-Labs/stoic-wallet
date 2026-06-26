import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';

// Offers an "Install" action when the browser fires beforeinstallprompt (PWA).
export default function InstallPrompt() {
  const [deferred, setDeferred] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setDeferred(e);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    setOpen(false);
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch (e) {}
    setDeferred(null);
  };
  return (
    <Snackbar
      open={open}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      message="Install Stoic Wallet for quick access"
      action={
        <>
          <Button color="secondary" size="small" onClick={install}>
            Install
          </Button>
          <Button color="inherit" size="small" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
        </>
      }
    />
  );
}
