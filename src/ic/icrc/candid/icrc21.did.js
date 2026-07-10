// ICRC-21: a canister renders a human-readable consent message for a given
// method + argument, which the signer shows the user before an ICRC-49 call.
export default ({IDL}) => {
  const Icrc21ConsentMessageMetadata = IDL.Record({
    utc_offset_minutes: IDL.Opt(IDL.Int16),
    language: IDL.Text,
  });
  const Icrc21DeviceSpec = IDL.Variant({
    GenericDisplay: IDL.Null,
    LineDisplay: IDL.Record({
      characters_per_line: IDL.Nat16,
      lines_per_page: IDL.Nat16,
    }),
  });
  const Icrc21ConsentMessageSpec = IDL.Record({
    metadata: Icrc21ConsentMessageMetadata,
    device_spec: IDL.Opt(Icrc21DeviceSpec),
  });
  const Icrc21ConsentMessageRequest = IDL.Record({
    arg: IDL.Vec(IDL.Nat8),
    method: IDL.Text,
    user_preferences: Icrc21ConsentMessageSpec,
  });
  const Icrc21ConsentMessage = IDL.Variant({
    LineDisplayMessage: IDL.Record({
      pages: IDL.Vec(IDL.Record({lines: IDL.Vec(IDL.Text)})),
    }),
    GenericDisplayMessage: IDL.Text,
  });
  const Icrc21ConsentInfo = IDL.Record({
    metadata: Icrc21ConsentMessageMetadata,
    consent_message: Icrc21ConsentMessage,
  });
  const Icrc21ErrorInfo = IDL.Record({description: IDL.Text});
  const Icrc21Error = IDL.Variant({
    GenericError: IDL.Record({description: IDL.Text, error_code: IDL.Nat}),
    InsufficientPayment: Icrc21ErrorInfo,
    UnsupportedCanisterCall: Icrc21ErrorInfo,
    ConsentMessageUnavailable: Icrc21ErrorInfo,
  });
  const Icrc21ConsentMessageResponse = IDL.Variant({
    Ok: Icrc21ConsentInfo,
    Err: Icrc21Error,
  });
  return IDL.Service({
    icrc21_canister_call_consent_message: IDL.Func(
      [Icrc21ConsentMessageRequest],
      [Icrc21ConsentMessageResponse],
      [],
    ),
  });
};
