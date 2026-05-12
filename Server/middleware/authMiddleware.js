const User = require('../models/User');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    try {
        let token;

        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'No Authorization header found' });
        }

        if (req.headers.authorization.startsWith('Bearer')) {
            // Get token from string "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return next();
        } else {
            return res.status(401).json({ message: 'Invalid token format' });
        }

    } catch (error) {
        console.error('Auth Error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to access this route' });
        }
        next();
    };
};

module.exports = { protect, authorize };