export default ({ IDL }) => {
    const Txid = IDL.Blob;
    const Operation = IDL.Variant({
      'approve': IDL.Record({ 'allowance': IDL.Nat }),
      'executeTransfer': IDL.Record({ 'fallback': IDL.Nat, 'lockedTxid': Txid }),
      'lockTransfer': IDL.Record({ 'decider': IDL.Principal, 'expiration': IDL.Int, 'locked': IDL.Nat }),
      'transfer': IDL.Record({ 'action': IDL.Variant({ 'burn': IDL.Null, 'mint': IDL.Null, 'send': IDL.Null }) }),
    });
    const AccountId = IDL.Blob;
    const Transaction = IDL.Record({
      'data': IDL.Opt(IDL.Blob),
      'from': AccountId,
      'operation': Operation,
      'to': AccountId,
      'value': IDL.Nat,
    });
    const Time = IDL.Int;
    const TxnRecord = IDL.Record({
      'caller': AccountId,
      'gas': IDL.Variant({ 'cycles': IDL.Nat, 'noFee': IDL.Null, 'token': IDL.Nat }),
      'index': IDL.Nat,
      'msgCaller': IDL.Opt(IDL.Principal),
      'nonce': IDL.Nat,
      'timestamp': Time,
      'transaction': Transaction,
      'txid': Txid,
    });
    const TxnResult = IDL.Variant({
      'err': IDL.Record({
        'code': IDL.Variant({
          'DuplicateExecutedTransfer': IDL.Null,
          'InsufficientAllowance': IDL.Null,
          'InsufficientBalance': IDL.Null,
          'InsufficientGas': IDL.Null,
          'LockedTransferExpired': IDL.Null,
          'NoLockedTransfer': IDL.Null,
          'NonceError': IDL.Null,
          'UndefinedError': IDL.Null,
        }),
        'message': IDL.Text,
      }),
      'ok': Txid,
    });
    const Address = IDL.Text;
    const Amount = IDL.Nat;
    const Nonce = IDL.Nat;
    const Sa = IDL.Vec(IDL.Nat8);
    const Data = IDL.Blob;
    const TxnQueryRequest = IDL.Variant({
      'getEvents': IDL.Record({ 'owner': IDL.Opt(Address) }),
      'getTxn': IDL.Record({ 'txid': Txid }),
      'lastTxids': IDL.Record({ 'owner': Address }),
      'lastTxidsGlobal': IDL.Null,
      'lockedTxns': IDL.Record({ 'owner': Address }),
      'txnCount': IDL.Record({ 'owner': Address }),
      'txnCountGlobal': IDL.Null,
    });
    const TxnQueryResponse = IDL.Variant({
      'getEvents': IDL.Vec(TxnRecord),
      'getTxn': IDL.Opt(TxnRecord),
      'lastTxids': IDL.Vec(Txid),
      'lastTxidsGlobal': IDL.Vec(Txid),
      'lockedTxns': IDL.Record({ 'lockedBalance': IDL.Nat, 'txns': IDL.Vec(TxnRecord) }),
      'txnCount': IDL.Nat,
      'txnCountGlobal': IDL.Nat,
    });
    const Metadata = IDL.Record({ 'content': IDL.Text, 'name': IDL.Text });
    const InitArgs = IDL.Record({
      'decimals': IDL.Nat8,
      'fee': IDL.Nat,
      'founder': IDL.Opt(Address),
      'metadata': IDL.Opt(IDL.Vec(Metadata)),
      'name': IDL.Opt(IDL.Text),
      'symbol': IDL.Opt(IDL.Text),
      'totalSupply': IDL.Nat,
    });
    const DRC20 = IDL.Service({
      'standard': IDL.Func([], [IDL.Text], ['query']),
      'drc20_allowance': IDL.Func([Address, Address], [Amount], ['query']),
      'drc20_approvals': IDL.Func([Address], [IDL.Vec(IDL.Record({ 'remaining': IDL.Nat, 'spender': AccountId }))], ['query']),
      'drc20_approve': IDL.Func([Address, Amount, IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [TxnResult], []),
      'drc20_balanceOf': IDL.Func([Address], [Amount], ['query']),
      'drc20_decimals': IDL.Func([], [IDL.Nat8], ['query']),
      'drc20_dropAccount': IDL.Func([IDL.Opt(Sa)], [IDL.Bool], []),
      'drc20_executeTransfer': IDL.Func([Txid, IDL.Variant({ 'fallback': IDL.Null, 'send': IDL.Nat, 'sendAll': IDL.Null }), IDL.Opt(Address), IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [TxnResult], []),
      'drc20_fee': IDL.Func([], [Amount], ['query']),
      'drc20_getCoinSeconds': IDL.Func([IDL.Opt(Address)], [IDL.Record({ 'coinSeconds': IDL.Nat, 'updateTime': IDL.Int }), IDL.Opt(IDL.Record({ 'coinSeconds': IDL.Nat, 'updateTime': IDL.Int }))], ['query']),
      'drc20_holdersCount': IDL.Func([], [IDL.Nat, IDL.Nat, IDL.Nat], ['query']),
      'drc20_lockTransfer': IDL.Func([Address, Amount, IDL.Nat32, IDL.Opt(Address), IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [TxnResult], []),
      'drc20_lockTransferFrom': IDL.Func([Address, Address, Amount, IDL.Nat32, IDL.Opt(Address), IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [TxnResult], []),
      'drc20_metadata': IDL.Func([], [IDL.Vec(Metadata)], ['query']),
      'drc20_name': IDL.Func([], [IDL.Text], ['query']),
      'drc20_subscribe': IDL.Func([IDL.Func([TxnRecord], [], []), IDL.Vec(IDL.Variant({ 'onApprove': IDL.Null, 'onExecute': IDL.Null, 'onLock': IDL.Null, 'onTransfer': IDL.Null })), IDL.Opt(Sa)], [IDL.Bool], []),
      'drc20_subscribed': IDL.Func([Address], [IDL.Opt(IDL.Record({ 'callback': IDL.Func([TxnRecord], [], []), 'msgTypes': IDL.Vec(IDL.Variant({ 'onApprove': IDL.Null, 'onExecute': IDL.Null, 'onLock': IDL.Null, 'onTransfer': IDL.Null })) }))], ['query']),
      'drc20_symbol': IDL.Func([], [IDL.Text], ['query']),
      'drc20_totalSupply': IDL.Func([], [Amount], ['query']),
      'drc20_transfer': IDL.Func([Address, Amount, IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [TxnResult], []),
      'drc20_transferBatch': IDL.Func([IDL.Vec(Address), IDL.Vec(Amount), IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [IDL.Vec(TxnResult)], []),
      'drc20_transferFrom': IDL.Func([Address, Address, Amount, IDL.Opt(Nonce), IDL.Opt(Sa), IDL.Opt(Data)], [TxnResult], []),
      'drc20_txnQuery': IDL.Func([TxnQueryRequest], [TxnQueryResponse], ['query']),
      'drc20_txnRecord': IDL.Func([Txid], [IDL.Opt(TxnRecord)], ['query']),
    });
    return DRC20;
  };
  export const init = ({ IDL }) => { return []; };