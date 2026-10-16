
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Attach JWT token to requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export const getErrorMessage = (error, defaultMsg = "An error occurred") => {
  const data = error?.response?.data;
  if (!data) return error?.message || defaultMsg;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail.map((err) => err.msg || JSON.stringify(err)).join(", ");
  }
  if (typeof data.message === "string") return data.message;
  return defaultMsg;
};

export default API;
