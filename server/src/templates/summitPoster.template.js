/* ==========================================================
   COAST YOUTH SUMMIT ATTENDANCE POSTER

   Canvas:
   1080 × 1080 pixels

   Layout:
   - patterned outer border;
   - Coast Youth Summit header;
   - attendance message and participant details on the left;
   - background-removed participant photo on the right;
   - date and venue cards;
   - JVP branding and hashtag footer.
========================================================== */

/* ==========================================================
   DIMENSIONS
========================================================== */

export const POSTER_WIDTH = 1080;

export const POSTER_HEIGHT = 1080;

/*
 * The generator still imports PHOTO_FRAME.
 *
 * For this design, it represents the rectangular participant
 * image area instead of a circular frame.
 */
export const PHOTO_FRAME = {
   left: 450,
  top: 1,
  width: 560,
  height: 1500,

  /*
   * Retained temporarily for compatibility with any generator
   * code that still reads PHOTO_FRAME.size.
   */
  size: 535,
};

/* ==========================================================
   TEXT HELPERS
========================================================== */

const escapeXml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const normalizeText = (value = "") => {
  return String(value)
    .trim()
    .replace(/\s+/g, " ");
};

const getNameFontSize = (fullName) => {
  const length = fullName.length;

  if (length <= 14) {
    return 47;
  }

  if (length <= 20) {
    return 42;
  }

  if (length <= 27) {
    return 36;
  }

  if (length <= 34) {
    return 31;
  }

  return 27;
};

const getCountyFontSize = (county) => {
  const length = county.length;

  if (length <= 10) {
    return 34;
  }

  if (length <= 16) {
    return 29;
  }

  return 25;
};

const getVenueLines = (
  venue
) => {
  const normalized =
    normalizeText(
      venue
    ).toUpperCase();

  const parts =
    normalized
      .split(",")
      .map((part) =>
        part.trim()
      )
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return {
      firstLine:
        parts[0],

      secondLine:
        parts
          .slice(1)
          .join(", "),
    };
  }

  if (
    normalized.length <= 22
  ) {
    return {
      firstLine:
        normalized,

      secondLine:
        "",
    };
  }

  const words =
    normalized.split(" ");

  let firstLine = "";
  let secondLine = "";

  for (
    const word of words
  ) {
    const proposed =
      firstLine
        ? `${firstLine} ${word}`
        : word;

    if (
      proposed.length <= 20
    ) {
      firstLine =
        proposed;
    } else {
      secondLine =
        secondLine
          ? `${secondLine} ${word}`
          : word;
    }
  }

  return {
    firstLine,
    secondLine,
  };
};

/* ==========================================================
   IMAGE DATA URI
========================================================== */

export const imageBufferToDataUri = (
  buffer,
  mimeType = "image/png"
) => {
  if (!buffer) {
    return "";
  }

  return `data:${mimeType};base64,${Buffer.from(
    buffer
  ).toString("base64")}`;
};

/* ==========================================================
   TEMPLATE
========================================================== */

