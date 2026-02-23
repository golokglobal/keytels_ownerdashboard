import api from '../config/axiosConfig';

// Get all permissions
export const getAllPermissions = () =>
  api.get('/permissions').then(res => res.data);

// Get single permission by ID
export const getPermissionById = (id) =>
  api.get(`/permissions/${id}`).then(res => res.data);

// Get permissions by category
export const getPermissionsByCategory = (category) =>
  api.get(`/permissions/category/${category}`).then(res => res.data.permissions);

// Create new permission
export const createPermission = (permissionData) =>
  api.post('/permissions', permissionData).then(res => res.data.permission || res.data);

// Update a permission
export const updatePermission = (id, data) =>
  api.put(`/permissions/${id}`, data).then(res => res.data.permission || res.data);

// Delete a permission
export const deletePermission = (id) =>
  api.delete(`/permissions/${id}`).then(res => res.data);
