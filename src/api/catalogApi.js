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

// POST /partneredhotel/catalog/property-types
// Body: { name: string }  →  Response 201: { id, name, status, createdAt, updatedAt }
export const createPropertyType = (data) =>
  api.post(`/partneredhotel/catalog/property-types`, data).then(res => res.data);

// GET /partneredhotel/catalog/room-types
export const getRoomTypes = (includeInactive = false) =>
  api.get(`/partneredhotel/catalog/room-types`, { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/catalog/room-types
// Body: { name: string }  →  Response 201: { id, name, status, createdAt, updatedAt }
export const createRoomType = (data) =>
  api.post(`/partneredhotel/catalog/room-types`, data).then(res => res.data);

// GET /partneredhotel/catalog/bed-types
export const getBedTypes = (includeInactive = false) =>
  api.get(`/partneredhotel/catalog/bed-types`, { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/catalog/bed-types
// Body: { name: string }  →  Response 201: { id, name, status, createdAt, updatedAt }
export const createBedType = (data) =>
  api.post(`/partneredhotel/catalog/bed-types`, data).then(res => res.data);
