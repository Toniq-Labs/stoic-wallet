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
import DeleteIcon from '@material-ui/icons/Delete';
import PublicIcon from '@material-ui/icons/Public';
import {useSelector, useDispatch} from 'react-redux';
import {useTheme} from '@material-ui/core/styles';

// Best-effort favicon for a dApp origin; the Avatar falls back to an icon if it fails to load.
const faviconUrl = host => {
  try {
    return new URL(host).origin + '/favicon.ico';
  } catch (e) {
    return '';
  }
};
const formatLastUsed = ts => {
  if (!ts) return 'Unknown';
  return new Date(ts).toLocaleString();
};
const shorten = p => (p && p.length > 16 ? p.substr(0, 8) + '...' + p.substr(-5) : p || '—');

function Applications(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const apps = useSelector(state => state.principals[currentPrincipal].apps);
  const dispatch = useDispatch();
  const theme = useTheme();
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty: {
      maxWidth: 400,
      margin: '0 auto',
    },
    table: {
      minWidth: 650,
    },
    appCell: {
      display: 'flex',
      alignItems: 'center',
    },
    avatar: {
      width: 28,
      height: 28,
      marginRight: theme.spacing(1.5),
    },
  };
  // Revoking a session removes its whitelist entry, which prevents future silent
  // approvals from that origin (AccountDetail re-prompts when no entry is found).
  const revokeApp = host => {
    dispatch({type: 'app/remove', payload: {host: host}});
  };

  return (
    <div style={styles.root}>
      <Typography variant="h6" style={{marginBottom: theme.spacing(2)}}>
        Connected Apps
      </Typography>
      {apps.length === 0 ? (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            You have no connected apps yet
          </Typography>
        </div>
      ) : (
        <TableContainer component={Paper}>
          <Table style={styles.table} aria-label="connected apps table">
            <TableHead>
              <TableRow>
                <TableCell style={{fontWeight: 'bold'}}>App</TableCell>
                <TableCell width="200" style={{fontWeight: 'bold'}}>
                  Principal
                </TableCell>
                <TableCell width="180" style={{fontWeight: 'bold'}}>
                  Last used
                </TableCell>
                <TableCell width="120" align="right" style={{fontWeight: 'bold'}}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.map(app => {
                return (
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
                    <TableCell>{formatLastUsed(app.lastUsed)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Revoke session">
                        <IconButton aria-label="Revoke session" onClick={() => revokeApp(app.host)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default Applications;
