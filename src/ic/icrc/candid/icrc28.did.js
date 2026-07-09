// ICRC-28: a target canister declares which relying-party origins may request
// account-scoped delegations for it. Called (as an update, for a certified
// response) before Stoic issues an ICRC-34 delegation with `targets`.
export default ({IDL}) => {
  const Icrc28TrustedOriginsResponse = IDL.Record({
    trusted_origins: IDL.Vec(IDL.Text),
  });
  return IDL.Service({
    icrc28_trusted_origins: IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    icrc10_supported_standards: IDL.Func(
      [],
      [IDL.Vec(IDL.Record({url: IDL.Text, name: IDL.Text}))],
      ['query'],
    ),
  });
};
