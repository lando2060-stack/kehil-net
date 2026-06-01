// Legacy file kept for compatibility — API URL is now configured via VITE_API_URL env variable
export const appParams = {
  appId: null,
  token: null,
  functionsVersion: null,
  appBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};
