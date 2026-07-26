import MeetingCounter from "../models/meetingCounter.model.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const MEETING_NUMBER_PREFIX = "JVP";
const MEETING_NUMBER_CATEGORY = "MTG";
const SEQUENCE_LENGTH = 5;
const MAX_RETRIES = 5;

/* ==========================================================
   HELPERS
========================================================== */

const formatSequence = (sequence) => {
  return String(sequence).padStart(
    SEQUENCE_LENGTH,
    "0"
  );
};

const buildMeetingNumber = ({
  year,
  sequence,
}) => {
  const formattedSequence =
    formatSequence(sequence);

  return [
    MEETING_NUMBER_PREFIX,
    MEETING_NUMBER_CATEGORY,
    year,
    formattedSequence,
  ].join("/");
};

/* ==========================================================
   GENERATE MEETING NUMBER
========================================================== */

export const generateMeetingNumber = async ({
  year = new Date().getFullYear(),
} = {}) => {
  const normalizedYear = Number(year);

  if (
    !Number.isInteger(normalizedYear) ||
    normalizedYear < 2000 ||
    normalizedYear > 9999
  ) {
    throw new Error(
      "A valid meeting year is required."
    );
  }

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt += 1
  ) {
    try {
      /*
       * findOneAndUpdate with $inc is atomic.
       * This prevents two meetings from receiving
       * the same sequence number.
       */
      const counter =
        await MeetingCounter.findOneAndUpdate(
          {
            year: normalizedYear,
          },
          {
            $inc: {
              sequence: 1,
            },

            $setOnInsert: {
              year: normalizedYear,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

      if (!counter) {
        throw new Error(
          "Meeting counter could not be created."
        );
      }

      const meetingNumber =
        buildMeetingNumber({
          year: normalizedYear,
          sequence: counter.sequence,
        });

      /*
       * This field is only for auditing and
       * troubleshooting. Failure to update it should
       * not invalidate the generated number.
       */
      await MeetingCounter.updateOne(
        {
          _id: counter._id,
        },
        {
          $set: {
            lastMeetingNumber:
              meetingNumber,
          },
        }
      );

      return meetingNumber;
    } catch (error) {
      lastError = error;

      /*
       * MongoDB duplicate key error may occur during
       * the first simultaneous upsert for a new year.
       * Retry the operation safely.
       */
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  throw new Error(
    lastError?.message ||
      "Failed to generate meeting number."
  );
};

/* ==========================================================
   PREVIEW NEXT NUMBER
========================================================== */

export const previewNextMeetingNumber =
  async ({
    year = new Date().getFullYear(),
  } = {}) => {
    const normalizedYear = Number(year);

    if (
      !Number.isInteger(normalizedYear) ||
      normalizedYear < 2000 ||
      normalizedYear > 9999
    ) {
      throw new Error(
        "A valid meeting year is required."
      );
    }

    const counter =
      await MeetingCounter.findOne({
        year: normalizedYear,
      }).lean();

    const nextSequence =
      (counter?.sequence || 0) + 1;

    return buildMeetingNumber({
      year: normalizedYear,
      sequence: nextSequence,
    });
  };

/* ==========================================================
   PARSE MEETING NUMBER
========================================================== */

export const parseMeetingNumber = (
  meetingNumber
) => {
  if (
    !meetingNumber ||
    typeof meetingNumber !== "string"
  ) {
    return null;
  }

  const normalizedMeetingNumber =
    meetingNumber.trim().toUpperCase();

  const pattern =
    /^JVP\/MTG\/(\d{4})\/(\d{5})$/;

  const match =
    normalizedMeetingNumber.match(pattern);

  if (!match) {
    return null;
  }

  return {
    meetingNumber:
      normalizedMeetingNumber,

    year: Number(match[1]),

    sequence: Number(match[2]),
  };
};

/* ==========================================================
   VALIDATE MEETING NUMBER
========================================================== */

export const isValidMeetingNumber = (
  meetingNumber
) => {
  return Boolean(
    parseMeetingNumber(meetingNumber)
  );
};

export default generateMeetingNumber;