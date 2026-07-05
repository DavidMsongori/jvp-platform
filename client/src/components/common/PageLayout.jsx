import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";

function PageLayout({ children }) {
  return (
    <>
      <Navbar />

      <main>
        {children}
      </main>

      <Footer />
    </>
  );
}

export default PageLayout;