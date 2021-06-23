/* global BigInt */
import { Actor, HttpAgent, Principal, AnonymousIdentity } from "@dfinity/agent";  
import { principalToAccountIdentifier, toHexString, to32bits, getSubAccountArray, fromHexString } from "./utils.js";
import extjs from "./extjs.js";
import { sha256 as jsSha256 } from 'js-sha256';
import { blobFromUint8Array } from '@dfinity/agent/lib/esm/types';
import {StoicIdentity} from "./identity.js";

const GOVERNANCE_CANISTER = "rrkah-fqaaa-aaaaa-aaaaq-cai";
const LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const topics = [
  ["All topics", 0],
  ["Neuron Management", 1],
  ["Exchange Rate", 2],
  ["Network Economics", 3],
  ["Governance", 4],
  ["Node Admin", 5],
  ["Participant Management", 6],
  ["Subnet Management", 7],
  ["Network Canister Management", 8],
  ["KYC", 9],
  ["Node Proivuder Rewards", 10],
];
const sha256 = (data) => {
    const shaObj = jsSha256.create();
    shaObj.update(data);
    return blobFromUint8Array(new Uint8Array(shaObj.array()));
}
const getStakingAddress = (principal, nonce) => {
  if (typeof nonce == 'string') nonce = Buffer(nonce);
  if (nonce.length > 8) return false;
  const array = new Uint8Array([
      [0x0c],
      ...Buffer("neuron-stake"),
      ...Principal.fromText(principal).toBlob(),
      ...nonce
  ]);
  const hash = sha256(array);
  return principalToAccountIdentifier(GOVERNANCE_CANISTER, Array.from(hash));
}

class ICNeuron {
  //TODO add voting, proposals, disburse to neuron?
  //TODO deal with errors
  _api = false;
  _neuronid = 0;
  data = {};
  constructor(neuronid, neurondata, identity) {
    if (!neuronid) throw "NeuronID is required";
    if (!identity) throw "Identity is required";
    this._neuronid = neuronid;
    this.data = neurondata;
    this._api = extjs.connect("https://boundary.ic0.app/", identity).canister('rrkah-fqaaa-aaaaa-aaaaq-cai');
  };
  isAlive() {
    return (this.data.voting_power > 0n);
  };
  async update() {
    var ni = await this._api.get_neuron_info(this._neuronid);
    if (ni.hasOwnProperty("Err")) {
      throw "Error: " + JSON.stringify(ni.Error);
    };
    this.data = ni.Ok;
    return this.data;
  };
  async spawn() { //TODO TEST
    var commandArgs = {
      new_controller  : []
    };
    var cmdId = "Spawn";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async split(amount) { //TODO TEST
    var commandArgs = {
      amount_e8s   : BigInt(amount) * BigInt(10**8)
    };
    var cmdId = "Split";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async follow(topic, neuron) {
    var commandArgs = {
      topic : BigInt(topic),
      "followees" : [{id : BigInt(neuron)}]
    };
    var cmdId = "Follow";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async startDissolving() {
    var commandArgs = {
      operation  : [{"StartDissolving" : {}}]
    };
    var cmdId = "Configure";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async stopDissolving() {
    var commandArgs = {
      operation  : [{"StopDissolving" : {}}]
    };
    var cmdId = "Configure";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async increaseDissolveDelay(seconds) {
    var commandArgs = {
      operation  : [{"IncreaseDissolveDelay" : {
        "additional_dissolve_delay_seconds" : BigInt(seconds)
      }}]
    };
    var cmdId = "Configure";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    console.log(res);
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async setDissolveTime(seconds) {//not really needed
    var commandArgs = {
      operation  : [{"SetDissolveTimestamp" : {
        dissolve_timestamp_seconds  : BigInt(seconds)
      }}]
    };
    var cmdId = "Configure";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
  async disburse() {
    var commandArgs = {
      to_account   : [],
      amount   : []
    };
    var cmdId = "Disburse";
    var cmdBody = {};
    cmdBody[cmdId] = commandArgs;
    var res = await this._api.manage_neuron({
      id : [{id : this._neuronid}],
      command : [cmdBody]
    });
    if (res.command[0].hasOwnProperty('Error')) throw "Error:" + JSON.stringify(res.command[0].Error.error_message);
    else return res.command[0][cmdId];
  };
};
const NeuronManager = {
  nextId : 0,
  setIndex : (index) => {
    NeuronManager.nextId = index;
  },
  scan : async (id) => {
    var lastInd = 0;
    var neurons = [];
    while(true){
      try {
        var n = await NeuronManager.get(lastInd, id);
        neurons.push(n);
        lastInd++;
      } catch (e) {
        //dont throw we are expecting an error
        break;
      }
    };
    NeuronManager.nextId = lastInd;
    return neurons;
  },
  create : async (amount, id, sa) => { //new, takes next index
    var index = NeuronManager.nextId;
    var n = await NeuronManager.stake(index, amount, id, sa);
    NeuronManager.nextId++;
    return n;
  },
  stake : async (index, amount, id, sa) => { //stakes, can be new or existing index
    if (index > 2**32) return false; //only 32bits for now/over 4 billion
    if (amount < 1) return false;
    var principal = id.getPrincipal();
    var nonce = Array(4).fill(0).concat(to32bits(index));
    var memo = BigInt("0x"+toHexString(nonce));
    var stakingTo = getStakingAddress(principal.toText(), nonce);
    var args = {
      "from_subaccount" : [getSubAccountArray(sa ?? 0)], 
      "to" : stakingTo,
      "amount" : { "e8s" : BigInt(amount) * BigInt(10**8) },
      "fee" : { "e8s" : 10000n }, 
      "memo" : Number(memo), 
      "created_at_time" : []
    }
    var bh = await extjs.connect("https://boundary.ic0.app/", id).canister(LEDGER_CANISTER_ID).send_dfx(args);
    var n = await NeuronManager.get(index, id);
    return n;
  },
  get : async (index, id) => {
    if (index > 2**32) return false; //only 32bits for now
    var principal = id.getPrincipal();
    var nonce = Array(4).fill(0).concat(to32bits(index));
    var memo = BigInt("0x"+toHexString(nonce));
    
    var args = {
      controller : [principal], 
      memo : Number(memo)
    };
    var nd = await extjs.connect("https://boundary.ic0.app/", id).canister(GOVERNANCE_CANISTER).claim_or_refresh_neuron_from_account(args);
    if (nd.result[0].hasOwnProperty("Error")) {
      throw "Error: " + JSON.stringify(nd.result[0].Error);
    }
    var neuronid = nd.result[0].NeuronId.id;
    
    var ni = await extjs.connect("https://boundary.ic0.app/", id).canister(GOVERNANCE_CANISTER).get_neuron_info(neuronid);
    if (ni.hasOwnProperty("Err")) {
      throw "Error: " + JSON.stringify(ni.Error);
    };
    var ndata = ni.Ok;
    return new ICNeuron(neuronid, ndata, id);
  },
  topics : topics
};
export default NeuronManager;
window.NeuronManager = NeuronManager;
window.StoicIdentity = StoicIdentity;