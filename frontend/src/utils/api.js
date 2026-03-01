import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000
});

export const startSearch = (competitorName) =>
  api.post('/intelligence/search', { competitorName }).then(r => r.data);

export const getStatus = (reportId) =>
  api.get(`/intelligence/status/${reportId}`).then(r => r.data);

export const getReport = (reportId) =>
  api.get(`/intelligence/report/${reportId}`).then(r => r.data);

export const getAllReports = () =>
  api.get('/results').then(r => r.data);

export const deleteReport = (id) =>
  api.delete(`/results/${id}`).then(r => r.data);

export const getExportUrl = (reportId) =>
  `${API_BASE}/intelligence/export/${reportId}`;
