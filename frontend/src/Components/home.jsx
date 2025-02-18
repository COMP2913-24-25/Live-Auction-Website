import Hero from "./hero";
import Categories from "./categories";
import TrustIndicators from "./trust_Indicators";

function Home() {
  return (
    <div className="min-h-screen bg-background -mt-16">
      <Hero />
      <Categories />
      <TrustIndicators />
    </div>
  );
}

export default Home;