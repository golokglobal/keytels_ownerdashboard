import api from "../config/axiosConfig";

/* ============================ HOTEL CATALOG ============================ */

// GET /partneredhotel/catalog/property-types
export const getPropertyTypes = (includeInactive = false) =>
  api.get(`/partneredhotel/catalog/property-types`, { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// GET /partneredhotel/catalog/room-types
export const getRoomTypes = (includeInactive = false) =>
  api.get(`/partneredhotel/catalog/room-types`, { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// GET /partneredhotel/catalog/bed-types
export const getBedTypes = (includeInactive = false) =>
  api.get(`/partneredhotel/catalog/bed-types`, { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });
