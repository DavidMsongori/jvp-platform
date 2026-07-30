/* ==========================================
   SUPPORTED COUNTY CODES
========================================== */

const SUPPORTED_COUNTY_CODES =
  Object.freeze({
    KILIFI: "KLF",
    MOMBASA: "MSA",
    KWALE: "KWL",
    "TAITA TAVETA": "TTV",
    "TANA RIVER": "TNR",
    LAMU: "LMU",
  });

const VALID_COUNTY_CODES = new Set(
  Object.values(SUPPORTED_COUNTY_CODES)
);

/* ==========================================
   NORMALIZE COUNTY CODE
========================================== */

const normalizeCountyCode = (
  countyCode
) => {
  if (!countyCode) {
    throw new Error(
      "County code is required to generate a summit ticket number."
    );
  }

  const normalizedCode = String(
    countyCode
  )
    .trim()
    .toUpperCase();

  if (
    !VALID_COUNTY_CODES.has(normalizedCode)
  ) {
    throw new Error(
      `Unsupported summit county code: ${normalizedCode}.`
    );
  }

  return normalizedCode;
};

/* ==========================================
   DETERMINE SEQUENCE LENGTH
========================================== */

const determineSequenceLength = ({
  sequence,
  allocatedSlots,
}) => {
  const minimumLength = 4;

  const allocationLength =
    Number.isInteger(allocatedSlots) &&
    allocatedSlots > 0
      ? String(allocatedSlots).length
      : minimumLength;

  const sequenceLength =
    String(sequence).length;

  return Math.max(
    minimumLength,
    allocationLength,
    sequenceLength
  );
};

/* ==========================================
   GENERATE SUMMIT TICKET NUMBER
========================================== */

export const generateSummitTicketNumber = ({
  prefix = "CYS",
  countyCode,
  sequence,
  allocatedSlots,
}) => {
  const normalizedPrefix = String(
    prefix || "CYS"
  )
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!normalizedPrefix) {
    throw new Error(
      "A valid ticket prefix is required."
    );
  }

  const normalizedCountyCode =
    normalizeCountyCode(countyCode);

  const numericSequence = Number(sequence);

  if (
    !Number.isInteger(numericSequence) ||
    numericSequence < 1
  ) {
    throw new Error(
      "Ticket sequence must be a positive integer."
    );
  }

  if (
    allocatedSlots !== undefined &&
    allocatedSlots !== null
  ) {
    const numericAllocation =
      Number(allocatedSlots);

    if (
      !Number.isInteger(
        numericAllocation
      ) ||
      numericAllocation < 1
    ) {
      throw new Error(
        "Allocated slots must be a positive integer."
      );
    }

    if (
      numericSequence >
      numericAllocation
    ) {
      throw new Error(
        `Ticket sequence ${numericSequence} exceeds the allocated county slots of ${numericAllocation}.`
      );
    }
  }

  const sequenceLength =
    determineSequenceLength({
      sequence: numericSequence,
      allocatedSlots:
        allocatedSlots === undefined
          ? null
          : Number(allocatedSlots),
    });

  const paddedSequence = String(
    numericSequence
  ).padStart(sequenceLength, "0");

  return [
    normalizedPrefix,
    normalizedCountyCode,
    paddedSequence,
  ].join("/");
};

/* ==========================================
   GET COUNTY CODE
========================================== */

export const getSummitCountyCode = (
  county
) => {
  if (!county) {
    throw new Error(
      "County name is required."
    );
  }

  const normalizedCounty = String(county)
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  const countyCode =
    SUPPORTED_COUNTY_CODES[
      normalizedCounty
    ];

  if (!countyCode) {
    throw new Error(
      `Summit registration is not configured for ${county}.`
    );
  }

  return countyCode;
};

/* ==========================================
   VALIDATE TICKET NUMBER
========================================== */

export const isValidSummitTicketNumber = (
  ticketNumber
) => {
  if (
    typeof ticketNumber !== "string"
  ) {
    return false;
  }

  const normalizedTicketNumber =
    ticketNumber.trim().toUpperCase();

  const pattern =
    /^CYS\/(KLF|MSA|KWL|TTV|TNR|LMU)\/\d{3,4}$/;

  return pattern.test(
    normalizedTicketNumber
  );
};

/* ==========================================
   PARSE TICKET NUMBER
========================================== */

export const parseSummitTicketNumber = (
  ticketNumber
) => {
  if (
    !isValidSummitTicketNumber(
      ticketNumber
    )
  ) {
    throw new Error(
      "The summit ticket number is invalid."
    );
  }

  const [
    prefix,
    countyCode,
    sequence,
  ] = ticketNumber
    .trim()
    .toUpperCase()
    .split("/");

  return {
    prefix,
    countyCode,
    sequence: Number(sequence),
    formattedSequence: sequence,
  };
};

export {
  SUPPORTED_COUNTY_CODES,
};