export const createSummitPosterTemplate = ({
  fullName,
  county,

  summitLogoDataUri = "",
  jvpLogoDataUri = "",
  backgroundPatternDataUri = "",
  participantPhotoDataUri = "",

  eventDate = "28 AUGUST 2026",

  eventVenue =
    "UWANJA WA WATER, KILIFI TOWN",

  hashtag = "#CYS2026",
}) => {
  const normalizedName =
    normalizeText(fullName).toUpperCase();

  const normalizedCounty =
    normalizeText(county).toUpperCase();

  const normalizedDate =
    normalizeText(eventDate).toUpperCase();

  const normalizedVenue =
    normalizeText(eventVenue).toUpperCase();

  const normalizedHashtag =
    normalizeText(hashtag).toUpperCase();

  const safeName =
    escapeXml(normalizedName);

  const safeCounty =
    escapeXml(normalizedCounty);

  const safeDate =
    escapeXml(normalizedDate);

  const safeHashtag =
    escapeXml(normalizedHashtag);

  const nameFontSize =
    getNameFontSize(normalizedName);

  const countyFontSize =
    getCountyFontSize(normalizedCounty);

  const venueLines =
    getVenueLines(normalizedVenue);

  const safeVenueLineOne =
    escapeXml(venueLines.firstLine);

  const safeVenueLineTwo =
    escapeXml(venueLines.secondLine);

  /* ========================================================
     SUMMIT LOGO
  ======================================================== */

  const summitLogo = summitLogoDataUri
    ? `
      <image
        href="${summitLogoDataUri}"
        x="330"
        y="35"
        width="420"
        height="135"
        preserveAspectRatio="xMidYMid meet"
      />
    `
    : `
      <text
        x="540"
        y="92"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="48"
        font-weight="900"
        fill="#082f66"
      >
        COAST YOUTH SUMMIT
      </text>

      <text
        x="540"
        y="138"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="34"
        font-weight="900"
        fill="#ef1d24"
      >
        2026
      </text>
    `;

  /* ========================================================
     JVP LOGO
  ======================================================== */

  const jvpLogo = jvpLogoDataUri
    ? `
      <image
        href="${jvpLogoDataUri}"
        x="66"
        y="927"
        width="118"
        height="95"
        preserveAspectRatio="xMidYMid meet"
      />
    `
    : `
      <text
        x="125"
        y="985"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="43"
        font-weight="900"
        fill="#087744"
      >
        JVP
      </text>
    `;

  /* ========================================================
     PATTERN BACKGROUND
  ======================================================== */

  const background = backgroundPatternDataUri
    ? `
      <image
        href="${backgroundPatternDataUri}"
        x="0"
        y="0"
        width="${POSTER_WIDTH}"
        height="${POSTER_HEIGHT}"
        preserveAspectRatio="xMidYMid slice"
      />

      <rect
        x="23"
        y="23"
        width="1034"
        height="1034"
        rx="4"
        fill="#ffffff"
        fill-opacity="0.91"
      />
    `
    : `
      <rect
        width="${POSTER_WIDTH}"
        height="${POSTER_HEIGHT}"
        fill="#ffffff"
      />

      <rect
        x="23"
        y="23"
        width="1034"
        height="1034"
        rx="4"
        fill="#fdfefe"
      />
    `;

  return Buffer.from(`
    <svg
      width="${POSTER_WIDTH}"
      height="${POSTER_HEIGHT}"
      viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient
          id="venueGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#073b79"
          />

          <stop
            offset="100%"
            stop-color="#087744"
          />
        </linearGradient>

        <linearGradient
          id="photoFade"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="72%"
            stop-color="#ffffff"
            stop-opacity="0"
          />

          <stop
            offset="100%"
            stop-color="#ffffff"
            stop-opacity="1"
          />
        </linearGradient>

        <filter
          id="softShadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="9"
            stdDeviation="12"
            flood-color="#0f172a"
            flood-opacity="0.14"
          />
        </filter>

        <filter
          id="photoShadow"
          x="-30%"
          y="-20%"
          width="170%"
          height="150%"
        >
          <feDropShadow
            dx="-5"
            dy="7"
            stdDeviation="9"
            flood-color="#082f66"
            flood-opacity="0.12"
          />
        </filter>
      </defs>

      <!-- ================================================
           BACKGROUND
      ================================================= -->

      ${background}

      <rect
        x="29"
        y="29"
        width="1022"
        height="1022"
        fill="none"
        stroke="#e4ebef"
        stroke-width="2"
      />

      <rect
        x="25"
        y="25"
        width="1030"
        height="6"
        fill="#f4a51c"
      />

      <!-- ================================================
           HEADER
      ================================================= -->

      ${summitLogo}

      <text
        x="540"
        y="177"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="15"
        font-weight="800"
        fill="#173b65"
        letter-spacing="0.8"
      >
        EMPOWERED YOUTH · STRONGER COAST · SUSTAINABLE FUTURE
      </text>

      <line
        x1="315"
        y1="197"
        x2="765"
        y2="197"
        stroke="#cddce5"
        stroke-width="2"
      />

      <circle
        cx="540"
        cy="197"
        r="5"
        fill="#082f66"
      />

      <!-- ================================================
     PARTICIPANT PHOTO
================================================= -->

${
  participantPhotoDataUri
    ? `
      <image
        href="${participantPhotoDataUri}"
        x="450"
        y="35"
        width="600"
        height="1000"
        preserveAspectRatio="xMaxYMax meet"
        filter="url(#photoShadow)"
      />
    `
    : ""
}

      <!-- Right-side visual accent behind participant -->

      <path
        d="
          M820 225
          C955 255 1028 360 1024 530
          C1020 710 950 815 810 866
          L1055 866
          L1055 205
          Z
        "
        fill="#087744"
        fill-opacity="0.035"
      />

      <circle
        cx="1015"
        cy="275"
        r="120"
        fill="#f4a51c"
        fill-opacity="0.04"
      />

      <!-- ================================================
           ATTENDANCE MESSAGE
      ================================================= -->

      <text
        x="76"
        y="300"
        font-family="Georgia, Times New Roman, serif"
        font-size="46"
        font-style="italic"
        font-weight="700"
        fill="#0f172a"
      >
        I will be
      </text>

      <!-- Coloured patterned strip -->

      <rect
        x="76"
        y="326"
        width="58"
        height="127"
        fill="#082f66"
      />

      <rect
        x="76"
        y="326"
        width="58"
        height="31"
        fill="#f4a51c"
      />

      <rect
        x="76"
        y="368"
        width="58"
        height="30"
        fill="#073b79"
      />

      <rect
        x="76"
        y="399"
        width="58"
        height="29"
        fill="#ef1d24"
      />

      <rect
        x="76"
        y="429"
        width="58"
        height="24"
        fill="#087744"
      />

      <!-- Attendance card -->

      <rect
        x="134"
        y="326"
        width="460"
        height="127"
        rx="2"
        fill="#ef1d24"
        filter="url(#softShadow)"
      />

      <text
        x="364"
        y="409"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="57"
        font-weight="900"
        fill="#ffffff"
        letter-spacing="0.5"
      >
        ATTENDING
      </text>

      <!-- ================================================
           PARTICIPANT DETAILS
      ================================================= -->

      <text
        x="76"
        y="510"
        font-family="Arial, Helvetica, sans-serif"
        font-size="15"
        font-weight="900"
        fill="#087744"
        letter-spacing="2"
      >
        PARTICIPANT
      </text>

      <text
        x="76"
        y="565"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${nameFontSize}"
        font-weight="900"
        fill="#082f66"
        letter-spacing="-0.8"
      >
        ${safeName}
      </text>

      <line
        x1="76"
        y1="591"
        x2="520"
        y2="591"
        stroke="#dbe5ea"
        stroke-width="2"
      />

      <text
        x="76"
        y="637"
        font-family="Arial, Helvetica, sans-serif"
        font-size="15"
        font-weight="800"
        fill="#64748b"
        letter-spacing="1.5"
      >
        REPRESENTING
      </text>

      <text
        x="76"
        y="687"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${countyFontSize}"
        font-weight="900"
        fill="#087744"
        letter-spacing="1.5"
      >
        ${safeCounty} COUNTY
      </text>

      <rect
        x="76"
        y="710"
        width="105"
        height="6"
        rx="3"
        fill="#f4a51c"
      />

      <!-- ================================================
           EVENT CARDS
      ================================================= -->

      <!-- Date card -->

      <g filter="url(#softShadow)">
        <rect
          x="76"
          y="746"
          width="356"
          height="124"
          rx="14"
          fill="#ffffff"
          stroke="#d4e0e6"
          stroke-width="2"
        />

        <rect
          x="76"
          y="746"
          width="100"
          height="124"
          rx="14"
          fill="#ef1d24"
        />

        <rect
          x="76"
          y="746"
          width="100"
          height="15"
          rx="14"
          fill="#f4a51c"
        />

        <g transform="translate(100 778)">
          <rect
            x="0"
            y="10"
            width="52"
            height="47"
            rx="5"
            fill="none"
            stroke="#ffffff"
            stroke-width="5"
          />

          <line
            x1="0"
            y1="24"
            x2="52"
            y2="24"
            stroke="#ffffff"
            stroke-width="5"
          />

          <line
            x1="13"
            y1="0"
            x2="13"
            y2="17"
            stroke="#ffffff"
            stroke-width="5"
            stroke-linecap="round"
          />

          <line
            x1="39"
            y1="0"
            x2="39"
            y2="17"
            stroke="#ffffff"
            stroke-width="5"
            stroke-linecap="round"
          />
        </g>

        <text
          x="198"
          y="789"
          font-family="Arial, Helvetica, sans-serif"
          font-size="13"
          font-weight="800"
          fill="#64748b"
          letter-spacing="1"
        >
          SUMMIT DATE
        </text>

        <text
          x="198"
          y="834"
          font-family="Arial, Helvetica, sans-serif"
          font-size="24"
          font-weight="900"
          fill="#111827"
        >
          ${safeDate}
        </text>
      </g>

      <!-- Venue card -->

      <g filter="url(#softShadow)">
        <rect
          x="452"
          y="746"
          width="370"
          height="124"
          rx="14"
          fill="#ffffff"
          stroke="#d4e0e6"
          stroke-width="2"
        />

        <rect
          x="452"
          y="746"
          width="101"
          height="124"
          rx="14"
          fill="url(#venueGradient)"
        />

        <g transform="translate(478 774)">
          <path
            d="
              M25 0
              C11 0 0 11 0 25
              C0 45 25 69 25 69
              C25 69 50 45 50 25
              C50 11 39 0 25 0
              Z
            "
            fill="#ffffff"
          />

          <circle
            cx="25"
            cy="25"
            r="8"
            fill="#087744"
          />
        </g>

        <text
          x="575"
          y="783"
          font-family="Arial, Helvetica, sans-serif"
          font-size="13"
          font-weight="800"
          fill="#64748b"
          letter-spacing="1"
        >
          VENUE
        </text>

        <text
          x="575"
          y="823"
          font-family="Arial, Helvetica, sans-serif"
          font-size="21"
          font-weight="900"
          fill="#111827"
        >
          ${safeVenueLineOne}
        </text>

        ${
          safeVenueLineTwo
            ? `
              <text
                x="575"
                y="852"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="800"
                fill="#087744"
              >
                ${safeVenueLineTwo}
              </text>
            `
            : ""
        }
      </g>

      <!-- ================================================
           FOOTER
      ================================================= -->

      <rect
        x="48"
        y="908"
        width="984"
        height="124"
        rx="12"
        fill="#ffffff"
        fill-opacity="0.97"
        filter="url(#softShadow)"
      />

      ${jvpLogo}

      <line
        x1="198"
        y1="931"
        x2="198"
        y2="1011"
        stroke="#d6e0e6"
        stroke-width="2"
      />

      <text
        x="228"
        y="956"
        font-family="Arial, Helvetica, sans-serif"
        font-size="18"
        font-weight="900"
        fill="#082f66"
      >
        JUMUIYA YA VIJANA WA PWANI
      </text>

      <text
        x="228"
        y="983"
        font-family="Arial, Helvetica, sans-serif"
        font-size="14"
        font-weight="700"
        fill="#087744"
      >
        Connecting · Empowering · Transforming
      </text>

      <text
        x="228"
        y="1009"
        font-family="Arial, Helvetica, sans-serif"
        font-size="14"
        font-weight="600"
        fill="#64748b"
      >
        www.jvp.co.ke
      </text>

      <line
        x1="672"
        y1="931"
        x2="672"
        y2="1011"
        stroke="#d6e0e6"
        stroke-width="2"
      />

      <text
        x="850"
        y="970"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="40"
        font-weight="900"
        fill="#082f66"
      >
        ${safeHashtag}
      </text>

      <text
        x="850"
        y="1003"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="14"
        font-weight="800"
        fill="#087744"
        letter-spacing="0.7"
      >
        COAST YOUTH SUMMIT 2026
      </text>

      <rect
        x="25"
        y="1049"
        width="1030"
        height="6"
        fill="#f4a51c"
      />
    </svg>
  `);
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  POSTER_WIDTH,
  POSTER_HEIGHT,
  PHOTO_FRAME,
  imageBufferToDataUri,
  createSummitPosterTemplate,
};