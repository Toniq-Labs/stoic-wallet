import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';

// Shows a persistent warning while the browser is offline.
export default function OfflineBanner() {
  const [offline, setOffline] = React.useState(
    typeof navigator !== 'undefined' && !navigator.onLine,
  );
  React.useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return (
    <Snackbar open={offline} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
      <Alert severity="warning" variant="filled">
        You're offline — balances and transactions may be out of date.
      </Alert>
    </Snackbar>
  );
}
