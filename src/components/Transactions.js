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
const formatNumber = n => {
  return n.toFixed(8).replace(/0{1,6}$/, '');
};
const perPage = 20;
export default function Transactions(props) {
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
  return (
    <>
      {props.transactions === false ? (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            Loading transactions...
          </Typography>
        </div>
      ) : props.transactions.length === 0 ? (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            No transactions available
          </Typography>
        </div>
      ) : (
        <>
          <div style={{float:"right", marginTop: '13px', marginBottom: '20px'}}>
            <span style={{display:"inline-block", paddingTop: '3px'}}>Data powered by <a href="https://nftgeek.app/" target="_blank" rel="noreferrer">nftGeek</a></span>
            {props.transactions.length > perPage ? (
              <Pagination
                style={{float: 'right', marginLeft:"10px"}}
                size="small"
                count={Math.ceil(props.transactions.length / perPage)}
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
                {props.transactions
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
                              href={'https://ic.house/ICP/tx/' + tx.hash}
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
                              href={'https://ic.house/ICP/tx/' + tx.hash}
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
