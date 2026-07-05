import Navbar from "../components/Layout/Navbar";

import Hero from "../components/Home/Hero";
import Statistics from "../components/Home/Statistics";
import About from "../components/Home/About";
import Programs from "../components/Home/Programs";
import Events from "../components/Home/Events";
import News from "../components/Home/News";
import Partners from "../components/Home/Partners";
import CTA from "../components/Home/CTA";
import Footer from "../components/Layout/Footer";

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
