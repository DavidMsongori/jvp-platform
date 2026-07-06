import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import AboutHero from "../../components/about/AboutHero";
import OurJourney from "../../components/about/OurJourney";
import LeadershipStructure from "../../components/about/LeadershipStructure";
import PartnersSection from "../../components/about/PartnersSection";
import JoinMovement from "../../components/about/JoinMovement";
import WhoWeAre from "../../components/about/WhoWeAre";
import Impact from "../../components/about/Impact";
import Counties from "../../components/about/Counties";
import Foundation from "../../components/about/Foundation";
import Pillars from "../../components/about/Pillars";

function About() {
  return (
    <>
      <Navbar />

      <AboutHero />

      <WhoWeAre />

      <Foundation />
      
      <OurJourney />

      <Impact />

      <LeadershipStructure />

      <Counties />

      <Pillars />

      <PartnersSection />

      <JoinMovement />

      <Footer />
    </>
  );
}

export default About;
