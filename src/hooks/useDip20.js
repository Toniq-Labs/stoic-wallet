import React from 'react';
import { useSelector } from "react-redux";
import { getTokenActor } from '@psychedelic/dab-js'
import { HttpAgent } from '@dfinity/agent';
import {StoicIdentity} from '../ic/identity.js';
import { Principal } from '@dfinity/principal';

export const useDip20 = () => {
    const addresses = useSelector(state => state.addresses);
    const principals = useSelector(state => state.principals);
    const currentPrincipal = useSelector(state => state.currentPrincipal);
    const currentAccount = useSelector(state => state.currentAccount)
    const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));

    const [dabTokens, setDabTokens] = React.useState([])
    const [tokenAmounts, setTokenAmounts] = React.useState([])
    
    
    React.useEffect(() => {
        fetch("https://raw.githubusercontent.com/Psychedelic/dab/main/registries/tokens/list.json").then(r => r.json()).then(async tokens => {
            setDabTokens(tokens);
           

            let tokenAmounts = await Promise.all(
            
            tokens.map(async token =>  {
                return new Promise(async (resolve, reject) => {
                    
                    
                    resolve( getTokenBalance(token, identity));
            })
            }));

            setTokenAmounts(tokenAmounts)
        })
    }, [currentPrincipal])


    return {dabTokens, tokenAmounts,};


 
}

const getTokenBalance = async (token, identity) => {
    const canisterId = (token.id);
    const id = StoicIdentity.getIdentity(identity.principal);
    const agent = await Promise.resolve(
        new HttpAgent({ identity: id, host: "https://ic0.app" }),
      );
    const standard = token.standard;
    let tokenActor = await getTokenActor({canisterId, agent, standard});
    
    try {
        let balance = await tokenActor.getBalance(Principal.fromText(identity.principal))
       
        return balance;
    } catch (err) {
        console.error(err);
    }
}