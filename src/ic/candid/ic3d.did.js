export default ({ IDL }) => {
  const AssetHandle = IDL.Text;
  const SubAccount_2 = IDL.Vec(IDL.Nat8);
  const SubAccount = SubAccount_2;
  const SubAccount_3 = SubAccount;
  const TokenIndex_2 = IDL.Nat32;
  const TokenIndex = TokenIndex_2;
  const AccountIdentifier_2 = IDL.Text;
  const AccountIdentifier = AccountIdentifier_2;
  const AccountIdentifier_3 = AccountIdentifier;
  const Settlement = IDL.Record({
    'subaccount' : SubAccount_3,
    'seller' : IDL.Principal,
    'buyer' : AccountIdentifier_3,
    'price' : IDL.Nat64,
  });
  const TokenIdentifier = IDL.Text;
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
  const Result_11 = IDL.Variant({ 'ok' : Balance, 'err' : CommonError_2 });
  const BalanceResponse_2 = Result_11;
  const BalanceResponse = BalanceResponse_2;
  const TokenIdentifier_2 = TokenIdentifier;
  const CommonError = CommonError_2;
  const Result_9 = IDL.Variant({
    'ok' : AccountIdentifier_3,
    'err' : CommonError,
  });
  const Time_2 = IDL.Int;
  const Time = Time_2;
  const Listing = IDL.Record({
    'locked' : IDL.Opt(Time),
    'seller' : IDL.Principal,
    'price' : IDL.Nat64,
  });
  const Result_10 = IDL.Variant({
    'ok' : IDL.Tuple(AccountIdentifier_3, IDL.Opt(Listing)),
    'err' : CommonError,
  });
  const Extension_2 = IDL.Text;
  const Extension = Extension_2;
  const Asset = IDL.Record({
    'ttype' : IDL.Text,
    'thumbnail' : IDL.Vec(IDL.Nat32),
    'data' : IDL.Vec(IDL.Nat32),
    'ctype' : IDL.Text,
  });
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
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
  });
  const HttpStreamingCallbackToken = IDL.Record({
    'key' : IDL.Text,
    'sha256' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'index' : IDL.Nat,
    'content_encoding' : IDL.Text,
  });
  const HttpStreamingCallbackResponse = IDL.Record({
    'token' : IDL.Opt(HttpStreamingCallbackToken),
    'body' : IDL.Vec(IDL.Nat8),
  });
  const HttpStreamingStrategy = IDL.Variant({
    'Callback' : IDL.Record({
      'token' : HttpStreamingCallbackToken,
      'callback' : IDL.Func(
          [HttpStreamingCallbackToken],
          [HttpStreamingCallbackResponse],
          ['query'],
        ),
    }),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'streaming_strategy' : IDL.Opt(HttpStreamingStrategy),
    'status_code' : IDL.Nat16,
  });
  const ListRequest = IDL.Record({
    'token' : TokenIdentifier_2,
    'from_subaccount' : IDL.Opt(SubAccount_3),
    'price' : IDL.Opt(IDL.Nat64),
  });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Null, 'err' : CommonError });
  const Result_8 = IDL.Variant({ 'ok' : Metadata, 'err' : CommonError });
  const MintingRequest = IDL.Record({
    'to' : AccountIdentifier_3,
    'asset' : IDL.Nat32,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Tuple(AccountIdentifier_3, IDL.Nat64),
    'err' : IDL.Text,
  });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Sale = IDL.Record({
    'expires' : Time,
    'subaccount' : SubAccount_3,
    'tokens' : IDL.Vec(TokenIndex),
    'buyer' : AccountIdentifier_3,
    'price' : IDL.Nat64,
  });
  const Balance_2 = Balance;
  const Result_4 = IDL.Variant({ 'ok' : Balance_2, 'err' : CommonError });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(TokenIndex),
    'err' : CommonError,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Vec(
      IDL.Tuple(TokenIndex, IDL.Opt(Listing), IDL.Opt(IDL.Vec(IDL.Nat8)))
    ),
    'err' : CommonError,
  });
  const Transaction = IDL.Record({
    'token' : TokenIdentifier_2,
    'time' : Time,
    'seller' : IDL.Principal,
    'buyer' : AccountIdentifier_3,
    'price' : IDL.Nat64,
  });
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
  const Canister = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addAsset' : IDL.Func([AssetHandle, IDL.Text, IDL.Text], [IDL.Text], []),
    'addThumb' : IDL.Func([AssetHandle, IDL.Text], [], []),
    'allPayments' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(SubAccount_3)))],
        ['query'],
      ),
    'allSettlements' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, Settlement))],
        ['query'],
      ),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'balance' : IDL.Func([BalanceRequest], [BalanceResponse], ['query']),
    'bearer' : IDL.Func([TokenIdentifier_2], [Result_9], ['query']),
    'clearPayments' : IDL.Func([IDL.Principal, IDL.Vec(SubAccount_3)], [], []),
    'details' : IDL.Func([TokenIdentifier_2], [Result_10], ['query']),
    'extensions' : IDL.Func([], [IDL.Vec(Extension)], ['query']),
    'failedSales' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(AccountIdentifier_3, SubAccount_3))],
        ['query'],
      ),
    'getAssets' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, Asset))],
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
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'http_request_streaming_callback' : IDL.Func(
        [HttpStreamingCallbackToken],
        [HttpStreamingCallbackResponse],
        ['query'],
      ),
    'list' : IDL.Func([ListRequest], [Result_5], []),
    'listings' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, Listing, Metadata))],
        ['query'],
      ),
    'lock' : IDL.Func(
        [TokenIdentifier_2, IDL.Nat64, AccountIdentifier_3, SubAccount_3],
        [Result_9],
        [],
      ),
    'metadata' : IDL.Func([TokenIdentifier_2], [Result_8], ['query']),
    'mintNFT' : IDL.Func([MintingRequest], [TokenIndex], []),
    'payments' : IDL.Func([], [IDL.Opt(IDL.Vec(SubAccount_3))], ['query']),
    'reserve' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, AccountIdentifier_3, SubAccount_3],
        [Result_7],
        [],
      ),
    'retreive' : IDL.Func([AccountIdentifier_3], [Result_6], []),
    'salesSettlements' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(AccountIdentifier_3, Sale))],
        ['query'],
      ),
    'salesStats' : IDL.Func(
        [AccountIdentifier_3],
        [Time, IDL.Nat64, IDL.Nat],
        ['query'],
      ),
    'setMinter' : IDL.Func([IDL.Principal], [], []),
    'settle' : IDL.Func([TokenIdentifier_2], [Result_5], []),
    'settlements' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, AccountIdentifier_3, IDL.Nat64))],
        ['query'],
      ),
    'streamAsset' : IDL.Func(
        [AssetHandle, IDL.Vec(IDL.Nat8), IDL.Bool, IDL.Bool],
        [IDL.Bool],
        [],
      ),
    'supply' : IDL.Func([TokenIdentifier_2], [Result_4], ['query']),
    'tokens' : IDL.Func([AccountIdentifier_3], [Result_3], ['query']),
    'tokens_ext' : IDL.Func([AccountIdentifier_3], [Result_2], ['query']),
    'transactions' : IDL.Func([], [IDL.Vec(Transaction)], ['query']),
    'transfer' : IDL.Func([TransferRequest], [TransferResponse], []),
  });
  return Canister;
};
export const init = ({ IDL }) => { return []; };