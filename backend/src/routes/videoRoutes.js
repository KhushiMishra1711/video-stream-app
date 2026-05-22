const express = require('express');
const router = express.Router();
const { authMiddleware, rbacMiddleware } = require('../middlewares/security');
const { upload, uploadVideo, getVideos, streamVideo } = require('../controllers/videoController');

// 1. Upload Route - Only 'Admin' and 'Editor' roles are allowed to upload videos
router.post('/upload', authMiddleware, rbacMiddleware(['Admin', 'Editor']), upload, uploadVideo);

// 2. Fetch Video Library Route - 'Admin', 'Editor', and 'Viewer' can view isolated team videos
router.get('/', authMiddleware, rbacMiddleware(['Admin', 'Editor', 'Viewer']), getVideos);

// 3. Range-Based Video Streaming Route - Available to all validated authenticated users
router.get('/stream/:id', authMiddleware, rbacMiddleware(['Admin', 'Editor', 'Viewer']), streamVideo);

module.exports = router;