import React from 'react';
import { useSelector } from "react-redux";
import { getTokenActor } from '@psychedelic/dab-js'
import { HttpAgent } from '@dfinity/agent';
import {StoicIdentity} from '../ic/identity.js';
import { Principal } from '@dfinity/principal';

export const useDip20 = (reload) => {
    const addresses = useSelector(state => state.addresses);
    const principals = useSelector(state => state.principals);
    const currentPrincipal = useSelector(state => state.currentPrincipal);
    const currentAccount = useSelector(state => state.currentAccount)
    const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));

    const [dabTokens, setDabTokens] = React.useState([])
    const [tokenAmounts, setTokenAmounts] = React.useState([])
    const [tokenMetadata, setTokenMetadata] = React.useState([])
    
    React.useEffect(() => {
        console.log("refresh!")
        fetch("https://raw.githubusercontent.com/Psychedelic/dab/main/registries/tokens/list.json").then(r => r.json()).then(async tokens => {
            setDabTokens(tokens);
            let tokenAmounts = await Promise.all(
            
            tokens.map(async token =>  {
                return new Promise(async (resolve, reject) => {
                    resolve( getTokenBalance(token, identity));
            })
            }));

            let tokenMetadata = await Promise.all(
                tokens.map(async token =>  {
                    return new Promise(async (resolve, reject) => {
                        resolve( getTokenMetadata(token, identity));
                })
                }));
            

            setTokenAmounts(tokenAmounts)
            setTokenMetadata(tokenMetadata);

            console.log(tokenAmounts)
        })
    // })
    }, [currentPrincipal, reload])

 


    return {dabTokens, tokenAmounts, tokenMetadata,};


 
}

export const sendDipToken = async (token, identity, to, from, amount) => {
    let tokenActor = await getParticularTokenActor(token, identity);



    return tokenActor.send({to, from, amount});

} 

export const getTokenMetadata = async (token, identity) => {
    let tokenActor = await getParticularTokenActor(token, identity);
    
    try {
        let metadata = await tokenActor.getMetadata()
       
        // console.log(token.name, metadata);
        return metadata;
    } catch (err) {
        console.error(err);
    }
}


export const getTokenBalance = async (token, identity) => {

    let tokenActor = await getParticularTokenActor(token, identity);

    try {
        let balance = await tokenActor.getBalance(Principal.fromText(identity.principal))
       
        // console.log(token.name, balance);
        return balance;
    } catch (err) {
        console.error(err);
    }
}

const getParticularTokenActor = async (token, identity) => {
    const canisterId = (token.id);
    const id = StoicIdentity.getIdentity(identity.principal);
    const agent = await Promise.resolve(
        new HttpAgent({ identity: id, host: "https://ic0.app" }),
      );
    const standard = token.standard;
    let tokenActor = await getTokenActor({canisterId, agent, standard});
    return tokenActor;
}