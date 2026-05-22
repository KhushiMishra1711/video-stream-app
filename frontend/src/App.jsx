import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

// Main Application Component Switcher Layer
function AppContent() {
  const { user } = useAuth();

  // If user session is active, load the Console Dashboard. Otherwise, redirect to the Login Portal.
  return user ? <Dashboard /> : <AuthScreen />;
}

// Global App Composition Entry Point
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}