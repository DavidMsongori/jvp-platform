import { useState } from "react";
import "./Counties.css";

import kenyaMap from "../../assets/images/kenya-counties.png";
import counties from "./countiesData";

function Counties() {

  const [selectedCounty, setSelectedCounty] = useState("Mombasa");

  const county = counties[selectedCounty];

  const displayNames = {
    Mombasa: "Mombasa",
    Kwale: "Kwale",
    Kilifi: "Kilifi",
    TanaRiver: "Tana River",
    Lamu: "Lamu",
    TaitaTaveta: "Taita Taveta",
  };

  return (

    <section className="counties">

      <div className="container">

        <div className="section-title">

          <span>OUR PRESENCE</span>

          <h2>Across Kenya's Coast Region</h2>

          <p>
            Hover over any county to discover JVP programmes,
            opportunities, partnerships and upcoming activities.
          </p>

        </div>

        <div className="counties-wrapper">

          {/* ===========================
              LEFT - MAP
          ============================ */}

          <div className="map-container">

            <img
              src={kenyaMap}
              alt="Kenya Counties"
              className="kenya-map"
            />

            {/* Mombasa */}

            <button
              className="county-marker mombasa"
              onMouseEnter={() => setSelectedCounty("Mombasa")}
            >
              <span>Mombasa</span>
            </button>

            {/* Kwale */}

            <button
              className="county-marker kwale"
              onMouseEnter={() => setSelectedCounty("Kwale")}
            >
              <span>Kwale</span>
            </button>

            {/* Kilifi */}

            <button
              className="county-marker kilifi"
              onMouseEnter={() => setSelectedCounty("Kilifi")}
            >
              <span>Kilifi</span>
            </button>

            {/* Tana River */}

            <button
              className="county-marker tana"
              onMouseEnter={() => setSelectedCounty("TanaRiver")}
            >
              <span>Tana River</span>
            </button>

            {/* Lamu */}

            <button
              className="county-marker lamu"
              onMouseEnter={() => setSelectedCounty("Lamu")}
            >
              <span>Lamu</span>
            </button>

            {/* Taita Taveta */}

            <button
              className="county-marker taita"
              onMouseEnter={() => setSelectedCounty("TaitaTaveta")}
            >
              <span>Taita Taveta</span>
            </button>

          </div>

          {/* ===========================
              RIGHT - INFORMATION CARD
          ============================ */}

          <div
            className="county-card"
            key={selectedCounty}
          >

            <h3>
              📍 {displayNames[selectedCounty]}
            </h3>

            <div className="county-stat">

              <div>

                <h2>{county.members}</h2>

                <small>Registered Members</small>

              </div>

              <div>

                <h2>{county.opportunities}</h2>

                <small>Opportunities</small>

              </div>

            </div>

            <h4>Current Programmes</h4>

            <div className="program-list">

              {county.programs.map((program, index) => (

                <div
                  className="program-chip"
                  key={index}
                >

                  {program}

                </div>

              ))}

            </div>

            <div className="county-extra">

              <p>

                <strong>Partner:</strong>{" "}

                {county.partner}

              </p>

              <p>

                <strong>Upcoming Event:</strong>{" "}

                {county.upcoming}

              </p>

            </div>

            <button>

              Explore {displayNames[selectedCounty]}

            </button>

          </div>

        </div>

      </div>

    </section>

  );

}

export default Counties;