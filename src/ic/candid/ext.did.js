export default ({ IDL }) => {
  const TokenIdentifier = IDL.Text;
  const AccountIdentifier_2 = IDL.Text;
  const AccountIdentifier = AccountIdentifier_2;
  const User = IDL.Variant({
    'principal' : IDL.Principal,
    'address' : AccountIdentifier,
  });
  const AllowanceRequest_2 = IDL.Record({
    'token' : TokenIdentifier,
    'owner' : User,
    'spender' : IDL.Principal,
  });
  const AllowanceRequest = AllowanceRequest_2;
  const Balance = IDL.Nat;
  const Balance_2 = Balance;
  const CommonError_2 = IDL.Variant({
    'InvalidToken' : TokenIdentifier,
    'Other' : IDL.Text,
  });
  const CommonError = CommonError_2;
  const Result_2 = IDL.Variant({ 'ok' : Balance_2, 'err' : CommonError });
  const SubAccount_2 = IDL.Vec(IDL.Nat8);
  const SubAccount = SubAccount_2;
  const ApproveRequest_2 = IDL.Record({
    'token' : TokenIdentifier,
    'subaccount' : IDL.Opt(SubAccount),
    'allowance' : Balance,
    'spender' : IDL.Principal,
  });
  const ApproveRequest = ApproveRequest_2;
  const BalanceRequest_2 = IDL.Record({
    'token' : TokenIdentifier,
    'user' : User,
  });
  const BalanceRequest = BalanceRequest_2;
  const Result_5 = IDL.Variant({ 'ok' : Balance, 'err' : CommonError_2 });
  const BalanceResponse_2 = Result_5;
  const BalanceResponse = BalanceResponse_2;
  const TokenIdentifier_2 = TokenIdentifier;
  const AccountIdentifier_3 = AccountIdentifier;
  const Result_4 = IDL.Variant({
    'ok' : AccountIdentifier_3,
    'err' : CommonError,
  });
  const Extension_2 = IDL.Text;
  const Extension = Extension_2;
  const TokenIndex_2 = IDL.Nat32;
  const TokenIndex = TokenIndex_2;
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
  const Result_3 = IDL.Variant({ 'ok' : Metadata, 'err' : CommonError });
  const MintRequest_2 = IDL.Record({
    'to' : User,
    'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const MintRequest = MintRequest_2;
  const Memo = IDL.Vec(IDL.Nat8);
  const TransferRequest_2 = IDL.Record({
    'to' : User,
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
  const erc721_token = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'allowance' : IDL.Func([AllowanceRequest], [Result_2], ['query']),
    'approve' : IDL.Func([ApproveRequest], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'balance' : IDL.Func([BalanceRequest], [BalanceResponse], ['query']),
    'bearer' : IDL.Func([TokenIdentifier_2], [Result_4], ['query']),
    'extensions' : IDL.Func([], [IDL.Vec(Extension)], ['query']),
    'getAllowances' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, IDL.Principal))],
        ['query'],
      ),
    'getMinter' : IDL.Func([], [IDL.Principal], ['query']),
    'getRegistry' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, AccountIdentifier_3))],
        ['query'],
      ),
    'getTokens' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, Metadata))],
        ['query'],
      ),
    'metadata' : IDL.Func([TokenIdentifier_2], [Result_3], ['query']),
    'mintNFT' : IDL.Func([MintRequest], [TokenIndex], []),
    'setMinter' : IDL.Func([IDL.Principal], [], []),
    'supply' : IDL.Func([TokenIdentifier_2], [Result_2], ['query']),
    'transfer' : IDL.Func([TransferRequest], [TransferResponse], []),
  });
  return erc721_token;
};
export const init = ({ IDL }) => { return [IDL.Principal]; };