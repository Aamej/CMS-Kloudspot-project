import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import CrowdEntries from './components/CrowdEntries';
import UserManagement from './components/UserManagement';
import { ViewState } from './types';
import { api } from './services/api';
import { socketService } from './services/socket.ts';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.OVERVIEW);
  const [checkingSession, setCheckingSession] = useState(true);

  // Checking local storage for token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      setIsLoggedIn(true);
    }
    setCheckingSession(false);
  }, []);

  // Handling socket connection state
  useEffect(() => {
    if (isLoggedIn) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    api.clearToken();
    setIsLoggedIn(false);
    setCurrentView(ViewState.OVERVIEW); 
  };

  if (checkingSession) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 w-full overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col ml-64 h-screen">
        <Header onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto">
          {currentView === ViewState.OVERVIEW && <Overview />}
          {currentView === ViewState.ENTRIES && <CrowdEntries />}
          {currentView === ViewState.USER_MANAGEMENT && <UserManagement />}
        </main>
      </div>
    </div>
  );
};

export default App;