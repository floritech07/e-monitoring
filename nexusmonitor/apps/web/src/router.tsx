import React from 'react';
import AppShell from './layout/AppShell';
import Dashboard from './pages/Dashboard';
import ProblemConsole from './pages/ProblemConsole';
import TopologyMap from './pages/TopologyMap';
import AssetDetail from './pages/AssetDetail';
import { useWebSocket } from './hooks/useWebSocket';

// Lightweight SPA router (no TanStack dep in standalone build)
const getPath = () => window.location.pathname;

const useRouter = () => {
  const [path, setPath] = React.useState(getPath);
  React.useEffect(() => {
    const handle = () => setPath(getPath());
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, []);
  return path;
};

const Router: React.FC = () => {
  const path = useRouter();
  // Boot WS
  useWebSocket(sessionStorage.getItem('access_token') || '');

  const renderPage = () => {
    if (path.startsWith('/problems')) return <ProblemConsole />;
    if (path.startsWith('/topology')) return <TopologyMap />;
    if (path.startsWith('/assets/')) return <AssetDetail />;
    return <Dashboard />;
  };

  return (
    <AppShell>
      {renderPage()}
    </AppShell>
  );
};

export default Router;
