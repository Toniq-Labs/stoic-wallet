
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
import {useDip20, getTokenMetadata} from '../hooks/useDip20'
import SendFormDAB from '../components/SendFormDAB';



export default function FungibleTokenList(props)
{
    const {dabTokens, tokenAmounts, tokenMetadata} = useDip20(props.childRefresh);


    let fees = tokenMetadata.map(metadata => {
      if (metadata!=null) {
        // console.log(metadata)
        if (metadata.fungible.fee==null) return 0
        return metadata.fungible.fee;
      }
      return metadata;
    })
    
    let decimals = tokenMetadata.map(metadata => {
      if (metadata!=null) {
        if (metadata.fungible.decimals==null) return 0
        return metadata.fungible.decimals;
      }
      return metadata;
    })

    // const tokenMetadata1 = async () => {
      
    //     const metadata = await getTokenMetadata(dabTokens);
    //     console.log(metadata);
      
    // }

    // tokenMetadata();

    const error = (e) => {
      props.alert("There was an error", e);
    };


    const styles = {
        empty : {
          maxWidth:300,
          margin : "0 auto",
        },
        table: {
          minWidth: 450,
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
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                    dabTokens && dabTokens.map((token, index) => 
                    {
                     
                      let valueShown = 0;
                      let fee = 0;
                      let symbol = "";
                      if (tokenAmounts[index])
                      {
                        if (tokenAmounts[index].value>0){
                          valueShown = (tokenAmounts[index].value / Math.pow(10, tokenAmounts[index].decimals)).toFixed(6);
                        }
                      }
                      if (tokenMetadata[index])
                      {
                        symbol = tokenMetadata[index].fungible.symbol
                        fee = tokenMetadata[index].fungible.fee;
                        if (fee==undefined) fee = 0;
                        decimals = tokenMetadata[index].fungible.decimals
                      }

                      
                        return (
                                <TableRow key={index}>
                                <TableCell>
                                    {token.name}
                                </TableCell>
                                <TableCell>
                                    {token.description}
                                </TableCell>
                                <TableCell>
                                    {valueShown + " " + symbol}
                                </TableCell>
                                {token && tokenAmounts && tokenAmounts[index] && valueShown > 0  ?
                                <TableCell>
                                <SendFormDAB setChildRefresh={props.setChildRefresh} childRefresh={props.childRefresh} alert={props.alert} error={error} loader={props.loader} token={token} value={ valueShown } minFee={fee} balance={valueShown} decimals={decimals}>
                                    <Button style={styles.button} color="inherit" variant="contained" endIcon={<SendIcon />}>
                                        Send
                                    </Button>
                                 </SendFormDAB>
                                </TableCell> : ""
                                 }

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