/* global BigInt */
import React from 'react';
import { useSelector } from "react-redux";
import { getTokenActor } from '@psychedelic/dab-js'
import { HttpAgent } from '@dfinity/agent';
import {StoicIdentity} from '../ic/identity.js';
import { Principal } from '@dfinity/principal';
import { getCanisterInfo } from '@psychedelic/dab-js';
import {dab_tokens_json} from '../ic/dab_tokens';
import extjs from '../ic/extjs.js';
import { Actor } from '@dfinity/agent';
import dip20_idl from '../ic/candid/dip20.did';
import ext_fungible from '../ic/candid/ext_fungible.did';

export const useDip20 = (reload) => {
    const addresses = useSelector(state => state.addresses);
    const principals = useSelector(state => state.principals);
    const currentPrincipal = useSelector(state => state.currentPrincipal);
    const currentAccount = useSelector(state => state.currentAccount)
    const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));

    const [dabTokens, setDabTokens] = React.useState([])
    const [tokenAmounts, setTokenAmounts] = React.useState([])
    const [tokenMetadata, setTokenMetadata] = React.useState([])
    const [tokenFees, setTokenfees] = React.useState([])
    
    React.useEffect(() =>  {

            let tokens = dab_tokens_json

            
            async function fetchData()
            {

                const agent = new HttpAgent({ host: "https://ic0.app" });
                const canId = 'lzvjb-wyaaa-aaaam-qarua-cai';
                const canMeta = await getCanisterInfo({ canisterId: canId, agent });
                console.log(canMeta);
    
                // tokens.push({name:"Boxy", id:'lzvjb-wyaaa-aaaam-qarua-cai', standard:"DIP20"})
                // console.log(tokens);
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

                    let tokenFees = await Promise.all(
                        tokens.map(async (token,index) =>  {
                            return new Promise(async (resolve, reject) => {
                                resolve( getTokenFees(token, identity, index, tokenMetadata));
                        })
                        }));
                    
                        console.log(tokenFees);
                        setTokenfees(tokenFees);
            }

            fetchData()
    }, [currentPrincipal, reload])

 


    return {dabTokens, tokenAmounts, tokenMetadata, tokenFees};


 
}

export const sendDipToken = async (token, identity, to, from, amount) => {
    let tokenActor = await getParticularTokenActor(token, identity);

    return tokenActor.send({to, from, amount});

} 

export const getTokenMetadata = async (token, identity) => {
    let tokenActor = await getParticularTokenActor(token, identity);
    
    try {
        let metadata = await tokenActor.getMetadata()
        return metadata;
    } catch (err) {
        console.error(err);
    }
}


export const getTokenBalance = async (token, identity) => {

    let tokenActor = await getParticularTokenActor(token, identity);

    try {
        let balance = await tokenActor.getBalance(Principal.fromText(identity.principal))
        return balance;
    } catch (err) {
        console.error(err);
    }
}

export const getTokenFees = async (token, identity, index, tokenMetadata) => {
    
    if (tokenMetadata[index].fungible.fee)
    {
        let fee =  BigInt(Math.round(tokenMetadata[index].fungible.fee*(10**Number(tokenMetadata[index].fungible.decimals))));
        return fee;
    } 
    const canisterId = (token.id);
    const id = StoicIdentity.getIdentity(identity.principal);
    const agent = await Promise.resolve(
        new HttpAgent({ identity: id, host: "https://ic0.app" }),
      );
    const standard = token.standard;

    let api = null

    if (standard==="DIP20")
    {
       
        if (token.name == "WICP") return 0;
        if (token.name == "Cycles") return 0;
        if (token.name == "BOX") return 0;

        api = Actor.createActor(dip20_idl, 
        {
            agent,
            canisterId
        });
        let x = await api.getTokenFee()
        return BigInt(x);
    }
    else if (standard == "EXT")
    {
        api = Actor.createActor(ext_fungible, 
            {
                agent,
                canisterId
            });
            let x = await api.getFee();

            return BigInt(x.ok);
    }

    return BigInt(0);
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