import Hero from "./Hero";
import Categories from "./Categories";
import TrustIndicators from "./TrustIndicators";
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