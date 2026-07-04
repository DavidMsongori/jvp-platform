import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import AboutHero from "../../components/about/AboutHero";
import OurJourney from "../../components/About/OurJourney";
import LeadershipStructure from "../../components/About/LeadershipStructure";
import PartnersSection from "../../components/about/PartnersSection";
import JoinMovement from "../../components/About/JoinMovement";

function About() {
  return (
    <>
      <Navbar />

      <AboutHero />
      
      <OurJourney />

      <LeadershipStructure />

      <PartnersSection />

      <JoinMovement />

      <Footer />
    </>
  );
}

export default About;