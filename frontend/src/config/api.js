// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://fivem-resource-hub-production.up.railway.app',
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'FiveM Resource Hub',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0'
};

// Set axios default base URL
import axios from 'axios';
axios.defaults.baseURL = API_CONFIG.BASE_URL;
