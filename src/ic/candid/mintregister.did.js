export default ({ IDL }) => {
  return IDL.Service({
    'createCanister' : IDL.Func([IDL.Text, IDL.Text], [IDL.Principal], []),
    'getCanisters' : IDL.Func([], [IDL.Vec(IDL.Principal)], []),
  });
};
export const init = ({ IDL }) => { return []; };