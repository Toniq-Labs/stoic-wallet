import React from 'react';
import Typography from '@material-ui/core/Typography';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from '@material-ui/core/styles';

function Applications(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const apps = useSelector(state => state.principals[currentPrincipal].apps);
  const dispatch = useDispatch()
  const theme = useTheme();
  const styles = {
    root : {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty : {
      maxWidth:400,
      margin : "0 auto",
    },
    table: {
      minWidth: 650,
    },
  };
  const deleteApp = (host) => {
    dispatch({ type: 'app/remove', payload: {host:host}});
  };
  
  return (
    <div style={styles.root}>
    {apps.length === 0 ?
      <div style={styles.empty}>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          You have no authorized applications yet
        </Typography>
      </div> :
      <TableContainer component={Paper}>
        <Table style={styles.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell width="220" style={{fontWeight:'bold'}}>Host</TableCell>
              <TableCell style={{fontWeight:'bold'}}>API Key</TableCell>
              <TableCell width="150" align="right" style={{fontWeight:'bold'}}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((app, i) => {
              return (<TableRow key={app.apikey}>
                <TableCell>
                  <a href={app.host} target="_blank" rel="noreferrer">{app.host}</a>
                </TableCell>
                <TableCell>{app.apikey.substr(48, 80)}...</TableCell>
                <TableCell align="right">
                  <Tooltip title="Remove from Stoic">
                    <IconButton onClick={() => deleteApp(app.host)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>)
            })}
          </TableBody>
        </Table>
      </TableContainer>}
    </div>
  );
}

export default Applications;