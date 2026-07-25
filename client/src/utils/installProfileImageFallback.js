/* ==========================================================
   GLOBAL PROFILE IMAGE FALLBACK
========================================================== */

/*
  Inline SVG fallback.

  Using an inline image means the browser does not make
  another network request for the fallback image.
*/

const DEFAULT_PROFILE_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="160"
    height="160"
    viewBox="0 0 160 160"
  >
    <rect
      width="160"
      height="160"
      rx="80"
      fill="#eef2f7"
    />

    <circle
      cx="80"
      cy="61"
      r="28"
      fill="#94a3b8"
    />

    <path
      d="M34 139c4-28 22-43 46-43s42 15 46 43"
      fill="#94a3b8"
    />
  </svg>
`)}`;

/* ==========================================================
   DETERMINE WHETHER IMAGE IS A PROFILE PHOTO
========================================================== */

const isProfilePhoto = (image) => {
  const source =
    image.currentSrc ||
    image.src ||
    "";

  const className =
    typeof image.className === "string"
      ? image.className.toLowerCase()
      : "";

  return (
    source.includes("/uploads/profile/") ||
    source.includes("/uploads/profiles/") ||
    className.includes("avatar") ||
    className.includes("profile-photo") ||
    className.includes("profile-image") ||
    image.dataset.profilePhoto === "true"
  );
};

/* ==========================================================
   INSTALL FALLBACK HANDLER
========================================================== */

export const installProfileImageFallback = () => {
  const handleImageError = (event) => {
    const image = event.target;

    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    if (!isProfilePhoto(image)) {
      return;
    }

    /*
      Prevent the handler from replacing the same image
      repeatedly if another render occurs.
    */

    if (
      image.dataset.profileFallbackApplied ===
      "true"
    ) {
      return;
    }

    image.dataset.profileFallbackApplied = "true";

    image.src = DEFAULT_PROFILE_AVATAR;
  };

  /*
    Image error events do not bubble normally.
    The third argument enables capture mode.
  */

  document.addEventListener(
    "error",
    handleImageError,
    true
  );

  return () => {
    document.removeEventListener(
      "error",
      handleImageError,
      true
    );
  };
};

export {
  DEFAULT_PROFILE_AVATAR,
};