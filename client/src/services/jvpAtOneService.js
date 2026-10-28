
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://jvp-platform-api.onrender.com/api"
).replace(/\/+$/, "");

const JVP_AT_ONE_URL = `${API_BASE_URL}/jvp-at-one`;

/**
 * Shared request helper for JVP @ 1 API endpoints.
 */
async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${JVP_AT_ONE_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

/**
 * Register a Lamu County youth for JVP @ 1.
 *
 * Returns the server response, including:
 * - registration.registrationNumber
 * - registration.fullName
 * - registration.phone
 * - registration.constituency
 * - registration.ward
 * - existingRegistration
 */
export async function registerJVPAtOne(registration) {
  return request("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: registration.fullName?.trim(),
      phone: registration.phone?.trim(),
      constituency: registration.constituency,
      ward: registration.ward,
    }),
  });
}

/**
 * Retrieve anniversary registrations.
 * Requires an authenticated admin, events, or super_admin user.
 *
 * Supported filters:
 * search, constituency, ward, status, page, limit
 */
export async function getJVPAtOneRegistrations(
  {
    search = "",
    constituency = "",
    ward = "",
    status = "registered",
    page = 1,
    limit = 20,
  } = {},
  token
) {
  if (!token) {
    throw new Error("Administrator authentication is required.");
  }

  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (constituency) {
    params.set("constituency", constituency);
  }

  if (ward) {
    params.set("ward", ward);
  }

  if (status) {
    params.set("status", status);
  }

  params.set("page", String(page));
  params.set("limit", String(limit));

  return request(`/registrations?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Retrieve active anniversary gallery photos.
 */
export async function getJVPAtOnePhotos() {
  return request("/photos");
}

/**
 * Upload a photo to the anniversary gallery.
 */
export async function uploadJVPAtOnePhoto({
  file,
  title,
  caption = "",
  token,
}) {
  if (!file) {
    throw new Error("Please select a photo to upload.");
  }

  if (!token) {
    throw new Error("Administrator authentication is required.");
  }

  const formData = new FormData();

  formData.append("photo", file);
  formData.append("title", title?.trim() || "");
  formData.append("caption", caption.trim());

  return request("/photos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

/**
 * Delete a gallery photo using its database ID.
 */
export async function deleteJVPAtOnePhoto(photoId, token) {
  if (!photoId) {
    throw new Error("A photo ID is required.");
  }

  if (!token) {
    throw new Error("Administrator authentication is required.");
  }

  return request(`/photos/${encodeURIComponent(photoId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
