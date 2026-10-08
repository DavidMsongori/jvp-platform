import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";
import Statistics from "../components/home/Statistics";
import About from "../components/home/About";
import Events from "../components/home/Events";
import News from "../components/home/News";
import CTA from "../components/home/CTA";

import Footer from "../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <Statistics />

        <About />

        <Events />

        <News />

        <CTA />
      </main>

      <Footer />
    </>
  );
}

export default Home;