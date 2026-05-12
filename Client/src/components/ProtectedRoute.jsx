import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
        // Not logged in? Send back to Login
        return <Navigate to="/" />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Logged in, but wrong role? Send to a "Deny" page or back to their own dash
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;