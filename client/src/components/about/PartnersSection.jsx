import "./PartnersSection.css";

import partner1 from "../../assets/partners/partner1.png";
import partner2 from "../../assets/partners/partner2.png";
import partner3 from "../../assets/partners/partner3.png";
import partner4 from "../../assets/partners/partner4.png";
import partner5 from "../../assets/partners/partner5.png";
import partner6 from "../../assets/partners/partner6.png";
import partner7 from "../../assets/partners/partner7.png";
import partner8 from "../../assets/partners/partner8.png";
import partner9 from "../../assets/partners/partner9.png";
import partner10 from "../../assets/partners/partner10.png";
import partner11 from "../../assets/partners/partner11.png";

const partners = [
  partner1,
  partner2,
  partner3,
  partner4,
  partner5,
  partner6,
  partner7,
  partner8,
  partner9,
  partner10,
  partner11,
];

function PartnersSection() {
  return (
    <section className="partners-section">

      <div className="container">

        <div className="section-title">

          <span>OUR PARTNERS</span>

          <h2>Working Together For Greater Impact</h2>

          <p>
            We collaborate with government institutions,
            development partners, private sector,
            educational institutions and civil society
            organizations to create opportunities for
            young people.
          </p>

        </div>

        <div className="partners-slider">

          <div className="partners-track">

            {[...partners, ...partners].map((logo, index) => (

              <div
                className="partner-logo"
                key={index}
              >

                <img
                  src={logo}
                  alt="Partner"
                />

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>
  );
}

export default PartnersSection;