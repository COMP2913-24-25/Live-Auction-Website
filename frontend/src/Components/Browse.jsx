import Hero from "./hero";
import Categories from "./categories";
import TrustIndicators from "./trust_Indicators";
import AuctionList from "./AuctionList";

function Browse() {
  return (
    <div className="min-h-screen bg-background -mt-16">
      <Hero />
      <Categories />
      <AuctionList />
      <TrustIndicators />
    </div>
  );
}

export default Browse;