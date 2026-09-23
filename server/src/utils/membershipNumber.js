import Counter from "../models/Counter.js";
import Member from "../models/Member.js";

/* ==========================================
   COUNTY CODES
========================================== */

export const COUNTY_CODES = {
  Mombasa: "MSA",
  Kwale: "KWL",
  Kilifi: "KLF",
  "Tana River": "TRV",
  Lamu: "LMU",
  "Taita Taveta": "TTV",
};

/* ==========================================
   GET NEXT COUNTER VALUE
========================================== */

const getNextCounter = async (key, session = null) => {
  let query = Counter.findOneAndUpdate(
    { key },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  if (session) {
    query = query.session(session);
  }

  const counter = await query;

  if (!counter) {
    throw new Error(
      "Unable to generate membership number."
    );
  }

  return counter;
};

/* ==========================================
   CHECK MEMBERSHIP NUMBER
========================================== */

const membershipNumberExists = async (
  memberNumber,
  session = null
) => {
  let query = Member.exists({
    memberNumber,
  });

  if (session) {
    query = query.session(session);
  }

  const exists = await query;

  return Boolean(exists);
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
    throw new Error(`Invalid county: ${county}`);
  }

  const year = new Date().getFullYear();

  const key = `MEMBER-${countyCode}-${year}`;

  const MAX_ATTEMPTS = 100;

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {
    const counter = await getNextCounter(
      key,
      session
    );

    if (
      !Number.isInteger(counter.sequence) ||
      counter.sequence < 1
    ) {
      throw new Error(
        "Invalid membership counter sequence."
      );
    }

    const sequence = String(
      counter.sequence
    ).padStart(5, "0");

    const memberNumber =
      `JVP/${countyCode}/${year}/${sequence}`;

    const exists =
      await membershipNumberExists(
        memberNumber,
        session
      );

    if (!exists) {
      return memberNumber;
    }

    console.warn(
      `Membership number collision detected: ${memberNumber}. Retrying (${attempt}/${MAX_ATTEMPTS}).`
    );
  }

  throw new Error(
    `Unable to generate a unique membership number for ${county}.`
  );
};

/* ==========================================
   EXPORT COUNTY CODE HELPER
========================================== */

export const getCountyCode = (county) => {
  return COUNTY_CODES[county] || null;
};

export default generateMembershipNumber;