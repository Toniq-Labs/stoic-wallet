import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Pagination from '@material-ui/lab/Pagination';
import Typography from '@material-ui/core/Typography';
import Timestamp from 'react-timestamp';
import extjs from '../ic/extjs.js';
const formatNumber = n => {
  return n.toFixed(8).replace(/0{1,6}$/, '');
};
var intervalId = 0;
const api = extjs.connect('https://icp0.io/');
const perPage = 10;
export default function Transactions(props) {
  const [transactions, setTransactions] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const styles = {
    empty: {
      maxWidth: 400,
      margin: '0 auto',
    },
    table: {
      minWidth: 650,
    },
  };
  const updateTransactions = (_id, _address) => {
    return fetch('https://api.nftgeek.app/api/1/toniq/accountIdentifier/'+_address+'/tokenTransactions').then(response => response.json()).then(data => {
      var txs = []
      if (data.hasOwnProperty('transactions') && data.transactions.hasOwnProperty(_id)){
        txs = data.transactions[_id].map(a => ({
          amount : a.amount,
          fee : 0,
          from : a.uniqueIdentifierFrom.id,
          hash : a.id,
          memo : 0,
          timestamp : new Date(a.timeMillis),
          to : a.uniqueIdentifierTo.id,
        }));
      };
      return [txs, _id, _address];
    });
  };
  const stopPoll = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = 0;
  };
  const startPoll = () => {
    if (intervalId) stopPoll();
    fetchTx();
    intervalId = setInterval(fetchTx, 10000);
  };

  const fetchTx = () => {
    //console.log("Fetching for " + props.data.id);
    updateTransactions(props.data.id, props.address).then(txs => {
      //console.log("Fetched for " + txs[1]);
      //console.log("Current " + props.data.id);
      if (txs[1] !== props.data.id || txs[2] !== props.address) return;
      setTransactions(txs[0]);
    });
  };
  React.useEffect(() => {
    startPoll();
    return () => {
      stopPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    stopPoll();
    setTimeout(() => {
      setTransactions(false);
      startPoll();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.address, props.data.id]);

  return (
    <>
      {transactions === false ? (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            Loading transactions...
          </Typography>
        </div>
      ) : transactions.length === 0 ? (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            No transactions available
          </Typography>
        </div>
      ) : (
        <>
          <div style={{float:"right", marginTop: '13px', marginBottom: '20px'}}>
            <span style={{display:"inline-block", paddingTop: '3px'}}>Data powered by <a href="https://nftgeek.app/" target="_blank">NFT Geek</a></span>
            {transactions.length > perPage ? (
              <Pagination
                style={{float: 'right', marginLeft:"10px"}}
                size="small"
                count={Math.ceil(transactions.length / perPage)}
                page={page}
                onChange={(e, v) => setPage(v)}
              />
            ) : (
              ''
            )}
          </div>
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
                {transactions
                  .filter((tx, i) => i >= (page - 1) * perPage && i < page * perPage)
                  .map((tx, i) => (
                    <TableRow key={props.data.id + props.address + tx.hash + i}>
                      <TableCell component="th" scope="row">
                        <Timestamp relative autoUpdate date={tx.timestamp} />
                      </TableCell>
                      <TableCell>
                        {tx.from === props.address ? (
                          <>
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
                              href={'https://icscan.io/transaction/' + tx.hash}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Transaction
                            </a>
                            )
                          </>
                        ) : (
                          <>
                            Received{' '}
                            <strong>
                              {tx.amount} {props.data.symbol}
                            </strong>{' '}
                            from {tx.from}
                            <br />(
                            <a
                              href={'https://icscan.io/transaction/' + tx.hash}
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
        </>
      )}
    </>
  );
}
