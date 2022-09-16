export default ({ IDL }) => {
    const AccountIdentifier = IDL.Text;
    const User = IDL.Variant({
      'principal' : IDL.Principal,
      'address' : AccountIdentifier,
    });
    const SubAccount = IDL.Vec(IDL.Nat8);
    const AllowanceRequest = IDL.Record({
      'owner' : User,
      'subaccount' : IDL.Opt(SubAccount),
      'spender' : IDL.Principal,
    });
    const Balance__1 = IDL.Nat;
    const TokenIdentifier = IDL.Text;
    const CommonError__1 = IDL.Variant({
      'InsufficientBalance' : IDL.Null,
      'InvalidToken' : TokenIdentifier,
      'Unauthorized' : AccountIdentifier,
      'Other' : IDL.Text,
    });
    const Result_1 = IDL.Variant({ 'ok' : Balance__1, 'err' : CommonError__1 });
    const Balance = IDL.Nat;
    const ApproveRequest = IDL.Record({
      'subaccount' : IDL.Opt(SubAccount),
      'allowance' : Balance,
      'spender' : IDL.Principal,
    });
    const Result_2 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : CommonError__1 });
    const BalanceRequest = IDL.Record({
      'token' : TokenIdentifier,
      'user' : User,
    });
    const CommonError = IDL.Variant({
      'InsufficientBalance' : IDL.Null,
      'InvalidToken' : TokenIdentifier,
      'Unauthorized' : AccountIdentifier,
      'Other' : IDL.Text,
    });
    const BalanceResponse = IDL.Variant({ 'ok' : Balance, 'err' : CommonError });
    const Result_6 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : CommonError__1 });
    const Extension = IDL.Text;
    const HoldersRequest = IDL.Record({
      'offset' : IDL.Opt(IDL.Nat),
      'limit' : IDL.Opt(IDL.Nat),
    });
    const Holder = IDL.Record({
      'balance' : IDL.Nat,
      'account' : AccountIdentifier,
    });
    const Page = IDL.Record({
      'content' : IDL.Vec(Holder),
      'offset' : IDL.Nat,
      'limit' : IDL.Nat,
      'totalElements' : IDL.Nat,
    });
    const Result_5 = IDL.Variant({ 'ok' : Page, 'err' : CommonError });
    const Result_4 = IDL.Variant({ 'ok' : IDL.Text, 'err' : CommonError__1 });
    const Metadata = IDL.Variant({
      'fungible' : IDL.Record({
        'decimals' : IDL.Nat8,
        'ownerAccount' : AccountIdentifier,
        'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)),
        'name' : IDL.Text,
        'symbol' : IDL.Text,
      }),
      'nonfungible' : IDL.Record({ 'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)) }),
    });
    const Result_3 = IDL.Variant({ 'ok' : Metadata, 'err' : CommonError__1 });
    const MintRequest = IDL.Record({ 'to' : User, 'amount' : Balance });
    const TransferResponse = IDL.Variant({
      'ok' : Balance,
      'err' : IDL.Variant({
        'InsufficientAllowance' : IDL.Null,
        'CannotNotify' : AccountIdentifier,
        'InsufficientBalance' : IDL.Null,
        'InvalidToken' : TokenIdentifier,
        'Rejected' : IDL.Null,
        'Unauthorized' : AccountIdentifier,
        'Other' : IDL.Text,
      }),
    });
    const AccountIdentifier__1 = IDL.Text;
    const User__1 = IDL.Variant({
      'principal' : IDL.Principal,
      'address' : AccountIdentifier,
    });
    const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : CommonError });
    const Memo = IDL.Vec(IDL.Nat8);
    const TransferRequest = IDL.Record({
      'to' : User,
      'token' : TokenIdentifier,
      'notify' : IDL.Bool,
      'from' : User,
      'memo' : Memo,
      'subaccount' : IDL.Opt(SubAccount),
      'nonce' : IDL.Opt(IDL.Nat),
      'amount' : Balance,
    });
    return IDL.Service({
      'allowance' : IDL.Func([AllowanceRequest], [Result_1], ['query']),
      'approve' : IDL.Func([ApproveRequest], [Result_2], []),
      'balance' : IDL.Func([BalanceRequest], [BalanceResponse], ['query']),
      'cycleAvailable' : IDL.Func([], [Result_6], []),
      'cycleBalance' : IDL.Func([], [Result_6], ['query']),
      'extensions' : IDL.Func([], [IDL.Vec(Extension)], ['query']),
      'getFee' : IDL.Func([], [Result_1], ['query']),
      'getRootBucketId' : IDL.Func([], [IDL.Text], ['query']),
      'holders' : IDL.Func([HoldersRequest], [Result_5], ['query']),
      'logo' : IDL.Func([], [Result_4], ['query']),
      'metadata' : IDL.Func([], [Result_3], ['query']),
      'mint' : IDL.Func([MintRequest], [TransferResponse], []),
      'registry' : IDL.Func(
          [],
          [IDL.Vec(IDL.Tuple(AccountIdentifier__1, Balance__1))],
          ['query'],
        ),
      'setFee' : IDL.Func([Balance__1], [Result_2], []),
      'setFeeTo' : IDL.Func([User__1], [Result_2], []),
      'setLogo' : IDL.Func([IDL.Text], [Result_2], []),
      'supply' : IDL.Func([], [Result_1], ['query']),
      'totalHolders' : IDL.Func([], [Result], ['query']),
      'transfer' : IDL.Func([TransferRequest], [TransferResponse], []),
      'transferFrom' : IDL.Func([TransferRequest], [TransferResponse], []),
      'txSize' : IDL.Func([], [IDL.Nat64], []),
    });
  };
  export const init = ({ IDL }) => { return []; };