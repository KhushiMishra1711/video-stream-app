const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load environment variables config
dotenv.config();

// Initialize express app instance
const app = express();
const server = http.createServer(app);

// Configure Socket.io server with CORS allowance boundaries
const io = socketIo(server, {
    cors: {
        origin: "*", // Adjust this to your specific React domain URL during production deployment
        methods: ["GET", "POST"]
    }
});

// Establish connection to MongoDB cluster
connectDB();

// Global App Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming json requests

// Share the Socket.io instance globally so controllers can push pipeline progress events
app.set('socketio', io);

// Mount Application Feature API Routers
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/videos', require('./src/routes/videoRoutes'));

// Root Status Check Endpoint
app.get('/', (req, res) => {
    res.send('Video Streaming & Processing Multi-Tenant API is fully active.');
});

// Socket.io Client Interaction Architecture
io.on('connection', (socket) => {
    console.log(`New communication client connected: ${socket.id}`);

    // User joins an explicit isolation room matching their Organization Tenant ID
    socket.on('join-tenant-room', (tenantId) => {
        if (tenantId) {
            socket.join(tenantId);
            console.log(`Client connection socket ${socket.id} locked into Tenant Room: ${tenantId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client communication connection terminated: ${socket.id}`);
    });
});

// Bind server execution port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend Application Engine running in production mode on port ${PORT}`);
});