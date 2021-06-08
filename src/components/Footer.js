export default (props) => {
  return (
    <footer className="py-4 bg-light mt-auto">
        <div className="container-fluid px-4">
            <div className="d-flex align-items-center justify-content-between small">
                <div className="text-muted">Copyright &copy; Elastic Wallet</div>
                <div>
                    <a href="https://toniqlabs.com">Developed by Toniq Labs</a>
                    { /*&nbsp;&middot;&nbsp;
                    <a href="#">Privacy Policy</a>
                    &nbsp;&middot;&nbsp;
                    <a href="#">Terms &amp; Conditions</a>*/ }
                </div>
            </div>
        </div>
    </footer>
  );
}
