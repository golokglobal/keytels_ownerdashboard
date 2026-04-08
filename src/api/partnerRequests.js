import api from '../config/axiosConfig';

export const submitPartnerRequest = (payload) =>
  api.post('/admin/partner-requests/submit', payload).then((res) => res.data);

