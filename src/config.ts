export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

export const fetchConfig = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' as RequestCredentials
};

export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Network response was not ok');
  }
  return response.json();
};