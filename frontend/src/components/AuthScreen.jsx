import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Building, User } from 'lucide-react';

export default function AuthScreen() {
    const { loginSession } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        organizationName: '',
        role: 'Viewer'
    });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        const endpoint = isRegistering ? 'register' : 'login';
        
        try {
            const response = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, formData);
            
            if (isRegistering) {
                setStatusMessage({ type: 'success', text: 'Registration successful! Switching to Login view...' });
                setIsRegistering(false);
                setLoading(false);
            } else {
                // Save session in our context
                loginSession(response.data.user, response.data.token);
            }
        } catch (error) {
            setStatusMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'An unexpected server error occurred.' 
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                
                {/* Branding / Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-blue-600/20 text-blue-500 rounded-2xl mb-3 border border-blue-500/30">
                        <Shield size={36} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">StreamGuard Portal</h1>
                    <p className="text-sm text-slate-400 mt-1 text-center">
                        Multi-Tenant Video Analytics & Range-Streaming Console
                    </p>
                </div>

                {/* Response Alert Box */}
                {statusMessage.text && (
                    <div className={`p-4 rounded-xl text-sm mb-6 border ${
                        statusMessage.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                        {statusMessage.text}
                    </div>
                )}

                {/* Authentication Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {isRegistering && (
                        <>
                            {/* Full Name input */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-slate-500" size={18} />
                                    <input 
                                        type="text" name="name" required
                                        value={formData.name} onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Organization input */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization/Tenant Space</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 text-slate-500" size={18} />
                                    <input 
                                        type="text" name="organizationName" required
                                        value={formData.organizationName} onChange={handleInputChange}
                                        placeholder="e.g., AcmeCorp, Dronacharya"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* RBAC Role Selection Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Access Role Assignment</label>
                                <select 
                                    name="role" value={formData.role} onChange={handleInputChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
                                >
                                    <option value="Viewer">Viewer (Stream Only)</option>
                                    <option value="Editor">Editor (Upload & Stream)</option>
                                    <option value="Admin">Admin (Full Command Control)</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input 
                                type="email" name="email" required
                                value={formData.email} onChange={handleInputChange}
                                placeholder="name@company.com"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input 
                                type="password" name="password" required
                                value={formData.password} onChange={handleInputChange}
                                placeholder="••••••••"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Primary Button */}
                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-sm py-3 rounded-xl shadow-lg transition-colors mt-2"
                    >
                        {loading ? 'Processing Context Request...' : isRegistering ? 'Create Account' : 'Authenticate Console'}
                    </button>
                </form>

                {/* View Switcher Toggle */}
                <div className="mt-6 text-center text-sm">
                    <button 
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setStatusMessage({ type: '', text: '' });
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register Tenant"}
                    </button>
                </div>

            </div>
        </div>
    );
}