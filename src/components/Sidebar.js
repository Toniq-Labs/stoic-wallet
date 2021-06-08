import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import makeBlockie from 'ethereum-blockies-base64';

class Blockie extends React.Component {
  render() {
    return <img src={makeBlockie(this.props.address)}/>
  }
}
const connectionTypes = {
  "ii" : "Internet Identity",
  "ledgerhq" : "LedgerHQ",
  "trezor" : "Trezor",
  "private" : "PrivateKey",
  "metamask" : "Metamask",
};
export default (props) => {
  const [accounts, _accounts] = useState(props.accounts);
  const [connectionType, _connectionType] = useState(props.connectionType);
  useEffect(() => {
     _accounts(props.accounts);
     _connectionType(props.connectionType);
   }, [props.accounts, props.connectionType]);
  return (
    <div id="layoutSidenav_nav">
        <nav className="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
            <div className="sb-sidenav-menu account-sidebar">
                <div className="nav">
                    <div className="sb-sidenav-menu-heading">Accounts</div>
                    {accounts.map((a, i) => {  
                      return (<a key={i} onClick={() => props.changeAccount(i)} className={(props.currentAccount == i ? "nav-link selected" : "nav-link")}>
                        <Blockie address={a.address} />
                        {a.name}
                    </a>) 
                  })}
                  <a key={100} className="nav-link" onClick={props.addAccount}><FontAwesomeIcon icon={faPlus} />&nbsp;&nbsp;Add Account</a>
                </div>
            </div>
            <div className="sb-sidenav-footer">
                <div className="small">Connected using:</div>
                {connectionTypes[connectionType]}
            </div>
        </nav>
    </div>
  );
}
