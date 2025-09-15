import axios from "axios";

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOGS === "true") {
    console.log("🌐 [API-FRONTEND]", config.method?.toUpperCase(), config.url);
  }
  return config;
});
