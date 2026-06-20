const PORT = process.env.SYNC_SERVICE_PORT || "8000";
const API_URL = process.env.SYNC_SERVICE_API_URL || "http://127.0.0.1";

export const BASE_URL = `${API_URL}:${PORT}`;
