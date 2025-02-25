import Hero from "../components/Hero";
import Categories from "../components/Categories";
import TrustIndicators from "../components/TrustIndicators";
import AuctionList from "../components/AuctionList";

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