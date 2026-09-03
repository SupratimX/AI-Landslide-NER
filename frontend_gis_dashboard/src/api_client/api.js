import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const res = await apiClient.get('/api/v1/health');
  return res.data;
};

export const getLocations = async (params = {}) => {
  const res = await apiClient.get('/api/v1/locations', { params });
  return res.data;
};

export const getLocationHistory = async (locationId) => {
  const res = await apiClient.get(`/api/v1/locations/${locationId}/history`);
  return res.data;
};

export const predictRisk = async (payload) => {
  const res = await apiClient.post('/api/v1/predict-risk', payload);
  return res.data;
};

export const getLiveAlerts = async () => {
  const res = await apiClient.get('/api/v1/alerts/live');
  return res.data;
};

export const broadcastAlert = async (payload) => {
  const res = await apiClient.post('/api/v1/alerts/broadcast', payload);
  return res.data;
};

export const getCitizenReports = async (params = {}) => {
  const res = await apiClient.get('/api/v1/citizen-reports', { params });
  return res.data;
};

export const submitCitizenReport = async (payload) => {
  const res = await apiClient.post('/api/v1/citizen-reports', payload);
  return res.data;
};

export const verifyCitizenReport = async (reportId, payload) => {
  const res = await apiClient.patch(`/api/v1/citizen-reports/${reportId}/verify`, payload);
  return res.data;
};

export const getGeospatialHotspots = async () => {
  const res = await apiClient.get('/api/v1/geospatial/hotspots-geojson');
  return res.data;
};

export const getFaultLines = async () => {
  const res = await apiClient.get('/api/v1/geospatial/faults');
  return res.data;
};

export const getSusceptibilityZones = async () => {
  const res = await apiClient.get('/api/v1/geospatial/susceptibility');
  return res.data;
};

export default apiClient;
