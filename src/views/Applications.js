import React from 'react';
import Typography from '@material-ui/core/Typography';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import DeleteIcon from '@material-ui/icons/Delete';
import PublicIcon from '@material-ui/icons/Public';
import {useSelector, useDispatch} from 'react-redux';
import {useTheme} from '@material-ui/core/styles';
import useIsMobile from '../useIsMobile';

// Best-effort favicon for a dApp origin; the Avatar falls back to an icon if it fails to load.
const faviconUrl = host => {
  try {
    return new URL(host).origin + '/favicon.ico';
  } catch (e) {
    return '';
  }
};
const formatLastUsed = ts => (ts ? new Date(ts).toLocaleString() : 'Unknown');
const shorten = p => (p && p.length > 16 ? p.substr(0, 8) + '...' + p.substr(-5) : p || '—');
// Human-readable access summary: ICRC scopes (prefix stripped) or the legacy API key.
const accessLabel = app => {
  if (app.scopes && app.scopes.length) return app.scopes.map(s => s.replace(/^icrc\d+_/, '')).join(', ');
  if (app.apikey) return app.apikey.substr(0, 8) + '...';
  return '—';
};

function Applications(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const apps = useSelector(state => state.principals[currentPrincipal].apps);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [tab, setTab] = React.useState(0);

  // Connected Apps = new ICRC signer sessions (permission scopes).
  // Legacy = the older ?authorizeApp / apikey authorizations (to be sunset).
  const connectedApps = apps.filter(a => a && a.scopes && a.scopes.length);
  const legacyApps = apps.filter(a => a && a.apikey);

  const styles = {
    root: {flexGrow: 1, padding: theme.spacing(isMobile ? 1 : 3)},
    empty: {maxWidth: 400, margin: '0 auto'},
    table: {minWidth: isMobile ? 0 : 650},
    appCell: {display: 'flex', alignItems: 'center'},
    avatar: {width: 28, height: 28, marginRight: theme.spacing(1.5)},
  };

  // Revoking removes the whitelist/session entry; the origin must re-request access.
  const revokeApp = host => dispatch({type: 'app/remove', payload: {host: host}});

  const renderTable = (list, accessHeader, emptyText) => {
    if (list.length === 0) {
      return (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            {emptyText}
          </Typography>
        </div>
      );
    }
    return (
      <TableContainer component={Paper}>
        <Table style={styles.table} aria-label="connected apps table">
          <TableHead>
            <TableRow>
              <TableCell style={{fontWeight: 'bold'}}>App</TableCell>
              <TableCell width="200" style={{fontWeight: 'bold'}}>
                Principal
              </TableCell>
              <TableCell style={{fontWeight: 'bold'}}>{accessHeader}</TableCell>
              <TableCell width="180" style={{fontWeight: 'bold'}}>
                Last used
              </TableCell>
              <TableCell width="90" align="right" style={{fontWeight: 'bold'}}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(app => (
              <TableRow key={app.host}>
                <TableCell>
                  <div style={styles.appCell}>
                    <Avatar style={styles.avatar} src={faviconUrl(app.host)}>
                      <PublicIcon fontSize="small" />
                    </Avatar>
                    <a href={app.host} target="_blank" rel="noreferrer">
                      {app.host}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <Tooltip title={app.principal || ''}>
                    <span>{shorten(app.principal)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{accessLabel(app)}</TableCell>
                <TableCell>{formatLastUsed(app.lastUsed)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Revoke session">
                    <IconButton aria-label="Revoke session" onClick={() => revokeApp(app.host)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <div style={styles.root}>
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        indicatorColor="primary"
        textColor="primary"
        style={{marginBottom: theme.spacing(2)}}
      >
        <Tab label={`Connected Apps (${connectedApps.length})`} />
        <Tab label={`Legacy (${legacyApps.length})`} />
      </Tabs>
      {tab === 0
        ? renderTable(connectedApps, 'Permissions', 'No connected apps yet')
        : renderTable(legacyApps, 'API Key', 'No legacy app authorizations')}
    </div>
  );
}

export default Applications;
