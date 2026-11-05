
import { useState } from "react";
import "./JVPAtOneLeadersRegister.css";
import { registerJVPAtOneLeader } from "../services/jvpAtOneService";

// Coastal counties, constituencies and wards
const countyData = {
  Mombasa: {
    Changamwe: [
      "Port Reitz",
      "Kipevu",
      "Airport",
      "Changamwe",
      "Chaani",
    ],
    Jomvu: [
      "Jomvu Kuu",
      "Miritini",
      "Mikindani",
    ],
    Kisauni: [
      "Mjambere",
      "Junda",
      "Bamburi",
      "Mwakirunge",
      "Mtopanga",
      "Magogoni",
      "Shanzu",
    ],
    Nyali: [
      "Frere Town",
      "Ziwa La Ng'ombe",
      "Mkomani",
      "Kongowea",
      "Kadzandani",
    ],
    Likoni: [
      "Mtongwe",
      "Shika Adabu",
      "Bofu",
      "Likoni",
      "Timbwani",
    ],
    Mvita: [
      "Mji Wa Kale/Makadara",
      "Tudor",
      "Tononoka",
      "Shimanzi/Ganjoni",
      "Majengo",
    ],
  },

  Kwale: {
    Msambweni: [
      "Gombato Bongwe",
      "Ukunda",
      "Kinondo",
      "Ramisi",
    ],
    Lungalunga: [
      "Pongwe/Kikoneni",
      "Dzombo",
      "Mwereni",
      "Vanga",
    ],
    Matuga: [
      "Tsimba Golini",
      "Waa",
      "Tiwi",
      "Kubo South",
      "Mkongani",
    ],
    Kinango: [
      "Ndavaya",
      "Puma",
      "Kinango",
      "Mackinnon Road",
      "Chengoni/Samburu",
      "Mwavumbo",
      "Kasemeni",
    ],
  },

  Kilifi: {
    "Kilifi North": [
      "Tezo",
      "Sokoni",
      "Kibarani",
      "Dabaso",
      "Matsangoni",
      "Watamu",
      "Mnarani",
    ],
    "Kilifi South": [
      "Junju",
      "Mwarakaya",
      "Shimo La Tewa",
      "Chasimba",
      "Mtepeni",
    ],
    Kaloleni: [
      "Mariakani",
      "Kayafungo",
      "Kaloleni",
      "Mwanamwinga",
    ],
    Rabai: [
      "Mwawesa",
      "Ruruma",
      "Kambe/Ribe",
      "Rabai/Kisurutini",
    ],
    Ganze: [
      "Ganze",
      "Bamba",
      "Jaribuni",
      "Sokoke",
    ],
    Malindi: [
      "Jilore",
      "Kakuyuni",
      "Ganda",
      "Malindi Town",
      "Shella",
    ],
    Magarini: [
      "Marafa",
      "Magarini",
      "Gongoni",
      "Adu",
      "Garashi",
      "Sabaki",
    ],
  },

  "Tana River": {
    Garsen: [
      "Kipini East",
      "Garsen South",
      "Kipini West",
      "Garsen Central",
      "Garsen West",
      "Garsen North",
      "Kipini Central",
    ],
    Galole: [
      "Mikinduni",
      "Chewani",
      "Wayu",
      "Garsen Central",
      "Kinakomba",
    ],
    Bura: [
      "Madogo",
      "Sala",
      "Bangale",
      "Bura",
      "Hirimani",
    ],
  },

  Lamu: {
    "Lamu East": [
      "Faza",
      "Kiunga",
      "Basuba",
    ],
    "Lamu West": [
      "Shela",
      "Mkomani",
      "Hindi",
      "Mkunumbi",
      "Hongwe",
      "Bahari",
      "Witu",
    ],
  },

  "Taita Taveta": {
    Voi: [
      "Mbololo",
      "Sagalla",
      "Kaloleni",
      "Marungu",
      "Kasigau",
      "Ngolia",
    ],
    Wundanyi: [
      "Wundanyi/Mbale",
      "Werugha",
      "Wumingu/Kishushe",
      "Mwanda/Mgange",
    ],
    Taveta: [
      "Chala",
      "Mahoo",
      "Bomani",
      "Mata",
      "Mboghoni",
    ],
    Mwatate: [
      "Ronge",
      "Mwatate",
      "Bura",
      "Chawia",
      "Wusi/Kishamba",
    ],
  },
};

const counties = Object.keys(countyData);

const tShirtSizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
];

const initialForm = {
  fullName: "",
  position: "",
  phone: "",
  county: "",
  constituency: "",
  ward: "",
  pickupTown: "",
  tShirtSize: "",
};

export default function JVPAtOneLeadersRegister() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load constituencies based on selected county
  const constituencies = form.county
    ? Object.keys(countyData[form.county])
    : [];

  // Load wards based on selected constituency
  const wards =
    form.county && form.constituency
      ? countyData[form.county][form.constituency]
      : [];

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,

      ...(name === "county"
        ? { constituency: "", ward: "" }
        : {}),

      ...(name === "constituency"
        ? { ward: "" }
        : {}),
    }));

    setError("");
    setSuccess("");
  };

  // Submit leaders registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await registerJVPAtOneLeader(form);

      setSuccess(
        response.message ||
          "Your leaders registration has been submitted successfully!"
      );

      setForm({ ...initialForm });
    } catch (err) {
      setError(
        err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="leaders-registration-page">
      <section className="leaders-registration-container">

        <div className="leaders-registration-header">
          <span className="leaders-registration-label">
            JVP @ 1 ANNIVERSARY
          </span>

          <h1>Leaders Registration</h1>

          <p>
            Register your details as a leader attending the
            JVP @ 1 First Anniversary Celebration in Lamu County.
          </p>
        </div>

        <form
          className="leaders-registration-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
  <label htmlFor="position">
    Leadership Position
  </label>

  <input
    id="position"
    type="text"
    name="position"
    value={form.position}
    onChange={handleChange}
    placeholder="e.g. County Youth Governor, Youth MP, Speaker"
    minLength={2}
    maxLength={120}
    required
  />
</div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 07XXXXXXXX"
              autoComplete="tel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="county">
              County
            </label>

            <select
              id="county"
              name="county"
              value={form.county}
              onChange={handleChange}
              required
            >
              <option value="">
                Select your county
              </option>

              {counties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="constituency">
              Constituency
            </label>

            <select
              id="constituency"
              name="constituency"
              value={form.constituency}
              onChange={handleChange}
              disabled={!form.county}
              required
            >
              <option value="">
                Select constituency
              </option>

              {constituencies.map((constituency) => (
                <option
                  key={constituency}
                  value={constituency}
                >
                  {constituency}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ward">
              Ward
            </label>

            <select
              id="ward"
              name="ward"
              value={form.ward}
              onChange={handleChange}
              disabled={!form.constituency}
              required
            >
              <option value="">
                Select ward
              </option>

              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pickupTown">
              Nearest Town for Pick-up
            </label>

            <input
              id="pickupTown"
              type="text"
              name="pickupTown"
              value={form.pickupTown}
              onChange={handleChange}
              placeholder="Enter your nearest town"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tShirtSize">
              T-Shirt Size
            </label>

            <select
              id="tShirtSize"
              name="tShirtSize"
              value={form.tShirtSize}
              onChange={handleChange}
              required
            >
              <option value="">
                Select T-shirt size
              </option>

              {tShirtSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Registration feedback */}
          {error && (
            <div
              className="registration-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="registration-success"
              role="status"
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            className="leaders-submit-button"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Submit Registration"}
          </button>

        </form>
      </section>
    </main>
  );
}
