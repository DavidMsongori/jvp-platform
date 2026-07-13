import Counter from "../models/Counter.js";

/* ==========================================
   COUNTY CODES
========================================== */

const COUNTY_CODES = {
  Mombasa: "MSA",
  Kwale: "KWL",
  Kilifi: "KLF",
  "Tana River": "TRV",
  Lamu: "LMU",
  "Taita Taveta": "TTV",
};

/* ==========================================
   GENERATE MEMBERSHIP NUMBER
========================================== */

export const generateMembershipNumber = async (
  county,
  session = null
) => {

  const countyCode = COUNTY_CODES[county];

  if (!countyCode) {

    throw new Error("Invalid county.");

  }

  const year = new Date().getFullYear();

  const key = `MEMBER-${countyCode}-${year}`;

  let query = Counter.findOneAndUpdate(

    { key },

    {

      $inc: {

        sequence: 1,

      },

    },

    {

      new: true,

      upsert: true,

      setDefaultsOnInsert: true,

    }

  );

  if (session) {

    query = query.session(session);

  }

  const counter = await query;

  const sequence = String(counter.sequence)
    .padStart(5, "0");

  return `JVP/${countyCode}/${year}/${sequence}`;

};

export default generateMembershipNumber;