import dotenv from "dotenv";
import mongoose from "mongoose";

import SummitEvent from "../models/summitEvent.model.js";

dotenv.config();

/* ==========================================
   CONNECT TO DATABASE
========================================== */

const connectDatabase = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI or MONGODB_URI is missing from the environment variables."
    );
  }

  await mongoose.connect(mongoUri);

  console.log("✅ MongoDB connected.");
};

/* ==========================================
   SUMMIT EVENT DATA
========================================== */

const summitEventData = {
  title: "Coast Youth Summit 2026",

  shortTitle: "CYS 2026",

  slug: "coast-youth-summit-2026",

  description:
    "A regional youth summit bringing together young people from the six counties of Kenya's Coast Region for leadership, economic empowerment, innovation, climate action and regional development.",

  year: 2026,

  /*
   * Leave the date as null until it is officially confirmed.
   */
  summitDate: null,

  dateStatus: "to_be_communicated",

  venue: {
    name: "To be communicated",
    county: "Kilifi",
    address: "To be communicated",
    mapUrl: null,
  },

  /*
   * Registration is open immediately.
   * You can add opening and closing dates later.
   */
  registrationOpensAt: new Date(),

  registrationClosesAt: null,

  registrationStatus: "open",

  totalCapacity: 10000,

  totalRegistered: 0,

  "countyAllocations": [
  {
    "county": "Kilifi",
    "countyCode": "KLF",
    "allocatedSlots": 5000,
    "registeredCount": 0,
    "isRegistrationOpen": true
  },
  {
    "county": "Mombasa",
    "countyCode": "MSA",
    "allocatedSlots": 1000,
    "registeredCount": 0,
    "isRegistrationOpen": true
  },
  {
    "county": "Kwale",
    "countyCode": "KWL",
    "allocatedSlots": 1000,
    "registeredCount": 0,
    "isRegistrationOpen": true
  },
  {
    "county": "Taita Taveta",
    "countyCode": "TTV",
    "allocatedSlots": 1000,
    "registeredCount": 0,
    "isRegistrationOpen": true
  },
  {
    "county": "Tana River",
    "countyCode": "TNR",
    "allocatedSlots": 1000,
    "registeredCount": 0,
    "isRegistrationOpen": true
  },
  {
    "county": "Lamu",
    "countyCode": "LMU",
    "allocatedSlots": 1000,
    "registeredCount": 0,
    "isRegistrationOpen": true
  }
],

  allowMemberRegistration: true,

  allowPublicRegistration: true,

  allowMembershipInterest: true,

  ticketPrefix: "CYS",

  contactEmail: "admin@jvp.co.ke",

  contactPhone: "0740504969",

  logisticsMessage:
    "The final summit date, venue and transport logistics will be communicated through email and phone.",

  publishedAt: new Date(),

  createdBy: null,

  updatedBy: null,
};

/* ==========================================
   CREATE OR UPDATE SUMMIT EVENT
========================================== */

const seedSummitEvent = async () => {
  try {
    await connectDatabase();

    const existingEvent =
      await SummitEvent.findOne({
        slug: summitEventData.slug,
      });

    if (existingEvent) {
      const updatedEvent =
        await SummitEvent.findByIdAndUpdate(
          existingEvent._id,
          {
            $set: {
              ...summitEventData,

              /*
               * Preserve the existing registration count.
               */
              totalRegistered:
                existingEvent.totalRegistered ||
                0,

              countyAllocations:
                summitEventData.countyAllocations.map(
                  (allocation) => {
                    const currentAllocation =
                      existingEvent.countyAllocations.find(
                        (current) =>
                          current.countyCode ===
                          allocation.countyCode
                      );

                    return {
                      ...allocation,

                      registeredCount:
                        currentAllocation?.registeredCount ||
                        0,
                    };
                  }
                ),
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      console.log(
        "✅ Existing summit event updated successfully."
      );

      console.log({
        id: updatedEvent._id.toString(),
        title: updatedEvent.title,
        slug: updatedEvent.slug,
        registrationStatus:
          updatedEvent.registrationStatus,
        totalCapacity:
          updatedEvent.totalCapacity,
        totalRegistered:
          updatedEvent.totalRegistered,
      });

      return;
    }

    const summitEvent =
      await SummitEvent.create(
        summitEventData
      );

    console.log(
      "✅ Summit event created successfully."
    );

    console.log({
      id: summitEvent._id.toString(),
      title: summitEvent.title,
      slug: summitEvent.slug,
      registrationStatus:
        summitEvent.registrationStatus,
      totalCapacity:
        summitEvent.totalCapacity,
      totalRegistered:
        summitEvent.totalRegistered,
    });
  } catch (error) {
    console.error(
      "❌ Summit event seeding failed:"
    );

    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();

    console.log(
      "🔌 MongoDB connection closed."
    );
  }
};

seedSummitEvent();