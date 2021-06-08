export default (props)  =>{
  return (
    <div className={(props.selected ? "col-xl-2 col-lg-4 col-md-4 col-sm-6 col-xs-6 accountCards selectedAccount" : "col-xl-2 col-lg-4 col-md-4 col-sm-6 col-xs-6 accountCards")}>
        <div className="card mb-3 text-center" onClick={() => props.clickEv(props.token)}>
          <div className="card-body">
            <h1>{props.data.name}</h1>
            <h2>{props.data.amount === "Loading" ? "Loading" : props.data.amount + " " + props.data.symbol}</h2>
            <h3>{props.data.price ? "$"+(props.data.price*props.data.amount) : ""}</h3>
          </div>
        </div>
    </div>
  );
}