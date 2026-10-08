import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import AboutHero from "../../components/about/AboutHero";
import WhoWeAre from "../../components/about/WhoWeAre";
import OurJourney from "../../components/about/OurJourney";
import Pillars from "../../components/about/Pillars";
import LeadershipStructure from "../../components/about/LeadershipStructure";
import JoinMovement from "../../components/about/JoinMovement";

function About() {
  return (
    <>
      <Navbar />

      <main className="public-about-page">
        {/* Introduction */}
        <AboutHero />

        {/* Who JVP is */}
        <WhoWeAre />

        {/* Journey + impact */}
        <OurJourney />

        {/* What JVP does */}
        <Pillars />

        {/* How JVP is organized */}
        <LeadershipStructure />

        {/* Final conversion */}
        <JoinMovement />
      </main>

      <Footer />
    </>
  );
}

export default About;