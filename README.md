# StreamGuard Console - Multi-Tenant Video Streaming & Analytics Platform

A secure, multi-tenant enterprise video streaming application featuring dynamic Role-Based Access Control (RBAC), real-time content analysis pipelines via WebSockets, and byte-range HTTP 206 video chunk serving.

## 🚀 Key Features Built

- **Multi-Tenant Architecture:** Complete data isolation across workspaces (e.g., `Dronacharya Group of Institutions`). Users can only fetch and control items pinned to their corporate entity ID.
- **Granular RBAC System:** Enforces privilege checks between access levels (`Admin`, `Editor`, `Viewer`). The media upload subsystem dynamically blocks restricted roles.
- **Real-Time Pipeline (WebSockets):** Uses `Socket.io` to transmit active background processing events and analysis ticks instantly to the dashboard without structural browser refreshes.
- **Automated Content Classification:** Integrates an asynchronous validation gate that scans incoming payloads for safety flags (e.g., labeling metadata as `Flagged` or `Safe`).
- **HTTP 206 Partial Content Streaming:** Implements a custom chunked binary data engine pulling audio/video buffers efficiently via custom range parameters to eliminate lagging.

## 🛠️ Tech Stack Employed

- **Frontend:** React, Tailwind CSS v4 (with Native Vite Pipeline Processing), Lucide Icons, Axios, Socket.io-client
- **Backend:** Node.js, Express, MongoDB (via Mongoose ODM), Socket.io, Multer for multipart form handling

## 🏁 Quick Local Setup

### 1. Clone & Core Structural Layers
```bash
git clone [https://github.com/KhushiMishra1711/video-stream-app.git](https://github.com/KhushiMishra1711/video-stream-app.git)
cd video-stream-app