const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Standard Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

module.exports = router;