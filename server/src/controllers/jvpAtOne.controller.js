
import JVPAtOneRegistration from "../models/jvpAtOneRegistration.model.js";

const LAMU_WARDS = {
  "Lamu East": ["Faza", "Kiunga", "Basuba"],
  "Lamu West": [
    "Shela",
    "Mkomani",
    "Hindi",
    "Mkunumbi",
    "Hongwe",
    "Bahari",
    "Witu",
    "Mpeketoni",
  ],
};

const normalizeKenyanPhone = (value) => {
  let phone = String(value || "").replace(/[\s()-]/g, "");

  if (phone.startsWith("0")) {
    phone = `+254${phone.slice(1)}`;
  } else if (phone.startsWith("254")) {
    phone = `+${phone}`;
  }

  if (!/^\+254[17]\d{8}$/.test(phone)) {
    return null;
  }

  return phone;
};

/*
 * Atomically allocate a sequential registration number for the year.
 * MongoDB's findOneAndUpdate prevents concurrent requests from
 * receiving the same sequence number.
 */
const generateRegistrationNumber = async () => {
  const year = new Date().getFullYear();
  const counterId = `jvpAtOneRegistration-${year}`;

  const result = await JVPAtOneRegistration.db
    .collection("counters")
    .findOneAndUpdate(
      { _id: counterId },
      { $inc: { sequence: 1 } },
      {
        upsert: true,
        returnDocument: "after",
        includeResultMetadata: false,
      }
    );

  const counter = result?.value ?? result;
  const sequence = counter?.sequence;

  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Could not generate a registration number.");
  }

  return `JVP1-${year}-${String(sequence).padStart(4, "0")}`;
};

const registrationResponse = (registration) => ({
  id: registration._id,
  registrationNumber: registration.registrationNumber,
  fullName: registration.fullName,
  phone: registration.phone,
  constituency: registration.constituency,
  ward: registration.ward,
  registrationStatus: registration.registrationStatus,
  createdAt: registration.createdAt,
});

// Public registration endpoint
export const registerJVPAtOne = async (req, res, next) => {
  try {
    const { fullName, phone, constituency, ward } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      !phone ||
      !constituency ||
      !ward
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your full name, phone number, constituency and ward.",
      });
    }

    const normalizedPhone = normalizeKenyanPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Kenyan mobile number, e.g. 0712345678.",
      });
    }

    if (!LAMU_WARDS[constituency]) {
      return res.status(400).json({
        success: false,
        message: "Select a valid Lamu County constituency.",
      });
    }

    if (!LAMU_WARDS[constituency].includes(ward)) {
      return res.status(400).json({
        success: false,
        message: "The selected ward does not belong to that constituency.",
      });
    }

    // If this phone is already registered, return its existing ticket.
    const existingRegistration = await JVPAtOneRegistration.findOne({
      phone: normalizedPhone,
      registrationStatus: "registered",
    });

    if (existingRegistration) {
      return res.status(200).json({
        success: true,
        existingRegistration: true,
        message:
          "This phone number is already registered. Here is your existing ticket.",
        registration: registrationResponse(existingRegistration),
      });
    }

    // Allocate the ticket number on the server, not in the browser.
    const registrationNumber = await generateRegistrationNumber();

    const registration = await JVPAtOneRegistration.create({
      registrationNumber,
      fullName: fullName.trim(),
      phone: normalizedPhone,
      constituency,
      ward,
    });

    return res.status(201).json({
      success: true,
      existingRegistration: false,
      message: "Registration for JVP @ 1 was successful.",
      registration: registrationResponse(registration),
    });
  } catch (error) {
    // Pass errors to the application's existing error handler.
    next(error);
  }
};

// Admin endpoint: view registered youths
export const getJVPAtOneRegistrations = async (req, res, next) => {
  try {
    const {
      search = "",
      constituency = "",
      ward = "",
      status = "registered",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 20)
    );

    const filter = {};

    // Default to active registrations. Use status=all to include cancelled records.
    if (status !== "all") {
      if (!["registered", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration status filter.",
        });
      }

      filter.registrationStatus = status;
    }

    if (constituency) {
      if (!LAMU_WARDS[constituency]) {
        return res.status(400).json({
          success: false,
          message: "Invalid constituency filter.",
        });
      }

      filter.constituency = constituency;
    }

    if (ward) {
      const validWards = constituency
        ? LAMU_WARDS[constituency]
        : Object.values(LAMU_WARDS).flat();

      if (!validWards.includes(ward)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ward filter.",
        });
      }

      filter.ward = ward;
    }

    const searchTerm = String(search).trim();

    if (searchTerm) {
      const escapedSearch = searchTerm.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { fullName: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } },
        {
          registrationNumber: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    const [registrations, total] = await Promise.all([
      JVPAtOneRegistration.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .select(
          "registrationNumber fullName phone constituency ward registrationStatus createdAt"
        )
        .lean(),

      JVPAtOneRegistration.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};
