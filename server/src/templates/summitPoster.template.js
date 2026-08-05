/* ==========================================================
   SUMMIT POSTER TEMPLATE
========================================================== */

/*
 * Final poster dimensions:
 * 1080 × 1350 pixels
 *
 * The participant photo is composited separately by Sharp.
 */

export const POSTER_WIDTH =
  1080;

export const POSTER_HEIGHT =
  1350;

/* ==========================================================
   PARTICIPANT PHOTO POSITION
========================================================== */

export const PHOTO_FRAME = {
  size: 530,
  left: 275,
  top: 255,
};

/* ==========================================================
   HELPERS
========================================================== */

const escapeXml = (
  value = ""
) => {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&apos;"
    );
};

const normalizeText = (
  value = ""
) => {
  return String(value)
    .trim()
    .replace(
      /\s+/g,
      " "
    );
};

const getNameFontSize = (
  fullName
) => {
  const length =
    fullName.length;

  if (length <= 14) {
    return 78;
  }

  if (length <= 20) {
    return 68;
  }

  if (length <= 27) {
    return 58;
  }

  if (length <= 34) {
    return 50;
  }

  return 43;
};

const getCountyFontSize = (
  county
) => {
  const length =
    county.length;

  if (length <= 12) {
    return 40;
  }

  if (length <= 18) {
    return 35;
  }

  return 30;
};

/* ==========================================================
   DATA URI HELPER
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
   TEMPLATE GENERATOR
========================================================== */

