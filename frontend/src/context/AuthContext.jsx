import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Hydrate authentication session from localStorage on startup
        const savedUser = localStorage.getItem('stream_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('stream_token'));
    const [socket, setSocket] = useState(null);

    // Synchronize global Socket.io client instance connection state
    useEffect(() => {
        if (user && token) {
            // Instantiate real-time web socket pipeline linking back to our Node server
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);

            // Command the socket instance to bind immediately to its isolated tenant group
            newSocket.emit('join-tenant-room', user.id ? user.organization : null);

            return () => newSocket.disconnect();
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user, token]);

    // Handle session authentication establishment
    const loginSession = (userData, sessionToken) => {
        localStorage.setItem('stream_user', JSON.stringify(userData));
        localStorage.setItem('stream_token', sessionToken);
        setUser(userData);
        setToken(sessionToken);
    };

    // Handle session destruction
    const logoutSession = () => {
        localStorage.removeItem('stream_user');
        localStorage.removeItem('stream_token');
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, socket, loginSession, logoutSession }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook helper for quick component consumption
export const useAuth = () => useContext(AuthContext);