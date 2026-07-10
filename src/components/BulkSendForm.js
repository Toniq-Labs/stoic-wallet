/* global BigInt */
import React from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {useTheme} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import PublishIcon from '@material-ui/icons/Publish';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal, validateAddress} from '../ic/utils.js';
import {compressAddress} from '../utils.js';
import {useSelector} from 'react-redux';

const emptyRow = () => ({to: '', amount: '', memo: ''});

// Parse CSV text into rows of {to, amount, memo}. A header line (where the
// first column is not a valid address/principal) is skipped automatically.
const parseCSV = text => {
  const rows = [];
  text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .forEach((line, i) => {
      const cols = line.split(',').map(c => c.trim());
      if (i === 0 && !validateAddress(cols[0]) && !validatePrincipal(cols[0])) return; //header
      rows.push({to: cols[0] || '', amount: cols[1] || '', memo: cols[2] || ''});
    });
  return rows.length ? rows : [emptyRow()];
};

export default function BulkSendForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount);
  const identity = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity : {},
  );
  const _theme = useTheme();
  const fullScreen = useMediaQuery(_theme.breakpoints.down('sm'));
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState([emptyRow()]);
  // status per row: {status: 'pending'|'success'|'failed', block, error}
  const [status, setStatus] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const fileRef = React.useRef(null);

  const error = e => props.error(e);

  const setRow = (i, field, value) => {
    setRows(rs => rs.map((r, idx) => (idx === i ? {...r, [field]: value} : r)));
  };
  const addRow = () => setRows(rs => [...rs, emptyRow()]);
  const removeRow = i => setRows(rs => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const onFile = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(String(ev.target.result || '')));
    reader.readAsText(file);
    e.target.value = ''; //allow re-uploading the same file
  };

  const validate = list => {
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (!validateAddress(r.to) && !validatePrincipal(r.to))
        return 'Row ' + (i + 1) + ': invalid recipient address';
      if (isNaN(r.amount) || Number(r.amount) <= 0)
        return 'Row ' + (i + 1) + ': amount must be greater than 0';
      if (r.memo !== '' && isNaN(r.memo))
        return 'Row ' + (i + 1) + ': memo must be a number (or left blank)';
    }
    return null;
  };

  // Sequentially queue each transfer. Awaiting between rows yields to the event
  // loop so the UI keeps responding, and a failed row never aborts the rest.
  const send = async () => {
    const list = rows.filter(r => r.to || r.amount || r.memo);
    if (!list.length) return error('Please add at least one recipient');
    const v = validate(list);
    if (v) return error(v);
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error('Something wrong with your wallet, try logging in again');

    setRows(list);
    const next = list.map(() => ({status: 'pending'}));
    setStatus([...next]);
    setRunning(true);
    setDone(false);

    const token = extjs.connect('https://icp0.io/', id).token(props.data.id, props.data.standard);
    const fee = BigInt(props.data.fee);

    for (let i = 0; i < list.length; i++) {
      try {
        const amount = BigInt(Math.round(Number(list[i].amount) * 10 ** props.data.decimals));
        const bh = await token.transfer(
          identity.principal,
          currentAccount,
          list[i].to.trim(),
          amount,
          fee,
          list[i].memo === '' ? '' : list[i].memo,
          false,
        );
        next[i] = {status: 'success', block: bh ? bh.toString() : ''};
      } catch (e) {
        next[i] = {status: 'failed', error: String((e && e.message) || e)};
      }
      setStatus([...next]);
    }
    setRunning(false);
    setDone(true);
    if (props.refresh) props.refresh(true);
  };

  const handleClick = () => setOpen(true);
  const handleClose = () => {
    if (running) return;
    setOpen(false);
    setRows([emptyRow()]);
    setStatus([]);
    setDone(false);
  };

  const succeeded = status.filter(s => s.status === 'success').length;
  const failed = status.filter(s => s.status === 'failed').length;
  const showStatus = running || done;
  const renderStatus = s => {
    if (!s) return null;
    if (s.status === 'success')
      return <Chip size="small" color="primary" label={'block ' + s.block} />;
    if (s.status === 'failed')
      return (
        <Tooltip title={s.error || 'Failed'}>
          <Chip size="small" style={{backgroundColor: '#d32f2f', color: '#fff'}} label="failed" />
        </Tooltip>
      );
    return <Chip size="small" variant="outlined" label="pending" />;
  };

  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog open={open} onClose={handleClose} maxWidth={'md'} fullWidth fullScreen={fullScreen}>
        <DialogTitle style={{textAlign: 'center'}}>Bulk Send {props.data.symbol}</DialogTitle>
        <DialogContent>
          <DialogContentText style={{textAlign: 'center'}}>
            Add recipients manually or upload a CSV (address, amount, memo). Transfers are queued
            sequentially &mdash; a failed transfer will not stop the others.
          </DialogContentText>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Recipient</TableCell>
                <TableCell style={{width: 140}}>Amount</TableCell>
                <TableCell style={{width: 120}}>Memo</TableCell>
                <TableCell style={{width: 110}}>{showStatus ? 'Status' : ''}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {showStatus ? (
                      compressAddress(r.to)
                    ) : (
                      <TextField
                        fullWidth
                        margin="dense"
                        placeholder="Address or principal"
                        value={r.to}
                        onChange={e => setRow(i, 'to', e.target.value)}
                        inputProps={{spellCheck: false, autoCapitalize: 'none', autoCorrect: 'off'}}
                        error={!!r.to && !validateAddress(r.to) && !validatePrincipal(r.to)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {showStatus ? (
                      r.amount
                    ) : (
                      <TextField
                        fullWidth
                        margin="dense"
                        placeholder="0.0"
                        value={r.amount}
                        onChange={e => setRow(i, 'amount', e.target.value)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {showStatus ? (
                      r.memo
                    ) : (
                      <TextField
                        fullWidth
                        margin="dense"
                        placeholder="(optional)"
                        value={r.memo}
                        onChange={e => setRow(i, 'memo', e.target.value)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {showStatus ? (
                      renderStatus(status[i])
                    ) : (
                      <IconButton size="small" onClick={() => removeRow(i)} aria-label="remove row">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!showStatus ? (
            <div style={{marginTop: 8}}>
              <Button size="small" color="primary" startIcon={<AddIcon />} onClick={addRow}>
                Add Row
              </Button>
              <Button
                size="small"
                color="primary"
                startIcon={<PublishIcon />}
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                Upload CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                style={{display: 'none'}}
                onChange={onFile}
              />
            </div>
          ) : null}
          {done ? (
            <DialogContentText style={{textAlign: 'center', marginTop: 16, fontWeight: 'bold'}}>
              Batch complete: {succeeded} succeeded, {failed} failed (of {status.length}).
            </DialogContentText>
          ) : null}
          {running ? (
            <DialogContentText style={{textAlign: 'center', marginTop: 16}}>
              Sending {succeeded + failed + 1} of {status.length}&hellip;
            </DialogContentText>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" disabled={running}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!showStatus ? (
            <Button onClick={send} color="primary">
              Send Batch
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
}
