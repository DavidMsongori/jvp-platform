import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/* ==========================================
   DOCUMENT CONFIGURATION
========================================== */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 419.53;

const COLORS = Object.freeze({
  primary: "#086838",
  primaryDark: "#064a29",
  secondary: "#d89c16",
  background: "#f4f7f5",
  white: "#ffffff",
  text: "#26332c",
  muted: "#68766e",
  border: "#dce5df",
  lightGreen: "#eaf5ee",
  lightGold: "#fff6dc",
});

/* ==========================================
   TEXT HELPERS
========================================== */

const safeText = (
  value,
  fallback = "To be communicated"
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
};

const formatSummitDate = ({
  summitDate,
  dateStatus,
}) => {
  if (
    dateStatus === "to_be_announced" ||
    dateStatus === "tba" ||
    !summitDate
  ) {
    return "To be communicated";
  }

  const parsedDate = new Date(summitDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "To be communicated";
  }

  return new Intl.DateTimeFormat("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const formatVenue = (venue) => {
  if (!venue) {
    return "Kilifi County – exact venue to be communicated";
  }

  if (typeof venue === "string") {
    return venue;
  }

  if (typeof venue === "object") {
    const formattedVenue = [
      venue.name,
      venue.address,
      venue.town,
      venue.county,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      formattedVenue ||
      "Kilifi County – exact venue to be communicated"
    );
  }

  return "Kilifi County – exact venue to be communicated";
};

/* ==========================================
   FILE HELPERS
========================================== */

const ensureOutputDirectory = async (
  outputPath
) => {
  const outputDirectory =
    path.dirname(outputPath);

  await fsPromises.mkdir(
    outputDirectory,
    {
      recursive: true,
    }
  );
};

const findLogoPath = async () => {
  const configuredLogo =
    process.env.JVP_LOGO_PATH;

  const candidatePaths = [
    configuredLogo,

    path.join(
      process.cwd(),
      "src",
      "assets",
      "jvp-logo.png"
    ),

    path.join(
      process.cwd(),
      "src",
      "assets",
      "jvp-logo.jpg"
    ),

    path.join(
      process.cwd(),
      "public",
      "images",
      "branding",
      "jvp-logo.png"
    ),
  ].filter(Boolean);

  for (const logoPath of candidatePaths) {
    try {
      await fsPromises.access(logoPath);
      return logoPath;
    } catch {
      // Continue checking other locations.
    }
  }

  return null;
};

/* ==========================================
   QR CODE
========================================== */

const generateQrCodeBuffer = async (
  verificationUrl
) => {
  const verificationContent =
    verificationUrl ||
    "https://jvp.co.ke/summit/verify";

  const dataUrl =
    await QRCode.toDataURL(
      verificationContent,
      {
        type: "image/png",
        errorCorrectionLevel: "H",
        margin: 1,
        width: 350,
      }
    );

  const base64Data = dataUrl.replace(
    /^data:image\/png;base64,/,
    ""
  );

  return Buffer.from(
    base64Data,
    "base64"
  );
};

/* ==========================================
   DRAW ROUNDED BOX
========================================== */

const drawRoundedBox = ({
  doc,
  x,
  y,
  width,
  height,
  radius = 8,
  fillColor,
  strokeColor,
  lineWidth = 1,
}) => {
  doc.save();

  doc.roundedRect(
    x,
    y,
    width,
    height,
    radius
  );

  if (fillColor) {
    doc.fillColor(fillColor).fill();
  }

  if (strokeColor) {
    doc
      .roundedRect(
        x,
        y,
        width,
        height,
        radius
      )
      .lineWidth(lineWidth)
      .strokeColor(strokeColor)
      .stroke();
  }

  doc.restore();
};

/* ==========================================
   DRAW DETAIL ROW
========================================== */

const drawDetailRow = ({
  doc,
  label,
  value,
  x,
  y,
  labelWidth = 90,
  valueWidth = 230,
}) => {
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      label.toUpperCase(),
      x,
      y,
      {
        width: labelWidth,
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      safeText(value, "Not provided"),
      x + labelWidth,
      y - 1,
      {
        width: valueWidth,
        height: 22,
        ellipsis: true,
      }
    );
};

/* ==========================================
   DRAW LOGO
========================================== */

const drawLogo = ({
  doc,
  logoPath,
}) => {
  if (logoPath) {
    try {
      doc.image(
        logoPath,
        28,
        24,
        {
          fit: [58, 58],
          align: "center",
          valign: "center",
        }
      );

      return;
    } catch (error) {
      console.warn(
        "Could not render the JVP logo on the summit ticket:",
        error.message
      );
    }
  }

  doc
    .circle(57, 52, 25)
    .fillColor(COLORS.white)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.primary)
    .text(
      "JVP",
      36,
      44,
      {
        width: 42,
        align: "center",
      }
    );
};

