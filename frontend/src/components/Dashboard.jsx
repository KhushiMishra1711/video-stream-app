import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Video, ShieldAlert, CheckCircle, RefreshCw, Film } from 'lucide-react';

export default function Dashboard() {
    const { user, token, socket, logoutSession } = useAuth();
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [uploadData, setUploadData] = useState({ title: '', file: null });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [pipelineUpdates, setPipelineUpdates] = useState({});
    const fileInputRef = useRef(null);

    // Fetch matching isolated tenant videos on dashboard startup
    useEffect(() => {
        fetchVideoLibrary();
    }, []);

    // Listen for real-time WebSocket events from the processing pipeline
    useEffect(() => {
        if (!socket) return;

        // Catch background chunk tracking ticks
        socket.on('pipeline-progress', (data) => {
            setPipelineUpdates(prev => ({
                ...prev,
                [data.videoId]: { progress: data.progress, status: data.status }
            }));
        });

        // Catch final categorization completions
        socket.on('pipeline-completed', (data) => {
            setPipelineUpdates(prev => ({
                ...prev,
                [data.videoId]: { progress: 100, status: data.status, sensitivityStatus: data.sensitivityStatus }
            }));
            // Refresh local registry to lock values down
            fetchVideoLibrary();
        });

        return () => {
            socket.off('pipeline-progress');
            socket.off('pipeline-completed');
        };
    }, [socket]);

    const fetchVideoLibrary = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('http://localhost:5000/api/videos', config);
            setVideos(response.data);
        } catch (err) {
            console.error("Error pulling video library arrays:", err.message);
        }
    };

    const handleFileChange = (e) => {
        setUploadData({ ...uploadData, file: e.target.files[0] });
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadData.file || !uploadData.title) return;

        setUploading(true);
        setUploadProgress('Uploading asset to server storage...');

        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('video', uploadData.file);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.post('http://localhost:5000/api/videos/upload', formData, config);
            
            setUploadProgress('Upload completed successfully! Pipeline running...');
            setUploadData({ title: '', file: null });
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            fetchVideoLibrary();
        } catch (error) {
            setUploadProgress(error.response?.data?.message || 'Upload connection failure.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white">
                        <Film size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">StreamGuard Console</h1>
                        <p className="text-xs text-slate-400">Tenant Workspace: <span className="text-blue-400 font-semibold">{user?.organization}</span></p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <span className="inline-block text-[10px] bg-slate-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-slate-300 border border-slate-600">
                            Role: {user?.role}
                        </span>
                    </div>
                    <button 
                        onClick={logoutSession}
                        className="p-2.5 bg-slate-700 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 rounded-xl transition-all border border-slate-600"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Grid Content Area */}
            <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Controls (Conditional Upload Portal Based on RBAC) */}
                <div className="space-y-6 lg:col-span-1">
                    {user?.role === 'Viewer' ? (
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60 text-center">
                            <p className="text-sm text-slate-400">
                                Your account holds <strong>Viewer</strong> credentials. You are restricted from adding new videos, but have authorization to stream your organization's feed safely.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                            <h2 className="text-md font-bold tracking-wide uppercase text-slate-400 mb-4 flex items-center gap-2">
                                <Upload size={16} className="text-blue-500" /> Upload Media Resource
                            </h2>
                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1">Display Title</label>
                                    <input 
                                        type="text" required value={uploadData.title}
                                        onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                                        placeholder="e.g., Security Perimeter Cam A"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 font-medium mb-1">Video Resource File</label>
                                    <input 
                                        type="file" required accept="video/*" ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 file:cursor-pointer"
                                    />
                                </div>
                                <button 
                                    type="submit" disabled={uploading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-md"
                                >
                                    {uploading ? 'Transmitting Data...' : 'Dispatch Content Pipeline'}
                                </button>
                            </form>
                            {uploadProgress && (
                                <p className="text-xs text-center mt-3 p-2 bg-slate-900 rounded-lg border border-slate-700 text-slate-300">
                                    {uploadProgress}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Active Screen Stream Render Segment */}
                    {selectedVideo && (
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl space-y-3">
                            <h3 className="text-sm font-bold tracking-tight text-blue-400 truncate">
                                Now Streaming: {selectedVideo.title}
                            </h3>
                            {/* Native HTML5 Video configured with cross-origin token parsing headers over range loops */}
                            <video 
                                key={selectedVideo._id}
                                controls 
                                autoPlay
                                src={`http://localhost:5000/api/videos/stream/${selectedVideo._id}?token=${token}`}
                                className="w-full rounded-xl bg-black shadow-inner border border-slate-900"
                                controlsList="nodownload"
                            />
                            <p className="text-[11px] text-slate-400 italic">
                                *Serving data packages using range-based HTTP 206 structural chunks.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Video Library & Real-time Tracking Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-md font-bold tracking-wide uppercase text-slate-400 flex items-center gap-2">
                                <Video size={16} className="text-blue-500" /> Isolated Asset Vault
                            </h2>
                            <button 
                                onClick={fetchVideoLibrary}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {videos.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                                <Video size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No videos present inside this company's vault index.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {videos.map(vid => {
                                    const realTimeState = pipelineUpdates[vid._id] || {};
                                    const currentProgress = realTimeState.progress ?? vid.processingProgress;
                                    const currentStatus = realTimeState.status ?? vid.status;
                                    const currentSensitivity = realTimeState.sensitivityStatus ?? vid.sensitivityStatus;

                                    return (
                                        <div 
                                            key={vid._id}
                                            className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                                selectedVideo?._id === vid._id 
                                                    ? 'bg-blue-600/10 border-blue-500 shadow-md' 
                                                    : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-900'
                                            }`}
                                        >
                                            <div className="space-y-1 flex-1">
                                                <h3 className="text-sm font-semibold tracking-tight text-slate-200">{vid.title}</h3>
                                                <p className="text-[11px] text-slate-500 max-w-xs truncate">System ID: {vid._id}</p>
                                                
                                                {/* Live Tracking Progress Bar */}
                                                {currentStatus === 'Processing' && (
                                                    <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                                        <div 
                                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${currentProgress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Analysis Badges and Interactions */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                {/* Status Check badge */}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    currentStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    currentStatus === 'Processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                                                    'bg-slate-700 text-slate-300'
                                                }`}>
                                                    {currentStatus} {currentStatus === 'Processing' && `(${currentProgress}%)`}
                                                </span>

                                                {/* Content Sensitivity Tag */}
                                                {currentStatus === 'Completed' && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${
                                                        currentSensitivity === 'Safe' 
                                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                    }`}>
                                                        {currentSensitivity === 'Safe' ? <CheckCircle size={10} /> : <ShieldAlert size={10} />}
                                                        {currentSensitivity}
                                                    </span>
                                                )}

                                                {/* Trigger Stream Command CTA */}
                                                <button
                                                    onClick={() => setSelectedVideo(vid)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-xs font-semibold rounded-lg text-slate-200 hover:text-white transition-all shadow-sm"
                                                >
                                                    Stream Video
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}