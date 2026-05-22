const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Video = require('../models/Video');

// 1. Configure Local Disk Storage for incoming files via Multer
const storage = multer.diskStorage({
    destination: (apiReq, file, cb) => {
        cb(null, 'uploads/'); // Saves temporary files in backend/uploads directory
    },
    filename: (apiReq, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File validation helper (Accepts only standard video file types)
const videoFileFilter = (apiReq, file, cb) => {
    const allowedExtensions = ['.mp4', '.mkv', '.avi', '.mov'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only video files (.mp4, .mkv, .avi, .mov) are allowed!'), false);
    }
};

// Export upload middleware configuration (Limit file size to 100MB for safe testing)
exports.upload = multer({ 
    storage: storage,
    fileFilter: videoFileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } 
}).single('video');


// 2. Video Upload Endpoint and Pipeline Activation Handler
exports.uploadVideo = async (apiReq, apiRes) => {
    try {
        if (!apiReq.file) {
            return apiRes.status(400).json({ message: 'No video file provided' });
        }

        const { title } = apiReq.body;
        if (!title) {
            return apiRes.status(400).json({ message: 'Video title is required' });
        }

        // Save entry into database using multi-tenant IDs from the auth token
        const videoEntry = await Video.create({
            title,
            filename: apiReq.file.filename,
            filePath: apiReq.file.path,
            tenantId: apiReq.user.tenantId,
            uploadedBy: apiReq.user.id,
            status: 'Pending',
            sensitivityStatus: 'Unreviewed'
        });

        // Trigger the asynchronous mock pipeline processing loop immediately
        // We pass the io object globally from our application bootstrap later
        const io = apiReq.app.get('socketio');
        runProcessingPipeline(videoEntry, io);

        apiRes.status(202).json({
            message: 'Video uploaded successfully. Content analysis pipeline started.',
            video: videoEntry
        });
    } catch (err) {
        apiRes.status(500).json({ error: err.message });
    }
};


// 3. Isolated Multi-Tenant Video Library Retrieval Endpoint
exports.getVideos = async (apiReq, apiRes) => {
    try {
        const { sensitivity } = apiReq.query;
        let queryFilter = { tenantId: apiReq.user.tenantId }; // STRICT User Isolation

        // Optional stretch goal: Content-based filtering
        if (sensitivity) {
            queryFilter.sensitivityStatus = sensitivity;
        }

        const videos = await Video.find(queryFilter).sort({ createdAt: -1 });
        apiRes.json(videos);
    } catch (err) {
        apiRes.status(500).json({ error: err.message });
    }
};


// 4. HTTP Range Request Streaming Engine (Partial Content Provider)
exports.streamVideo = async (apiReq, apiRes) => {
    try {
        // Find the video and verify it belongs to the active tenant space
        const video = await Video.findOne({ _id: apiReq.params.id, tenantId: apiReq.user.tenantId });
        if (!video) {
            return apiRes.status(404).json({ message: 'Video not found or access unauthorized' });
        }

        const videoPath = path.resolve(video.filePath);
        if (!fs.existsSync(videoPath)) {
            return apiRes.status(404).json({ message: 'Physical file missing on server disk storage' });
        }

        const fileStats = fs.statSync(videoPath);
        const fileSize = fileStats.size;
        const rangeHeader = apiReq.headers.range;

        // If no explicit Range header is sent, stream the complete file properties safely
        if (!rangeHeader) {
            const headers = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            apiRes.writeHead(200, headers);
            return fs.createReadStream(videoPath).pipe(apiRes);
        }

        // Parse explicit byte chunk requests (Format: bytes=0-1024)
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const chunkStart = parseInt(parts[0], 10);
        const chunkEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        // Validation safeguards
        if (chunkStart >= fileSize || chunkEnd >= fileSize) {
            apiRes.status(416).headers({ 'Content-Range': `bytes */${fileSize}` });
            return apiRes.end();
        }

        const actualChunkSize = (chunkEnd - chunkStart) + 1;
        const responseHeaders = {
            'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': actualChunkSize,
            'Content-Type': 'video/mp4',
        };

        // Write Partial Content status header code (206)
        apiRes.writeHead(206, responseHeaders);

        // Pipe the sliced file stream segment directly into the HTTP response object
        const videoChunkStream = fs.createReadStream(videoPath, { start: chunkStart, end: chunkEnd });
        videoChunkStream.pipe(apiRes);

    } catch (err) {
        apiRes.status(500).json({ error: err.message });
    }
};


// 5. Simulated Background Content Sensitivity Pipeline (Asynchronous)
const runProcessingPipeline = async (videoModel, io) => {
    let internalProgress = 0;
    videoModel.status = 'Processing';
    await videoModel.save();

    const processingInterval = setInterval(async () => {
        internalProgress += 25; // Boost completion rates step by step
        videoModel.processingProgress = internalProgress;

        // Fire off Socket.io notifications to the frontend UI
        if (io) {
            io.to(videoModel.tenantId.toString()).emit('pipeline-progress', {
                videoId: videoModel._id,
                title: videoModel.title,
                progress: internalProgress,
                status: videoModel.status
            });
        }

        if (internalProgress >= 100) {
            clearInterval(processingInterval);

            // Automated screening classifier simulation (flags if title contains raw trigger keywords)
            const lowTitle = videoModel.title.toLowerCase();
            const containsSensitiveContent = lowTitle.includes('unsafe') || lowTitle.includes('violence') || lowTitle.includes('weapon');
            
            videoModel.status = 'Completed';
            videoModel.sensitivityStatus = containsSensitiveContent ? 'Flagged' : 'Safe';
            await videoModel.save();

            // Fire finishing payload update event down the socket pipeline
            if (io) {
                io.to(videoModel.tenantId.toString()).emit('pipeline-completed', {
                    videoId: videoModel._id,
                    status: videoModel.status,
                    sensitivityStatus: videoModel.sensitivityStatus
                });
            }
        } else {
            await videoModel.save();
        }
    }, 3000); // Progress increments every 3 seconds
};