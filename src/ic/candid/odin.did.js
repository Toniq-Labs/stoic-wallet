// Odin ledger — ICRC-1/2 multi-token ledger.
//
// Odin is a single ledger canister that holds many assets (BTC, the rewards
// token, every launched token and its LP). Which asset an ICRC operation
// touches is selected by the `subaccount` field, which Odin calls the "token
// pointer" (ICRC-80). The pointer for a text token id is resolved with the
// `odin_token_pointer` query and must be used identically on every subaccount
// field of a transfer. See ODIN_ICRC_WALLET_INTEGRATION.md.
//
// All ledger operations cost a flat fee of 100,000 msats (100 sats) which is
// always paid in BTC, regardless of which token is moved. Odin rejects calls
// that set `fee`, `memo` or `expires_at`, so those are always sent as null.
export default ({IDL}) => {
  const MetadataValue = IDL.Variant({
    Int: IDL.Int,
    Nat: IDL.Nat,
    Blob: IDL.Vec(IDL.Nat8),
    Text: IDL.Text,
  });
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const TransferArg = IDL.Record({
    to: Account,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
    amount: IDL.Nat,
  });
  const TransferError = IDL.Variant({
    GenericError: IDL.Record({message: IDL.Text, error_code: IDL.Nat}),
    TemporarilyUnavailable: IDL.Null,
    BadBurn: IDL.Record({min_burn_amount: IDL.Nat}),
    Duplicate: IDL.Record({duplicate_of: IDL.Nat}),
    BadFee: IDL.Record({expected_fee: IDL.Nat}),
    CreatedInFuture: IDL.Record({ledger_time: IDL.Nat64}),
    TooOld: IDL.Null,
    InsufficientFunds: IDL.Record({balance: IDL.Nat}),
  });
  const Result = IDL.Variant({Ok: IDL.Nat, Err: TransferError});
  const Allowance = IDL.Record({
    allowance: IDL.Nat,
    expires_at: IDL.Opt(IDL.Nat64),
  });
  const AllowanceArgs = IDL.Record({account: Account, spender: Account});
  const ApproveArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    spender: Account,
    amount: IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const ApproveError = IDL.Variant({
    GenericError: IDL.Record({message: IDL.Text, error_code: IDL.Nat}),
    TemporarilyUnavailable: IDL.Null,
    Duplicate: IDL.Record({duplicate_of: IDL.Nat}),
    BadFee: IDL.Record({expected_fee: IDL.Nat}),
    AllowanceChanged: IDL.Record({current_allowance: IDL.Nat}),
    CreatedInFuture: IDL.Record({ledger_time: IDL.Nat64}),
    TooOld: IDL.Null,
    Expired: IDL.Record({ledger_time: IDL.Nat64}),
    InsufficientFunds: IDL.Record({balance: IDL.Nat}),
  });
  const Result_1 = IDL.Variant({Ok: IDL.Nat, Err: ApproveError});
  const TransferFromArgs = IDL.Record({
    spender_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    from: Account,
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const TransferFromError = IDL.Variant({
    GenericError: IDL.Record({message: IDL.Text, error_code: IDL.Nat}),
    TemporarilyUnavailable: IDL.Null,
    InsufficientAllowance: IDL.Record({allowance: IDL.Nat}),
    BadBurn: IDL.Record({min_burn_amount: IDL.Nat}),
    Duplicate: IDL.Record({duplicate_of: IDL.Nat}),
    BadFee: IDL.Record({expected_fee: IDL.Nat}),
    CreatedInFuture: IDL.Record({ledger_time: IDL.Nat64}),
    TooOld: IDL.Null,
    InsufficientFunds: IDL.Record({balance: IDL.Nat}),
  });
  const Result_2 = IDL.Variant({Ok: IDL.Nat, Err: TransferFromError});
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
    icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
    icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, MetadataValue))], ['query']),
    icrc1_name: IDL.Func([], [IDL.Text], ['query']),
    icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
    icrc1_total_supply: IDL.Func([], [IDL.Nat], ['query']),
    icrc1_transfer: IDL.Func([TransferArg], [Result], []),
    icrc2_allowance: IDL.Func([AllowanceArgs], [Allowance], ['query']),
    icrc2_approve: IDL.Func([ApproveArgs], [Result_1], []),
    icrc2_transfer_from: IDL.Func([TransferFromArgs], [Result_2], []),
    // Odin-specific: resolve a text token id to its 32-byte token pointer.
    odin_token_pointer: IDL.Func([IDL.Text], [IDL.Vec(IDL.Nat8)], ['query']),
  });
};
