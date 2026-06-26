import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Pagination from '@material-ui/lab/Pagination';
import ReceiptIcon from '@material-ui/icons/Receipt';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';
import Timestamp from 'react-timestamp';
import CallMadeIcon from '@material-ui/icons/CallMade';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import GetAppIcon from '@material-ui/icons/GetApp';
const formatNumber = n => {
  return n.toFixed(8).replace(/0{1,6}$/, '');
};
const perPage = 20;
export default function Transactions(props) {
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState('');
  const styles = {
    empty: {
      maxWidth: 400,
      margin: '0 auto',
    },
    table: {
      minWidth: 650,
    },
  };
  const q = query.trim().toLowerCase();
  const list = Array.isArray(props.transactions)
    ? q
      ? props.transactions.filter(
          tx =>
            (tx.from || '').toLowerCase().includes(q) ||
            (tx.to || '').toLowerCase().includes(q) ||
            (tx.hash || '').toLowerCase().includes(q) ||
            String(tx.amount).includes(q) ||
            (tx.from === props.address ? 'sent' : 'received').includes(q),
        )
      : props.transactions
    : [];
  const exportCsv = () => {
    const head = ['Date', 'Direction', 'From', 'To', 'Amount', 'Fee', 'Hash'];
    const rows = (Array.isArray(props.transactions) ? props.transactions : []).map(tx => {
      const ms = tx.timestamp < 1e12 ? tx.timestamp * 1000 : tx.timestamp;
      return [
        new Date(ms).toISOString(),
        tx.from === props.address ? 'Sent' : 'Received',
        tx.from,
        tx.to,
        tx.amount,
        tx.fee,
        tx.hash,
      ];
    });
    const csv = [head, ...rows]
      .map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = (props.data.symbol || 'token') + '-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      {props.transactions === false ? (
        <div style={{padding: '20px 0'}}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="text" height={40} />
          ))}
        </div>
      ) : props.transactions.length === 0 ? (
        <div style={styles.empty}>
          <ReceiptIcon
            style={{fontSize: 48, color: '#ccc', display: 'block', margin: '20px auto 0'}}
          />
          <Typography paragraph style={{paddingTop: 10, fontWeight: 'bold'}} align="center">
            No transactions available
          </Typography>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
              margin: '13px 0',
            }}
          >
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search address, amount, sent/received…"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setPage(1);
              }}
              style={{flex: 1, minWidth: 180, maxWidth: 300}}
            />
            <Button size="small" variant="outlined" startIcon={<GetAppIcon />} onClick={exportCsv}>
              Export CSV
            </Button>
            <span style={{marginLeft: 'auto', fontSize: 'small', whiteSpace: 'nowrap'}}>
              Data powered by{' '}
              <a href="https://nftgeek.app/" target="_blank" rel="noreferrer">
                nftGeek
              </a>
            </span>
            {list.length > perPage ? (
              <Pagination
                size="small"
                count={Math.ceil(list.length / perPage)}
                page={page}
                onChange={(e, v) => setPage(v)}
              />
            ) : (
              ''
            )}
          </div>
          {list.length === 0 ? (
            <div style={styles.empty}>
              <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
                No transactions match your search.
              </Typography>
            </div>
          ) : (
            <TableContainer component={Paper}>
              <Table style={styles.table} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list
                    .filter((tx, i) => i >= (page - 1) * perPage && i < page * perPage)
                    .map((tx, i) => (
                      <TableRow key={props.data.id + props.address + tx.hash + i}>
                        <TableCell component="th" scope="row">
                          <Timestamp relative autoUpdate date={tx.timestamp} />
                        </TableCell>
                        <TableCell>
                          {tx.from === props.address ? (
                            <>
                              <CallMadeIcon
                                style={{
                                  fontSize: 14,
                                  verticalAlign: 'middle',
                                  color: 'red',
                                  marginRight: 4,
                                }}
                              />
                              Sent{' '}
                              <strong>
                                {tx.amount} {props.data.symbol}
                              </strong>{' '}
                              to {tx.to} with a{' '}
                              <strong>
                                {tx.fee} {props.data.symbol}
                              </strong>{' '}
                              Fee
                              <br />(
                              <a
                                href={
                                  'https://dashboard.internetcomputer.org/transaction/' + tx.hash
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Transaction
                              </a>
                              )
                            </>
                          ) : (
                            <>
                              <CallReceivedIcon
                                style={{
                                  fontSize: 14,
                                  verticalAlign: 'middle',
                                  color: '#00b894',
                                  marginRight: 4,
                                }}
                              />
                              Received{' '}
                              <strong>
                                {tx.amount} {props.data.symbol}
                              </strong>{' '}
                              from {tx.from}
                              <br />(
                              <a
                                href={
                                  'https://dashboard.internetcomputer.org/transaction/' + tx.hash
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Transaction
                              </a>
                              )
                            </>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {tx.from === props.address ? (
                            <span style={{color: 'red', fontWeight: 'bold'}}>
                              -{formatNumber(tx.amount + tx.fee)}
                            </span>
                          ) : (
                            <span style={{color: '#00b894', fontWeight: 'bold'}}>
                              +{formatNumber(tx.amount)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </>
  );
}
