import { useState } from "react";

const DEFAULT_AVATAR = "/images/default-avatar.png";

function ProfileAvatar({
  src,
  alt,
  className = "",
}) {
  const [image, setImage] = useState(
    src || DEFAULT_AVATAR
  );

  return (
    <img
      src={image}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;

        setImage(DEFAULT_AVATAR);
      }}
    />
  );
}

export default ProfileAvatar;