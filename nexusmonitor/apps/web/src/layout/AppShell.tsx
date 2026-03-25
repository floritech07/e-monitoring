import React from 'react';
import { useAppStore } from '../store/appStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const sidebarOpen = useAppStore(s => s.sidebarOpen);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0A0A12', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        marginLeft: sidebarOpen ? 240 : 64, transition: 'margin-left 0.2s ease'
      }}>
        <TopBar />
        <main style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
