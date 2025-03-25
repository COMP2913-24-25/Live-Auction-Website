{error ? (
  <div className="alert alert-danger">{error}</div>
) : (
  !paymentMethods.length && <div>No payment methods found</div>
)} 