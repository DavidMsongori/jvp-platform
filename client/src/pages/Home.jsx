import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";
import Statistics from "../components/home/Statistics";
import About from "../components/home/About";
import Programs from "../components/home/Programs";
import Events from "../components/home/Events";
import News from "../components/home/News";
import Partners from "../components/home/Partners";
import CTA from "../components/home/CTA";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Statistics />
      <About />
      <Programs />
      <Events />
      <News />
      <Partners />
      <CTA />
      <Footer />
    </>
  );
}

export default Home;