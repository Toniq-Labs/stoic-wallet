import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Timestamp from 'react-timestamp';
import extjs from '../ic/extjs.js';

var intervalId = 0;
const api = extjs.connect("https://boundary.ic0.app/");
export default function Transactions(props) {
  const [transactions, setTransactions] = React.useState(false);
  const styles = {
    empty : {
      maxWidth:400,
      margin : "0 auto",
    },
    table: {
      minWidth: 650,
    },
  };
  const updateTransactions = (_id, _address) => {
    return api.token(_id).getTransactions(_address).then(txs => {
      return [txs, _id, _address];
    });
  }
  const stopPoll = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = 0;
  }
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    
    stopPoll();
    setTimeout( () => {
      setTransactions(false);
      startPoll();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.address, props.data.id]);

  return (
    <>
      {transactions === false ?
      <div style={styles.empty}>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          Loading transactions...
        </Typography>
      </div> : (transactions.length === 0 ?
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
            No transactions available
          </Typography>
        </div> :
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
              {transactions.map((tx, i) => (
                <TableRow key={props.data.id + props.address + tx.hash + i}>
                  <TableCell component="th" scope="row">
                    <Timestamp relative autoUpdate date={tx.timestamp} />
                  </TableCell>
                  <TableCell>
                    {tx.from === props.address ?
                      <>Sent <strong>{tx.amount} {props.data.symbol}</strong> to {tx.to} with a <strong>{tx.fee} {props.data.symbol}</strong> Fee<br />(<a href={"https://ic.rocks/transaction/"+tx.hash} target="_blank" rel="noreferrer">View Transaction</a>)</> :
                      <>Received <strong>{tx.amount} {props.data.symbol}</strong> from {tx.from}<br />(<a href={"https://ic.rocks/transaction/"+tx.hash} target="_blank" rel="noreferrer">View Transaction</a>)</> }
                  </TableCell>
                  <TableCell align="right">
                    {tx.from === props.address ? 
                      <span style={{color:'red',fontWeight:'bold'}}>-{tx.amount + tx.fee}</span> : 
                      <span style={{color:'#00b894',fontWeight:'bold'}}>+{tx.amount}</span>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>) }
    </>
  );
}