export const createSummitPosterTemplate =
  ({
    fullName,
    county,

    summitLogoDataUri = "",
    jvpLogoDataUri = "",

    eventDate =
      "6 – 8 AUGUST 2026",

    eventVenue =
      "MALINDI, KILIFI COUNTY",

    hashtag =
      "#CYS2026",
  }) => {
    const normalizedName =
      normalizeText(
        fullName
      ).toUpperCase();

    const normalizedCounty =
      normalizeText(
        county
      ).toUpperCase();

    const safeName =
      escapeXml(
        normalizedName
      );

    const safeCounty =
      escapeXml(
        normalizedCounty
      );

    const safeDate =
      escapeXml(
        eventDate
      );

    const safeVenue =
      escapeXml(
        eventVenue
      );

    const safeHashtag =
      escapeXml(
        hashtag
      );

    const nameFontSize =
      getNameFontSize(
        normalizedName
      );

    const countyFontSize =
      getCountyFontSize(
        normalizedCounty
      );

    const summitLogo =
      summitLogoDataUri
        ? `
          <image
            href="${summitLogoDataUri}"
            x="315"
            y="38"
            width="450"
            height="150"
            preserveAspectRatio="xMidYMid meet"
          />
        `
        : `
          <text
            x="540"
            y="105"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="53"
            font-weight="900"
            fill="#082f66"
          >
            COAST YOUTH SUMMIT
          </text>

          <text
            x="540"
            y="157"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="41"
            font-weight="900"
            fill="#e86f16"
          >
            2026
          </text>
        `;

    const jvpLogo =
      jvpLogoDataUri
        ? `
          <image
            href="${jvpLogoDataUri}"
            x="78"
            y="1190"
            width="230"
            height="112"
            preserveAspectRatio="xMidYMid meet"
          />
        `
        : `
          <text
            x="185"
            y="1255"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="52"
            font-weight="900"
            fill="#087a45"
          >
            JVP
          </text>
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
            id="backgroundGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stop-color="#ffffff"
            />

            <stop
              offset="52%"
              stop-color="#f5fbff"
            />

            <stop
              offset="100%"
              stop-color="#edf9f4"
            />
          </linearGradient>

          <linearGradient
            id="bottomGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stop-color="#073b79"
            />

            <stop
              offset="52%"
              stop-color="#075d78"
            />

            <stop
              offset="100%"
              stop-color="#087744"
            />
          </linearGradient>

          <linearGradient
            id="photoRingGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stop-color="#0b4e9c"
            />

            <stop
              offset="50%"
              stop-color="#008db8"
            />

            <stop
              offset="100%"
              stop-color="#1f8f44"
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
              dy="12"
              stdDeviation="15"
              flood-color="#082f66"
              flood-opacity="0.18"
            />
          </filter>

          <pattern
            id="coastalPattern"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 42 C18 22 34 62 52 42 C65 28 72 34 80 42"
              fill="none"
              stroke="#0b6e8e"
              stroke-width="2"
              stroke-opacity="0.06"
            />

            <circle
              cx="15"
              cy="15"
              r="3"
              fill="#1f8f44"
              fill-opacity="0.05"
            />
          </pattern>

          <clipPath
            id="photoClip"
          >
            <circle
              cx="${
                PHOTO_FRAME.left +
                PHOTO_FRAME.size /
                  2
              }"
              cy="${
                PHOTO_FRAME.top +
                PHOTO_FRAME.size /
                  2
              }"
              r="${
                PHOTO_FRAME.size /
                  2
              }"
            />
          </clipPath>
        </defs>

        <!-- ================================================
             BACKGROUND
        ================================================= -->

        <rect
          width="1080"
          height="1350"
          fill="url(#backgroundGradient)"
        />

        <rect
          width="1080"
          height="1350"
          fill="url(#coastalPattern)"
        />

        <circle
          cx="80"
          cy="390"
          r="270"
          fill="#0b77bd"
          fill-opacity="0.045"
        />

        <circle
          cx="1010"
          cy="470"
          r="320"
          fill="#16924a"
          fill-opacity="0.05"
        />

        <!-- Decorative coastal sun -->

        <circle
          cx="950"
          cy="175"
          r="78"
          fill="#f4a51c"
          fill-opacity="0.10"
        />

        <circle
          cx="950"
          cy="175"
          r="48"
          fill="#f4a51c"
          fill-opacity="0.10"
        />

        <!-- ================================================
             SUMMIT HEADER
        ================================================= -->

        ${summitLogo}

        <text
          x="540"
          y="210"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="19"
          font-weight="600"
          fill="#314d6b"
          letter-spacing="0.6"
        >
          EMPOWERED YOUTH · STRONGER COAST · SUSTAINABLE FUTURE
        </text>

        <line
          x1="280"
          y1="230"
          x2="800"
          y2="230"
          stroke="#d9e7ef"
          stroke-width="2"
        />

        <!-- ================================================
             PHOTO FRAME
        ================================================= -->

        <circle
          cx="540"
          cy="520"
          r="284"
          fill="#ffffff"
          filter="url(#softShadow)"
        />

        <circle
          cx="540"
          cy="520"
          r="277"
          fill="none"
          stroke="url(#photoRingGradient)"
          stroke-width="18"
        />

        <circle
          cx="540"
          cy="520"
          r="261"
          fill="#eaf3f6"
        />

        <!-- Participant photo is composited here separately -->

        <!-- Decorative photo accents -->

        <path
          d="M268 460 C210 540 228 660 310 724"
          fill="none"
          stroke="#0b4e9c"
          stroke-width="14"
          stroke-linecap="round"
          stroke-opacity="0.85"
        />

        <path
          d="M812 390 C875 470 872 602 790 694"
          fill="none"
          stroke="#208d45"
          stroke-width="14"
          stroke-linecap="round"
          stroke-opacity="0.85"
        />

        <!-- ================================================
             ATTENDANCE BANNER
        ================================================= -->

        <g
          filter="url(#softShadow)"
        >
          <path
            d="
              M120 775
              L960 775
              L928 835
              L152 835
              Z
            "
            fill="#082f66"
          />

          <path
            d="
              M120 775
              L170 790
              L120 804
              Z
            "
            fill="#0b4e9c"
          />

          <path
            d="
              M960 775
              L910 790
              L960 804
              Z
            "
            fill="#087744"
          />
        </g>

        <text
          x="540"
          y="814"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="47"
          font-weight="900"
          fill="#ffffff"
          letter-spacing="2.5"
        >
          I WILL BE ATTENDING
        </text>

        <!-- ================================================
             PARTICIPANT DETAILS
        ================================================= -->

        <rect
          x="90"
          y="860"
          width="900"
          height="115"
          rx="18"
          fill="#ffffff"
          fill-opacity="0.94"
        />

        <text
          x="540"
          y="935"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${nameFontSize}"
          font-weight="900"
          fill="#082f66"
          letter-spacing="-1"
        >
          ${safeName}
        </text>

        <line
          x1="230"
          y1="1004"
          x2="385"
          y2="1004"
          stroke="#0b4e9c"
          stroke-width="4"
        />

        <circle
          cx="540"
          cy="1004"
          r="9"
          fill="#f4a51c"
        />

        <line
          x1="695"
          y1="1004"
          x2="850"
          y2="1004"
          stroke="#087744"
          stroke-width="4"
        />

        <text
          x="540"
          y="1060"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${countyFontSize}"
          font-weight="800"
          fill="#087744"
          letter-spacing="4"
        >
          ${safeCounty}
        </text>

        <!-- ================================================
             EVENT INFORMATION
        ================================================= -->

        <path
          d="
            M0 1095
            C200 1045 330 1140 540 1085
            C760 1030 860 1118 1080 1072
            L1080 1210
            L0 1210
            Z
          "
          fill="url(#bottomGradient)"
        />

        <path
          d="
            M0 1088
            C200 1038 330 1133 540 1078
            C760 1023 860 1111 1080 1065
          "
          fill="none"
          stroke="#f4a51c"
          stroke-width="7"
        />

        <!-- Calendar icon -->

        <g
          transform="translate(85 1120)"
        >
          <rect
            x="0"
            y="9"
            width="46"
            height="40"
            rx="5"
            fill="none"
            stroke="#ffffff"
            stroke-width="4"
          />

          <line
            x1="0"
            y1="22"
            x2="46"
            y2="22"
            stroke="#ffffff"
            stroke-width="4"
          />

          <line
            x1="12"
            y1="0"
            x2="12"
            y2="14"
            stroke="#ffffff"
            stroke-width="4"
            stroke-linecap="round"
          />

          <line
            x1="34"
            y1="0"
            x2="34"
            y2="14"
            stroke="#ffffff"
            stroke-width="4"
            stroke-linecap="round"
          />
        </g>

        <text
          x="150"
          y="1161"
          font-family="Arial, Helvetica, sans-serif"
          font-size="30"
          font-weight="800"
          fill="#ffffff"
        >
          ${safeDate}
        </text>

        <line
          x1="500"
          y1="1122"
          x2="500"
          y2="1172"
          stroke="#ffffff"
          stroke-width="2"
          stroke-opacity="0.7"
        />

        <!-- Location icon -->

        <g
          transform="translate(550 1116)"
        >
          <path
            d="
              M24 0
              C10 0 0 10 0 24
              C0 43 24 62 24 62
              C24 62 48 43 48 24
              C48 10 38 0 24 0
              Z
            "
            fill="#ffffff"
          />

          <circle
            cx="24"
            cy="23"
            r="8"
            fill="#087744"
          />
        </g>

        <text
          x="620"
          y="1161"
          font-family="Arial, Helvetica, sans-serif"
          font-size="28"
          font-weight="800"
          fill="#ffffff"
        >
          ${safeVenue}
        </text>

        <!-- ================================================
             FOOTER BRANDING
        ================================================= -->

        <rect
          x="0"
          y="1210"
          width="1080"
          height="140"
          fill="#ffffff"
        />

        ${jvpLogo}

        <line
          x1="345"
          y1="1230"
          x2="345"
          y2="1325"
          stroke="#dce7ec"
          stroke-width="2"
        />

        <text
          x="382"
          y="1255"
          font-family="Arial, Helvetica, sans-serif"
          font-size="22"
          font-weight="900"
          fill="#082f66"
        >
          JUMUIYA YA VIJANA
        </text>

        <text
          x="382"
          y="1285"
          font-family="Arial, Helvetica, sans-serif"
          font-size="22"
          font-weight="900"
          fill="#082f66"
        >
          WA PWANI
        </text>

        <text
          x="382"
          y="1315"
          font-family="Arial, Helvetica, sans-serif"
          font-size="16"
          font-weight="600"
          fill="#5d7183"
        >
          Connecting · Empowering · Transforming
        </text>

        <line
          x1="635"
          y1="1230"
          x2="635"
          y2="1325"
          stroke="#dce7ec"
          stroke-width="2"
        />

        <text
          x="835"
          y="1264"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="44"
          font-weight="900"
          fill="#082f66"
        >
          ${safeHashtag}
        </text>

        <text
          x="835"
          y="1303"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="18"
          font-weight="700"
          fill="#087744"
        >
          COAST YOUTH SUMMIT 2026
        </text>

        <!-- Bottom accent -->

        <rect
          x="0"
          y="1342"
          width="1080"
          height="8"
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