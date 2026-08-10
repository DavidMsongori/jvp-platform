import api from "./api";

/* ==========================================
   GET COAST GEOGRAPHY
========================================== */

export const getCoastGeography =
  async () => {
    const response =
      await api.get(
        "/geography/coast"
      );

    return response.data;
  };

export default {
  getCoastGeography,
};