
import React from 'react';
import { useSelector } from 'react-redux'
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send'
import Timestamp from 'react-timestamp';
import {useDip20} from '../hooks/useDip20'

export default function FungibleTokenList(props)
{
    const {dabTokens, tokenAmounts} = useDip20();

    console.log(dabTokens)
    console.log(tokenAmounts)

    const styles = {
        empty : {
          maxWidth:300,
          margin : "0 auto",
        },
        table: {
          minWidth: 250,
        },
        button: {
            height: "100%",
            backgroundColor: '#003240',
            color: 'white'
          },
      };

    return (
        <>

        <TableContainer component={Paper}>
            <Table style={styles.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  {/* <TableCell align="right"></TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {
                    dabTokens && dabTokens.map((token, index) => 
                    {
                        console.log(index)
                        console.log(tokenAmounts[index]);
                        return (
                                <TableRow key={index}>
                                <TableCell>
                                    {token.name}
                                </TableCell>
                                <TableCell>
                                    {token.description}
                                </TableCell>
                                <TableCell>
                                    {tokenAmounts && tokenAmounts[index] && tokenAmounts[index].value}
                                </TableCell>
                                {/* <TableCell align="right">
                                    <Button style={styles.button} color="inherit" variant="contained" endIcon={<SendIcon />}>
                                        Send
                                    </Button>
                                </TableCell> */}
                            </TableRow>
                        )
                    }
                    )
                }
              </TableBody>
            </Table>
          </TableContainer>
        </>
    );
}