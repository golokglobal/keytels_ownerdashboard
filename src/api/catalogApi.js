import api from '../config/axiosConfig';

// ─── Property Types ───────────────────────────────────────────────────────────

// GET /partneredhotel/catalog/property-types[?includeInactive=true]
// Response: CatalogItemDto[] { id, name, status, createdAt, updatedAt }
export const getPropertyTypes = (includeInactive = false) =>
  api.get('/partneredhotel/catalog/property-types', { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/catalog/property-types  — ADMIN only
// Body:     { name: string }
// Response: CatalogItemDto (HTTP 201)
export const createPropertyType = (data) =>
  api.post('/partneredhotel/catalog/property-types', data).then(res => res.data);

// DELETE /partneredhotel/catalog/property-types/{id}  — ADMIN only
// Response: 204 No Content
export const deletePropertyType = (id) =>
  api.delete(`/partneredhotel/catalog/property-types/${id}`).then(res => res.data);

// ─── Room Types ───────────────────────────────────────────────────────────────

// GET /partneredhotel/catalog/room-types[?includeInactive=true]
// Response: CatalogItemDto[]
export const getRoomTypes = (includeInactive = false) =>
  api.get('/partneredhotel/catalog/room-types', { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/catalog/room-types  — ADMIN only
// Body:     { name: string }
// Response: CatalogItemDto (HTTP 201)
export const createRoomType = (data) =>
  api.post('/partneredhotel/catalog/room-types', data).then(res => res.data);

// DELETE /partneredhotel/catalog/room-types/{id}  — ADMIN only
// Response: 204 No Content
export const deleteRoomType = (id) =>
  api.delete(`/partneredhotel/catalog/room-types/${id}`).then(res => res.data);

// ─── Bed Types ────────────────────────────────────────────────────────────────

// GET /partneredhotel/catalog/bed-types[?includeInactive=true]
// Response: CatalogItemDto[]
export const getBedTypes = (includeInactive = false) =>
  api.get('/partneredhotel/catalog/bed-types', { params: { includeInactive } })
    .then(res => res.data)
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/catalog/bed-types  — ADMIN only
// Body:     { name: string }
// Response: CatalogItemDto (HTTP 201)
export const createBedType = (data) =>
  api.post('/partneredhotel/catalog/bed-types', data).then(res => res.data);

// DELETE /partneredhotel/catalog/bed-types/{id}  — ADMIN only
// Response: 204 No Content
export const deleteBedType = (id) =>
  api.delete(`/partneredhotel/catalog/bed-types/${id}`).then(res => res.data);