/* ==========================================
   GENERATE PDF
========================================== */

export const generateSummitTicketPdf =
  async ({
    registration,
    summitEvent,
    verificationUrl,
    outputPath,
  }) => {
    if (!registration) {
      throw new Error(
        "Registration details are required to generate the summit ticket."
      );
    }

    if (!summitEvent) {
      throw new Error(
        "Summit event details are required to generate the summit ticket."
      );
    }

    if (!registration.ticketNumber) {
      throw new Error(
        "The summit ticket number is required."
      );
    }

    if (!outputPath) {
      throw new Error(
        "The summit ticket output path is required."
      );
    }

    await ensureOutputDirectory(
      outputPath
    );

    const [
      qrCodeBuffer,
      logoPath,
    ] = await Promise.all([
      generateQrCodeBuffer(
        verificationUrl
      ),
      findLogoPath(),
    ]);

    const summitDate =
      formatSummitDate({
        summitDate:
          summitEvent.summitDate,

        dateStatus:
          summitEvent.dateStatus,
      });

    const venue = formatVenue(
      summitEvent.venue
    );

    return new Promise(
      (resolve, reject) => {
        const doc = new PDFDocument({
          size: [
            PAGE_WIDTH,
            PAGE_HEIGHT,
          ],

          margins: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          },

          info: {
            Title:
              `${summitEvent.title || "Coast Youth Summit"} Ticket`,

            Author:
              "Jumuiya ya Vijana wa Pwani",

            Subject:
              registration.ticketNumber,

            Keywords:
              "Coast Youth Summit, JVP, summit ticket",
          },
        });

        const outputStream =
          fs.createWriteStream(
            outputPath
          );

        outputStream.on(
          "finish",
          () => {
            resolve({
              outputPath,

              ticketNumber:
                registration.ticketNumber,
            });
          }
        );

        outputStream.on(
          "error",
          reject
        );

        doc.on("error", reject);

        doc.pipe(outputStream);

        /* ==================================
           PAGE BACKGROUND
        ================================== */

        doc
          .rect(
            0,
            0,
            PAGE_WIDTH,
            PAGE_HEIGHT
          )
          .fillColor(
            COLORS.background
          )
          .fill();

        /* ==================================
           HEADER
        ================================== */

        doc
          .rect(
            0,
            0,
            PAGE_WIDTH,
            104
          )
          .fillColor(
            COLORS.primary
          )
          .fill();

        doc
          .rect(
            0,
            98,
            PAGE_WIDTH,
            6
          )
          .fillColor(
            COLORS.secondary
          )
          .fill();

        drawLogo({
          doc,
          logoPath,
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(
            COLORS.lightGreen
          )
          .text(
            "JUMUIYA YA VIJANA WA PWANI",
            98,
            26,
            {
              width: 330,
              characterSpacing: 1,
            }
          );

        doc
          .font("Helvetica-Bold")
          .fontSize(22)
          .fillColor(COLORS.white)
          .text(
            safeText(
              summitEvent.shortTitle,
              "COAST YOUTH SUMMIT"
            ),
            98,
            43,
            {
              width: 360,
              height: 31,
              ellipsis: true,
            }
          );

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(
            COLORS.lightGreen
          )
          .text(
            safeText(
              summitEvent.title,
              "Coast Youth Summit 2026"
            ),
            98,
            76,
            {
              width: 360,
              height: 18,
              ellipsis: true,
            }
          );

        drawRoundedBox({
          doc,
          x: 470,
          y: 28,
          width: 96,
          height: 48,
          radius: 8,
          fillColor: COLORS.white,
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(COLORS.muted)
          .text(
            "ADMISSION",
            478,
            36,
            {
              width: 80,
              align: "center",
            }
          );

        doc
          .font("Helvetica-Bold")
          .fontSize(15)
          .fillColor(
            COLORS.primary
          )
          .text(
            "TICKET",
            478,
            51,
            {
              width: 80,
              align: "center",
            }
          );

        /* ==================================
           TICKET NUMBER
        ================================== */

        drawRoundedBox({
          doc,
          x: 25,
          y: 122,
          width: 360,
          height: 61,
          radius: 10,
          fillColor:
            COLORS.lightGreen,
          strokeColor:
            COLORS.border,
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(COLORS.muted)
          .text(
            "OFFICIAL TICKET NUMBER",
            43,
            136,
            {
              width: 315,
              characterSpacing: 1.2,
            }
          );

        doc
          .font("Helvetica-Bold")
          .fontSize(23)
          .fillColor(
            COLORS.primary
          )
          .text(
            registration.ticketNumber,
            43,
            151,
            {
              width: 315,
              height: 28,
              ellipsis: true,
            }
          );

        /* ==================================
           PARTICIPANT INFORMATION
        ================================== */

        drawRoundedBox({
          doc,
          x: 25,
          y: 197,
          width: 360,
          height: 151,
          radius: 10,
          fillColor: COLORS.white,
          strokeColor:
            COLORS.border,
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(
            COLORS.primary
          )
          .text(
            "PARTICIPANT INFORMATION",
            43,
            211,
            {
              width: 320,
            }
          );

        doc
          .moveTo(43, 229)
          .lineTo(367, 229)
          .lineWidth(0.7)
          .strokeColor(
            COLORS.border
          )
          .stroke();

        drawDetailRow({
          doc,
          label: "Name",
          value:
            registration.fullName,
          x: 43,
          y: 241,
        });

        drawDetailRow({
          doc,
          label: "County",
          value:
            registration.county,
          x: 43,
          y: 265,
        });

        drawDetailRow({
          doc,
          label: "Constituency",
          value:
            registration.constituency,
          x: 43,
          y: 289,
        });

        drawDetailRow({
          doc,
          label: "Ward",
          value:
            registration.ward,
          x: 43,
          y: 313,
        });

        /* ==================================
           QR CODE SECTION
        ================================== */

        drawRoundedBox({
          doc,
          x: 402,
          y: 122,
          width: 168,
          height: 226,
          radius: 10,
          fillColor: COLORS.white,
          strokeColor:
            COLORS.border,
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(
            COLORS.primary
          )
          .text(
            "SCAN TO VERIFY",
            417,
            137,
            {
              width: 138,
              align: "center",
            }
          );

        doc.image(
          qrCodeBuffer,
          428,
          159,
          {
            fit: [116, 116],
            align: "center",
            valign: "center",
          }
        );

        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(COLORS.muted)
          .text(
            "Present this ticket at the registration desk. Each QR code is unique and valid for one participant.",
            421,
            287,
            {
              width: 130,
              align: "center",
              lineGap: 2,
            }
          );

        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(
            COLORS.secondary
          )
          .text(
            safeText(
              registration.nationalIdMasked,
              "ID verified"
            ),
            421,
            329,
            {
              width: 130,
              align: "center",
            }
          );

        /* ==================================
           EVENT DETAILS FOOTER
        ================================== */

        drawRoundedBox({
          doc,
          x: 25,
          y: 363,
          width: 545,
          height: 39,
          radius: 8,
          fillColor:
            COLORS.primaryDark,
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor(
            COLORS.lightGreen
          )
          .text(
            "DATE",
            40,
            372,
            {
              width: 34,
            }
          );

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.white)
          .text(
            summitDate,
            74,
            371,
            {
              width: 155,
              height: 22,
              ellipsis: true,
            }
          );

        doc
          .moveTo(239, 370)
          .lineTo(239, 394)
          .lineWidth(0.5)
          .strokeColor("#6e8d7c")
          .stroke();

        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor(
            COLORS.lightGreen
          )
          .text(
            "VENUE",
            253,
            372,
            {
              width: 42,
            }
          );

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.white)
          .text(
            venue,
            297,
            371,
            {
              width: 255,
              height: 22,
              ellipsis: true,
            }
          );

        doc.end();
      }
    );
  };