import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import useIotData from '../hooks/useIotData';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/live': 'Live Monitoring',
  '/analytics': 'Analytics',
  '/alerts': 'Security Alerts',
  '/device': 'Device Status',
  '/settings': 'Settings',
  '/login': 'Authentication',
};

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const iot = useIotData();

  const currentTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  const handleToggleSecurity = async () => {
    const nextMode = iot.securityMode === 'ARMED' ? 'DISARMED' : 'ARMED';
    try {
      await iot.setSecurityMode(nextMode);
    } catch (err) {
      console.error('Failed to toggle security mode:', err);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        unreadAlertCount={iot.unreadAlertCount}
        device={iot.device}
      />

      <div className="main-content">
        <Navbar
          pageTitle={currentTitle}
          securityMode={iot.securityMode}
          onToggleSecurityMode={handleToggleSecurity}
          unreadAlertCount={iot.unreadAlertCount}
          backendStatus={iot.backendStatus}
          onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
        />

        <main className="page-body">
          <Outlet context={iot} />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
