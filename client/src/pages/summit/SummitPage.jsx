import SummitNavbar from "../../components/summit/navbar/SummitNavbar";
import Hero from "../../components/summit/hero/Hero";
import About from "../../components/summit/about/About";
import WhyAttend from "../../components/summit/WhyAttend/WhyAttend";
import Tracks from "../../components/summit/tracks/Tracks";
import Programme from "../../components/summit/programme/Programme";
import Speakers from "../../components/summit/speakers/Speakers";
import Venue from "../../components/summit/venue/Venue";
import FAQ from "../../components/summit/FAQ/FAQ";
import CallToAction from "../../components/summit/calltoaction/CallToAction";
import Footer from "../../components/summit/footer/Footer";

export default function SummitPage() {
  return (
    <main className="bg-white overflow-x-hidden">
      <SummitNavbar />
      <Hero />
      <About />
      <WhyAttend />
      <Tracks />
      <Programme />
      <Speakers />
      <Venue />
      <FAQ />
      <Footer />
    </main>
  );
}
