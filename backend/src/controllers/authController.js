const User = require('../models/User');
const Tenant = require('../models/Tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user and assign/create an organization (Tenant)
exports.register = async (apiReq, apiRes) => {
    try {
        const { name, email, password, organizationName, role } = apiReq.body;

        // Check if user already exists
        let userExists = await User.findOne({ email });
        if (userExists) {
            return apiRes.status(400).json({ message: 'User already registered with this email' });
        }

        // Find or Create Tenant (Organization Isolation)
        let tenant = await Tenant.findOne({ name: organizationName });
        if (!tenant) {
            tenant = await Tenant.create({ name: organizationName });
        }

        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with specific RBAC role
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            tenantId: tenant._id,
            role: role || 'Viewer' // Defaults to Viewer if not provided
        });

        apiRes.status(201).json({
            message: 'User registered successfully!',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, organization: tenant.name }
        });
    } catch (err) {
        apiRes.status(500).json({ error: err.message });
    }
};

// Login user and issue JWT security token
exports.login = async (apiReq, apiRes) => {
    try {
        const { email, password } = apiReq.body;

        // Verify user exists
        const user = await User.findOne({ email }).populate('tenantId', 'name');
        if (!user) {
            return apiRes.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return apiRes.status(400).json({ message: 'Invalid credentials' });
        }

        // Create Token payload with security boundaries
        const tokenPayload = {
            id: user._id,
            tenantId: user.tenantId._id,
            role: user.role
        };

        // Sign JWT token
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

        apiRes.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.tenantId.name
            }
        });
    } catch (err) {
        apiRes.status(500).json({ error: err.message });
    }
};