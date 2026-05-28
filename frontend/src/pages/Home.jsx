import HomeHero from '../components/home/HomeHero';
import FeaturedListings from '../components/home/FeaturedListings';
import BrowseByType from '../components/home/BrowseByType';
import HowItWorks from '../components/home/HowItWorks';
import TrustSection from '../components/home/TrustSection';
import SellerCTA from '../components/home/SellerCTA';

export default function Home() {
  return (
    <div className="bg-white">
      <HomeHero />
      <FeaturedListings />
      <BrowseByType />
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <TrustSection />
      <SellerCTA />
    </div>
  );
}
