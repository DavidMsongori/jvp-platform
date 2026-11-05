
import JVPAtOneLeaderRegistration from "../models/jvpAtOneLeaderRegistration.model.js";

const countyData = {
  Mombasa: {
    Changamwe: ["Port Reitz", "Kipevu", "Airport", "Changamwe", "Chaani"],
    Jomvu: ["Jomvu Kuu", "Miritini", "Mikindani"],
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
    Likoni: ["Mtongwe", "Shika Adabu", "Bofu", "Likoni", "Timbwani"],
    Mvita: [
      "Mji Wa Kale/Makadara",
      "Tudor",
      "Tononoka",
      "Shimanzi/Ganjoni",
      "Majengo",
    ],
  },

  Kwale: {
    Msambweni: ["Gombato Bongwe", "Ukunda", "Kinondo", "Ramisi"],
    Lungalunga: ["Pongwe/Kikoneni", "Dzombo", "Mwereni", "Vanga"],
    Matuga: ["Tsimba Golini", "Waa", "Tiwi", "Kubo South", "Mkongani"],
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
    "Kilifi South": ["Junju", "Mwarakaya", "Shimo La Tewa", "Chasimba", "Mtepeni"],
    Kaloleni: ["Mariakani", "Kayafungo", "Kaloleni", "Mwanamwinga"],
    Rabai: ["Mwawesa", "Ruruma", "Kambe/Ribe", "Rabai/Kisurutini"],
    Ganze: ["Ganze", "Bamba", "Jaribuni", "Sokoke"],
    Malindi: ["Jilore", "Kakuyuni", "Ganda", "Malindi Town", "Shella"],
    Magarini: ["Marafa", "Magarini", "Gongoni", "Adu", "Garashi", "Sabaki"],
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
    Galole: ["Mikinduni", "Chewani", "Wayu", "Garsen Central", "Kinakomba"],
    Bura: ["Madogo", "Sala", "Bangale", "Bura", "Hirimani"],
  },

  Lamu: {
    "Lamu East": ["Faza", "Kiunga", "Basuba"],
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
    Voi: ["Mbololo", "Sagalla", "Kaloleni", "Marungu", "Kasigau", "Ngolia"],
    Wundanyi: [
      "Wundanyi/Mbale",
      "Werugha",
      "Wumingu/Kishushe",
      "Mwanda/Mgange",
    ],
    Taveta: ["Chala", "Mahoo", "Bomani", "Mata", "Mboghoni"],
    Mwatate: ["Ronge", "Mwatate", "Bura", "Chawia", "Wusi/Kishamba"],
  },
};

const normalizeKenyanPhone = (phone) => {
  let normalized = String(phone || "").replace(/[\s\-()]/g, "");

  if (normalized.startsWith("0")) {
    normalized = `+254${normalized.slice(1)}`;
  } else if (normalized.startsWith("254")) {
    normalized = `+${normalized}`;
  } else if (/^[17]\d{8}$/.test(normalized)) {
    normalized = `+254${normalized}`;
  }

  return normalized;
};

export const registerJVPAtOneLeader = async (req, res) => {
  try {
   const {
  fullName,
  position,
  phone,
  county,
  constituency,
  ward,
  pickupTown,
  tShirtSize,
} = req.body;

    // Check required fields
  if (
  !fullName?.trim() ||
  !position?.trim() ||
  !phone?.trim() ||
  !county ||
  !constituency ||
  !ward ||
  !pickupTown?.trim() ||
  !tShirtSize
) {
      return res.status(400).json({
        success: false,
        message: "Please complete all registration fields.",
      });
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizeKenyanPhone(phone);

    if (!/^\+254[17]\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Kenyan phone number.",
      });
    }

    // Validate county, constituency and ward
    const countyConstituencies = countyData[county];

    if (!countyConstituencies) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid county.",
      });
    }

    const constituencyWards = countyConstituencies[constituency];

    if (!constituencyWards || !constituencyWards.includes(ward)) {
      return res.status(400).json({
        success: false,
        message: "The selected constituency or ward is invalid.",
      });
    }

    // Validate T-shirt size
    const allowedSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

    if (!allowedSizes.includes(tShirtSize)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid T-shirt size.",
      });
    }

    // Prevent duplicate registrations
    const existingRegistration =
      await JVPAtOneLeaderRegistration.findOne({
        phone: normalizedPhone,
      });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message:
          "This phone number has already been used for a leaders registration.",
      });
    }

  const registration = await JVPAtOneLeaderRegistration.create({
  fullName: fullName.trim(),
  position: position.trim(),
  phone: normalizedPhone,
  county,
  constituency,
  ward,
  pickupTown: pickupTown.trim(),
  tShirtSize,
});

    return res.status(201).json({
      success: true,
      message: "Your JVP @ 1 leaders registration was successful.",
      data: registration,
    });
  } catch (error) {
    console.error("JVP @ 1 leader registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This phone number has already been registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to complete registration. Please try again.",
    });
  }
};


export const getJVPAtOneLeaderRegistrations = async (req, res) => {
  try {
    const {
      search = "",
      county = "",
      constituency = "",
      status = "registered",
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};

    if (county) filters.county = county;
    if (constituency) filters.constituency = constituency;
    if (status !== "all") filters.registrationStatus = status;

    if (search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(escapedSearch, "i");

      filters.$or = [
        { fullName: searchRegex },
        { phone: searchRegex },
        { pickupTown: searchRegex },
        { county: searchRegex },
        { constituency: searchRegex },
        { ward: searchRegex },
      ];
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const [registrations, total] = await Promise.all([
      JVPAtOneLeaderRegistration.find(filters)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),

      JVPAtOneLeaderRegistration.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Get JVP @ 1 leader registrations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leaders registrations.",
    });
  }
};
