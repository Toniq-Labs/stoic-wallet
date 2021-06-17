export default ({ IDL }) => {
  const TokenIdentifier = IDL.Text;
  const AccountIdentifier_2 = IDL.Text;
  const AccountIdentifier = AccountIdentifier_2;
  const User = IDL.Variant({
    'principal' : IDL.Principal,
    'address' : AccountIdentifier,
  });
  const BalanceRequest_2 = IDL.Record({
    'token' : TokenIdentifier,
    'user' : User,
  });
  const BalanceRequest = BalanceRequest_2;
  const Balance = IDL.Nat;
  const CommonError_2 = IDL.Variant({
    'InvalidToken' : TokenIdentifier,
    'Other' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : Balance, 'err' : CommonError_2 });
  const BalanceResponse_2 = Result_4;
  const BalanceResponse = BalanceResponse_2;
  const Balance_2 = Balance;
  const Extension_2 = IDL.Text;
  const Extension = Extension_2;
  const TokenIdentifier_2 = TokenIdentifier;
  const Metadata_2 = IDL.Variant({
    'fungible' : IDL.Record({
      'decimals' : IDL.Nat8,
      'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)),
      'name' : IDL.Text,
      'symbol' : IDL.Text,
    }),
    'nonfungible' : IDL.Record({ 'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)) }),
  });
  const Metadata = Metadata_2;
  const CommonError = CommonError_2;
  const Result_3 = IDL.Variant({ 'ok' : Metadata, 'err' : CommonError });
  const Result_2 = IDL.Variant({ 'ok' : Balance_2, 'err' : CommonError });
  const Memo = IDL.Vec(IDL.Nat8);
  const SubAccount_2 = IDL.Vec(IDL.Nat8);
  const SubAccount = SubAccount_2;
  const TransferRequest_2 = IDL.Record({
    'to' : User,
    'fee' : Balance,
    'token' : TokenIdentifier,
    'notify' : IDL.Bool,
    'from' : User,
    'memo' : Memo,
    'subaccount' : IDL.Opt(SubAccount),
    'amount' : Balance,
  });
  const TransferRequest = TransferRequest_2;
  const Result = IDL.Variant({
    'ok' : Balance,
    'err' : IDL.Variant({
      'CannotNotify' : AccountIdentifier,
      'InsufficientBalance' : IDL.Null,
      'InvalidToken' : TokenIdentifier,
      'Rejected' : IDL.Null,
      'Unauthorized' : AccountIdentifier,
      'Other' : IDL.Text,
    }),
  });
  const TransferResponse_2 = Result;
  const TransferResponse = TransferResponse_2;
  return IDL.Service({
    'balance' : IDL.Func([BalanceRequest], [BalanceResponse], ['query']),
    'balance_secure' : IDL.Func([BalanceRequest], [BalanceResponse], []),
    'extensions' : IDL.Func([], [IDL.Vec(Extension)], ['query']),
    'extensions_secure' : IDL.Func([], [IDL.Vec(Extension)], []),
    'fee' : IDL.Func([], [Balance_2], ['query']),
    'metadata' : IDL.Func([TokenIdentifier_2], [Result_3], ['query']),
    'metadata_secure' : IDL.Func([TokenIdentifier_2], [Result_3], []),
    'supply' : IDL.Func([TokenIdentifier_2], [Result_2], ['query']),
    'supply_secure' : IDL.Func([TokenIdentifier_2], [Result_2], []),
    'transfer' : IDL.Func([TransferRequest], [TransferResponse], []),
  });
};
export const init = ({ IDL }) => { return []; };