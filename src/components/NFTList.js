import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import Paper from '@material-ui/core/Paper';
import SendIcon from '@material-ui/icons/Send';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import SnackbarButton from '../components/SnackbarButton';
import Pagination from '@material-ui/lab/Pagination';
import SendNFTForm from '../components/SendNFTForm';
import extjs from '../ic/extjs.js';
import {toHexString} from '../ic/utils.js';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { compressAddress, clipboardCopy } from '../utils.js';
import { useSelector, useDispatch } from 'react-redux'
const perPage = 10;
const api = extjs.connect("https://boundary.ic0.app/");
const nftMap = {
  "e3izy-jiaaa-aaaah-qacbq-cai" : "Cronics"
};
const loadedBearers = {}
export default function NFTList(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const currentAccount = useSelector(state => state.currentAccount)
  const account = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts[currentAccount] : {}));
  const [nfts, setNfts] = React.useState([]);
  const [bearers, setBearers] = React.useState({});
  const [page, setPage] = React.useState(1);
  const [openNFTForm, setOpenNFTForm] = React.useState(false);
  const [tokenNFT, setTokenNFT] = React.useState('');
  
  const dispatch = useDispatch()
  
  const styles = {
    empty : {
      maxWidth:400,
      margin : "0 auto",
    },
    table: {
      minWidth: 650,
    },
  };
  
  const sendNft = (id) => {
    setTokenNFT(id);
    setOpenNFTForm(true);
  }
  const closeNFTForm = () => {
    setOpenNFTForm(false);
    setTokenNFT('');
  };
  const deleteNft = (id) => {
    props.confirm("Please confirm", "You are about to remove this NFT from your account? This does not affect the ownership of the NFT, and you can add it back again in future").then(v => {
      dispatch({ type: 'account/nft/remove', payload: {id:id}});
    });
  };
  const getBearer = (id) => {
    api.token(id).getBearer().then(b => {
      loadedBearers[id] = b;
      setBearers(loadedBearers);
    });
  };
  const error = (e) => {
    props.error(e);
  }
  React.useEffect(() => {
    var _nfts = [];
    account.nfts.map(nft => {
      _nfts.push({
        id : nft.id,
        canister : extjs.decodeTokenId(nft.id).canister,
        metadata : toHexString(nft.metadata.metadata[0]),
        bearer : false
      })
      getBearer(nft.id);
      return false;
    });
    setNfts(_nfts);
    setPage(1);
  }, [currentAccount, account.nfts]);


  return (
    <>
      {nfts.length === 0 ?
      <div style={styles.empty}>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          You have no NFT's right now
        </Typography>
      </div> :
      <>
        {nfts.length > perPage ?
        <Pagination style={{float:"right",marginTop:"10px",marginBottom:"20px"}} size="small" count={Math.ceil(nfts.length/perPage)} page={page} onChange={(e, v) => setPage(v)} />
        : ""}
        
        <TableContainer component={Paper}>
          <Table style={styles.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell width="220" style={{fontWeight:'bold'}}>ID</TableCell>
                <TableCell width="100" style={{fontWeight:'bold'}}>Preview</TableCell>
                <TableCell width="220" style={{fontWeight:'bold'}}>Canister</TableCell>
                <TableCell style={{fontWeight:'bold'}}>Metadata</TableCell>
                <TableCell width="190" style={{fontWeight:'bold'}}>Bearer</TableCell>
                <TableCell width="150" align="right" style={{fontWeight:'bold'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nfts.filter((nft,i) => (i >= ((page-1)*perPage) && i < ((page)*perPage))).map((nft, i) => {
                return (<TableRow key={nft.id}>
                  <TableCell style={{fontWeight:'bold'}}>
                    {compressAddress(nft.id)}
                    <SnackbarButton
                      message="NFT ID Copied"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      onClick={() => clipboardCopy(nft.id)}
                    >
                      <IconButton size="small" edge="end" aria-label="copy">
                        <FileCopyIcon  style={{ fontSize: 18 }} />
                      </IconButton>
                    </SnackbarButton>
                  </TableCell>
                  <TableCell>
                    <a href={"https://" + nft.canister + ".raw.ic0.app/?tokenid="+nft.id} target="_blank" rel="noreferrer"><img alt={compressAddress(nft.id)} src={"https://" + nft.canister + ".raw.ic0.app/?tokenid="+nft.id} style={{width:64}} /></a>
                  </TableCell>
                  <TableCell>
                    
                    {nftMap[nft.canister] ?? compressAddress(nft.canister)}<Tooltip title="View in browser">
                      <IconButton size="small" href={"https://" + nft.canister + ".raw.ic0.app"} target="_blank" edge="end" aria-label="search">
                        <LaunchIcon style={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {nft.metadata.substr(0, 22)+"..."}
                    <SnackbarButton
                      message="NFT Metadata Copied"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      onClick={() => clipboardCopy(nft.metadata)}
                    >
                      <IconButton size="small" edge="end" aria-label="copy">
                        <FileCopyIcon  style={{ fontSize: 18 }} />
                      </IconButton>
                    </SnackbarButton>
                  </TableCell>
                  <TableCell>{bearers[nft.id] ? (bearers[nft.id] === account.address ? <strong>{"Owned by You"}</strong> : 
                  <>
                    {compressAddress(bearers[nft.id])} 
                    <Tooltip title="View on ic.rocks">
                      <IconButton size="small" href={"https://ic.rocks/account/"+bearers[nft.id]} target="_blank" edge="end" aria-label="search">
                        <LaunchIcon style={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </>) : "Loading..."}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove from Stoic">
                      <IconButton onClick={() => deleteNft(nft.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send">
                      <IconButton onClick={() => sendNft(nft.id)}>
                        <SendIcon  />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>)
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
      <SendNFTForm open={openNFTForm} close={closeNFTForm} loader={props.loader} error={error} nft={tokenNFT} />
    </>
  );
}
