import axios from 'axios';

const API = axios.create({
    // This looks at your .env file. If it's empty, it defaults to localhost.
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://techveda-server.onrender.com/api'
});

// Automatically attach the token to every request if it exists
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;