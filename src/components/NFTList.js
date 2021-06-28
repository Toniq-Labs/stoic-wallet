import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import extjs from '../ic/extjs.js';

var intervalId = 0;
const api = extjs.connect("https://boundary.ic0.app/");
export default function NFTList(props) {
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

  React.useEffect(() => {

  }, []);
  React.useEffect(() => {

  }, [props.address]);

  return (
    <>
      {transactions.length === 0 ?
      <div style={styles.empty}>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          You have no NFT's right now
        </Typography>
      </div> :
      <TableContainer component={Paper}>
        <Table style={styles.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Canister</TableCell>
              <TableCell>Metadata</TableCell>
              <TableCell>Bearer</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/*transactions.map((tx, i) => (
              <TableRow key={props.data.id + props.address + tx.hash + i}>
                <TableCell component="th" scope="row">
                  <Timestamp relative autoUpdate date={tx.timestamp} />
                </TableCell>
                <TableCell>
                  {tx.from == props.address ?
                    <>Sent <strong>{tx.amount} {props.data.symbol}</strong> to {tx.to} with a <strong>{tx.fee} {props.data.symbol}</strong> Fee<br />(<a href={"https://ic.rocks/transaction/"+tx.hash} target="_blank">View Transaction</a>)</> :
                    <>Received <strong>{tx.amount} {props.data.symbol}</strong> from {tx.from}<br />(<a href={"https://ic.rocks/transaction/"+tx.hash} target="_blank">View Transaction</a>)</> }
                </TableCell>
                <TableCell align="right">
                  {tx.from == props.address ? 
                    <span style={{color:'red',fontWeight:'bold'}}>-{tx.amount + tx.fee}</span> : 
                    <span style={{color:'#00b894',fontWeight:'bold'}}>+{tx.amount}</span>
                  }
                </TableCell>
              </TableRow>
            ))*/}
          </TableBody>
        </Table>
      </TableContainer>}
    </>
  );
}
