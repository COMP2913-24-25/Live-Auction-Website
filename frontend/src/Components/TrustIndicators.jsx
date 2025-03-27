function TrustIndicators() {
  return (
    <div className="bg-background py-6 mt-4"> {/* Reduced padding and margin */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <h4 className="text-lg font-semibold mb-2 text-text">Secure Payments</h4>
            <p className="text-text/70">Protected by industry-leading encryption</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2 text-text">Buyer Protection</h4>
            <p className="text-text/70">100% money-back guarantee</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2 text-text">24/7 Support</h4>
            <p className="text-text/70">Expert assistance whenever you need it</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrustIndicators;