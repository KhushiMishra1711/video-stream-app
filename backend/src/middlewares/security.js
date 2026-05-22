const jwt = require('jsonwebtoken');

// 1. Authentication Middleware - Verifies JWT and handles multi-tenant data segregation
const authMiddleware = (apiReq, apiRes, next) => {
    // Get token from header (Format: Bearer <token>)
    const authHeader = apiReq.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return apiRes.status(401).json({ message: 'No security token found, authorization denied' });
    }

    try {
        // Decode and verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request object for downstream controllers to read
        apiReq.user = decoded; 
        
        next();
    } catch (err) {
        apiRes.status(401).json({ message: 'Token is invalid or expired' });
    }
};

// 2. RBAC Middleware - Controls access based on specific defined roles
const rbacMiddleware = (allowedRoles) => {
    return (apiReq, apiRes, next) => {
        // Safety check to ensure authMiddleware was executed first
        if (!apiReq.user) {
            return apiRes.status(500).json({ message: 'Auth middleware missing in system execution' });
        }

        // Validate if user's role matches any allowed role for this endpoint
        if (!allowedRoles.includes(apiReq.user.role)) {
            return apiRes.status(403).json({ 
                message: `Access denied. Your role (${apiReq.user.role}) does not have permissions for this action.` 
            });
        }

        next();
    };
};

module.exports = { authMiddleware, rbacMiddleware };