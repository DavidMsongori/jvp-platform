
import api from "./api";

export const getCoastGeography = async () => {
  const response = await api.get("/geography/coast");
  return response.data;
};

export default {
  getCoastGeography,
};
